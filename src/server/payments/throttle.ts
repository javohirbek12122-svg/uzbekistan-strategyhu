import 'server-only';
import { requireServiceClient } from '@/lib/supabase/service';

const WINDOW_MINUTES = 10;
const MAX_FAILURES = 20;

/**
 * Payment callbacks must answer 200 even for rejected requests, so a probing
 * client otherwise gets unlimited attempts. Failures are recorded per IP and,
 * once the threshold is reached, further requests from that IP are rejected
 * without touching orders.
 */
export async function recordCallbackFailure(provider: 'payme' | 'click', ip: string | null) {
  await requireServiceClient()
    .from('login_attempts')
    .insert({ identifier: ip ?? 'unknown', ip, scope: `payment:${provider}`, successful: false });
}

export async function isCallbackThrottled(provider: 'payme' | 'click', ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await requireServiceClient()
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    // `identifier` holds the IP so the (identifier, scope, created_at) index applies.
    .eq('identifier', ip)
    .eq('scope', `payment:${provider}`)
    .eq('successful', false)
    .gte('created_at', since);
  return (count ?? 0) >= MAX_FAILURES;
}
