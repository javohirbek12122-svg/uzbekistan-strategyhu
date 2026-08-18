-- Row level security + hardened helper functions.
--
-- Security rules applied here:
--   * Every table has RLS enabled; nothing is world-writable.
--   * Helper functions used by policies live in the `private` schema, which is
--     NOT exposed through the PostgREST API, so they cannot be called by
--     anon/authenticated clients even though they are SECURITY DEFINER.
--   * Business functions that must bypass RLS (order creation, payment
--     settlement) are executable by `service_role` only.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- Policy helpers
-- ---------------------------------------------------------------------------
create or replace function private.has_role(p_role app_role) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = p_role
  );
$$;

create or replace function private.is_staff() returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('manager', 'admin')
  );
$$;

create or replace function private.is_admin() returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    join public.admin_allowlist al on al.email = p.email
    where ur.user_id = auth.uid() and ur.role = 'admin'
  );
$$;

revoke all on function private.has_role(app_role) from public;
revoke all on function private.is_staff() from public;
revoke all on function private.is_admin() from public;
-- `anon` needs execute rights as well: the public catalog policies below call
-- these helpers, and for an anonymous request they simply return false.
grant execute on function private.has_role(app_role) to anon, authenticated, service_role;
grant execute on function private.is_staff() to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;

-- An admin role may only exist for an allow-listed e-mail address.
create or replace function private.guard_admin_grant() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role in ('admin', 'manager') then
    if not exists (
      select 1
      from public.profiles p
      join public.admin_allowlist al on al.email = p.email
      where p.id = new.user_id
    ) then
      raise exception 'privileged role requires an allow-listed e-mail'
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_admin_grant() from public, anon, authenticated;

create trigger user_roles_guard_privileged
  before insert or update on user_roles
  for each row execute function private.guard_admin_grant();

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public catalog: readable by everyone, writable by staff only
-- ---------------------------------------------------------------------------
create policy categories_read on categories for select using (is_active or private.is_staff());
create policy categories_write on categories for all using (private.is_staff()) with check (private.is_staff());

create policy brands_read on brands for select using (true);
create policy brands_write on brands for all using (private.is_staff()) with check (private.is_staff());

create policy products_read on products for select using (is_active or private.is_staff());
create policy products_write on products for all using (private.is_staff()) with check (private.is_staff());

create policy product_images_read on product_images for select using (true);
create policy product_images_write on product_images for all using (private.is_staff()) with check (private.is_staff());

create policy zones_read on delivery_zones for select using (is_active or private.is_staff());
create policy zones_write on delivery_zones for all using (private.is_staff()) with check (private.is_staff());

create policy banners_read on banners for select using (is_active or private.is_staff());
create policy banners_write on banners for all using (private.is_staff()) with check (private.is_staff());

create policy news_read on news for select using (is_published or private.is_staff());
create policy news_write on news for all using (private.is_staff()) with check (private.is_staff());

create policy reviews_read on reviews for select using (is_approved or user_id = auth.uid() or private.is_staff());
create policy reviews_insert on reviews for insert with check (user_id = auth.uid());
create policy reviews_update_own on reviews for update using (user_id = auth.uid() and not is_approved) with check (user_id = auth.uid());
create policy reviews_moderate on reviews for all using (private.is_staff()) with check (private.is_staff());

-- Promo codes are validated server-side only; never listed to clients.
create policy promo_staff on promo_codes for all using (private.is_staff()) with check (private.is_staff());

-- Only the storefront-facing keys are public; `security` and any future secret
-- key stays staff-only.
create policy settings_public_read on settings for select
  using (key in ('store', 'payments', 'delivery', 'late_delivery_compensation') or private.is_staff());
create policy settings_write on settings for all using (private.is_admin()) with check (private.is_admin());

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create policy profiles_self_read on profiles for select using (id = auth.uid() or private.is_staff());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff_all on profiles for all using (private.is_staff()) with check (private.is_staff());

create policy user_roles_self_read on user_roles for select using (user_id = auth.uid() or private.is_staff());
create policy user_roles_admin_write on user_roles for all using (private.is_admin()) with check (private.is_admin());

