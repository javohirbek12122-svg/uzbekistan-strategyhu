import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '../env';

let cached: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS, so it must only be used by trusted server
 * code paths (payment callbacks, order creation, console mutations) and never
 * be exposed to the browser.
 */
export function serviceClient(): SupabaseClient {
  if (cached) return cached;
  const env = serverEnv();
  cached = createSupabaseClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'parkent-emart-server' } },
  });
  return cached;
}
