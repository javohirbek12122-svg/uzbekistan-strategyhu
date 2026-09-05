import { getConsoleIdentity } from '@/lib/security/console';
import { ConsoleShell } from '@/components/console/shell';
import { updateContactSettings } from '@/server/actions/console';
import { SubmitButton } from '@/components/ui/submit-button';

export const dynamic = 'force-dynamic';

export default async function ConsoleContactPage() {
  const identity = await getConsoleIdentity();
  if (!identity) return null;

  return (
    <ConsoleShell identity={identity}>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-bold">Aloqa sozlamalari</h1>
        <p className="text-sm text-ink-500">
          Saytda ko&apos;rinadigan telefon raqam va manzilni bu yerda o&apos;zgartiring.
        </p>

        <form action={updateContactSettings} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="phone">
              Telefon raqam
            </label>
            <input id="phone" name="phone" className="input" placeholder="+998 90 123 45 67" />
          </div>
          <div>
            <label className="label" htmlFor="address">
              Manzil
            </label>
            <textarea id="address" name="address" className="input" rows={2} placeholder="Parkent tumani, ..." />
          </div>
          <div>
            <label className="label" htmlFor="working_hours">
              Ish vaqti
            </label>
            <input id="working_hours" name="working_hours" className="input" placeholder="Du-Ju: 09:00 - 18:00" />
          </div>
          <SubmitButton>Saqlash</SubmitButton>
        </form>
      </div>
    </ConsoleShell>
  );
}
