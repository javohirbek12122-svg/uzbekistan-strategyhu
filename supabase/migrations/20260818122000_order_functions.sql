-- Authoritative order/payment logic.
--
-- These functions are the ONLY way an order is created or settled. Prices,
-- delivery fees, discounts and totals are recomputed from the database, so a
-- tampered client payload cannot influence what the customer is charged.
-- They are SECURITY DEFINER and executable by `service_role` only.

-- ---------------------------------------------------------------------------
-- Delivery fee
-- ---------------------------------------------------------------------------
create or replace function public.calc_delivery_fee(
  p_zone_id uuid,
  p_weight_gram int,
  p_items_total bigint
) returns bigint
language plpgsql
stable
as $$
declare
  z delivery_zones;
  extra_kg int;
  fee bigint;
begin
  select * into z from delivery_zones where id = p_zone_id and is_active;
  if not found then
    raise exception 'zone_not_found' using errcode = 'no_data_found';
  end if;

  if z.free_over_total is not null and p_items_total >= z.free_over_total then
    return 0;
  end if;

  -- The base fee covers the first 5 kg; every extra kg is charged, capped at max_fee.
  extra_kg := greatest(0, ceil((greatest(p_weight_gram, 0) - 5000)::numeric / 1000)::int);
  fee := z.base_fee + extra_kg * z.fee_per_kg;
  return least(fee, z.max_fee);
