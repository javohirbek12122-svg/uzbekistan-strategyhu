/** Central env access. Server-only values are never imported into client code. */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Muhit o'zgaruvchisi yo'q: ${name}. .env.example faylini ko'ring.`);
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  mapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY ?? '',
};

export function serverEnv() {
  return {
    supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
    consoleEncryptionKey: required('CONSOLE_ENCRYPTION_KEY', process.env.CONSOLE_ENCRYPTION_KEY),
    payme: {
      merchantId: process.env.PAYME_MERCHANT_ID ?? '',
      merchantKey: process.env.PAYME_MERCHANT_KEY ?? '',
      checkoutUrl: process.env.PAYME_CHECKOUT_URL ?? 'https://checkout.paycom.uz',
    },
    click: {
      serviceId: process.env.CLICK_SERVICE_ID ?? '',
      merchantId: process.env.CLICK_MERCHANT_ID ?? '',
      secretKey: process.env.CLICK_SECRET_KEY ?? '',
    },
  };
}

export const isSupabaseConfigured = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
