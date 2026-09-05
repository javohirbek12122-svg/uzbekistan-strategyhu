import Link from 'next/link';
import { Phone, Send, Store } from 'lucide-react';
import { getStoreSettings } from '@/server/queries';

export async function Footer() {
  let settings = { name: 'Parkent E-Mart', phone: '+998 90 000 00 00', telegram: 'https://t.me/parkent_emart', address: 'Parkent tumani, Toshkent viloyati' };
  try {
    settings = await getStoreSettings();
  } catch (err) {
    console.error('[Footer]', err);
  }

  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
              <Store className="h-4 w-4" />
            </span>
            {settings.name}
          </div>
          <p className="mt-3 text-sm text-ink-500">
            Parkent tumanining onlayn bozori. Mahalliy mahsulotlar, halol narx, tez yetkazib berish.
          </p>
        </div>

        <div className="text-sm">
          <h3 className="mb-3 font-semibold">Xaridorlar uchun</h3>
          <ul className="space-y-2 text-ink-500">
            <li><Link href="/catalog" className="hover:text-brand-600">Katalog</Link></li>
            <li><Link href="/delivery" className="hover:text-brand-600">Yetkazib berish va to&apos;lov</Link></li>
            <li><Link href="/orders" className="hover:text-brand-600">Buyurtmalarim</Link></li>
            <li><Link href="/support" className="hover:text-brand-600">Shikoyat va taklif</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h3 className="mb-3 font-semibold">Kompaniya</h3>
          <ul className="space-y-2 text-ink-500">
            <li><Link href="/news" className="hover:text-brand-600">Yangiliklar</Link></li>
            <li><Link href="/about" className="hover:text-brand-600">Biz haqimizda</Link></li>
            <li><Link href="/terms" className="hover:text-brand-600">Ommaviy oferta</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <h3 className="mb-3 font-semibold">Aloqa</h3>
          <ul className="space-y-2 text-ink-500">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-brand-600">{settings.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <a href={settings.telegram} className="hover:text-brand-600">Telegram</a>
            </li>
            <li>{settings.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 py-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} {settings.name}. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
