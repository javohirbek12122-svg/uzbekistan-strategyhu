import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { MobileNav } from '@/components/site/mobile-nav';
import { BottomNav } from '@/components/site/bottom-nav';
import { PwaInitializer } from '@/components/site/pwa-initializer';
import { serviceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // The public storefront must remain available even if an optional server-only
  // secret is missing. Admin/payment features can fail closed independently.
  let maintenance = false;
  const service = serviceClient();
  if (service) {
    const { data } = await service
      .from('settings')
      .select('value')
      .eq('key', 'store_control')
      .maybeSingle();
    const control = (data?.value ?? {}) as Record<string, unknown>;
    maintenance = control.maintenance_mode === true;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PwaInitializer />
      <Header />
      {maintenance && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          <strong>Texnik xizmat rejimi.</strong> Saytning ayrim amallari vaqtincha cheklangan.
        </div>
      )}
      <main className="container-page flex-1 pb-24 pt-4 sm:pb-6 md:pb-6">{children}</main>
      <Footer />
      <MobileNav />
      <BottomNav />
    </div>
  );
}
