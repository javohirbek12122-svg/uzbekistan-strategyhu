import { redirect } from 'next/navigation';
import { getConsoleIdentity } from '@/lib/security/console';
import { ConsoleShell } from '@/components/console/shell';

export const dynamic = 'force-dynamic';

export default async function SecureConsoleLayout({ children }: { children: React.ReactNode }) {
  const identity = await getConsoleIdentity();
  if (!identity) redirect('/__console/login');

  return <ConsoleShell identity={identity}>{children}</ConsoleShell>;
}
