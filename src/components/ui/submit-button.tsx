'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/format';

export function SubmitButton({
  children,
  className,
  pendingLabel,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn('btn-primary', className)} {...props}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? (pendingLabel ?? 'Bajarilmoqda…') : children}
    </button>
  );
}
