import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '../env';

let cached: SupabaseClient | null = null;
let initialized = false;

/**
 * Service-role client. Bypasses RLS, so it must only be used by trusted server
 * code paths (payment callbacks, order creation, console mutations) and never
 * be exposed to the browser.
 *
 * Returns null when the service role key is not configured, so callers can
 * degrade gracefully instead of throwing during login.
 */
export function serviceClient(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;
  if (initialized) return cached;
  cached = createSupabaseClient(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'parkent-emart-server' } },
  });
  initialized = true;
  return cached;
}

/**
 * Throws if the service client is unavailable — for code paths that genuinely
 * cannot proceed without it (order creation, payment callbacks, console).
 */
export function requireServiceClient(): SupabaseClient {
  const client = serviceClient();
  if (!client) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY sozlanmagan. .env faylini tekshiring.');
  }
  return client;
}
