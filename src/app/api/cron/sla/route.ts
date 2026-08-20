import { NextResponse } from 'next/server';
import { requireServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Applies late-delivery compensations. Meant to be called every 15 minutes by
 * a scheduler with `Authorization: Bearer $CRON_SECRET`.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  }

  const { data, error } = await requireServiceClient().rpc('apply_late_compensations');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applied: data ?? 0 });
}
