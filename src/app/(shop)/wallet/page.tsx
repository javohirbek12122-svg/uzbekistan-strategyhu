'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Wallet as WalletIcon } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  const wallet = useAppStore((s) => s.wallet);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">Hamyon &amp; Keshbek</h1>
        <p className="text-sm text-ink-500">Avtomatik 2% keshbek va Parkent Coin yig&apos;ish</p>
      </header>

      <section className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Mavjud balans</p>
            <p className="text-3xl font-extrabold">{wallet.balance.toLocaleString()} so'm</p>
          </div>
          <WalletIcon className="h-10 w-10 opacity-50" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/20 pt-4 text-sm">
          <div>
            <p className="opacity-80">Parkent Coin</p>
            <p className="flex items-center gap-1 text-lg font-bold">
              <Coins className="h-4 w-4" />
              {wallet.coins}
            </p>
          </div>
          <div>
            <p className="opacity-80">Keshbek stavkasi</p>
            <p className="text-lg font-bold">{(wallet.cashbackRate * 100).toFixed(0)}%</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            So'nggi keshbek
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-ink-500">Buyurtma #10230</span>
              <span className="font-semibold text-emerald-600">+2 500 so&apos;m</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-ink-500">Buyurtma #10228</span>
              <span className="font-semibold text-emerald-600">+1 800 so&apos;m</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-ink-500">Buyurtma #10225</span>
              <span className="font-semibold text-emerald-600">+3 200 so&apos;m</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold">1-click to&apos;lov</h2>
          <p className="mt-1 text-xs text-ink-500">Click / Payme / Uzum orqali tezkor to&apos;lov</p>
          <div className="mt-3 grid gap-2">
            <button className="btn-secondary w-full">💳 Click orqali</button>
            <button className="btn-secondary w-full">💳 Payme orqali</button>
            <button className="btn-secondary w-full">💳 Uzum orqali</button>
          </div>
        </div>
      </section>
    </div>
  );
}
