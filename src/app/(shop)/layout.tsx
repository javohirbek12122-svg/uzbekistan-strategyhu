import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { MobileNav } from '@/components/site/mobile-nav';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container-page flex-1 pb-20 pt-4 sm:pb-6">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
