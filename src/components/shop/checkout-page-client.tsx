'use client';

import { useState } from 'react';
import { CheckoutForm } from '@/components/shop/checkout-form';
import { AddressForm } from '@/components/shop/address-form';
import { CheckoutModal } from '@/components/shop/checkout/checkout-modal';
import type { Address, DeliveryZone } from '@/lib/types';

export function CheckoutPageClient({
  addresses,
  zones,
  itemsTotal,
  weightGram,
  cardNumber,
}: {
  addresses: Address[];
  zones: DeliveryZone[];
  itemsTotal: number;
  weightGram: number;
  cardNumber: string;
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Buyurtmani rasmiylashtirish</h1>

      {addresses.length === 0 ? (
        <div className="mx-auto max-w-xl space-y-3">
          <p className="text-sm text-ink-500">Davom etish uchun yetkazib berish manzilini qo&apos;shing.</p>
          <AddressForm zones={zones} />
        </div>
      ) : (
        <>
          <CheckoutForm
            addresses={addresses}
            zones={zones}
            itemsTotal={itemsTotal}
            weightGram={weightGram}
          />
          <details className="mx-auto max-w-xl">
            <summary className="cursor-pointer text-sm font-medium text-brand-600">Yangi manzil qo&apos;shish</summary>
            <div className="mt-3">
              <AddressForm zones={zones} />
            </div>
          </details>
        </>
      )}

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        orderNumber={orderNumber}
        totalAmount={0}
        cardNumber={cardNumber}
        provider={provider}
      />
    </div>
  );
}
