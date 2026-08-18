'use client';

import { useActionState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { addToCart } from '@/server/actions/shop';
import { initialFormState } from '@/lib/validation';
import { cn } from '@/lib/format';

function Button({ disabled, className, done }: { disabled?: boolean; className?: string; done: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(done ? 'btn-secondary' : 'btn-primary', className)}
    >
      {done ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      {done ? 'Savatda' : pending ? '...' : 'Savatga'}
    </button>
  );
}

export function AddToCartButton({
  productId,
  quantity = 1,
  disabled,
  className,
}: {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
}) {
  const [state, action] = useActionState(addToCart, initialFormState);

  return (
    <form action={action} className="contents">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="quantity" value={quantity} />
      <Button disabled={disabled} className={className} done={Boolean(state?.ok)} />
      {state?.ok === false && state.message && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
    </form>
  );
}
