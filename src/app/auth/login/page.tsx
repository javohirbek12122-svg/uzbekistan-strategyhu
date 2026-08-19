import Link from 'next/link';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Kirish' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>;
}) {
  const { next, registered } = await searchParams;

  return (
    <div className="card space-y-4 p-6">
      <div>
        <h1 className="text-lg font-bold">Hisobga kirish</h1>
        <p className="text-sm text-ink-500">Email va parolingiz bilan oddiy kirish.</p>
      </div>
      {registered === '1' && (
        <p className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700">
          Hisobingiz yaratildi. Endi shu email va parol bilan kiring.
        </p>
      )}
      <LoginForm next={next} />
      <p className="text-center text-sm text-ink-500">
        Hisobingiz yo&apos;qmi?{' '}
        <Link href="/auth/register" className="font-medium text-brand-600 hover:underline">
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </p>
    </div>
  );
}
