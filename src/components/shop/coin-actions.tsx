
'use client';

import { useState, useTransition } from 'react';
import { Flame, Loader2, Radar, Shield, Sparkles } from 'lucide-react';
import { activateAiBoost, claimDailyCoin, createPriceSignal, armDeliveryShield } from '@/server/actions/coins';

function Result({ message }: { message: string }) {
  return message ? <p className="mt-2 text-xs text-ink-500">{message}</p> : null;
}

export function DailyCoinButton({ claimed = false }: { claimed?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  return <div>
    <button type="button" disabled={pending || claimed} onClick={() => startTransition(async () => {
      const r = await claimDailyCoin(); setMessage(r.message); window.dispatchEvent(new CustomEvent('coin-updated'));
    })} className="btn-primary w-full justify-center">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
      {claimed ? 'Bugungi Pulse olingan' : 'Bugungi Pulse + Coin'}
    </button>
    <Result message={message} />
  </div>;
}

export function AiBoostButton({ active = false }: { active?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  return <div>
    <button type="button" disabled={pending || active} onClick={() => startTransition(async () => {
      const r = await activateAiBoost(); setMessage(r.message); window.dispatchEvent(new CustomEvent('coin-updated'));
    })} className="btn-secondary w-full justify-center">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {active ? 'AI Deep Mode faol' : '3 Coin → AI Deep Mode'}
    </button>
    <Result message={message} />
  </div>;
}

export function PriceSignalButton({ productId, targetPrice }: { productId: string; targetPrice?: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  return <div>
    <button type="button" disabled={pending} onClick={() => startTransition(async () => {
      const r = await createPriceSignal(productId, targetPrice); setMessage(r.message); window.dispatchEvent(new CustomEvent('coin-updated'));
    })} className="btn-secondary w-full justify-center">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
      5 Coin → Price Signal
    </button>
    <Result message={message} />
  </div>;
}

export function DeliveryShieldButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  return <div>
    <button type="button" disabled={pending} onClick={() => startTransition(async () => {
      const r = await armDeliveryShield(orderId); setMessage(r.message); window.dispatchEvent(new CustomEvent('coin-updated'));
    })} className="btn-secondary w-full justify-center">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
      20 Coin → Delivery Shield
    </button>
    <Result message={message} />
  </div>;
}
