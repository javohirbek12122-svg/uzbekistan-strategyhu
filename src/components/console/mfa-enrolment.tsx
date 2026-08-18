'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { KeyRound } from 'lucide-react';
import { startMfaEnrolment } from '@/server/actions/console';

type Enrolment = { secret: string; otpauthUrl: string; qrDataUrl: string; recoveryCodes: string[] };

/**
 * One-time authenticator setup for the owner. Only works for an allow-listed
 * privileged account that has no confirmed authenticator yet.
 */
export function MfaEnrolment() {
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<Enrolment | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <details className="card p-4">
      <summary className="cursor-pointer text-sm font-medium text-brand-700">
        Autentifikatorni birinchi marta ulash
      </summary>

      <div className="mt-3 space-y-3">
        <p className="text-xs text-ink-500">
          Avval oddiy sahifadan (/auth/login) o&apos;z email va parolingiz bilan kiring, so&apos;ng shu tugmani
          bosing. Kod va zaxira kodlar faqat bir marta ko&apos;rsatiladi.
        </p>
        <button
          type="button"
          className="btn-secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await startMfaEnrolment();
              if (result.ok) setData(result);
              else setError(result.message);
            })
          }
        >
          <KeyRound className="h-4 w-4" />
          {pending ? 'Tayyorlanmoqda…' : 'Kod yaratish'}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {data && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-3">
            <Image src={data.qrDataUrl} alt="TOTP QR" width={220} height={220} unoptimized className="rounded bg-white p-2" />
            <p className="break-all text-xs">
              Maxfiy kalit: <code className="font-mono">{data.secret}</code>
            </p>
            <div>
              <p className="text-xs font-semibold">Zaxira kodlar (saqlab qo&apos;ying):</p>
              <ul className="mt-1 grid grid-cols-2 gap-1 font-mono text-xs">
                {data.recoveryCodes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
