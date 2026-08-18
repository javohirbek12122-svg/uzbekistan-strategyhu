'use client';

import { useActionState, useMemo, useState } from 'react';
import { Banknote, CreditCard, MapPin } from 'lucide-react';
import { placeOrder } from '@/server/actions/shop';
import { initialFormState } from '@/lib/validation';
import { calcDeliveryFee, formatEta } from '@/lib/delivery';
import { money } from '@/lib/format';
import { SubmitButton } from '@/components/ui/submit-button';
import type { Address, DeliveryZone } from '@/lib/types';

const PROVIDERS = [
  { key: 'payme', label: 'Payme', icon: CreditCard, hint: 'Karta bilan onlayn' },
  { key: 'click', label: 'Click', icon: CreditCard, hint: 'Karta bilan onlayn' },
  { key: 'cash', label: 'Naqd', icon: Banknote, hint: 'Kuryerga qabul qilganda' },
] as const;

export function CheckoutForm({
  addresses,
  zones,
  itemsTotal,
  weightGram,
}: {
  addresses: Address[];
  zones: DeliveryZone[];
  itemsTotal: number;
  weightGram: number;
}) {
  const [state, action] = useActionState(placeOrder, initialFormState);
  const [addressId, setAddressId] = useState(addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? '');
  const [provider, setProvider] = useState<'payme' | 'click' | 'cash'>('payme');
  // Regenerated per mount: protects against double submits creating two orders.
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const zone = useMemo(() => {
    const address = addresses.find((a) => a.id === addressId);
    return zones.find((z) => z.id === address?.zone_id) ?? null;
  }, [addressId, addresses, zones]);

  const deliveryFee = zone ? calcDeliveryFee({ zone, weightGram, itemsTotal }) : null;

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />

      <div className="space-y-5">
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Yetkazib berish manzili</h2>
          <div className="space-y-2">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                  addressId === address.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="address_id"
                  value={address.id}
                  checked={addressId === address.id}
                  onChange={() => setAddressId(address.id)}
                  className="mt-1"
                />
                <span>
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="h-4 w-4" />
                    {address.label ?? address.recipient_name}
                  </span>
                  <span className="block text-ink-500">{address.line1}</span>
                  <span className="block text-xs text-ink-500">
                    {address.phone} · {address.delivery_zones?.name_uz ?? '—'}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {state?.fieldErrors?.address_id && (
            <p className="mt-2 text-xs text-red-600">{state.fieldErrors.address_id[0]}</p>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-3 font-semibold">To&apos;lov usuli</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {PROVIDERS.map(({ key, label, icon: Icon, hint }) => (
              <label
                key={key}
                className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm ${
                  provider === key ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="provider"
                    value={key}
                    checked={provider === key}
                    onChange={() => setProvider(key)}
                  />
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <span className="text-xs text-ink-500">{hint}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Qo&apos;shimcha</h2>
          <div>
            <label className="label" htmlFor="promo_code">
              Promo-kod
            </label>
            <input id="promo_code" name="promo_code" className="input" placeholder="Masalan: PARKENT10" />
          </div>
          <div>
            <label className="label" htmlFor="note">
              Kuryerga izoh
            </label>
            <textarea id="note" name="note" rows={3} className="input" placeholder="Qo'ng'iroq qilib keling" />
          </div>
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-4 lg:sticky lg:top-28">
        <h2 className="font-semibold">Jami</h2>
        <Row label="Mahsulotlar" value={money(itemsTotal)} />
        <Row label="Vazn" value={`${(weightGram / 1000).toFixed(2)} kg`} />
        <Row label="Yetkazib berish" value={deliveryFee === null ? '—' : money(deliveryFee)} />
        {zone && <Row label="Muddat" value={formatEta(zone)} />}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base font-bold">
          <span>To&apos;lanadi</span>
          <span>{deliveryFee === null ? money(itemsTotal) : money(itemsTotal + deliveryFee)}</span>
        </div>
        <p className="text-xs text-ink-500">
          Ko&apos;rsatilgan summa taxminiy. Yakuniy summa server tomonida katalog narxlari asosida hisoblanadi.
        </p>
        {state?.ok === false && state.message && <p className="text-sm text-red-600">{state.message}</p>}
        <SubmitButton className="w-full" pendingLabel="Buyurtma yaratilmoqda…">
          Buyurtmani tasdiqlash
        </SubmitButton>
      </aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
