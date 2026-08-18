import { consoleSettings } from '@/server/console/queries';
import { SettingForm } from '@/components/console/setting-form';
import { dateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

const HINTS: Record<string, string> = {
  store: "Do'kon nomi, telefon, manzil, ish vaqti",
  security: 'MFA talabi, sessiya muddati, urinishlar limiti, IP allow-list',
  payments: "Yoqilgan to'lov usullari",
  delivery: 'Kechikish qoplamasi, bepul yetkazish chegarasi',
};

export default async function ConsoleSettingsPage() {
  const settings = await consoleSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Sozlamalar</h1>
        <p className="text-sm text-ink-500">
          Qiymatlar JSON ko&apos;rinishida saqlanadi. To&apos;lov provayderlarining maxfiy kalitlari bu yerda emas —
          faqat server muhit o&apos;zgaruvchilarida turadi.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {settings.map((setting) => (
          <section key={setting.key} className="card space-y-2 p-4">
            <div>
              <h2 className="font-semibold">{setting.key}</h2>
              <p className="text-xs text-ink-500">{HINTS[setting.key] ?? `Oxirgi o'zgarish: ${dateTime(setting.updated_at)}`}</p>
            </div>
            <SettingForm settingKey={setting.key} value={setting.value} />
          </section>
        ))}
      </div>

      <section className="card space-y-2 p-4">
        <h2 className="font-semibold">Yangi sozlama</h2>
        <SettingForm />
      </section>
    </div>
  );
}
