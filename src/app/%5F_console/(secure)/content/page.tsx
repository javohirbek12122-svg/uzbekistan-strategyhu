import { RemoteImage as Image } from '@/components/ui/remote-image';
import { consoleContent } from '@/server/console/queries';
import { deleteBanner, deleteNews, toggleBanner, toggleNews } from '@/server/actions/console';
import { BannerForm, NewsForm } from '@/components/console/content-forms';
import { dateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ConsoleContentPage() {
  const { banners, news } = await consoleContent();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Kontent va e&apos;lonlar</h1>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Bannerlar ({banners.length})</h2>
          <ul className="space-y-2">
            {banners.map((banner) => (
              <li key={banner.id} className="flex items-center gap-3 border-b border-slate-100 pb-2">
                {banner.image_url && (
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    width={72}
                    height={48}
                    className="h-12 w-[72px] rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{banner.title}</p>
                  <p className="truncate text-xs text-ink-500">{banner.subtitle ?? banner.link ?? '—'}</p>
                  <span className={`badge mt-1 ${banner.is_active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-ink-500'}`}>
                    {banner.is_active ? 'Faol' : 'Yopilgan'}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <form action={toggleBanner}>
                    <input type="hidden" name="id" value={banner.id} />
                    <button type="submit" className="btn-secondary py-1 text-xs">
                      {banner.is_active ? 'Yopish' : 'Faollashtirish'}
                    </button>
                  </form>
                  <form action={deleteBanner}>
                    <input type="hidden" name="id" value={banner.id} />
                    <button type="submit" className="btn-danger py-1 text-xs">
                      O&apos;chirish
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {banners.length === 0 && <li className="text-sm text-ink-500">Banner yo&apos;q.</li>}
          </ul>
          <BannerForm />
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">E&apos;lonlar ({news.length})</h2>
          <ul className="space-y-2">
            {news.map((item) => (
              <li key={item.id} className="border-b border-slate-100 pb-2">
                <p className="text-sm font-medium">{item.title}</p>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs text-ink-500">{item.body}</p>
                    <p className="text-[11px] text-ink-500">
                      {item.is_published ? 'Joylangan' : 'Qoralama'} · {dateTime(item.published_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <form action={toggleNews}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="btn-secondary py-1 text-xs">
                        {item.is_published ? 'Qoralamaga' : 'Joylash'}
                      </button>
                    </form>
                    <form action={deleteNews}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="btn-danger py-1 text-xs">
                        O&apos;chirish
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
            {news.length === 0 && <li className="text-sm text-ink-500">E&apos;lon yo&apos;q.</li>}
          </ul>
          <NewsForm />
        </section>
      </div>
    </div>
  );
}
