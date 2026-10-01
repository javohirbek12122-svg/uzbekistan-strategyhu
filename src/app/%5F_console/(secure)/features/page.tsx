import Link from 'next/link';
import { ToggleRight, Settings2, Zap } from 'lucide-react';
import { controlSettings } from '@/server/console/control';

export const dynamic = 'force-dynamic';

export default async function ConsoleFeaturesPage() {
  const settings = await controlSettings();
  const features = [
    ['Checkout', settings.store.checkout_enabled !== false, 'Checkout jarayoni'],
    ['Yangi buyurtmalar', settings.store.new_orders_enabled !== false, 'Buyurtma qabul qilish'],
    ['Ro‘yxatdan o‘tish', settings.store.registration_enabled !== false, 'Yangi accountlar'],
    ['Yetkazib berish', settings.store.delivery_enabled !== false, 'Delivery moduli'],
    ['Maintenance', settings.store.maintenance_mode === true, 'Texnik xizmat rejimi'],
    ['AI monitoring', settings.ai.auto_monitoring !== false, 'AI signallarini kuzatish'],
    ['AI notification', settings.ai.auto_notifications !== false, 'AI signal bildirishnomalari'],
    ['AI approval gate', settings.ai.require_approval_for_mutations !== false, 'Muhim mutation approval'],
  ] as const;
  return (
    <div className="space-y-5">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">FEATURE CONTROL</p><h1 className="text-2xl font-black">Funksiyalar markazi</h1><p className="mt-1 text-sm text-ink-500">Muhim feature va global switchlarning holatini bir joydan ko‘ring.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(([label, enabled, hint]) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between gap-2"><ToggleRight className={enabled ? 'h-5 w-5 text-emerald-600' : 'h-5 w-5 text-slate-400'} /><span className={enabled ? 'badge bg-emerald-50 text-emerald-700' : 'badge bg-slate-100 text-ink-500'}>{enabled ? 'ON' : 'OFF'}</span></div>
            <h2 className="mt-3 font-bold">{label}</h2><p className="mt-1 text-xs text-ink-500">{hint}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/__console/automation" className="card p-4 hover:bg-slate-50"><Zap className="mb-2 h-5 w-5 text-brand-600" /><strong>Switchlarni boshqarish</strong><span className="block text-sm text-ink-500">Global storefront nazoratiga o‘ting.</span></Link>
        <Link href="/__console/settings" className="card p-4 hover:bg-slate-50"><Settings2 className="mb-2 h-5 w-5 text-brand-600" /><strong>Advanced settings</strong><span className="block text-sm text-ink-500">JSON settings orqali chuqur sozlash.</span></Link>
      </div>
    </div>
  );
}