end;
$$;
grant execute on function public.calc_delivery_fee(uuid, int, bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Order creation
-- ---------------------------------------------------------------------------
create or replace function public.create_order_from_cart(
  p_user_id uuid,
  p_address_id uuid,
  p_provider payment_provider,
  p_promo_code text default null,
  p_note text default null,
  p_idempotency_key text default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_cart_id uuid;
  v_addr addresses;
  v_zone delivery_zones;
  v_items_total bigint := 0;
  v_weight int := 0;
  v_fee bigint := 0;
  v_discount bigint := 0;
  v_promo promo_codes;
  v_item record;
  v_count int := 0;
begin
  if p_idempotency_key is not null then
    select id into v_order_id from orders where idempotency_key = p_idempotency_key;
    if found then
      return v_order_id;
    end if;
  end if;

  select * into v_addr from addresses where id = p_address_id and user_id = p_user_id;
  if not found then
    raise exception 'address_not_found' using errcode = 'no_data_found';
  end if;

  select * into v_zone from delivery_zones where id = v_addr.zone_id and is_active;
  if not found then
    raise exception 'zone_not_found' using errcode = 'no_data_found';
  end if;

  select id into v_cart_id from carts where user_id = p_user_id;
  if not found then
    raise exception 'cart_empty' using errcode = 'no_data_found';
  end if;

  -- Lock the involved products so two concurrent checkouts cannot oversell.
  perform 1
  from products p
  join cart_items ci on ci.product_id = p.id
  where ci.cart_id = v_cart_id
  for update of p;

  for v_item in
    select ci.product_id, ci.quantity, p.name_uz, p.sku, p.price, p.weight_gram,
           p.stock, p.reserved, p.max_per_order, p.is_active,
           (select url from product_images pi where pi.product_id = p.id order by pi.position limit 1) as image_url
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.cart_id = v_cart_id
  loop
    v_count := v_count + 1;

    if not v_item.is_active then
      raise exception 'product_inactive:%', v_item.name_uz using errcode = 'check_violation';
    end if;
    if v_item.quantity > v_item.max_per_order then
      raise exception 'quantity_limit:%', v_item.name_uz using errcode = 'check_violation';
    end if;
    if v_item.quantity > (v_item.stock - v_item.reserved) then
      raise exception 'out_of_stock:%', v_item.name_uz using errcode = 'check_violation';
    end if;

    v_items_total := v_items_total + v_item.price * v_item.quantity;
    v_weight := v_weight + v_item.weight_gram * v_item.quantity;
  end loop;

  if v_count = 0 then
    raise exception 'cart_empty' using errcode = 'no_data_found';
  end if;

  if p_promo_code is not null and length(trim(p_promo_code)) > 0 then
    select * into v_promo from promo_codes
    where code = trim(p_promo_code)
      and is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
      and (max_uses is null or used_count < max_uses)
      and min_order_total <= v_items_total
    for update;

    if found then
      v_discount := least(
        v_items_total,
        coalesce(v_promo.amount_off, 0) + coalesce((v_items_total * v_promo.percent_off) / 100, 0)
      );
      update promo_codes set used_count = used_count + 1 where id = v_promo.id;
    else
      raise exception 'promo_invalid' using errcode = 'check_violation';
    end if;
  end if;

  v_fee := public.calc_delivery_fee(v_zone.id, v_weight, v_items_total);

  insert into orders (
    user_id, status, zone_id, address_id, address_snapshot,
    items_total, delivery_fee, discount_total, total, promo_code,
    total_weight_gram, payment_provider, payment_status, customer_note,
    promised_at, idempotency_key
  ) values (
    p_user_id,
    case when p_provider = 'cash' then 'confirmed'::order_status else 'pending_payment'::order_status end,
    v_zone.id,
    v_addr.id,
    jsonb_build_object(
      'recipient_name', v_addr.recipient_name,
      'phone', v_addr.phone,
      'line1', v_addr.line1,
      'landmark', v_addr.landmark,
      'lat', v_addr.lat,
      'lng', v_addr.lng,
      'zone', v_zone.name_uz
    ),
    v_items_total,
    v_fee,
    v_discount,
    v_items_total - v_discount + v_fee,
    nullif(trim(coalesce(p_promo_code, '')), ''),
    v_weight,
    p_provider,
    'pending'::payment_status,
    nullif(trim(coalesce(p_note, '')), ''),
    now() + make_interval(hours => v_zone.sla_hours),
    p_idempotency_key
  )
  returning id into v_order_id;

  insert into order_items (
    order_id, product_id, name_snapshot, sku_snapshot, image_snapshot,
    unit_price, quantity, weight_gram, line_total
  )
  select
    v_order_id, p.id, p.name_uz, p.sku,
    (select url from product_images pi where pi.product_id = p.id order by pi.position limit 1),
    p.price, ci.quantity, p.weight_gram * ci.quantity, p.price * ci.quantity
  from cart_items ci
  join products p on p.id = ci.product_id
  where ci.cart_id = v_cart_id;

  -- Reserve stock; it is decremented for real once the order ships.
  update products p
  set reserved = p.reserved + ci.quantity
  from cart_items ci
  where ci.cart_id = v_cart_id and ci.product_id = p.id;

  insert into payments (order_id, provider, status, amount)
  select v_order_id, p_provider, 'pending'::payment_status, total from orders where id = v_order_id;

  insert into shipments (order_id, status, planned_at)
  values (v_order_id, 'pending'::shipment_status, now() + make_interval(hours => v_zone.min_hours));

  insert into order_status_history (order_id, from_status, to_status, changed_by, comment)
  select v_order_id, null, status, p_user_id, 'order created' from orders where id = v_order_id;

  insert into notifications (user_id, title, body, link, is_admin_only)
  select p_user_id, 'Buyurtma qabul qilindi',
         'Buyurtma raqami: ' || order_number, '/orders/' || v_order_id, false
  from orders where id = v_order_id;

  insert into notifications (user_id, title, body, link, is_admin_only)
  select null, 'Yangi buyurtma',
         order_number || ' — ' || total || ' UZS', '/__console/orders/' || v_order_id, true
  from orders where id = v_order_id;

  delete from cart_items where cart_id = v_cart_id;

  return v_order_id;
end;
$$;
revoke all on function public.create_order_from_cart(uuid, uuid, payment_provider, text, text, text) from public, anon, authenticated;
grant execute on function public.create_order_from_cart(uuid, uuid, payment_provider, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Payment settlement (called from verified provider callbacks)
-- ---------------------------------------------------------------------------
create or replace function public.mark_payment_paid(
  p_payment_id uuid,
  p_provider_transaction_id text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order orders;
begin
  update payments
  set status = 'paid',
      paid_at = coalesce(paid_at, now()),
      provider_transaction_id = coalesce(provider_transaction_id, p_provider_transaction_id)
  where id = p_payment_id and status <> 'paid';

  select o.* into v_order from orders o join payments p on p.order_id = o.id where p.id = p_payment_id;
  if not found then
    raise exception 'payment_not_found' using errcode = 'no_data_found';
  end if;

  update orders
  set payment_status = 'paid',
      status = case when status in ('created', 'pending_payment') then 'paid'::order_status else status end
  where id = v_order.id;

  insert into notifications (user_id, title, body, link)
  values (v_order.user_id, 'To''lov qabul qilindi', v_order.order_number || ' uchun to''lov o''tdi', '/orders/' || v_order.id);
end;
$$;
revoke all on function public.mark_payment_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_payment_paid(uuid, text) to service_role;

create or replace function public.cancel_payment(
  p_payment_id uuid,
  p_reason int default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_was_paid boolean;
begin
  select order_id, status = 'paid' into v_order_id, v_was_paid from payments where id = p_payment_id;
  if v_order_id is null then
    raise exception 'payment_not_found' using errcode = 'no_data_found';
  end if;

  update payments
  set status = case when v_was_paid then 'refunded'::payment_status else 'cancelled'::payment_status end,
      cancelled_at = now(),
      cancel_reason = p_reason
  where id = p_payment_id;

  update orders
  set payment_status = case when v_was_paid then 'refunded'::payment_status else 'cancelled'::payment_status end,
      status = case
        when status in ('created', 'pending_payment', 'paid', 'confirmed', 'packing') then 'cancelled'::order_status
        else status
      end
  where id = v_order_id;

  -- Release the reservation.
  update products p
  set reserved = greatest(0, p.reserved - oi.quantity)
  from order_items oi
  where oi.order_id = v_order_id and oi.product_id = p.id;
end;
$$;
revoke all on function public.cancel_payment(uuid, int) from public, anon, authenticated;
grant execute on function public.cancel_payment(uuid, int) to service_role;

-- ---------------------------------------------------------------------------
-- Late delivery compensation (SLA)
-- ---------------------------------------------------------------------------
create or replace function public.apply_late_compensations() returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_amount bigint;
  v_applied int := 0;
  v_row record;
begin
  select coalesce((value ->> 'amount')::bigint, 5000) into v_amount
  from settings where key = 'late_delivery_compensation';
  v_amount := coalesce(v_amount, 5000);

  for v_row in
    select o.id, o.user_id, o.order_number, o.promised_at,
           ceil(extract(epoch from (coalesce(o.delivered_at, now()) - o.promised_at)) / 3600)::int as hours_late
    from orders o
    where o.promised_at is not null
      and o.status in ('confirmed', 'packing', 'shipped', 'delivered', 'completed')
      and coalesce(o.delivered_at, now()) > o.promised_at
      and not exists (
        select 1 from delivery_compensations dc
        where dc.order_id = o.id and dc.reason = 'late_delivery'
      )
  loop
    insert into delivery_compensations (order_id, amount, reason, hours_late)
    values (v_row.id, v_amount, 'late_delivery', v_row.hours_late);

    update orders
    set compensation_total = compensation_total + v_amount,
        total = greatest(0, total - v_amount)
    where id = v_row.id;

    insert into notifications (user_id, title, body, link)
    values (
      v_row.user_id,
      'Kechikish uchun kompensatsiya',
      v_row.order_number || ' buyurtmasi kechikdi, ' || v_amount || ' so''m qaytarildi',
      '/orders/' || v_row.id
    );

    v_applied := v_applied + 1;
  end loop;

  return v_applied;
end;
$$;
revoke all on function public.apply_late_compensations() from public, anon, authenticated;
grant execute on function public.apply_late_compensations() to service_role;

-- ---------------------------------------------------------------------------
-- Stock is consumed when the order ships, released when it is cancelled.
-- ---------------------------------------------------------------------------
create or replace function public.sync_stock_on_status() returns trigger
language plpgsql
as $$
begin
  if new.status = 'shipped' and old.status <> 'shipped' then
    update products p
    set stock = greatest(0, p.stock - oi.quantity),
        reserved = greatest(0, p.reserved - oi.quantity),
        sold_count = p.sold_count + oi.quantity
    from order_items oi
    where oi.order_id = new.id and oi.product_id = p.id;
  elsif new.status in ('cancelled', 'returned') and old.status not in ('cancelled', 'returned') then
    update products p
    set reserved = greatest(0, p.reserved - oi.quantity)
    from order_items oi
    where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$;

create trigger orders_sync_stock after update of status on orders
  for each row execute function public.sync_stock_on_status();

-- Ratings are derived, never client-supplied.
create or replace function public.refresh_product_rating() returns trigger
language plpgsql
as $$
declare
  v_product uuid := coalesce(new.product_id, old.product_id);
begin
  update products p
  set rating = coalesce((select round(avg(rating)::numeric, 2) from reviews r where r.product_id = v_product and r.is_approved), 0),
      reviews_count = (select count(*) from reviews r where r.product_id = v_product and r.is_approved)
  where p.id = v_product;
  return null;
end;
$$;

create trigger reviews_refresh_rating after insert or update or delete on reviews
  for each row execute function public.refresh_product_rating();
