import type { Metadata } from 'next';
import { MapPin, Users, TreePine, Building2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Parkent tumani' };
export const dynamic = 'force-dynamic';

export default function ParkentPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="card space-y-4 p-6">
        <h1 className="text-3xl font-extrabold">Parkent tumani</h1>
        <p className="text-base text-ink-700">
          Parkent — Toshkent viloyatining shimoli-sharqidagi tarixiy va go&apos;zal tuman. Bu yerda
          an&apos;anaviy hunarmandchilik, qishloq xo&apos;jiligi va zamonaviy raqamli iqtisodiyot
          uyg&apos;unlashadi.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4 text-center">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-brand-600" />
            <p className="text-sm font-semibold">Joylashuv</p>
            <p className="text-xs text-ink-500">Toshkent viloyati, shimoli-sharq</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-brand-600" />
            <p className="text-sm font-semibold">Aholi</p>
            <p className="text-xs text-ink-500">150 000+</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 text-center">
            <TreePine className="mx-auto mb-2 h-8 w-8 text-brand-600" />
            <p className="text-sm font-semibold">Tabiat</p>
            <p className="text-xs text-ink-500">Tog&apos;lar va bog&apos;lar</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 text-center">
            <Building2 className="mx-auto mb-2 h-8 w-8 text-brand-600" />
            <p className="text-sm font-semibold">Iqtisodiyot</p>
            <p className="text-xs text-ink-500">Qishloq xo&apos;jiligi va sanoat</p>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-2xl font-bold">Tarix</h2>
        <p className="text-base text-ink-700">
          Parkent tumani ming yillik tarixga ega. Bu yerda qadimgi savdo yo&apos;llari, tarixiy
          inshootlar va boy madaniy meros saqlanib qolgan.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-1 font-semibold">Qadimgi Parkent</h3>
            <p className="text-sm text-ink-500">
              Miloddan avvalgi davrlardan beri aholi punkti sifatida ma&apos;lum.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-1 font-semibold">Zamonaviy Parkent</h3>
            <p className="text-sm text-ink-500">
              Raqamli iqtisodiyot va zamonaviy infratuzilma rivojlanmoqda.
            </p>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-2xl font-bold">Diqqatga loyiq joylar</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold">Parkent qal&apos;asi</h3>
            <p className="text-sm text-ink-500">Tarixiy qal&apos;a harabasi</p>
          </li>
          <li className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold">Chinor bog&apos;i</h3>
            <p className="text-sm text-ink-500">Tabiiy bog&apos; va dam olish maydoni</p>
          </li>
          <li className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold">Mahalliy bozori</h3>
            <p className="text-sm text-ink-500">An&apos;anaviy mahsulotlar va hunarmandlar</p>
          </li>
          <li className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold">E-Market platformasi</h3>
            <p className="text-sm text-ink-500">Raqamli savdo va yetkazib berish</p>
          </li>
        </ul>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="text-2xl font-bold">Iqtisodiyot va innovatsiyalar</h2>
        <p className="text-base text-ink-700">
          Parkent E-Market orqali tuman iqtisodiyotini rag&apos;batlantiramiz. Mahalliy
          ishlab chiqaruvchilarni raqamli platformaga jalb qilib, ishsizlikni kamaytirish va
          aholi daromadini oshirish maqsadida.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-600">500+</p>
            <p className="text-sm text-ink-500">Mahalliy mahsulot</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-600">1000+</p>
            <p className="text-sm text-ink-500">Faol foydalanuvchi</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-600">1 kun</p>
            <p className="text-sm text-ink-500">O&apos;rtacha yetkazish</p>
          </div>
        </div>
      </section>
    </div>
  );
}
