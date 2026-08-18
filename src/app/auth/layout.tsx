import Link from 'next/link';
import { Store } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white">
          <Store className="h-5 w-5" />
        </span>
        Parkent<span className="text-brand-600">E-Mart</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
