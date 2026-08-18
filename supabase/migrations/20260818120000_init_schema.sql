-- Parkent E-Mart: core schema
-- All money is stored in UZS as bigint (tiyin is not used in retail UZ pricing).

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type app_role as enum ('customer', 'courier', 'manager', 'admin');

create type order_status as enum (
  'created',
  'pending_payment',
  'paid',
  'confirmed',
  'packing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'returned',
  'refunded'
);

create type payment_provider as enum ('payme', 'click', 'cash');

create type payment_status as enum (
  'pending',
  'authorized',
  'paid',
  'cancelled',
  'refunded',
  'failed'
);

create type shipment_status as enum (
  'pending',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'failed'
);

create type ticket_kind as enum ('complaint', 'suggestion', 'question', 'return_request');
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  email citext,
  avatar_url text,
  locale text not null default 'uz',
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role app_role not null,
  granted_by uuid references auth.users (id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Only e-mails present here may ever hold the admin role or reach the console.
create table admin_allowlist (
  email citext primary key,
  note text,
  created_at timestamptz not null default now()
);

create table admin_ip_allowlist (
  cidr cidr primary key,
  note text,
  created_at timestamptz not null default now()
);

-- TOTP enrolment for privileged accounts (secret is encrypted at rest by
-- pgcrypto; the plaintext never leaves the server).
create table admin_mfa (
  user_id uuid primary key references auth.users (id) on delete cascade,
  secret_encrypted bytea not null,
  confirmed_at timestamptz,
  last_used_step bigint,
  recovery_codes_hashed text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  ip inet,
  user_agent text,
  mfa_passed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index admin_sessions_user_idx on admin_sessions (user_id);

create table login_attempts (
  id bigserial primary key,
  identifier citext not null,
  ip inet,
  scope text not null default 'console',
  successful boolean not null default false,
  created_at timestamptz not null default now()
);
create index login_attempts_lookup_idx on login_attempts (identifier, scope, created_at desc);

create table audit_log (
  id bigserial primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email citext,
  action text not null,
  entity text,
  entity_id text,
  before jsonb,
  after jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on audit_log (created_at desc);
create index audit_log_entity_idx on audit_log (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories (id) on delete set null,
  slug text not null unique,
  name_uz text not null,
  name_ru text,
  icon text,
  image_url text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index categories_parent_idx on categories (parent_id);

create table brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  category_id uuid references categories (id) on delete set null,
  brand_id uuid references brands (id) on delete set null,
  name_uz text not null,
  name_ru text,
  description_uz text,
  description_ru text,
  -- Authoritative price. The client never supplies a price.
  price bigint not null check (price >= 0),
  compare_at_price bigint check (compare_at_price >= 0),
  currency text not null default 'UZS',
  weight_gram int not null default 0 check (weight_gram >= 0),
  volume_cm3 int not null default 0 check (volume_cm3 >= 0),
  stock int not null default 0 check (stock >= 0),
  reserved int not null default 0 check (reserved >= 0),
  max_per_order int not null default 20 check (max_per_order > 0),
  rating numeric(3, 2) not null default 0,
  reviews_count int not null default 0,
  sold_count int not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on products (category_id) where is_active;
create index products_featured_idx on products (is_featured) where is_active;
create index products_search_idx on products using gin (
  to_tsvector('simple', coalesce(name_uz, '') || ' ' || coalesce(name_ru, '') || ' ' || coalesce(sku, ''))
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  alt text,
  position int not null default 0
);
create index product_images_product_idx on product_images (product_id);

create table price_history (
  id bigserial primary key,
  product_id uuid not null references products (id) on delete cascade,
  old_price bigint,
  new_price bigint not null,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique,
  percent_off int check (percent_off between 1 and 90),
  amount_off bigint check (amount_off > 0),
  min_order_total bigint not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint promo_discount_present check (percent_off is not null or amount_off is not null)
);

-- ---------------------------------------------------------------------------
-- Delivery
-- ---------------------------------------------------------------------------
create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_uz text not null,
  base_fee bigint not null check (base_fee >= 0),
  max_fee bigint not null check (max_fee >= 0),
  fee_per_kg bigint not null default 0 check (fee_per_kg >= 0),
  free_over_total bigint,
  min_hours int not null default 1,
  max_hours int not null default 24,
  sla_hours int not null default 24,
  center_lat double precision,
  center_lng double precision,
  radius_km double precision,
  is_active boolean not null default true,
  position int not null default 0,
  constraint delivery_fee_range check (max_fee >= base_fee)
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  zone_id uuid references delivery_zones (id) on delete set null,
  label text,
  recipient_name text not null,
  phone text not null,
  line1 text not null,
  landmark text,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on addresses (user_id);

-- ---------------------------------------------------------------------------
-- Cart
-- ---------------------------------------------------------------------------
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);
create index cart_items_cart_idx on cart_items (cart_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence order_number_seq start 1000;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default 'PE-' || to_char(now(), 'YYMM') || '-' || nextval('order_number_seq'),
  user_id uuid not null references auth.users (id) on delete restrict,
  status order_status not null default 'created',
  zone_id uuid references delivery_zones (id) on delete set null,
  address_id uuid references addresses (id) on delete set null,
  -- Frozen address snapshot: the order must not change if the address is edited.
  address_snapshot jsonb not null default '{}'::jsonb,
  items_total bigint not null check (items_total >= 0),
  delivery_fee bigint not null check (delivery_fee >= 0),
  discount_total bigint not null default 0 check (discount_total >= 0),
  compensation_total bigint not null default 0 check (compensation_total >= 0),
  total bigint not null check (total >= 0),
  promo_code citext,
  total_weight_gram int not null default 0,
  payment_provider payment_provider not null default 'cash',
  payment_status payment_status not null default 'pending',
  customer_note text,
  promised_at timestamptz,
  delivered_at timestamptz,
  cancelled_reason text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on orders (user_id, created_at desc);
create index orders_status_idx on orders (status, created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  name_snapshot text not null,
  sku_snapshot text not null,
  image_snapshot text,
  -- Server-recomputed unit price at the moment the order was created.
  unit_price bigint not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  weight_gram int not null default 0,
  line_total bigint not null check (line_total >= 0)
);
create index order_items_order_idx on order_items (order_id);

create table order_status_history (
  id bigserial primary key,
  order_id uuid not null references orders (id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  comment text,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on order_status_history (order_id, created_at);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider payment_provider not null,
  status payment_status not null default 'pending',
  amount bigint not null check (amount >= 0),
  provider_transaction_id text,
  provider_state int,
  -- Provider clocks (epoch ms) as reported by Payme/Click.
  provider_created_time bigint,
  provider_perform_time bigint,
  provider_cancel_time bigint,
  paid_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);
create index payments_order_idx on payments (order_id);

create table payment_events (
  id bigserial primary key,
  payment_id uuid references payments (id) on delete cascade,
  provider payment_provider not null,
  method text,
  request jsonb,
  response jsonb,
  signature_valid boolean,
  ip inet,
  created_at timestamptz not null default now()
);
create index payment_events_created_idx on payment_events (created_at desc);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  payment_id uuid references payments (id) on delete set null,
  amount bigint not null check (amount > 0),
  reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id) on delete cascade,
  courier_id uuid references auth.users (id) on delete set null,
  status shipment_status not null default 'pending',
  planned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  proof_code text,
  proof_photo_url text,
  route_position int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipments_courier_idx on shipments (courier_id, status);

-- Late-delivery compensation (5 000 UZS by default, configurable in settings).
create table delivery_compensations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  amount bigint not null check (amount > 0),
  reason text not null default 'late_delivery',
  hours_late int,
  created_at timestamptz not null default now(),
  unique (order_id, reason)
);

-- ---------------------------------------------------------------------------
-- Engagement
-- ---------------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid references orders (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on reviews (product_id) where is_approved;

create table tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid references orders (id) on delete set null,
  kind ticket_kind not null default 'question',
  subject text not null,
  status ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tickets_user_idx on tickets (user_id, created_at desc);
create index tickets_status_idx on tickets (status, created_at desc);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  is_staff boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);
create index ticket_messages_ticket_idx on ticket_messages (ticket_id, created_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_admin_only boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

create table banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  link text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  cover_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger payments_updated_at before update on payments
  for each row execute function set_updated_at();
create trigger shipments_updated_at before update on shipments
  for each row execute function set_updated_at();
create trigger tickets_updated_at before update on tickets
  for each row execute function set_updated_at();

-- New auth user -> profile + customer role. Admin is never auto-granted.
create or replace function handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict do nothing;

  return new;
end;
$$;
revoke all on function handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Price changes are always journalled.
create or replace function log_price_change() returns trigger
language plpgsql
as $$
begin
  if new.price is distinct from old.price then
    insert into public.price_history (product_id, old_price, new_price)
    values (new.id, old.price, new.price);
  end if;
  return new;
end;
$$;

create trigger products_price_history after update of price on products
  for each row execute function log_price_change();

-- Order status transitions are journalled and validated.
create or replace function guard_order_status() returns trigger
language plpgsql
as $$
declare
  allowed order_status[];
begin
  if new.status = old.status then
    return new;
  end if;

  allowed := case old.status
    when 'created' then array['pending_payment', 'paid', 'confirmed', 'cancelled']::order_status[]
    when 'pending_payment' then array['paid', 'cancelled']::order_status[]
    when 'paid' then array['confirmed', 'cancelled', 'refunded']::order_status[]
    when 'confirmed' then array['packing', 'cancelled']::order_status[]
    when 'packing' then array['shipped', 'cancelled']::order_status[]
    when 'shipped' then array['delivered', 'returned']::order_status[]
    when 'delivered' then array['completed', 'returned']::order_status[]
    when 'completed' then array['returned']::order_status[]
    when 'returned' then array['refunded']::order_status[]
    else array[]::order_status[]
  end;

  if not (new.status = any (allowed)) then
    raise exception 'invalid order status transition: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  insert into public.order_status_history (order_id, from_status, to_status)
  values (new.id, old.status, new.status);

  if new.status = 'delivered' and new.delivered_at is null then
    new.delivered_at := now();
  end if;

  return new;
end;
$$;

create trigger orders_status_guard before update of status on orders
  for each row execute function guard_order_status();
