'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Users, CalendarClock, Wallet } from 'lucide-react';

export default function B2BPage() {
  const [mounted, setMounted] = useState(false);
  const [people, setPeople] = useState(100);
  const [eventDate, setEventDate] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalPrice = people * 25000;
  const upfront = totalPrice * 0.5;
  const postpay = totalPrice * 0.5;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">B2B Portal — Catering &amp; Choyxona</h1>
        <p className="text-sm text-ink-500">To&apos;y, marosim va korporativ tadbirlar uchun bulk buyurtma</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: 'Mehmonlar', value: people },
          { icon: CalendarClock, label: 'Sana', value: eventDate || '—' },
          { icon: Wallet, label: 'Umumiy', value: `${totalPrice.toLocaleString()} so&apos;m` },
          { icon: Briefcase, label: 'Oldindan (50%)', value: `${upfront.toLocaleString()} so&apos;m` },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <Icon className="h-5 w-5 text-brand-500" />
              <p className="mt-2 text-xs text-ink-500">{item.label}</p>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">Tadbir ma'lumotlari</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Mehmonlar soni</label>
            <input
              type="number"
              min={20}
              value={people}
              onChange={(e) => setPeople(Math.max(20, Number(e.target.value) || 20))}
              className="input mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tadbir sanasi</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="input mt-1 w-full"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-amber-50 p-5">
        <h2 className="text-lg font-bold text-brand-900">Uzum Digital Nasiya</h2>
        <p className="mt-1 text-sm text-brand-800">
          Tadbir tugaganidan keyin 3 kun ichida qolgan 50% ni to&apos;lang.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white/80 p-4">
            <p className="text-xs text-ink-500">Oldindan to&apos;lov (50%)</p>
            <p className="text-2xl font-extrabold text-ink-900">{upfront.toLocaleString()} so&apos;m</p>
            <p className="text-xs text-ink-500">Tadbir boshlanishida</p>
          </div>
          <div className="rounded-xl bg-white/80 p-4">
            <p className="text-xs text-ink-500">Keyingi to&apos;lov (50%)</p>
            <p className="text-2xl font-extrabold text-ink-900">{postpay.toLocaleString()} so&apos;m</p>
            <p className="text-xs text-ink-500">3 kun ichida</p>
          </div>
        </div>
        <button className="btn-primary mt-4 w-full sm:w-auto">Buyurtma berish</button>
      </section>
    </div>
  );
}
