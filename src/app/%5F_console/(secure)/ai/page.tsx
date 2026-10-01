import { Bot, CircleCheck, LockKeyhole } from 'lucide-react';
import { ConsoleModulePage } from '@/components/console/module-page';
import { AIControlForm } from '@/components/console/ai-control-form';
import { controlSnapshot } from '@/server/console/control';

export const dynamic = 'force-dynamic';

export default async function ConsoleAiPage() {
  const data = await controlSnapshot();
  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-slate-950 p-6 text-white">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-emerald-300"><Bot className="h-5 w-5" /></span>
          <div><p className="text-xs uppercase tracking-widest text-slate-400">AI CONTROL CENTER</p><h1 className="text-2xl font-black">AI boshqaruv markazi</h1></div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">AI monitoringni kengaytiradi, operatsion signallarni tahlil qiladi va rutin ishlarni tayyorlaydi. Kritik mutationlar inson tasdig‘i bilan qoladi.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-3"><span className="text-xs text-slate-400">Rejim</span><strong className="mt-1 block uppercase">{data.ai.mode}</strong></div>
          <div className="rounded-2xl bg-white/5 p-3"><span className="text-xs text-slate-400">Monitoring</span><strong className="mt-1 block">{data.ai.auto_monitoring ? 'ON' : 'OFF'}</strong></div>
          <div className="rounded-2xl bg-white/5 p-3"><span className="text-xs text-slate-400">Approval gate</span><strong className="mt-1 block">{data.ai.require_approval_for_mutations ? 'ON' : 'OFF'}</strong></div>
        </div>
      </section>
      <AIControlForm initial={data.ai} />
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4"><CircleCheck className="mb-2 h-5 w-5 text-emerald-600" /><h2 className="font-bold">Xavfsiz avtomatika</h2><p className="mt-1 text-sm text-ink-500">Monitoring, digest, stock alert va support triage kabi past-xavfli jarayonlar.</p></div>
        <div className="card p-4"><LockKeyhole className="mb-2 h-5 w-5 text-amber-600" /><h2 className="font-bold">Majburiy inson nazorati</h2><p className="mt-1 text-sm text-ink-500">Pul, rol, xavfsizlik, o‘chirish va muhim buyurtma o‘zgarishlari uchun tasdiq.</p></div>
      </section>
    </div>
  );
}
