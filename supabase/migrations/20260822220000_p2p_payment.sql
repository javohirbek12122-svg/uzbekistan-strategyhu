-- P2P Telegram Payment System
-- Adds payment verification workflow for Parkent E-Mart

-- 1. Update orders table with payment-specific fields
alter table public.orders 
  add column if not exists customer_phone text,
  add column if not exists payment_method text default 'p2p_telegram',
  add column if not exists card_last_four text,
  add column if not exists payment_receipt_url text;

-- 2. Payment receipts table
create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  card_last_four text not null,
  receipt_url text not null,
  telegram_msg_id int,
  verified_by_admin text,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists idx_payment_receipts_order on public.payment_receipts(order_id);
create index if not exists idx_orders_payment_status on public.orders(payment_status);

-- 4. RLS
alter table public.payment_receipts enable row level security;

-- 5. RLS Policies
create policy "Customers can view own payment receipts"
  on public.payment_receipts for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = payment_receipts.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "Admins can view all payment receipts"
  on public.payment_receipts for select
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Customers can create payment receipts"
  on public.payment_receipts for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = payment_receipts.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "Admins can update payment receipts"
  on public.payment_receipts for update
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

-- 6. Update orders RLS to allow customers to create orders
create policy "Customers can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Customers can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Admins can update orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

-- 7. Enable realtime for orders and payment_receipts
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.payment_receipts;
