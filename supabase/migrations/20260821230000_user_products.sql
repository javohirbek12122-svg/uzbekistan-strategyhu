-- Add created_by to products for user-submitted products
alter table public.products add column if not exists created_by uuid references auth.users (id) on delete set null;
create index if not exists products_created_by_idx on public.products (created_by);

-- User products pending approval
create table if not exists public.user_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name_uz text not null,
  description_uz text,
  price bigint not null check (price >= 0),
  weight_gram int not null default 0 check (weight_gram >= 0),
  image_url text,
  category_id uuid references public.categories (id) on delete set null,
  passport_id text,
  card_number text,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_products_user_idx on public.user_products (user_id, status);

alter table public.products enable row level security;
create policy products_user_read on public.products for select using (is_active or private.is_staff());
create policy products_user_insert on public.products for insert with check (private.is_staff());
create policy products_user_update on public.products for update using (private.is_staff()) with check (private.is_staff());
create policy products_user_delete on public.products for delete using (private.is_admin());

alter table public.user_products enable row level security;
create policy user_products_own on public.user_products for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_products_staff on public.user_products for all using (private.is_staff()) with check (private.is_staff());
