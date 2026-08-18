import Link from 'next/link';
import { consoleUsers } from '@/server/console/queries';
import { revokeUserRole, toggleUserBlock } from '@/server/actions/console';
import { RoleForm } from '@/components/console/role-form';
import { dateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Egasi',
  manager: 'Menejer',
  courier: 'Kuryer',
  customer: 'Xaridor',
};

export default async function ConsoleUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = '', page } = await searchParams;
  const current = Number(page ?? '1') || 1;
  const { users, total } = await consoleUsers(q, current);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Foydalanuvchilar ({total})</h1>
        <form action="/__console/users" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Email, ism, telefon" className="input w-56" />
          <button type="submit" className="btn-secondary">
            Qidirish
          </button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>Telefon</th>
              <th>Rollar</th>
              <th>Ro&apos;yxatdan</th>
              <th>Holat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.full_name ?? '—'}
                  <span className="block text-xs text-ink-500">{user.email}</span>
                </td>
                <td>{user.phone ?? '—'}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {(user.user_roles ?? []).map((row) => (
                      <form action={revokeUserRole} key={row.role}>
                        <input type="hidden" name="user_id" value={user.id} />
                        <input type="hidden" name="role" value={row.role} />
                        <button
                          type="submit"
                          title="Rolni olib tashlash"
                          className="badge bg-slate-100 text-ink-700 hover:bg-red-50 hover:text-red-600"
                        >
                          {ROLE_LABEL[row.role] ?? row.role} ×
                        </button>
                      </form>
                    ))}
                  </div>
                </td>
                <td className="text-xs text-ink-500">{dateTime(user.created_at)}</td>
                <td>
                  <span className={`badge ${user.is_blocked ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'}`}>
                    {user.is_blocked ? 'Bloklangan' : 'Faol'}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <RoleForm userId={user.id} />
                    <form action={toggleUserBlock}>
                      <input type="hidden" name="user_id" value={user.id} />
                      <button type="submit" className={user.is_blocked ? 'btn-secondary py-1 text-xs' : 'btn-danger py-1 text-xs'}>
                        {user.is_blocked ? 'Blokni ochish' : 'Bloklash'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-center text-sm text-ink-500">Foydalanuvchi topilmadi.</p>}
      </div>

      <p className="text-xs text-ink-500">
        Admin roli faqat allow-list&apos;dagi email uchun beriladi — allow-list&apos;ni{' '}
        <Link href="/__console/security" className="text-brand-600 hover:underline">
          Xavfsizlik
        </Link>{' '}
        bo&apos;limida boshqarasiz.
      </p>

      <div className="flex justify-between">
        {current > 1 ? (
          <Link href={`/__console/users?page=${current - 1}&q=${q}`} className="btn-secondary">
            Oldingi
          </Link>
        ) : (
          <span />
        )}
        {current * 30 < total && (
          <Link href={`/__console/users?page=${current + 1}&q=${q}`} className="btn-secondary">
            Keyingi
          </Link>
        )}
      </div>
    </div>
  );
}
