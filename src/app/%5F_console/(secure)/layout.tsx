import { getConsoleIdentity } from '@/lib/security/console';
import { ConsoleShell } from '@/components/console/shell';

export const dynamic = 'force-dynamic';

export default async function SecureConsoleLayout({ children }: { children: React.ReactNode }) {
  const identity = await getConsoleIdentity();

  if (!identity) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-lg p-6 text-center">
          <h1 className="text-lg font-bold">Admin server konfiguratsiyasi topilmadi</h1>
          <p className="mt-2 text-sm text-ink-500">
            Vercel Environment Variables ichida SUPABASE_SERVICE_ROLE_KEY sozlangan bo&apos;lishi kerak.
          </p>
        </div>
      </div>
    );
  }

  return <ConsoleShell identity={identity}>{children}</ConsoleShell>;
}
