
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Sparkles, Sparkles, Wallet, Mic, Search, Sparkles, Sparkles } from 'lucide-react';

const presets = [
  { title: 'Oilaviy hafta', copy: '7 kunlik ro‘zg‘or savatini xarajatni nazorat qilib tuzish', icon: '🧺' },
  { title: 'Mehmon dasturxoni', copy: '10–100 kishilik dasturxon va masalliq rejasini tuzish', icon: '🍽️' },
  { title: 'Tejamkor savat', copy: 'Minimal budjet bilan asosiy ehtiyojlarni ajratish', icon: '💡' },
];

function buildPlan(text: string) {
  const value = text.toLowerCase();
  const items = [];
  if (value.includes('osh') || value.includes('mehmon')) items.push('Guruch', 'Go‘sht', 'Sabzi', 'Yog‘');
  if (value.includes('uy') || value.includes('hafta')) items.push('Un', 'Shakar', 'Choy', 'Makaron');
  if (value.includes('tejam') || value.includes('arzon')) items.push('Mahalliy brendlar', 'Katta qadoq', 'Chegirmadagi pozitsiyalar');
  if (items.length === 0) items.push('Asosiy oziq-ovqat', 'Uy-ro‘zg‘or', 'Tez aylanadigan mahsulotlar');
  return Array.from(new Set(items));
}

export default function AiLabPage() {
  const [intent, setIntent] = useState('');
  const [result, setResult] = useState('');
  const [voice, setVoice] = useState(false);
  const plan = useMemo(() => buildPlan(result || intent), [result, intent]);

  function runPilot() {
    setResult(intent.trim() || 'Oilaviy hafta uchun tejamkor savat');
  }

  function startVoice() {
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Speech) { setVoice(false); setIntent('Ovozli qidiruv bu brauzerda mavjud emas.'); return; }
    const recognition = new Speech();
    recognition.lang = 'uz-UZ';
    recognition.onstart = () => setVoice(true);
    recognition.onend = () => setVoice(false);
    recognition.onresult = (event: any) => setIntent(event.results?.[0]?.[0]?.transcript || '');
    recognition.start();
  }

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-9">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="relative max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5"/> AI STUDIO</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">AI sizdan buyruq kutmaydi — niyatni tushunadi.</h1>
        <p className="mt-2 text-sm leading-6 text-white/65">Sizning maqsadingizdan xarid rejasi, masalliq ro‘yxati va qidiruv yo‘nalishini bir oqimga yig‘adi.</p>
        <div className="mt-5 flex gap-2">
          <div className="relative flex-1"><Sparkles className="absolute left-3 top-3.5 h-4 w-4 text-white/40"/><input value={intent} onChange={e => setIntent(e.target.value)} onKeyDown={e => e.key === 'Enter' && runPilot()} placeholder="Masalan: 8 kishiga bir haftalik tejamkor savat" className="input border-white/10 bg-white/10 pl-9 text-white placeholder:text-white/35"/></div>
          <button type="button" onClick={startVoice} className="btn-secondary shrink-0 bg-white/10 text-white hover:bg-white/15">{voice ? 'Tinglayapman…' : <><Mic className="h-4 w-4"/> Ovoz</>}</button>
          <button type="button" onClick={runPilot} className="btn-primary shrink-0"><Sparkles className="h-4 w-4"/> Tuzish</button>
        </div>
      </div>
    </section>

    <section className="grid gap-3 md:grid-cols-3">
      {presets.map(item => <button key={item.title} onClick={() => setIntent(item.copy)} className="card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lift">
        <span className="text-2xl">{item.icon}</span><p className="mt-3 font-bold">{item.title}</p><p className="mt-1 text-xs leading-5 text-ink-500">{item.copy}</p>
      </button>)}
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <div className="card p-5">
        <div className="flex items-center gap-2"><Search className="h-5 w-5 text-brand-600"/><h2 className="font-bold">Basket DNA</h2></div>
        <p className="mt-1 text-xs text-ink-500">Natija oddiy qidiruv emas — xarid maqsadiga mos yo‘nalish.</p>
        <div className="mt-4 space-y-2">{plan.map((item, i) => <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-xs font-bold">{i + 1}</span><span className="text-sm font-medium">{item}</span>
        </div>)}</div>
        <Link href="/catalog" className="btn-primary mt-4 inline-flex">Katalogga o‘tish</Link>
      </div>
      <div className="card p-5">
        <div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-amber-500"/><h2 className="font-bold">AI xarajat oynasi</h2></div>
        <p className="mt-2 text-sm text-ink-500">AI Lab’da budjetni 3 qatlamga ajratish mumkin: majburiy, foydali va keyinroq olinadigan.</p>
        <div className="mt-4 grid gap-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><b className="text-sm">Majburiy</b><p className="text-xs text-ink-500">Asosiy ro‘zg‘or.</p></div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><b className="text-sm">Foydali</b><p className="text-xs text-ink-500">Qo‘shimcha qulayliklar.</p></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><b className="text-sm">Keyinroq</b><p className="text-xs text-ink-500">Budjet oshib ketmasligi uchun navbatda turadi.</p></div>
        </div>
      </div>
    </section>

    <section className="rounded-3xl border border-brand-100 bg-brand-50 p-5">
      <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-brand-600"/><div><h2 className="font-bold text-brand-900">AI Sommelier ham qolmoqda</h2><p className="mt-1 text-xs leading-5 text-brand-800/70">Osh kalkulyatori va ovozli qidiruvni batafsil variantda ishlatish uchun eski Sommelier bo‘limi ham mavjud.</p><Link href="/sommelier" className="mt-3 inline-flex text-sm font-semibold text-brand-700">Sommelier'ni ochish →</Link></div></div>
    </section>
  </div>;
}
