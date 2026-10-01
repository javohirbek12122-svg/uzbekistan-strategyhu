import Link from 'next/link';
import type { Metadata } from 'next';
import { getAddresses, getCart, getZones } from '@/server/queries';
import { CheckoutForm } from '@/components/shop/checkout-form';
import { AddressForm } from '@/components/shop/address-form';
import { requireServiceClient } from '@/lib/supabase/service';

export const metadata: Metadata = { title: 'Rasmiylashtirish' };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const [cart, addresses, zones, storeSetting] = await Promise.all([
    getCart(),
    getAddresses(),
    getZones(),
    requireServiceClient().from('settings').select('value').eq('key', 'store_control').maybeSingle(),
  ]);

  const control = (storeSetting.data?.value ?? {}) as Record<string, unknown>;
  if (control.checkout_enabled === false || control.new_orders_enabled === false || control.maintenance_mode === true) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-lg font-bold">Rasmiylashtirish vaqtincha yopiq</h1>
        <p className="mt-2 text-sm text-ink-500">Admin boshqaruvida checkout yoki yangi buyurtmalar vaqtincha o‘chirildi.</p>
        <Link href="/cart" className="btn-primary mt-4">Savatga qaytish</Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="text-lg font-bold">Savat bo&apos;sh</h1>
        <Link href="/catalog" className="btn-primary mt-4">
          Katalogga o&apos;tish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Buyurtmani rasmiylashtirish</h1>

      {addresses.length === 0 ? (
        <div className="mx-auto max-w-xl space-y-3">
          <p className="text-sm text-ink-500">Davom etish uchun yetkazib berish manzilini qo&apos;shing.</p>
          <AddressForm zones={zones} />
        </div>
      ) : (
        <>
          <CheckoutForm
            addresses={addresses}
            zones={zones}
            itemsTotal={cart.itemsTotal}
            weightGram={cart.weightGram}
          />
          <details className="mx-auto max-w-xl">
            <summary className="cursor-pointer text-sm font-medium text-brand-600">Yangi manzil qo&apos;shish</summary>
            <div className="mt-3">
              <AddressForm zones={zones} />
            </div>
          </details>
        </>
      )}
    </div>
  );
}
