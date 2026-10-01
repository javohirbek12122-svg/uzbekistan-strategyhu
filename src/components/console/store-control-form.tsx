'use client';

import { useActionState } from 'react';
import { Power, ShieldAlert, ShoppingCart, UserPlus, Truck } from 'lucide-react';
import { saveStoreControl } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';

export function StoreControlForm({
  initial,
}: {
  initial: Record<string, unknown>;
}) {
  const [state, action] = useActionState(saveStoreControl, initialFormState);

  const options = [
    ['maintenance_mode', 'Maintenance mode', Power, 'Saytga texnik xizmat rejimi.'],
    ['checkout_enabled', 'Checkout yoqilgan', ShoppingCart, 'Yangi checkout jarayoniga ruxsat.'],
    ['registration_enabled', 'Ro‘yxatdan o‘tish', UserPlus, 'Yangi mijoz account yaratishi mumkin.'],
    ['new_orders_enabled', 'Yangi buyurtmalar', ShieldAlert, 'Buyurtma qabul qilish global kaliti.'],
    ['delivery_enabled', 'Yetkazib berish', Truck, 'Yetkazib berish modulini yoqish.'],
  ] as const;

  return (
    <form action={action} className="card space-y-3 p-5">
      <div><h2 className="font-bold">Global Store Controls</h2><p className="text-xs text-ink-500">Butun storefront xulqini bitta boshqaruv qatlamidan nazorat qilish.</p></div>
      {options.map(([name, label, Icon, hint]) => (
        <label key={name} className="flex gap-3 rounded-2xl border border-slate-100 p-3">
          <input type="checkbox" name={name} defaultChecked={initial[name] !== false} className="mt-1 h-4 w-4 accent-emerald-600" />
          <span><Icon className="mr-2 inline h-4 w-4 text-brand-600" /><strong className="text-sm">{label}</strong><span className="mt-1 block text-xs text-ink-500">{hint}</span></span>
        </label>
      ))}
      {state?.message && <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>}
      <button type="submit" className="btn-primary">Global boshqaruvni saqlash</button>
    </form>
  );
}
