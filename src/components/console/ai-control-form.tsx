'use client';

import { useActionState } from 'react';
import { Bot, ShieldCheck, Sparkles } from 'lucide-react';
import { saveAiControl } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';

export function AIControlForm({
  initial,
}: {
  initial: {
    mode?: string;
    auto_monitoring?: boolean;
    auto_notifications?: boolean;
    require_approval_for_mutations?: boolean;
    daily_digest?: boolean;
  };
}) {
  const [state, action] = useActionState(saveAiControl, initialFormState);

  return (
    <form action={action} className="card space-y-4 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><Bot className="h-5 w-5" /></span>
        <div><h2 className="font-bold">AI operatsion siyosati</h2><p className="text-xs text-ink-500">AI tizimni kuzatadi va xavfsiz yordam beradi. Muhim o‘zgarishlar tasdiq talab qiladi.</p></div>
      </div>

      <div>
        <label className="label" htmlFor="ai-mode">Rejim</label>
        <select id="ai-mode" name="mode" className="input" defaultValue={initial.mode ?? 'suggest'}>
          <option value="observe">Observe — faqat kuzatish</option>
          <option value="suggest">Suggest — tavsiya va ogohlantirish</option>
          <option value="assist">Assist — tasdiqlangan rutin amallarni tayyorlash</option>
        </select>
      </div>

      {[
        ['auto_monitoring', 'Doimiy monitoring', initial.auto_monitoring ?? true, 'Risk, inventar, logistika va to‘lov signallarini tekshirish.'],
        ['auto_notifications', 'Avtomatik bildirishnoma', initial.auto_notifications ?? true, 'Muhim signal bo‘lsa adminlarga xabar tayyorlash.'],
        ['require_approval_for_mutations', 'Mutation uchun majburiy tasdiq', initial.require_approval_for_mutations ?? true, 'Narx, buyurtma, foydalanuvchi, to‘lov kabi o‘zgarishlarda inson tasdig‘i.'],
        ['daily_digest', 'Kunlik AI digest', initial.daily_digest ?? true, 'Kun yakunida KPI va risklar bo‘yicha hisobot.'],
      ].map(([name, label, checked, hint]) => (
        <label key={String(name)} className="flex gap-3 rounded-2xl border border-slate-100 p-3">
          <input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="mt-1 h-4 w-4 accent-emerald-600" />
          <span><strong className="block text-sm">{String(label)}</strong><span className="text-xs text-ink-500">{String(hint)}</span></span>
        </label>
      ))}

      <div className="rounded-2xl bg-slate-950 p-3 text-xs text-slate-300">
        <div className="flex items-center gap-2 text-emerald-300"><ShieldCheck className="h-4 w-4" /> Xavfsiz avtonomiya</div>
        <p className="mt-1">AI'ga inventar va operatsion monitoringni kengaytirish mumkin, ammo qaytarish, rol berish, parol/MFA, pul va boshqa kritik mutationlar inson tasdig‘isiz bajarilmaydi.</p>
      </div>

      {state?.message && <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>}
      <button type="submit" className="btn-primary"><Sparkles className="h-4 w-4" /> AI siyosatini saqlash</button>
    </form>
  );
}
