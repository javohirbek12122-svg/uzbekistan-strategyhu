import Link from 'next/link';
import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: "Ro'yxatdan o'tish" };

export default function RegisterPage() {
  return (
    <div className="card space-y-4 p-6">
      <div>
        <h1 className="text-lg font-bold">Ro&apos;yxatdan o&apos;tish</h1>
        <p className="text-sm text-ink-500">Buyurtma berish uchun hisob yarating.</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-ink-500">
        Hisobingiz bormi?{' '}
        <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}
