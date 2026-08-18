import Link from 'next/link';
import { Star } from 'lucide-react';
import { consoleReviews } from '@/server/console/queries';
import { moderateReview } from '@/server/actions/console';
import { dateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ConsoleReviewsPage() {
  const reviews = await consoleReviews();
  const pending = reviews.filter((review) => !review.is_approved);
  const approved = reviews.filter((review) => review.is_approved);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Sharhlar</h1>

      <section className="space-y-3">
        <h2 className="font-semibold">Tasdiqlanmagan ({pending.length})</h2>
        {pending.map((review) => (
          <ReviewCard key={String(review.id)} review={review} moderatable />
        ))}
        {pending.length === 0 && <p className="card p-4 text-sm text-ink-500">Navbatda sharh yo&apos;q.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Tasdiqlangan ({approved.length})</h2>
        {approved.map((review) => (
          <ReviewCard key={String(review.id)} review={review} />
        ))}
      </section>
    </div>
  );
}

function ReviewCard({
  review,
  moderatable,
}: {
  review: Record<string, unknown>;
  moderatable?: boolean;
}) {
  const product = review.products as { name_uz?: string; slug?: string } | null;
  const author = review.profiles as { full_name?: string; email?: string } | null;
  const rating = Number(review.rating ?? 0);

  return (
    <article className="card space-y-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={`/product/${product?.slug ?? ''}`} className="font-medium text-brand-700 hover:underline">
            {product?.name_uz ?? 'Mahsulot'}
          </Link>
          <p className="text-xs text-ink-500">
            {author?.full_name ?? author?.email ?? '—'} · {dateTime(String(review.created_at))}
          </p>
        </div>
        <span className="flex items-center gap-0.5 text-accent-500">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={index < rating ? 'h-4 w-4 fill-current' : 'h-4 w-4 text-slate-300'} />
          ))}
        </span>
      </div>
      {review.body ? <p className="text-sm">{String(review.body)}</p> : null}
      {moderatable && (
        <div className="flex gap-2">
          <form action={moderateReview}>
            <input type="hidden" name="id" value={String(review.id)} />
            <input type="hidden" name="approve" value="1" />
            <button type="submit" className="btn-primary py-1 text-xs">
              Tasdiqlash
            </button>
          </form>
          <form action={moderateReview}>
            <input type="hidden" name="id" value={String(review.id)} />
            <input type="hidden" name="approve" value="0" />
            <button type="submit" className="btn-danger py-1 text-xs">
              O&apos;chirish
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