create policy allowlist_admin on admin_allowlist for all using (private.is_admin()) with check (private.is_admin());
create policy ip_allowlist_admin on admin_ip_allowlist for all using (private.is_admin()) with check (private.is_admin());
create policy audit_admin_read on audit_log for select using (private.is_admin());

-- Secrets: no client role may read these at all (service_role bypasses RLS).
create policy mfa_none on admin_mfa for select using (false);
create policy admin_sessions_none on admin_sessions for select using (false);
create policy login_attempts_none on login_attempts for select using (false);

-- ---------------------------------------------------------------------------
-- Addresses, cart
-- ---------------------------------------------------------------------------
create policy addresses_own on addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_staff_read on addresses for select using (private.is_staff());

create policy carts_own on carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cart_items_own on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Orders: customers read their own, staff manage, couriers see assigned
-- ---------------------------------------------------------------------------
create policy orders_own_read on orders for select using (
  user_id = auth.uid()
  or private.is_staff()
  or exists (select 1 from shipments s where s.order_id = orders.id and s.courier_id = auth.uid())
);
create policy orders_staff_write on orders for all using (private.is_staff()) with check (private.is_staff());

create policy order_items_read on order_items for select using (
  exists (
    select 1 from orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or private.is_staff()
           or exists (select 1 from shipments s where s.order_id = o.id and s.courier_id = auth.uid()))
  )
);
create policy order_items_staff_write on order_items for all using (private.is_staff()) with check (private.is_staff());

create policy order_history_read on order_status_history for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or private.is_staff()))
);

create policy payments_read on payments for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or private.is_staff()))
);
create policy payments_staff_write on payments for all using (private.is_staff()) with check (private.is_staff());

-- Raw provider payloads are staff-only (they contain provider credentials data).
create policy payment_events_staff on payment_events for select using (private.is_admin());
create policy refunds_read on refunds for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or private.is_staff()))
);
create policy refunds_staff_write on refunds for all using (private.is_staff()) with check (private.is_staff());

create policy shipments_read on shipments for select using (
  courier_id = auth.uid()
  or private.is_staff()
  or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy shipments_courier_update on shipments for update
  using (courier_id = auth.uid()) with check (courier_id = auth.uid());
create policy shipments_staff_write on shipments for all using (private.is_staff()) with check (private.is_staff());

create policy compensations_read on delivery_compensations for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or private.is_staff()))
);
create policy compensations_staff_write on delivery_compensations for all using (private.is_staff()) with check (private.is_staff());

create policy price_history_staff on price_history for select using (private.is_staff());

-- ---------------------------------------------------------------------------
-- Support
-- ---------------------------------------------------------------------------
create policy tickets_own on tickets for select using (user_id = auth.uid() or private.is_staff());
create policy tickets_insert on tickets for insert with check (user_id = auth.uid());
create policy tickets_staff_write on tickets for all using (private.is_staff()) with check (private.is_staff());

create policy ticket_messages_read on ticket_messages for select using (
  exists (select 1 from tickets t where t.id = ticket_id and (t.user_id = auth.uid() or private.is_staff()))
);
create policy ticket_messages_insert on ticket_messages for insert with check (
  (author_id = auth.uid() and exists (select 1 from tickets t where t.id = ticket_id and t.user_id = auth.uid()))
  or private.is_staff()
);

create policy notifications_own on notifications for select using (
  (user_id = auth.uid() and not is_admin_only) or private.is_staff()
);
create policy notifications_own_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_staff_write on notifications for all using (private.is_staff()) with check (private.is_staff());

-- ---------------------------------------------------------------------------
-- Least privilege for API roles
-- ---------------------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon, authenticated;
revoke all on all tables in schema public from anon;
grant select on categories, brands, products, product_images, delivery_zones, banners, news, reviews, settings to anon, authenticated;
grant select, insert, update, delete on carts, cart_items, addresses, tickets, ticket_messages, reviews to authenticated;
grant select on orders, order_items, order_status_history, payments, shipments, delivery_compensations, refunds, profiles, user_roles to authenticated;
grant update on profiles, notifications to authenticated;
grant select on notifications to authenticated;
grant usage on sequence order_number_seq to service_role;
