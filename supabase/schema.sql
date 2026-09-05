-- Parkent E-Market Full Database Schema
-- Bu fayl Supabase Studio yoki migration orqali qo‘llanadi.

-- 1. Asosiy jadvallar
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_uz text not null,
  name_ru text,
  description_uz text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_uz text not null,
  name_ru text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  sku text unique not null,
  name_uz text not null,
  name_ru text,
  description_uz text,
  category_id uuid references public.categories(id),
  brand_id uuid references public.brands(id),
  price numeric(12,2) not null,
  compare_at_price numeric(12,2),
  weight_gram int not null default 0,
  stock int not null default 0,
  reserved int not null default 0,
  max_per_order int not null default 10,
  rating numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  sold_count int not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  position int not null default 0,
  alt text,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_uz text not null,
  price numeric(10,2) not null,
  max_fee numeric(10,2),
  fee_per_kg numeric(10,2),
  free_delivery_min numeric(12,2),
  estimated_minutes int,
  is_active boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id),
  status text not null default 'new',
  payment_status text not null default 'unpaid',
  payment_provider text,
  payment_id text,
  total numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  address_snapshot jsonb not null,
  items jsonb not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null default 'pending',
  courier_name text,
  tracking_number text,
  estimated_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  passport_id text,
  birth_date date,
  address text,
  emergency_contact text,
  emergency_phone text,
  settings jsonb not null default '{}'::jsonb,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  zone_id uuid references public.delivery_zones(id),
  label text,
  recipient_name text not null,
  phone text not null,
  line1 text not null,
  landmark text,
  lat numeric(9,6),
  lng numeric(9,6),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  assignee_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid references auth.users(id),
  message text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.price_history (
  id bigserial primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  old_price numeric(12,2),
  new_price numeric(12,2) not null,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ip text,
  user_agent text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.login_attempts (
  id bigserial primary key,
  identifier text not null,
  ip text not null,
  scope text not null,
  successful boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_allowlist (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_ip_allowlist (
  id bigserial primary key,
  cidr text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_ips (
  ip text primary key,
  reason text,
  blocked_until timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.security_threats (
  id bigserial primary key,
  ip text not null,
  user_agent text,
  type text not null,
  severity text not null default 'medium',
  path text,
  user_id uuid references auth.users(id),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id bigserial primary key,
  ip text not null,
  user_id uuid references auth.users(id),
  event_type text not null,
  details jsonb,
  severity text not null default 'low',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id bigserial primary key,
  event_name text not null,
  user_id uuid references auth.users(id),
  session_id text,
  properties jsonb,
  ip text,
  user_agent text,
  url text not null,
  referrer text,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists public.page_views (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  session_id text not null,
  path text not null,
  title text,
  duration_seconds int,
  ip text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists public.performance_metrics (
  id bigserial primary key,
  metric_name text not null,
  value numeric not null,
  unit text,
  page_url text,
  device_type text,
  connection_type text,
  created_at timestamptz not null default now()
);

-- 3. Indekslar
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_price on public.products(price);
create index if not exists idx_products_stock on public.products(stock);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_chat_created on public.chat_messages(created_at);
create index if not exists idx_analytics_created on public.analytics_events(created_at desc);
create index if not exists idx_analytics_event on public.analytics_events(event_name);
create index if not exists idx_page_views_created on public.page_views(created_at desc);
create index if not exists idx_price_history_product on public.price_history(product_id, created_at desc);

-- 4. RLS siyosatlari
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.shipments enable row level security;
alter table public.addresses enable row level security;
alter table public.cart_items enable row level security;
alter table public.reviews enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;
alter table public.notifications enable row level security;
alter table public.chat_messages enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.price_history enable row level security;
alter table public.settings enable row level security;
alter table public.audit_log enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.login_attempts enable row level security;
alter table public.admin_allowlist enable row level security;
alter table public.admin_ip_allowlist enable row level security;
alter table public.analytics_events enable row level security;
alter table public.page_views enable row level security;
alter table public.performance_metrics enable row level security;

-- 5. Dastlabki ma'lumotlar
insert into public.categories (slug, name_uz, name_ru, position) values
  ('guruch', 'Guruch', 'Рис', 1),
  ('yog', 'Yogʻ va moylar', 'Масла', 2),
  ('shakar', 'Shakar va shakarlar', 'Сахар', 3),
  ('sabzavot', 'Sabzavotlar', 'Овощи', 4),
  ('meva', 'Mevalar', 'Фрукты', 5),
  ('sut', 'Sut va sut mahsulotlari', 'Молочные продукты', 6),
  ('go_sht', 'Goʻsht va parranda', 'Мясо и птица', 7),
  ['non', 'Non va makaron', 'Хлеб и макароны', 8)
on conflict (slug) do nothing;

insert into public.delivery_zones (slug, name_uz, price, max_fee, fee_per_kg, free_delivery_min, estimated_minutes) values
  ('parkent-markaz', 'Parkent markazi', 8000, 15000, 500, 150000, 60),
  ('parkent-tuman', 'Parkent tumani', 12000, 20000, 800, 200000, 90),
  ('toshkent-sh', 'Toshkent shahar', 15000, 25000, 1000, 250000, 120)
on conflict (slug) do nothing;

insert into public.settings (key, value) values
  ('store', '{"name":"Parkent E-Market","phone":"931261150","telegram":"https://t.me/parkent_emart","address":"Parkent tumani, Toshkent viloyati"}'::jsonb),
  ('contact', '{"phone":"931261150","address":"Parkent tumani, Toshkent viloyati","working_hours":"Du-Ju: 09:00 - 18:00"}'::jsonb),
  ('security', '{"sessionHours":12,"maxLoginAttempts":5,"blockMinutes":15,"ipAllowlistEnabled":false,"mfaRequired":false}'::jsonb),
  ('payments', '{"paymeEnabled":false,"clickEnabled":false,"cashEnabled":true,"freeDeliveryMin":150000}'::jsonb)
on conflict (key) do nothing;
