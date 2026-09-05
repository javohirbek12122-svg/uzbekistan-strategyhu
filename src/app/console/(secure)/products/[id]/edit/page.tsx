import { getConsoleIdentity } from '@/lib/security/console';
import { ConsoleShell } from '@/components/console/shell';
import { consoleProduct } from '@/server/console/queries';
import { ProductEditForm } from '@/components/console/product-edit-form';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Mahsulotni tahrirlash' };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const identity = await getConsoleIdentity();
  if (!identity) return null;

  const { id } = await params;
  const { product } = await consoleProduct(id);

  if (!product) {
    return (
      <ConsoleShell identity={identity}>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold">Mahsulot topilmadi</h1>
        </div>
      </ConsoleShell>
    );
  }

  return (
    <ConsoleShell identity={identity}>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-bold">Mahsulotni tahrirlash</h1>
        <ProductEditForm productId={product.id} defaultValues={product} />
      </div>
    </ConsoleShell>
  );
}
