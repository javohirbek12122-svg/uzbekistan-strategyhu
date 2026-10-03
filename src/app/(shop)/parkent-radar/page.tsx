
import Link from 'next/link';
import { Sparkles, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { getZones } from '@/server/queries';
import { getLatestProducts } from '@/server/coins';
import { money } from '@/lib/format';
import { formatEta } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

export default async function ParkentRadarPage() {
  const [zones, products] = await Promise.all([getZones(), getLatestProducts(6)]);
  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
      <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-brand-500/20 to-transparent" />
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5"/> PARKENT RADAR</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Hududni ham interfeysning bir qismi qildik.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Yetkazish tezligi, hudud oynasi va mahsulot signalini bitta ko‘rinishda kuzating.</p>
      </div>
      <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/10 p-4"><Sparkles className="h-5 w-5 text-emerald-300"/><p className="mt-2 text-xs text-white/60">Tizim</p><p className="font-bold">Jonli</p></div>
        <div className="rounded-2xl bg-white/10 p-4"><MapPin className="h-5 w-5 text-sky-300"/><p className="mt-2 text-xs text-white/60">Hududlar</p><p className="font-bold">{zones.length} ta faol</p></div>
        <div className="rounded-2xl bg-white/10 p-4"><Sparkles className="h-5 w-5 text-amber-300"/><p className="mt-2 text-xs text-white/60">Yangi qatlam</p><p className="font-bold">MapPin Signal</p></div>
      </div>
    </section>

    <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Hudud oynalari</h2><Link href="/delivery" className="text-sm font-semibold text-brand-600">Yetkazish qoidalari →</Link></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map(zone => <article key={zone.id} className="card p-5">
          <div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><MapPin className="h-4 w-4"/></span><div><p className="font-bold">{zone.name_uz}</p><p className="text-xs text-ink-500">{formatEta(zone)}</p></div></div><span className="badge bg-emerald-50 text-emerald-700">faol</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-ink-500">Bazaviy</p><b>{money(zone.base_fee)}</b></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-ink-500">SLA</p><b>{zone.sla_hours} soat</b></div></div>
        </article>)}
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <div className="card p-5">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand-600"/><h2 className="font-bold">MapPin yondashuvi</h2></div>
        <p className="mt-2 text-sm text-ink-500">Hudud kartasi faqat ma'lumot bermaydi: u katalog, AI va yetkazish qarorini birlashtirish uchun xizmat qiladi.</p>
        <div className="mt-4 space-y-2 text-xs"><div className="rounded-xl bg-slate-50 p-3">1. Hududingizni aniqlang</div><div className="rounded-xl bg-slate-50 p-3">2. AI’dan xarid maqsadini tuzing</div><div className="rounded-xl bg-slate-50 p-3">3. Signal va ShieldCheck bilan riskni boshqaring</div></div>
      </div>
      <div className="card p-5">
        <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-sky-600"/><h2 className="font-bold">Mahsulot oqimi</h2></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {products.map(product => <Link key={product.id} href={'/product/' + product.name_uz.toLowerCase().replace(/\s+/g, '-')} className="rounded-2xl border border-slate-200 p-4 hover:border-brand-300">
            <p className="text-sm font-semibold">{product.name_uz}</p><p className="mt-1 text-xs text-ink-500">{money(product.price)}</p><span className="mt-2 inline-flex text-xs font-semibold text-brand-600">Signal qo‘yish →</span>
          </Link>)}
        </div>
      </div>
    </section>
  </div>;
}
