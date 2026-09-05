'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { saveP2PCard } from '@/server/actions/shop';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';
import { CreditCard, Trash2 } from 'lucide-react';

export function P2PCardForm({ defaultCardNumber }: { defaultCardNumber: string }) {
  const [state, action] = useActionState(saveP2PCard, initialFormState);
  const [cardNumber, setCardNumber] = useState(defaultCardNumber);

  const formatCard = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  };

  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="p2p_card_number" value={cardNumber.replace(/\s/g, '')} />
      <div>
        <label className="mb-2 block text-sm text-slate-300">P2P Telegram karta raqami</label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={formatCard(cardNumber)}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 19))}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className="w-full rounded-2xl border border-white/20 bg-white/10 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          {cardNumber && (
            <button
              type="button"
              onClick={() => setCardNumber('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">Karta raqamingiz shifrlanadi va faqat to‘lov uchun ishlatiladi.</p>
      </div>
      {state?.message && <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>}
      <SubmitButton className="w-full" pendingLabel="Saqlanmoqda…">
        Karta raqamini saqlash
      </SubmitButton>
    </form>
  );
}
