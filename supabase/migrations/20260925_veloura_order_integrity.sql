-- Veloura V12 order/review integrity hardening
-- Scope: veloura schema only.
-- Prevents browser clients from forging fulfilment state, altering order contents
-- after creation, or reading reviewer identity columns.

select hub.assert_app_scope('veloura','veloura');

-- Direct authenticated clients may read their orders, but order creation is now
-- performed atomically through create_order_snapshot().
revoke insert on veloura.orders from authenticated;
revoke insert on veloura.order_items from authenticated;
revoke update on veloura.orders from authenticated;
grant update (status, updated_at) on veloura.orders to authenticated;

drop policy if exists orders_insert_self on veloura.orders;
drop policy if exists order_items_insert_self on veloura.order_items;

drop policy if exists orders_cancel_self on veloura.orders;
create policy orders_cancel_self
  on veloura.orders
  for update
  to authenticated
  using ((select auth.uid()) = user_id and status in ('placed','confirmed'))
  with check ((select auth.uid()) = user_id and status = 'cancelled');

create or replace function veloura.create_order_snapshot(
  p_order_number text,
  p_payment_method text,
  p_subtotal integer,
  p_discount integer,
  p_delivery integer,
  p_total integer,
  p_coupon_code text,
  p_delivery_address jsonb,
  p_contact_email text,
  p_contact_phone text,
  p_created_at timestamptz,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = veloura, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_item_subtotal bigint;
begin
  if v_user_id is null then
    raise insufficient_privilege using message = 'Authentication required.';
  end if;

  if p_order_number is null
     or p_order_number !~ '^VL[A-Z0-9]{8,24}$' then
    raise check_violation using message = 'Invalid Veloura order number.';
  end if;

  if p_payment_method not in ('upi','card','cod') then
    raise check_violation using message = 'Invalid payment method.';
  end if;

  if p_subtotal < 0 or p_discount < 0 or p_delivery < 0 or p_total < 0
     or p_discount > p_subtotal
     or p_total <> (p_subtotal - p_discount + p_delivery) then
    raise check_violation using message = 'Invalid order totals.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise check_violation using message = 'Order must contain at least one item.';
  end if;

  select coalesce(sum((x.unit_price * x.quantity)::bigint),0)
  into v_item_subtotal
  from jsonb_to_recordset(p_items) as x(
    product_id bigint,
    source_id text,
    title text,
    brand text,
    category text,
    size text,
    quantity integer,
    unit_price integer,
    product_snapshot jsonb
  );

  if v_item_subtotal <> p_subtotal then
    raise check_violation using message = 'Item totals do not match subtotal.';
  end if;

  insert into veloura.orders (
    order_number, user_id, guest_key_hash, status,
    payment_method, payment_status,
    subtotal, discount, delivery, total, coupon_code,
    delivery_address, contact_email, contact_phone,
    created_at, updated_at
  ) values (
    p_order_number, v_user_id, null, 'placed',
    p_payment_method, 'sandbox',
    p_subtotal, p_discount, p_delivery, p_total, nullif(p_coupon_code,''),
    p_delivery_address, p_contact_email, p_contact_phone,
    coalesce(p_created_at, now()), now()
  )
  returning id into v_order_id;

  insert into veloura.order_items (
    order_id, product_id, source_id, title, brand, category,
    size, quantity, unit_price, product_snapshot
  )
  select
    v_order_id, x.product_id, x.source_id, x.title, x.brand, x.category,
    x.size, x.quantity, x.unit_price, x.product_snapshot
  from jsonb_to_recordset(p_items) as x(
    product_id bigint,
    source_id text,
    title text,
    brand text,
    category text,
    size text,
    quantity integer,
    unit_price integer,
    product_snapshot jsonb
  )
  where x.product_id is not null
    and x.title is not null and char_length(x.title) between 1 and 500
    and x.category is not null and char_length(x.category) between 1 and 120
    and x.size is not null and char_length(x.size) between 1 and 80
    and x.quantity between 1 and 25
    and x.unit_price >= 0
    and x.product_snapshot is not null;

  if not exists (select 1 from veloura.order_items where order_id = v_order_id) then
    raise check_violation using message = 'Order items are invalid.';
  end if;

  return v_order_id;
end;
$$;

revoke all on function veloura.create_order_snapshot(
  text,text,integer,integer,integer,integer,text,jsonb,text,text,timestamptz,jsonb
) from public, anon;
grant execute on function veloura.create_order_snapshot(
  text,text,integer,integer,integer,integer,text,jsonb,text,text,timestamptz,jsonb
) to authenticated;

-- Public and signed-in storefront reads expose only review content, never
-- reviewer identity/order linkage columns.
revoke all on veloura.product_reviews from authenticated;
grant select (id, product_id, rating, comment, image_urls, created_at)
  on veloura.product_reviews to authenticated;
grant insert (user_id, order_id, order_item_id, product_id, rating, comment, image_urls)
  on veloura.product_reviews to authenticated;

drop policy if exists reviews_update_self on veloura.product_reviews;
drop policy if exists reviews_delete_self on veloura.product_reviews;

create or replace function veloura.review_eligibility(p_product_id bigint)
returns table(order_id uuid, order_item_id uuid)
language sql
stable
security definer
set search_path = veloura, pg_temp
as $$
  select oi.order_id, oi.id
  from veloura.order_items oi
  join veloura.orders o on o.id = oi.order_id
  where auth.uid() is not null
    and o.user_id = auth.uid()
    and o.status = 'delivered'
    and oi.product_id = p_product_id
    and not exists (
      select 1
      from veloura.product_reviews pr
      where pr.user_id = auth.uid()
        and pr.order_item_id = oi.id
    )
  order by o.created_at desc
  limit 1;
$$;

revoke all on function veloura.review_eligibility(bigint) from public, anon;
grant execute on function veloura.review_eligibility(bigint) to authenticated;

notify pgrst, 'reload schema';
