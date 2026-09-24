-- Veloura V11 authenticated cloud sync
-- Scope: veloura schema only. Uses auth.uid() owner isolation.

select hub.assert_app_scope('veloura','veloura');

alter table veloura.profiles
  add column if not exists style_signals jsonb not null default '{"categories":{},"brands":{},"colors":{},"occasions":{}}'::jsonb,
  add column if not exists recently_viewed jsonb not null default '[]'::jsonb;

alter table veloura.addresses
  add column if not exists client_id text;

update veloura.addresses
set client_id = coalesce(client_id, id::text)
where client_id is null;

alter table veloura.addresses
  alter column client_id set not null;

create unique index if not exists veloura_addresses_user_client_idx
  on veloura.addresses(user_id, client_id);

alter table veloura.cart_items
  add column if not exists saved_for_later boolean not null default false;

create table if not exists veloura.product_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_id uuid not null references veloura.orders(id) on delete cascade,
  order_item_id uuid not null references veloura.order_items(id) on delete cascade,
  product_id bigint not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 3 and 1500),
  image_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, order_item_id)
);

alter table veloura.product_reviews enable row level security;

grant usage on schema veloura to authenticated;

grant select, insert, update on veloura.profiles to authenticated;
grant select, insert, update, delete on veloura.addresses to authenticated;
grant select, insert, update, delete on veloura.cart_items to authenticated;
grant select, insert, update, delete on veloura.wishlist_items to authenticated;
grant select, insert, update on veloura.orders to authenticated;
grant select, insert on veloura.order_items to authenticated;
grant insert, select on veloura.commerce_events to authenticated;
grant select, insert, update, delete on veloura.product_reviews to authenticated;
grant usage, select on all sequences in schema veloura to authenticated;

drop policy if exists profiles_select_self on veloura.profiles;
drop policy if exists profiles_insert_self on veloura.profiles;
drop policy if exists profiles_update_self on veloura.profiles;
create policy profiles_select_self on veloura.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy profiles_insert_self on veloura.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy profiles_update_self on veloura.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists addresses_select_self on veloura.addresses;
drop policy if exists addresses_insert_self on veloura.addresses;
drop policy if exists addresses_update_self on veloura.addresses;
drop policy if exists addresses_delete_self on veloura.addresses;
create policy addresses_select_self on veloura.addresses for select to authenticated
  using ((select auth.uid()) = user_id);
create policy addresses_insert_self on veloura.addresses for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy addresses_update_self on veloura.addresses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy addresses_delete_self on veloura.addresses for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists cart_select_self on veloura.cart_items;
drop policy if exists cart_insert_self on veloura.cart_items;
drop policy if exists cart_update_self on veloura.cart_items;
drop policy if exists cart_delete_self on veloura.cart_items;
create policy cart_select_self on veloura.cart_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy cart_insert_self on veloura.cart_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy cart_update_self on veloura.cart_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy cart_delete_self on veloura.cart_items for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists wishlist_select_self on veloura.wishlist_items;
drop policy if exists wishlist_insert_self on veloura.wishlist_items;
drop policy if exists wishlist_update_self on veloura.wishlist_items;
drop policy if exists wishlist_delete_self on veloura.wishlist_items;
create policy wishlist_select_self on veloura.wishlist_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy wishlist_insert_self on veloura.wishlist_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy wishlist_update_self on veloura.wishlist_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy wishlist_delete_self on veloura.wishlist_items for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists orders_select_self on veloura.orders;
drop policy if exists orders_insert_self on veloura.orders;
drop policy if exists orders_cancel_self on veloura.orders;
create policy orders_select_self on veloura.orders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy orders_insert_self on veloura.orders for insert to authenticated
  with check ((select auth.uid()) = user_id and guest_key_hash is null);
create policy orders_cancel_self on veloura.orders for update to authenticated
  using ((select auth.uid()) = user_id and status in ('placed','confirmed'))
  with check ((select auth.uid()) = user_id and status = 'cancelled');

drop policy if exists order_items_select_self on veloura.order_items;
drop policy if exists order_items_insert_self on veloura.order_items;
create policy order_items_select_self on veloura.order_items for select to authenticated
  using (exists (
    select 1 from veloura.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));
create policy order_items_insert_self on veloura.order_items for insert to authenticated
  with check (exists (
    select 1 from veloura.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));

drop policy if exists commerce_events_insert_self on veloura.commerce_events;
drop policy if exists commerce_events_select_self on veloura.commerce_events;
create policy commerce_events_insert_self on veloura.commerce_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy commerce_events_select_self on veloura.commerce_events for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists reviews_select_authenticated on veloura.product_reviews;
drop policy if exists reviews_insert_verified on veloura.product_reviews;
drop policy if exists reviews_update_self on veloura.product_reviews;
drop policy if exists reviews_delete_self on veloura.product_reviews;
create policy reviews_select_authenticated on veloura.product_reviews for select to authenticated
  using (true);
create policy reviews_insert_verified on veloura.product_reviews for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from veloura.order_items oi
      join veloura.orders o on o.id = oi.order_id
      where oi.id = product_reviews.order_item_id
        and oi.order_id = product_reviews.order_id
        and oi.product_id = product_reviews.product_id
        and o.user_id = (select auth.uid())
        and o.status = 'delivered'
    )
  );
create policy reviews_update_self on veloura.product_reviews for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy reviews_delete_self on veloura.product_reviews for delete to authenticated
  using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
