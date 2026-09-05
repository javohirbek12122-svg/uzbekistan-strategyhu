import Link from 'next/link';
import type { Metadata } from 'next';
import { SellProductForm } from '@/components/shop/sell-product-form';

export const metadata: Metadata = { title: 'Mahsulot qo\'shish' };
export const dynamic = 'force-dynamic';

export default async function SellPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Mahsulot qo&apos;shish</h1>
        <Link href="/catalog" className="btn-secondary">
          Katalog
        </Link>
      </div>
      <p className="text-sm text-ink-500">
        Mahsulotingizni qo&apos;shing. Admin tasdiqlagandan keyin u katalogda paydo bo&apos;ladi.
      </p>
      <SellProductForm />
    </div>
  );
}
