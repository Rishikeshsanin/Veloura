-- Veloura V11 public review read surface
-- Public visitors may read only sanitized review columns.
-- All write policies remain authenticated and verified-purchase scoped.

select hub.assert_app_scope('veloura','veloura');

grant usage on schema veloura to anon;
grant select (id, product_id, rating, comment, image_urls, created_at)
  on veloura.product_reviews to anon;

drop policy if exists reviews_select_authenticated on veloura.product_reviews;
drop policy if exists reviews_select_public on veloura.product_reviews;

create policy reviews_select_public
  on veloura.product_reviews
  for select
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
