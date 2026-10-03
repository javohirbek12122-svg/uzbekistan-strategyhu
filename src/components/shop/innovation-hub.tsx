
import Link from 'next/link';
import { ArrowUpRight, MapPin, Radar, Sparkles, WalletCards, Zap } from 'lucide-react';
import type { CoinWallet } from '@/server/coins';

export function InnovationHub({ wallet }: { wallet: CoinWallet | null }) {
  const mechanisms = [
    ['01', 'Coin Pulse', 'Ketma-ket kunlar uzaygani sari kunlik reward 5–19 Coin oralig‘ida o‘sadi.'],
    ['02', 'AI Deep Mode', '3 Coin evaziga AI Studio 24 soatlik chuqur rejimga o‘tadi.'],
    ['03', 'Price Signal', '5 Coin evaziga tanlangan mahsulot uchun 7 kunlik kuzatuv yoqiladi.'],
    ['04', 'Delivery Shield', '20 Coin rezerv qilinadi; vaqtida yetkazilsa qaytadi, kechiksa +10 bonus beradi.'],
  ];
  return <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-100/70 blur-2xl" />
    <div className="relative">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="badge bg-brand-50 text-brand-700">Yangi avlod Parkent mexanizmlari</span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">AI + Coin + Hudud = bitta ekotizim</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">Xarid, AI va yetkazib berish bir-biriga ulanadi. Coinlar serverdagi ledgerda saqlanadi.</p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
          <p className="text-[11px] text-white/60">Parkent Coin</p>
          <p className="text-2xl font-black">{wallet?.balance?.toLocaleString() ?? '0'}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Link href="/ai-lab" className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Sparkles className="h-5 w-5" /></span>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-4 font-bold">AI Basket Pilot</p><p className="mt-1 text-xs text-ink-500">Maqsadni kiriting — savat mantig‘ini birga tuzing.</p>
        </Link>
        <Link href="/coin-lab" className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><WalletCards className="h-5 w-5" /></span>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-4 font-bold">Coin Lab</p><p className="mt-1 text-xs text-ink-500">Pulse, Boost, Signal va Shield bir panelda.</p>
        </Link>
        <Link href="/parkent-radar" className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
          <div className="flex items-start justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600"><MapPin className="h-5 w-5" /></span>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-4 font-bold">Parkent Radar</p><p className="mt-1 text-xs text-ink-500">Hudud, yetkazish va mahalliy signal qatlamlari.</p>
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mechanisms.map(([num, title, copy]) => <div key={num} className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600"><Zap className="h-3.5 w-3.5" />{num}</div>
          <p className="mt-2 font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-ink-500">{copy}</p>
        </div>)}
      </div>
    </div>
  </section>;
}
