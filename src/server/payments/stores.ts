import 'server-only';
import { serviceClient } from '@/lib/supabase/service';
import type { PaymeStore, PaymeTransactionView } from '@/lib/payments/payme';
import type { ClickStore, ClickOrderView } from '@/lib/payments/click';

const PAYABLE_STATUSES = ['created', 'pending_payment'];

interface PaymentRow {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  provider_transaction_id: string | null;
  provider_state: number | null;
  provider_created_time: number | null;
  provider_perform_time: number | null;
  provider_cancel_time: number | null;
  cancel_reason: number | null;
}

function toTransaction(row: PaymentRow): PaymeTransactionView {
  return {
    providerTransactionId: row.provider_transaction_id ?? '',
    paymentId: row.id,
    orderId: row.order_id,
    amount: Number(row.amount),
    state: (row.provider_state ?? 1) as PaymeTransactionView['state'],
    createTime: Number(row.provider_created_time ?? 0),
    performTime: Number(row.provider_perform_time ?? 0),
    cancelTime: Number(row.provider_cancel_time ?? 0),
    reason: row.cancel_reason,
  };
}

const PAYMENT_COLUMNS =
  'id, order_id, amount, status, provider_transaction_id, provider_state, provider_created_time, provider_perform_time, provider_cancel_time, cancel_reason';

/** Looks up the pending payment row of an order for a given provider. */
async function findPayableOrder(orderId: string, provider: 'payme' | 'click') {
  const client = serviceClient();
  const { data: order } = await client
    .from('orders')
    .select('id, total, status, payment_status')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return null;

  const { data: payment } = await client
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .eq('order_id', orderId)
    .eq('provider', provider)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!payment) return null;

  return { order, payment: payment as PaymentRow };
}

export function paymeStore(): PaymeStore {
  const client = serviceClient();

  return {
    async findOrder(orderId) {
      if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
      const found = await findPayableOrder(orderId, 'payme');
      if (!found) return null;
      return {
        orderId: found.order.id,
        paymentId: found.payment.id,
        amount: Number(found.order.total),
        payable: PAYABLE_STATUSES.includes(found.order.status) && found.order.payment_status !== 'paid',
      };
    },

    async findTransaction(providerTransactionId) {
      const { data } = await client
        .from('payments')
        .select(PAYMENT_COLUMNS)
        .eq('provider', 'payme')
        .eq('provider_transaction_id', providerTransactionId)
        .maybeSingle();
      return data ? toTransaction(data as PaymentRow) : null;
    },

    async createTransaction({ providerTransactionId, paymentId, time }) {
      const { data, error } = await client
        .from('payments')
        .update({
          provider_transaction_id: providerTransactionId,
          provider_state: 1,
          provider_created_time: time,
          status: 'authorized',
        })
        .eq('id', paymentId)
        .select(PAYMENT_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      return toTransaction(data as PaymentRow);
    },

    async performTransaction(providerTransactionId) {
      const now = Date.now();
      const { data, error } = await client
        .from('payments')
        .update({ provider_state: 2, provider_perform_time: now })
        .eq('provider', 'payme')
        .eq('provider_transaction_id', providerTransactionId)
        .select(PAYMENT_COLUMNS)
        .single();
      if (error) throw new Error(error.message);

      const row = data as PaymentRow;
      const { error: rpcError } = await client.rpc('mark_payment_paid', {
        p_payment_id: row.id,
        p_provider_transaction_id: providerTransactionId,
      });
      if (rpcError) throw new Error(rpcError.message);
      return toTransaction(row);
    },

    async cancelTransaction(providerTransactionId, reason) {
      const now = Date.now();
      const { data: current } = await client
        .from('payments')
        .select(PAYMENT_COLUMNS)
        .eq('provider', 'payme')
        .eq('provider_transaction_id', providerTransactionId)
        .maybeSingle();
      if (!current) throw new Error('transaction_not_found');

      const row = current as PaymentRow;
      const state = row.provider_state === 2 ? -2 : -1;
      const { data, error } = await client
        .from('payments')
        .update({ provider_state: state, provider_cancel_time: now, cancel_reason: reason })
        .eq('id', row.id)
        .select(PAYMENT_COLUMNS)
        .single();
      if (error) throw new Error(error.message);

      const { error: rpcError } = await client.rpc('cancel_payment', {
        p_payment_id: row.id,
        p_reason: reason,
      });
      if (rpcError) throw new Error(rpcError.message);
      return toTransaction(data as PaymentRow);
    },

    async listTransactions(from, to) {
      const { data } = await client
        .from('payments')
        .select(PAYMENT_COLUMNS)
        .eq('provider', 'payme')
        .gte('provider_created_time', from)
        .lte('provider_created_time', to);
      return (data ?? []).map((row) => toTransaction(row as PaymentRow));
    },
  };
}

export function clickStore(): ClickStore {
  const client = serviceClient();

  return {
    async findOrder(orderId): Promise<ClickOrderView | null> {
      if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
      const found = await findPayableOrder(orderId, 'click');
      if (!found) return null;
      return {
        orderId: found.order.id,
        paymentId: found.payment.id,
        amount: Number(found.order.total),
        payable: PAYABLE_STATUSES.includes(found.order.status),
        alreadyPaid: found.order.payment_status === 'paid',
        cancelled: ['cancelled', 'refunded'].includes(found.order.payment_status),
      };
    },

    async markPrepared({ paymentId, clickTransId }) {
      await client
        .from('payments')
        .update({ status: 'authorized', provider_transaction_id: clickTransId, provider_created_time: Date.now() })
        .eq('id', paymentId);
    },

    async markPaid({ paymentId, clickTransId }) {
      await client
        .from('payments')
        .update({ provider_perform_time: Date.now() })
        .eq('id', paymentId);
      const { error } = await client.rpc('mark_payment_paid', {
        p_payment_id: paymentId,
        p_provider_transaction_id: clickTransId,
      });
      if (error) throw new Error(error.message);
    },

    async cancel({ paymentId, error }) {
      const { error: rpcError } = await client.rpc('cancel_payment', {
        p_payment_id: paymentId,
        p_reason: error,
      });
      if (rpcError) throw new Error(rpcError.message);
    },
  };
}

export async function logPaymentEvent(input: {
  provider: 'payme' | 'click';
  method?: string;
  request: unknown;
  response: unknown;
  signatureValid: boolean;
  ip: string | null;
}) {
  await serviceClient().from('payment_events').insert({
    provider: input.provider,
    method: input.method ?? null,
    request: input.request as never,
    response: input.response as never,
    signature_valid: input.signatureValid,
    ip: input.ip,
  });
}
