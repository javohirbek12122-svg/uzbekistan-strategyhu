
import Link from 'next/link';
import { Coins, Flame, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { getSessionUser } from '@/lib/supabase/server';
import { getActiveAiBoost, getCoinLedger, getCoinWallet, getLatestCoinSignals } from '@/server/coins';
import { DailyCoinButton, AiBoostButton } from '@/components/shop/coin-actions';

export const dynamic = 'force-dynamic';

export default async function CoinLabPage() {
  const user = await getSessionUser();
  const [wallet, ledger, boost, signals] = user
    ? await Promise.all([getCoinWallet(), getCoinLedger(), getActiveAiBoost(), getLatestCoinSignals()])
    : [null, [], null, []];
  const today = new Date().toISOString().slice(0, 10);

  return <div className="space-y-6">
    <header className="grid gap-4 rounded-3xl bg-slate-950 p-6 text-white sm:p-8 md:grid-cols-[1.4fr_.6fr]">
      <div>
        <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">PARKENT COIN LAB</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Coin — xarid tarixining jonli qatlami.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Mukofot va sarf bir martalik local data emas: barcha o‘zgarishlar serverdagi ketma-ket ledger orqali saqlanadi.</p>
        {!user && <Link href="/auth/login?next=/coin-lab" className="btn mt-4 bg-white text-slate-950">Kirish</Link>}
      </div>
      <div className="rounded-2xl bg-white/10 p-5">
        <p className="text-xs text-white/60">Mavjud Coin</p>
        <p className="mt-1 text-4xl font-black">{wallet?.balance?.toLocaleString() ?? '—'}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <span className="rounded-xl bg-white/5 p-3">Toplangan<br/><b>{wallet?.lifetime_earned?.toLocaleString() ?? '—'}</b></span>
          <span className="rounded-xl bg-white/5 p-3">Sarflangan<br/><b>{wallet?.lifetime_spent?.toLocaleString() ?? '—'}</b></span>
        </div>
      </div>
    </header>

    <section className="grid gap-3 md:grid-cols-2">
      <div className="card p-5">
        <div className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500"/><h2 className="font-bold">Coin Pulse</h2></div>
        <p className="mt-2 text-sm text-ink-500">Har kuni bir marta. Streak uzaygani sari reward o‘sadi.</p>
        {user ? <div className="mt-4"><DailyCoinButton claimed={wallet?.last_daily_claimed_on === today} /></div> : <p className="mt-4 text-xs text-ink-500">Kirishdan keyin faollashadi.</p>}
      </div>
      <div className="card p-5">
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-600"/><h2 className="font-bold">AI Deep Mode</h2></div>
        <p className="mt-2 text-sm text-ink-500">3 Coin evaziga 24 soatlik AI kuchaytirgich.</p>
        {user ? <div className="mt-4"><AiBoostButton active={Boolean(boost)} /></div> : <p className="mt-4 text-xs text-ink-500">Kirishdan keyin faollashadi.</p>}
      </div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="card p-5"><Coins className="h-5 w-5 text-amber-500"/><h3 className="mt-3 font-bold">Pulse</h3><p className="mt-1 text-xs text-ink-500">Streak asosida o‘suvchi reward.</p></article>
      <article className="card p-5"><Sparkles className="h-5 w-5 text-brand-600"/><h3 className="mt-3 font-bold">Deep</h3><p className="mt-1 text-xs text-ink-500">AI imkoniyatlarini 24 soat kuchaytiradi.</p></article>
      <article className="card p-5"><MapPin className="h-5 w-5 text-sky-600"/><h3 className="mt-3 font-bold">Signal</h3><p className="mt-1 text-xs text-ink-500">7 kunlik narx kuzatuvi.</p></article>
      <article className="card p-5"><ShieldCheck className="h-5 w-5 text-emerald-600"/><h3 className="mt-3 font-bold">ShieldCheck</h3><p className="mt-1 text-xs text-ink-500">20 Coin rezerv va kechikish bonus mexanizmi.</p></article>
    </section>

    <section className="card p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Coin Ledger</h2><span className="badge bg-slate-100 text-slate-700">{ledger.length} ta</span></div>
      {ledger.length === 0 ? <p className="mt-4 text-sm text-ink-500">Hali tranzaksiya yo‘q.</p> : <div className="mt-3 divide-y divide-slate-100">
        {ledger.map((item: any) => <div key={item.id} className="flex items-center justify-between gap-3 py-3">
          <div><p className="text-sm font-medium">{item.description || item.event_type}</p><p className="text-xs text-ink-500">{new Date(item.created_at).toLocaleString('uz-UZ')}</p></div>
          <span className={item.delta > 0 ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>{item.delta > 0 ? '+' : ''}{item.delta} Coin</span>
        </div>)}
      </div>}
    </section>

    {signals.length > 0 && <section className="card p-5">
      <h2 className="font-bold">Faol Price Signal'lar</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {signals.map((signal: any) => <div key={signal.id} className="rounded-2xl bg-sky-50 p-4">
          <p className="font-semibold">{signal.products?.name_uz || 'Mahsulot'}</p>
          <p className="mt-1 text-xs text-ink-500">Hozir: {Number(signal.products?.price || 0).toLocaleString()} so‘m · {signal.target_price ? 'Maqsad: ' + Number(signal.target_price).toLocaleString() + ' so‘m' : 'Narx o‘zgarishi kuzatiladi'}</p>
        </div>)}
      </div>
    </section>}
  </div>;
}
