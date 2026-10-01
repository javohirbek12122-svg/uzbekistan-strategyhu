import { PlayCircle, ShieldCheck } from 'lucide-react';
import { controlSettings } from '@/server/console/control';
import { StoreControlForm } from '@/components/console/store-control-form';

export const dynamic = 'force-dynamic';

export default async function ConsoleAutomationPage() {
  const settings = await controlSettings();
  return (
    <div className="space-y-5">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">AUTOMATION HUB</p><h1 className="text-2xl font-black">Avtomatlashtirish va global boshqaruv</h1><p className="mt-1 text-sm text-ink-500">Storefront va operatsiyalar uchun markaziy switchboard.</p></div>
      <StoreControlForm initial={settings.store} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5"><PlayCircle className="mb-2 h-5 w-5 text-brand-600" /><h2 className="font-bold">Avtomatik jarayonlar</h2><p className="mt-1 text-sm text-ink-500">Keyingi qatlamda cron/queue orqali digest, stock alerts, failed payment monitor va SLA signalizatsiyasini ulash uchun tayyor boshqaruv nuqtasi.</p></div>
        <div className="card p-5"><ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" /><h2 className="font-bold">Safety Gate</h2><p className="mt-1 text-sm text-ink-500">Global switchlar audit qilinadi. Kritik amallarni avtomatik ravishda o'tkazib yuborish uchun xavfsizlik chegarasi saqlanadi.</p></div>
      </div>
    </div>
  );
}
