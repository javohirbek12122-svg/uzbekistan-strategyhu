import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { MobileNav } from '@/components/site/mobile-nav';
import { BottomNav } from '@/components/site/bottom-nav';
import { PwaInitializer } from '@/components/site/pwa-initializer';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PwaInitializer />
      <Header />
      <main className="container-page flex-1 pb-24 pt-4 sm:pb-6 md:pb-6">{children}</main>
      <Footer />
      <MobileNav />
      <BottomNav />
    </div>
  );
}
