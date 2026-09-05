/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { toolsDefinition } from '@/lib/ai/tools';
import { SYSTEM_PROMPT } from '@/lib/ai/systemPrompt';
import { requireServiceClient } from '@/lib/supabase/service';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const RICE_TYPE_SLUGS: Record<string, string> = {
  Devzira: 'devzira-guruch-3kg',
  Lazer: 'lazer-guruch-5kg',
  Alanga: 'alanga-guruch',
  Avangard: 'alanga-guruch',
  Ushoq: 'ushoq-guruch',
};

async function addToCart(riceType: string, weightKg: number) {
  const slug = RICE_TYPE_SLUGS[riceType];
  if (!slug) {
    return { ok: false, message: `${riceType} navi topilmadi.` };
  }

  const client = requireServiceClient();
  const { data: product } = await client
    .from('products')
    .select('id, stock, reserved, max_per_order, weight_gram, price')
    .eq('slug', slug)
    .maybeSingle();

  if (!product) {
    return { ok: false, message: `${riceType} mahsuloti topilmadi.` };
  }

  const available = product.stock - product.reserved;
  if (available <= 0) {
    return { ok: false, message: `${riceType} omborda qolmagan.` };
  }

  const weightGram = Math.round(weightKg * 1000);
  const quantity = Math.max(1, Math.round(weightGram / product.weight_gram));

  const { data: existing } = await client
    .from('cart_items')
    .select('id, quantity')
    .eq('product_id', product.id)
    .maybeSingle();

  const nextQuantity = existing ? existing.quantity + quantity : quantity;

  if (existing) {
    await client.from('cart_items').update({ quantity: nextQuantity }).eq('id', existing.id);
  } else {
    await client.from('cart_items').insert({ product_id: product.id, quantity });
  }

  return { ok: true, message: `${riceType} (${weightKg} kg) savatga qo'shildi.` };
}

function calculateShipping(zone: string, weightKg: number) {
  if (weightKg < 1 || weightKg > 1000) {
    return { ok: false, message: 'Vazn 1 kg dan 1000 kg gacha bolishi kerak.' };
  }

  if (weightKg <= 69) {
    return {
      ok: true,
      method: 'Damas Micro-Transit',
      price: 'Flat rate (buyer paid)',
      description: 'Tez yetkazib berish. Labo yuborilmaydi.',
    };
  }

  if (weightKg <= 1000) {
    const zoneLower = zone.toLowerCase();
    let day = 'Har kuni';
    if (zoneLower.includes('zarkent') || zoneLower.includes('hisarak')) day = 'Dushanba';
    else if (zoneLower.includes("so'qoq") || zoneLower.includes('kumushkon')) day = 'Chorshanba';
    else if (zoneLower.includes('yangibozor')) day = 'Juma';
    else if (zoneLower.includes('parkent')) day = 'Har kuni';

    return {
      ok: true,
      method: 'Labo Batch Delivery',
      price: 'Bepul yoki chegirma',
      day,
      description: `Labo yuboriladi. ${day} yetkazib beriladi.`,
    };
  }

  return { ok: false, message: 'Maksimal vazn 1000 kg.' };
}

function openCart() {
  return { ok: true, action: 'open_cart' };
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: toolsDefinition[0].functionDeclarations as any }],
      },
    });

    const candidates = response.candidates || [];
    if (candidates.length === 0) {
      return NextResponse.json({ text: 'Kechirasiz, javob topilmadi.' });
    }

    const firstCandidate = candidates[0];
    const functionCalls = (firstCandidate.content?.parts as any[])?.filter((p: any) => p.functionCall) || [];
    const textParts = (firstCandidate.content?.parts as any[])?.filter((p: any) => p.text) || [];

    if (functionCalls.length > 0) {
      const functionResults: any[] = [];

      for (const part of functionCalls) {
        const fc = part.functionCall;
        const args = fc.args || {};
        if (fc.name === 'addToCart') {
          const result = await addToCart(args.riceType, args.weightKg);
          functionResults.push({ name: fc.name, response: result });
        } else if (fc.name === 'calculateShipping') {
          const result = calculateShipping(args.zone, args.weightKg);
          functionResults.push({ name: fc.name, response: result });
        } else if (fc.name === 'openCart') {
          const result = openCart();
          functionResults.push({ name: fc.name, response: result });
        }
      }

      const followUp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...messages,
          {
            role: 'model',
            parts: functionCalls.map((p: any) => ({
              functionCall: p.functionCall,
            })),
          },
          {
            role: 'user',
            parts: functionResults.map((fr) => ({
              functionResponse: {
                name: fr.name,
                response: fr.response,
              },
            })),
          },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      const finalText = (followUp.candidates?.[0]?.content?.parts as any[])?.find((p: any) => p.text)?.text || 'Bajarildi.';

      return NextResponse.json({
        text: finalText,
        functionCalls: functionResults,
      });
    }

    const text = textParts.length > 0 ? textParts[0].text : 'Kechirasiz, tushunmadim.';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('AI Error', error);
    return NextResponse.json({ error: 'AI Error' }, { status: 500 });
  }
}
