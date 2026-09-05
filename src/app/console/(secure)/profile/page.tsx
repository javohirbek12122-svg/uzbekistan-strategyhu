import { getConsoleIdentity } from '@/lib/security/console';
import { ConsoleShell } from '@/components/console/shell';

export const dynamic = 'force-dynamic';

export default async function ConsoleProfilePage() {
  const identity = await getConsoleIdentity();
  if (!identity) return null;

  const roleLabel = identity.role === 'admin' ? 'Egasi' : identity.role === 'manager' ? 'Yordamchi boshqaruvchi' : 'Boshqaruv';

  return (
    <ConsoleShell identity={identity}>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-bold">Profil</h1>

        <div className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Hisob ma&apos;lumotlari</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-ink-500">Email</p>
              <p className="font-medium">{identity.email}</p>
            </div>
            <div>
              <p className="text-sm text-ink-500">Rol</p>
              <p className="font-medium">{roleLabel}</p>
            </div>
            <div>
              <p className="text-sm text-ink-500">Kirish vaqti</p>
              <p className="font-medium">{new Date().toLocaleString('uz-UZ')}</p>
            </div>
          </div>
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="text-lg font-semibold">Xavfsizlik</h2>
          <p className="text-sm text-ink-700">Barcha imtiyozli amallar audit jurnalida saqlanadi.</p>
          <p className="text-sm text-ink-700">Parolni o&apos;zgartirish uchun Supabase dashboard&apos;dan foydalaning.</p>
        </div>
      </div>
    </ConsoleShell>
  );
}
