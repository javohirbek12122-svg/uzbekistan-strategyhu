
'use server';

import { getSessionUser } from '@/lib/supabase/server';
import { requireServiceClient } from '@/lib/supabase/service';

function errorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  if (raw.includes('coin_insufficient_balance')) return 'Coin yetarli emas.';
  if (raw.includes('coin_product_not_found')) return 'Mahsulot topilmadi.';
  if (raw.includes('coin_order_not_owned')) return 'Bu buyurtma sizga tegishli emas.';
  return 'Amalni bajarib bo‘lmadi. Qayta urinib ko‘ring.';
}

export async function claimDailyCoin() {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: 'Coin olish uchun hisobga kiring.' };
  const client = requireServiceClient();
  const { data, error } = await client.rpc('claim_daily_coin', {
    p_user_id: user.id,
    p_claim_date: new Date().toISOString().slice(0, 10),
  });
  if (error) return { ok: false, message: errorMessage(error) };
  const row = Array.isArray(data) ? data[0] : data;
  const reward = Number(row?.reward ?? 0);
  return {
    ok: true,
    claimed: Boolean(row?.claimed),
    reward,
    streakDays: Number(row?.streak_days ?? 0),
    balance: Number(row?.balance ?? 0),
    message: row?.claimed ? '+' + reward + ' Coin qo‘shildi.' : 'Bugungi Coin Pulse allaqachon olingan.',
  };
}

export async function activateAiBoost() {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: 'AI Boost uchun hisobga kiring.' };
  const client = requireServiceClient();
  const { data, error } = await client.rpc('activate_ai_coin_boost', {
    p_user_id: user.id,
    p_source_key: 'ai_boost:' + new Date().toISOString().slice(0, 10),
  });
  if (error) return { ok: false, message: errorMessage(error) };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    activated: Boolean(row?.activated),
    balance: Number(row?.balance ?? 0),
    expiresAt: row?.expires_at ?? null,
    message: row?.activated ? 'AI Deep Mode 24 soatga faollashtirildi.' : 'AI Deep Mode allaqachon faol.',
  };
}

export async function createPriceSignal(productId: string, targetPrice?: number) {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: 'Price Signal uchun hisobga kiring.' };
  const client = requireServiceClient();
  const { data, error } = await client.rpc('create_coin_price_signal', {
    p_user_id: user.id,
    p_product_id: productId,
    p_target_price: targetPrice ?? null,
    p_source_key: null,
  });
  if (error) return { ok: false, message: errorMessage(error) };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    created: Boolean(row?.created),
    balance: Number(row?.balance ?? 0),
    expiresAt: row?.expires_at ?? null,
    message: row?.created ? 'Price Signal 7 kunga yoqildi.' : 'Bu signal allaqachon yoqilgan.',
  };
}

export async function armDeliveryShield(orderId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: 'Delivery Shield uchun hisobga kiring.' };
  const client = requireServiceClient();
  const { data, error } = await client.rpc('arm_delivery_shield', {
    p_user_id: user.id,
    p_order_id: orderId,
    p_source_key: 'shield:' + orderId,
  });
  if (error) return { ok: false, message: errorMessage(error) };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    armed: Boolean(row?.armed),
    balance: Number(row?.balance ?? 0),
    lockedAmount: Number(row?.locked_amount ?? 20),
    message: row?.armed
      ? 'Delivery Shield yoqildi: 20 Coin vaqtincha rezerv qilindi.'
      : 'Bu buyurtma uchun Shield allaqachon yoqilgan.',
  };
}
