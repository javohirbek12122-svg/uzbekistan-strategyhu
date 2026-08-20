import { ShieldCheck } from 'lucide-react';
import { ConsoleLoginForm } from '@/components/console/login-form';
import { MfaEnrolment } from '@/components/console/mfa-enrolment';

export const dynamic = 'force-dynamic';

export default function ConsoleLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-center gap-2 text-slate-700">
          <ShieldCheck className="h-6 w-6 text-brand-600" />
          <span className="text-lg font-extrabold">Parkent E-Mart · Console</span>
        </div>

        <div className="card space-y-4 p-6">
          <p className="text-sm text-ink-500">
            Bu bo&apos;lim faqat egasi uchun. Email va parol bilan kiring. Har bir urinish jurnalga yozib olinadi.
          </p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Faqat egasining emaili va admin roli bilan kirish mumkin.
          </p>
          <ConsoleLoginForm />
        </div>

        <MfaEnrolment />
      </div>
    </div>
  );
}
