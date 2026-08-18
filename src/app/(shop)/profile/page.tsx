import Link from 'next/link';
import type { Metadata } from 'next';
import { LogOut, MapPin, Package } from 'lucide-react';
import { getAddresses, getMyOrders, getZones } from '@/server/queries';
import { AddressForm } from '@/components/shop/address-form';
import { getSessionUser, createClient } from '@/lib/supabase/server';
import { signOut } from '@/server/actions/auth';
import { money } from '@/lib/format';

export const metadata: Metadata = { title: 'Profil' };
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getSessionUser();
  const supabase = await createClient();
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name, phone, email').eq('id', user.id).maybeSingle()
    : { data: null };

  const [addresses, orders, zones] = await Promise.all([getAddresses(), getMyOrders(), getZones()]);
  const spent = orders
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <section className="space-y-4">
        <div className="card p-4">
          <h1 className="text-lg font-bold">{profile?.full_name ?? 'Foydalanuvchi'}</h1>
          <p className="text-sm text-ink-500">{profile?.email ?? user?.email}</p>
          <p className="text-sm text-ink-500">{profile?.phone ?? '—'}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="btn-secondary">
              <LogOut className="h-4 w-4" />
              Chiqish
            </button>
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card p-4">
            <p className="text-sm text-ink-500">Buyurtmalar</p>
            <p className="text-2xl font-bold">{orders.length}</p>
            <Link href="/orders" className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
              <Package className="h-4 w-4" /> Ko&apos;rish
            </Link>
          </div>
          <div className="card p-4">
            <p className="text-sm text-ink-500">Xarid summasi</p>
            <p className="text-2xl font-bold">{money(spent)}</p>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Manzillarim</h2>
          {addresses.length === 0 ? (
            <p className="text-sm text-ink-500">Manzil qo&apos;shilmagan.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {addresses.map((address) => (
                <li key={address.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="flex items-center gap-1 font-medium">
                    <MapPin className="h-4 w-4" />
                    {address.label ?? address.recipient_name}
                    {address.is_default && <span className="badge bg-brand-100 text-brand-700">Asosiy</span>}
                  </p>
                  <p className="text-ink-500">{address.line1}</p>
                  <p className="text-xs text-ink-500">
                    {address.phone} · {address.delivery_zones?.name_uz ?? '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <aside>
        <AddressForm zones={zones} />
      </aside>
    </div>
  );
}
