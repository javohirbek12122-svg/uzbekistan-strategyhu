import Link from 'next/link';
import type { Category } from '@/lib/types';

export function CategoryBar({ categories }: { categories: Category[] }) {
  const roots = categories.filter((c) => !c.parent_id);
  if (roots.length === 0) return null;

  return (
    <div className="border-t border-slate-100">
      <div className="container-page flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {roots.map((category) => (
          <Link
            key={category.id}
            href={`/catalog?category=${category.slug}`}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-700"
          >
            {category.name_uz}
          </Link>
        ))}
      </div>
    </div>
  );
}
