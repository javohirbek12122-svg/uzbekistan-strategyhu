import { getConsoleIdentity } from '@/lib/security/console';
import { ConsoleShell } from '@/components/console/shell';
import { updateUserSettings } from '@/server/actions/shop';
import { SubmitButton } from '@/components/ui/submit-button';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const identity = await getConsoleIdentity();
  if (!identity) return null;

  return (
    <ConsoleShell identity={identity}>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-bold">Sozlamalar</h1>
        <form action={updateUserSettings} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="theme">Mavzu</label>
            <select id="theme" name="theme" className="input">
              <option value="light">Yorug&apos;</option>
              <option value="dark">To&apos;q</option>
              <option value="system">Tizim</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="language">Til</label>
            <select id="language" name="language" className="input">
              <option value="uz">O&apos;zbek</option>
              <option value="ru">Русский</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="notifications">Bildirishnomalar</label>
            <select id="notifications" name="notifications" className="input">
              <option value="all">Hammasi</option>
              <option value="important">Muhim</option>
              <option value="none">O&apos;chirilgan</option>
            </select>
          </div>
          <SubmitButton>Saqlash</SubmitButton>
        </form>
      </div>
    </ConsoleShell>
  );
}
