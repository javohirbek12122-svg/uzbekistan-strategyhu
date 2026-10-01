import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { requireConsole } from '@/lib/security/console';
import { controlSnapshot } from '@/server/console/control';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const identity = await requireConsole();
    const snapshot = await controlSnapshot();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        source: 'rules',
        text: 'Gemini kaliti sozlanmagan. Qoidaviy AI tekshiruvi ishladi.',
        actions: buildFallback(snapshot),
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text:
            'Parkent E-MART admin snapshotini tahlil qil. Uzbek tilida 5 tagacha aniq boshqaruv tavsiyasi ber. ' +
            'Har bir tavsiya: priority, signal, tavsiya qilingan harakat va xavf bo‘lsin. ' +
            'Pul, rol, o‘chirish, xavfsizlik kabi kritik mutationlarni inson tasdig‘isiz tavsiya etma. ' +
            JSON.stringify(snapshot),
        }],
      }],
    });

    const result = response as unknown as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = result.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text ?? 'AI tavsiya qaytarmadi.';
    return NextResponse.json({ ok: true, source: 'gemini', actor: identity.email, text, actions: buildFallback(snapshot) });
  } catch (error) {
    console.error('[console.ai-audit]', error);
    return NextResponse.json({ ok: false, error: 'AI audit bajarilmadi' }, { status: 500 });
  }
}

function buildFallback(snapshot: Awaited<ReturnType<typeof controlSnapshot>>) {
  const actions: Array<{ priority: string; signal: string; action: string; risk: string }> = [];
  if (snapshot.outOfStock > 0) {
    actions.push({ priority: 'HIGH', signal: snapshot.outOfStock + ' ta mahsulot tugagan', action: 'Mahsulotlarni qayta zaxiralash yoki listingni vaqtincha yopish.', risk: 'O‘rta' });
  }
  if (snapshot.lateShipments > 0) {
    actions.push({ priority: 'HIGH', signal: snapshot.lateShipments + ' ta shipment kechikkan', action: 'Kuryer taqsimoti va SLA holatini tekshirish.', risk: 'O‘rta' });
  }
  if (snapshot.failedPayments24h > 0) {
    actions.push({ priority: 'HIGH', signal: snapshot.failedPayments24h + ' ta failed payment', action: 'Provayder loglarini tekshirish va transactionlarni qayta ko‘rish.', risk: 'Yuqori' });
  }
  if (snapshot.pendingReviews > 0) {
    actions.push({ priority: 'NORMAL', signal: snapshot.pendingReviews + ' ta sharh kutmoqda', action: 'Moderatsiya navbatini ko‘rib chiqish.', risk: 'Past' });
  }
  if (snapshot.lowStock > 0) {
    actions.push({ priority: 'NORMAL', signal: snapshot.lowStock + ' ta mahsulot past zaxirada', action: 'Top mahsulotlar uchun zaxira thresholdini ko‘rib chiqish.', risk: 'Past' });
  }
  return actions;
}
