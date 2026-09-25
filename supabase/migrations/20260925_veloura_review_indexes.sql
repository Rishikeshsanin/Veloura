-- Veloura V12.1 performance indexes
-- Scope: veloura schema only.

select hub.assert_app_scope('veloura','veloura');

create index if not exists veloura_product_reviews_order_idx
  on veloura.product_reviews(order_id);

create index if not exists veloura_product_reviews_order_item_idx
  on veloura.product_reviews(order_item_id);

create index if not exists veloura_product_reviews_product_idx
  on veloura.product_reviews(product_id, created_at desc);
