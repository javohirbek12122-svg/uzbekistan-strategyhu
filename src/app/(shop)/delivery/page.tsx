import type { Metadata } from 'next';
import { getZones } from '@/server/queries';
import { formatEta } from '@/lib/delivery';
import { money } from '@/lib/format';

export const metadata: Metadata = { title: "Yetkazib berish va to'lov" };
export const dynamic = 'force-dynamic';

export default async function DeliveryPage() {
  const zones = await getZones();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Yetkazib berish va to&apos;lov</h1>
        <p className="mt-1 text-sm text-ink-500">
          Buyurtmalar 1 ish kunida yetkaziladi. Va&apos;da qilingan vaqt o&apos;tib ketsa, xaridorga 5 000 so&apos;m
          qoplama avtomatik hisoblanadi.
        </p>
      </div>

      <section className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Hudud</th>
              <th>Narx</th>
              <th>Muddat</th>
              <th>Har qo&apos;shimcha kg</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id}>
                <td className="font-medium">{zone.name_uz}</td>
                <td>
                  {money(zone.base_fee)} — {money(zone.max_fee)}
                </td>
                <td>{formatEta(zone)}</td>
                <td>{money(zone.fee_per_kg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card space-y-2 p-4 text-sm">
        <h2 className="font-semibold">To&apos;lov usullari</h2>
        <ul className="list-inside list-disc space-y-1 text-ink-500">
          <li>Payme — karta orqali onlayn to&apos;lov</li>
          <li>Click — karta orqali onlayn to&apos;lov</li>
          <li>Naqd — mahsulotni qabul qilganda kuryerga</li>
        </ul>
        <p className="text-xs text-ink-500">
          Onlayn to&apos;lovlar to&apos;lov tizimlari tomonidan tasdiqlanadi; summa har doim server tomonida
          tekshiriladi.
        </p>
      </section>

      <section className="card space-y-2 p-4 text-sm">
        <h2 className="font-semibold">Qaytarish shartlari</h2>
        <p className="text-ink-500">
          Mahsulot sifati talabga javob bermasa, qabul qilgan kundan 24 soat ichida &laquo;Yordam&raquo; bo&apos;limi
          orqali qaytarish so&apos;rovini yuboring. Tasdiqlangan holatlarda to&apos;lov to&apos;liq qaytariladi.
        </p>
      </section>
    </div>
  );
}
