'use client';

import { useState, useTransition } from 'react';
import { CreditCard } from 'lucide-react';
import { startPayment } from '@/server/actions/shop';

export function PayButton({ orderId, label }: { orderId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        className="btn-primary w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await startPayment(orderId);
            if (result.url) window.location.href = result.url;
            else setError(result.message ?? 'To\u2019lovni boshlash imkoni bo\u2019lmadi');
          })
        }
      >
        <CreditCard className="h-4 w-4" />
        {pending ? 'Yo\u2019naltirilmoqda…' : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
