
import 'server-only';

import { getSessionUser } from '@/lib/supabase/server';
import { requireServiceClient } from '@/lib/supabase/service';

export type CoinWallet = {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  streak_days: number;
  last_daily_claimed_on: string | null;
};

export async function getCoinWallet(): Promise<CoinWallet | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const client = requireServiceClient();
  const { data } = await client.from('coin_wallets')
    .select('balance,lifetime_earned,lifetime_spent,streak_days,last_daily_claimed_on')
    .eq('user_id', user.id).maybeSingle();
  if (data) return data as CoinWallet;
  const { data: created } = await client.from('coin_wallets')
    .insert({ user_id: user.id })
    .select('balance,lifetime_earned,lifetime_spent,streak_days,last_daily_claimed_on').single();
  return (created as CoinWallet | null) ?? null;
}

export async function getCoinLedger(limit = 12) {
  const user = await getSessionUser();
  if (!user) return [];
  const client = requireServiceClient();
  const { data } = await client.from('coin_ledger')
    .select('id,delta,balance_after,event_type,description,created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit);
  return data ?? [];
}

export async function getActiveAiBoost() {
  const user = await getSessionUser();
  if (!user) return null;
  const client = requireServiceClient();
  const { data } = await client.from('coin_boosts')
    .select('kind,expires_at').eq('user_id', user.id).eq('kind', 'ai_deep')
    .gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false })
    .limit(1).maybeSingle();
  return data;
}

export async function getLatestCoinSignals() {
  const user = await getSessionUser();
  if (!user) return [];
  const client = requireServiceClient();
  const { data } = await client.from('coin_price_signals')
    .select('id,product_id,target_price,expires_at,created_at,products(name_uz,price)')
    .eq('user_id', user.id).gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false }).limit(6);
  return data ?? [];
}

export async function getLatestProducts(limit = 8) {
  const client = requireServiceClient();
  const { data } = await client.from('products')
    .select('id,slug,name_uz,price,rating,reviews_count,stock,is_active,is_featured')
    .eq('is_active', true).order('is_featured', { ascending: false })
    .order('sold_count', { ascending: false }).limit(limit);
  return data ?? [];
}
