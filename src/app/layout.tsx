import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: "Parkent E-Mart — Parkent tumanining onlayn bozori",
    template: '%s | Parkent E-Mart',
  },
  description:
    "Parkent tumani uchun onlayn bozor: guruch, oziq-ovqat, uy-ro'zg'or mahsulotlari. Tez yetkazib berish. Barcha huquqlar himoyalangan.",
  keywords: ['Parkent', 'onlayn bozor', 'guruch', 'oziq-ovqat', 'uy-ro\'zg\'or', 'tez yetkazib berish', 'Mirahmadov Javohir', 'Zarkent', 'Kumushkon', 'Hisarak', "So'qoq", 'Yangibozor'],
  authors: [{ name: 'Mirahmadov Javohir' }],
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#12a065',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#12a065" />
      </head>
      <body className="font-sans bg-slate-50 min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
