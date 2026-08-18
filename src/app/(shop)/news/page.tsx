import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { dateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Yangiliklar va e\u2019lonlar' };
export const dynamic = 'force-dynamic';

interface NewsRow {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string | null;
}

export default async function NewsPage() {
  let news: NewsRow[] = [];
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('news')
      .select('id, title, body, is_pinned, published_at')
      .not('published_at', 'is', null)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false });
    news = (data ?? []) as NewsRow[];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">Yangiliklar va e&apos;lonlar</h1>
      {news.length === 0 ? (
        <p className="card p-6 text-sm text-ink-500">Hozircha e&apos;lon yo&apos;q.</p>
      ) : (
        <ul className="space-y-3">
          {news.map((item) => (
            <li key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">
                  {item.is_pinned && <span className="badge mr-2 bg-accent-400 text-ink-900">Muhim</span>}
                  {item.title}
                </h2>
                <span className="shrink-0 text-xs text-ink-500">{dateTime(item.published_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
