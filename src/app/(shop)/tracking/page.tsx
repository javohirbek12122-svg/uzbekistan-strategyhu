'use client';

import { useState, useEffect } from 'react';
import { Check, Clock, PackageCheck, Truck, Home as HomeIcon } from 'lucide-react';
import { cn } from '@/lib/format';

const STEPS = [
  { key: 'received', label: 'Qabul qilindi', icon: Clock },
  { key: 'packed', label: 'Qoplandi va Yorliqlandi', icon: PackageCheck },
  { key: 'shipped', label: 'Reysga yuklandi', icon: Truck },
  { key: 'delivered', label: 'Topshirildi', icon: HomeIcon },
];

const SAMPLE_ORDERS = [
  { id: 'PM-10234', status: 'shipped', eta: '18:30', zone: 'So&apos;qoq' },
  { id: 'PM-10235', status: 'packed', eta: '19:00', zone: 'Kumushkon' },
  { id: 'PM-10236', status: 'received', eta: '20:15', zone: 'Hisarak' },
];

export default function TrackingPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const order = SAMPLE_ORDERS[selectedIdx];
  const currentStepIdx = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">Reyslar GPS — Jonli Trekker</h1>
        <p className="text-sm text-ink-500">Buyurtmangiz qayerda — real vaqtda kuzatib boring</p>
      </header>

      <section className="flex gap-2 overflow-x-auto pb-2">
        {SAMPLE_ORDERS.map((o, idx) => (
          <button
            key={o.id}
            onClick={() => setSelectedIdx(idx)}
            className={cn(
              'shrink-0 rounded-xl border px-4 py-2 text-left transition-colors',
              selectedIdx === idx
                ? 'border-brand-500 bg-brand-50 text-brand-900'
                : 'border-slate-200 bg-white text-ink-700'
            )}
          >
            <p className="text-xs font-medium">{o.id}</p>
            <p className="text-sm font-bold">{o.zone}</p>
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-500">Buyurtma</p>
            <p className="text-lg font-bold">{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-500">Yetkazish vaqti</p>
            <p className="text-lg font-bold text-brand-600">{order.eta}</p>
          </div>
        </div>

        <ol className="space-y-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const completed = idx <= currentStepIdx;
            const active = idx === currentStepIdx;
            return (
              <li key={step.key} className="flex items-center gap-3">
                <div
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-full border-2',
                    completed
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-slate-200 bg-white text-slate-400',
                    active && 'ring-4 ring-brand-100'
                  )}
                >
                  {completed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm font-semibold', completed ? 'text-ink-900' : 'text-ink-400')}>
                    {step.label}
                  </p>
                  {active && <p className="text-xs text-brand-600">Hozir shu bosqichda</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-bold">Xarita preview</h2>
          <div className="grid h-40 place-items-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-300 text-brand-800">
            <p className="text-sm">📍 {order.zone} — Parkent tumani</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-bold">Haydovchi</h2>
          <p className="text-sm text-ink-700">Jasur T.</p>
          <p className="text-xs text-ink-500">+998 90 123 45 67</p>
          <a href="tel:+998901234567" className="btn-primary mt-3 inline-flex">
            Qo'ng'iroq qilish
          </a>
        </div>
      </section>
    </div>
  );
}
