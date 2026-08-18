import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ variable: '--font-sans', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: {
    default: "Parkent E-Mart — Parkent tumanining onlayn bozori",
    template: '%s | Parkent E-Mart',
  },
  description:
    "Parkent tumani uchun onlayn bozor: guruch, oziq-ovqat, uy-ro'zg'or mahsulotlari. Tez yetkazib berish, Payme/Click va naqd to'lov.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#12a065',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
