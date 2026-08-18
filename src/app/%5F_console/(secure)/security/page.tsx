import { consoleSecurity } from '@/server/console/queries';
import { getSecuritySettings } from '@/lib/security/console';
import { removeAllowlistEmail, removeIpAllowlist, revokeAdminSession } from '@/server/actions/console';
import { AllowlistForm, IpAllowlistForm } from '@/components/console/security-forms';
import { dateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ConsoleSecurityPage() {
  const [{ allowlist, sessions, attempts, audits, ips }, settings] = await Promise.all([
    consoleSecurity(),
    getSecuritySettings(),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Xavfsizlik</h1>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Fact label="MFA majburiy" value={settings.require_mfa ? 'Yoqilgan' : "O'chirilgan"} good={settings.require_mfa} />
        <Fact label="Sessiya muddati" value={`${settings.session_hours} soat`} good />
        <Fact
          label="Urinish limiti"
          value={`${settings.max_login_attempts} / ${settings.lockout_minutes} daq`}
          good
        />
        <Fact
          label="IP allow-list"
          value={settings.ip_allowlist_enabled ? 'Yoqilgan' : "O'chirilgan"}
          good={settings.ip_allowlist_enabled}
        />
      </section>
      <p className="text-xs text-ink-500">
        Bu qiymatlar <code>settings.security</code> kalitida saqlanadi — Sozlamalar bo&apos;limida o&apos;zgartiriladi.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Konsolga ruxsat etilgan emaillar</h2>
          <ul className="space-y-1 text-sm">
            {allowlist.map((row) => (
              <li key={row.email} className="flex items-center justify-between gap-2">
                <span>
                  {row.email}
                  <span className="block text-xs text-ink-500">{row.note ?? dateTime(row.created_at)}</span>
                </span>
                <form action={removeAllowlistEmail}>
                  <input type="hidden" name="email" value={row.email} />
                  <button type="submit" className="btn-danger py-1 text-xs">
                    O&apos;chirish
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <AllowlistForm />
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">IP allow-list</h2>
          <ul className="space-y-1 text-sm">
            {ips.map((row) => (
              <li key={row.cidr} className="flex items-center justify-between gap-2">
                <span>
                  <code>{row.cidr}</code>
                  <span className="block text-xs text-ink-500">{row.note ?? '—'}</span>
                </span>
                <form action={removeIpAllowlist}>
                  <input type="hidden" name="cidr" value={row.cidr} />
                  <button type="submit" className="btn-danger py-1 text-xs">
                    O&apos;chirish
                  </button>
                </form>
              </li>
            ))}
            {ips.length === 0 && <li className="text-ink-500">Ro&apos;yxat bo&apos;sh.</li>}
          </ul>
          <IpAllowlistForm />
        </section>
      </div>

      <section className="card overflow-x-auto">
        <h2 className="px-4 py-3 font-semibold">Konsol sessiyalari (kirish/chiqish nazorati)</h2>
        <table className="table-base">
          <thead>
            <tr>
              <th>IP</th>
              <th>Qurilma</th>
              <th>Boshlandi</th>
              <th>Tugaydi</th>
              <th>Holat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const active = !session.revoked_at && new Date(session.expires_at) > new Date();
              return (
                <tr key={session.id}>
                  <td>{session.ip ?? '—'}</td>
                  <td className="max-w-[240px] truncate text-xs text-ink-500">{session.user_agent ?? '—'}</td>
                  <td className="text-xs">{dateTime(session.created_at)}</td>
                  <td className="text-xs">{dateTime(session.expires_at)}</td>
                  <td>
                    <span className={`badge ${active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-ink-500'}`}>
                      {active ? 'Faol' : session.revoked_at ? 'Bekor qilingan' : 'Muddati tugagan'}
                    </span>
                  </td>
                  <td className="text-right">
                    {active && (
                      <form action={revokeAdminSession}>
                        <input type="hidden" name="id" value={session.id} />
                        <button type="submit" className="btn-danger py-1 text-xs">
                          Uzish
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Kirish urinishlari</h2>
          <ul className="space-y-1 text-sm">
            {attempts.map((attempt, index) => (
              <li key={`${attempt.identifier}-${index}`} className="flex items-center justify-between gap-2">
                <span>
                  {attempt.identifier}
                  <span className="block text-xs text-ink-500">
                    {attempt.ip ?? '—'} · {attempt.scope}
                  </span>
                </span>
                <span className={`text-xs ${attempt.successful ? 'text-brand-600' : 'text-red-600'}`}>
                  {attempt.successful ? 'muvaffaqiyat' : 'xato'} · {dateTime(attempt.created_at)}
                </span>
              </li>
            ))}
            {attempts.length === 0 && <li className="text-ink-500">Yozuv yo&apos;q.</li>}
          </ul>
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Audit jurnali</h2>
          <ul className="space-y-1 text-sm">
            {audits.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2">
                <span>
                  <code className="text-xs">{row.action}</code>
                  <span className="block text-xs text-ink-500">{row.actor_email ?? '—'}</span>
                </span>
                <span className="shrink-0 text-xs text-ink-500">{dateTime(row.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Fact({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-500">{label}</p>
      <p className={`text-lg font-bold ${good ? 'text-brand-700' : 'text-red-600'}`}>{value}</p>
    </div>
  );
}
