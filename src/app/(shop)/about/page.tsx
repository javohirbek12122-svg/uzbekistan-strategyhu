import type { Metadata } from 'next';
import { getStoreSettings } from '@/server/queries';

export const metadata: Metadata = { title: 'Biz haqimizda' };
export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">Biz haqimizda</h1>
      <p className="text-sm leading-relaxed text-ink-700">
        {settings.name} — Parkent tumani aholisi uchun mahalliy onlayn bozor. Biz guruch, oziq-ovqat,
        uy-ro&apos;zg&apos;or va gigiyena mahsulotlarini bozor narxida, aniq vaznda va tez muddatda yetkazib beramiz.
      </p>
      <p className="text-sm leading-relaxed text-ink-700">
        Har bir buyurtma tizimda kuzatiladi: narx, vazn va yetkazib berish summasi server tomonida hisoblanadi,
        holat o&apos;zgarishlari esa tarixda saqlanadi. Bu xaridor va sotuvchi uchun to&apos;liq shaffoflikni
        ta&apos;minlaydi.
      </p>
      <div className="card p-4 text-sm">
        <p className="font-semibold">Aloqa</p>
        <p className="text-ink-500">{settings.phone}</p>
        <p className="text-ink-500">{settings.address}</p>
      </div>
    </div>
  );
}
