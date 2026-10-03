import Link from 'next/link';
import { Coins, Flame, Sparkles, WalletCards } from 'lucide-react';
import { getSessionUser } from '@/lib/supabase/server';
import { getCoinLedger, getCoinWallet } from '@/server/coins';
import { DailyCoinButton } from '@/components/shop/coin-actions';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) {
    return <div className="mx-auto max-w-lg space-y-4 py-8">
      <div className="card p-6 text-center">
        <WalletCards className="mx-auto h-10 w-10 text-brand-600"/>
        <h1 className="mt-3 text-2xl font-extrabold">Parkent Coin</h1>
        <p className="mt-2 text-sm text-ink-500">Real balans, streak va xaridga ulangan mukofotlar uchun hisobga kiring.</p>
        <Link href="/auth/login?next=/wallet" className="btn-primary mt-4 inline-flex">Kirish</Link>
      </div>
    </div>;
  }
  const [wallet, ledger] = await Promise.all([getCoinWallet(), getCoinLedger(6)]);
  const today = new Date().toISOString().slice(0, 10);
  return <div className="space-y-5">
    <header className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white">
      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Coins className="h-3.5 w-3.5"/> PARKENT COIN</span>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div><p className="text-xs text-white/55">Mavjud balans</p><p className="text-4xl font-black">{wallet?.balance?.toLocaleString() ?? 0}</p></div>
        <Link href="/coin-lab" className="btn bg-white/10 text-white hover:bg-white/15">Coin Lab →</Link>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl bg-white/5 p-3"><b>{wallet?.streak_days ?? 0}</b><span className="ml-1 text-white/55">streak</span></div>
        <div className="rounded-xl bg-white/5 p-3"><b>{wallet?.lifetime_earned ?? 0}</b><span className="ml-1 text-white/55">olingan</span></div>
        <div className="rounded-xl bg-white/5 p-3"><b>{wallet?.lifetime_spent ?? 0}</b><span className="ml-1 text-white/55">sarflangan</span></div>
      </div>
    </header>

    <section className="grid gap-3 md:grid-cols-2">
      <div className="card p-5"><div className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500"/><h2 className="font-bold">Bugungi Coin Pulse</h2></div><p className="mt-2 text-sm text-ink-500">Streak uzaygani sari kunlik mukofot o‘sadi.</p><div className="mt-4"><DailyCoinButton claimed={wallet?.last_daily_claimed_on === today}/></div></div>
      <div className="card p-5"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-600"/><h2 className="font-bold">Coin bilan nima qilish mumkin?</h2></div><p className="mt-2 text-sm text-ink-500">AI Deep Mode, Price Signal va Delivery Shield shu bir xil balansdan foydalanadi.</p><Link href="/coin-lab" className="mt-4 inline-flex text-sm font-semibold text-brand-700">Barcha mexanizmlar →</Link></div>
    </section>

    <section className="card p-5">
      <h2 className="font-bold">So‘nggi harakatlar</h2>
      {ledger.length === 0 ? <p className="mt-3 text-sm text-ink-500">Hali Coin harakati yo‘q.</p> : <div className="mt-3 divide-y divide-slate-100">{ledger.map((item: any) => <div key={item.id} className="flex items-center justify-between py-3 text-sm"><span>{item.description || item.event_type}</span><b className={item.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}>{item.delta > 0 ? '+' : ''}{item.delta} Coin</b></div>)}</div>}
    </section>
  </div>;
