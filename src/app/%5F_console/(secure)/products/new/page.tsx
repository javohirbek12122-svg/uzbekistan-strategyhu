import Link from 'next/link';
import { consoleCategories } from '@/server/console/queries';
import { ProductForm } from '@/components/console/product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await consoleCategories();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Yangi mahsulot</h1>
        <Link href="/__console/products" className="btn-secondary">
          Orqaga
        </Link>
      </div>
      <div className="card p-4">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
