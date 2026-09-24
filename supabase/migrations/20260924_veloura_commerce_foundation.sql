-- Veloura V10 commerce foundation
-- Scope: veloura schema only. No public tables and no cross-app dependencies.

create schema if not exists veloura;

create table if not exists veloura.profiles (
  user_id uuid primary key,
  email text,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists veloura.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null default 'Home',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veloura_addresses_pincode_check check (pincode ~ '^[0-9]{6}$')
);

create table if not exists veloura.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid,
  guest_key_hash text,
  status text not null default 'placed',
  payment_method text not null,
  payment_status text not null default 'sandbox',
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  delivery integer not null default 0 check (delivery >= 0),
  total integer not null check (total >= 0),
  coupon_code text,
  delivery_address jsonb not null,
  contact_email text not null,
  contact_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veloura_orders_owner_check check (user_id is not null or guest_key_hash is not null),
  constraint veloura_orders_status_check check (status in ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','return_requested','returned')),
  constraint veloura_orders_payment_method_check check (payment_method in ('upi','card','cod')),
  constraint veloura_orders_payment_status_check check (payment_status in ('sandbox','pending','paid','failed','refunded'))
);

create table if not exists veloura.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references veloura.orders(id) on delete cascade,
  product_id bigint not null,
  source_id text,
  title text not null,
  brand text,
  category text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  product_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists veloura.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id bigint not null,
  size text not null,
  quantity integer not null default 1 check (quantity > 0),
  product_snapshot jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, size)
);

create table if not exists veloura.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id bigint not null,
  product_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists veloura.commerce_events (
  id bigint generated always as identity primary key,
  user_id uuid,
  anonymous_session_id text,
  event_name text not null,
  product_id bigint,
  order_number text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists veloura_addresses_user_idx on veloura.addresses(user_id);
create index if not exists veloura_orders_user_idx on veloura.orders(user_id, created_at desc);
create index if not exists veloura_orders_guest_idx on veloura.orders(guest_key_hash, created_at desc);
create index if not exists veloura_order_items_order_idx on veloura.order_items(order_id);
create index if not exists veloura_events_user_idx on veloura.commerce_events(user_id, created_at desc);
create index if not exists veloura_events_session_idx on veloura.commerce_events(anonymous_session_id, created_at desc);

alter table veloura.profiles enable row level security;
alter table veloura.addresses enable row level security;
alter table veloura.orders enable row level security;
alter table veloura.order_items enable row level security;
alter table veloura.cart_items enable row level security;
alter table veloura.wishlist_items enable row level security;
alter table veloura.commerce_events enable row level security;

-- Intentionally no public/anon policies in this foundation migration.
-- Production server access must use a dedicated scoped backend role and
-- application endpoints must enforce user/guest ownership before writes.
