'use server';

import { NextResponse } from 'next/server';
import { requireServiceClient } from '@/lib/supabase/service';

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function recordAttempt(identifier: string, ip: string, scope: string, success: boolean): Promise<void> {
  try {
    await requireServiceClient().from('login_attempts').insert({
      identifier,
      ip,
      scope,
      successful: success,
    });
  } catch {
    // Ignore
  }
}

export async function isBlocked(identifier: string): Promise<boolean> {
  try {
    const { data } = await requireServiceClient()
      .from('blocked_ips')
      .select('*')
      .eq('ip', identifier)
      .gt('blocked_until', new Date().toISOString())
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}

export async function blockIp(ip: string, reason: string, durationMinutes: number = 15): Promise<void> {
  try {
    const blockedUntil = new Date(Date.now() + durationMinutes * 60_000).toISOString();
    await requireServiceClient().from('blocked_ips').upsert(
      { ip, reason, blocked_until: blockedUntil },
      { onConflict: 'ip' }
    );
  } catch {
    // Ignore
  }
}

export async function unblockIp(ip: string): Promise<void> {
  try {
    await requireServiceClient().from('blocked_ips').delete().eq('ip', ip);
  } catch {
    // Ignore
  }
}

export async function rateLimitResponse() {
  return NextResponse.json(
    { ok: false, message: 'Juda ko\'p urinish. Bir necha daqiqadan keyin qayta urinib ko\'ring.' },
    { status: 429 },
  );
}
