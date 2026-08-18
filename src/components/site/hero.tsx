import Link from 'next/link';
import { Clock, ShieldCheck, Truck } from 'lucide-react';
import type { Banner } from '@/lib/types';

export function Hero({ banners }: { banners: Banner[] }) {
  const main = banners[0];

  return (
    <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl bg-brand-600 text-white">
        {/*
          Rendered as a background rather than through next/image: banner URLs are
          owner-supplied and any host outside `remotePatterns` would throw and take
          the whole page down.
        */}
        {main?.image_url && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{ backgroundImage: `url(${JSON.stringify(main.image_url)})` }}
          />
        )}
        <div className="relative flex flex-col items-start gap-4 p-6 sm:p-10">
          <span className="badge bg-white/20 text-white">Parkent tumani · onlayn bozor</span>
          <h1 className="max-w-xl text-2xl font-extrabold leading-tight sm:text-4xl">
            {main?.title ?? "Guruch, oziq-ovqat va uy-ro'zg'or mahsulotlari — uyingizgacha"}
          </h1>
          <p className="max-w-lg text-sm text-white/85 sm:text-base">
            {main?.subtitle ?? "Mahalliy narxlar, aniq vazn, 1 ish kunida yetkazib berish. Kechiksa — 5 000 so'm qoplama."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/catalog" className="btn bg-white font-bold text-brand-700 hover:bg-brand-50">
              Xarid qilish
            </Link>
            <Link href="/delivery" className="btn border border-white/40 text-white hover:bg-white/10">
              Yetkazib berish shartlari
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <Feature icon={Truck} title="Tez yetkazib berish" text="Parkent markazi — 1 soatdan 1 kungacha" />
        <Feature icon={ShieldCheck} title="Xavfsiz to'lov" text="Payme, Click yoki qabul qilganda naqd" />
        <Feature icon={Clock} title="Kechikishga qoplama" text="Va'da qilingan vaqt o'tsa — 5 000 so'm" />
      </div>
    </section>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="card flex items-start gap-3 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-ink-500">{text}</p>
      </div>
    </div>
  );
}
