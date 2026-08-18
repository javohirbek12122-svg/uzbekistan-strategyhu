import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '../env';

/**
 * Anonymous, cookie-less client for public catalog reads. Because it never
 * touches request cookies its results can be shared between visitors and
 * cached, which keeps the storefront off the database under load.
 */
export function publicClient() {
  return createSupabaseClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-application-name': 'parkent-emart-storefront' } },
  });
}
