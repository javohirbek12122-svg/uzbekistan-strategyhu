import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Payme Merchant API (JSON-RPC 2.0).
 * Amounts on the wire are in tiyin: 1 UZS = 100 tiyin.
 */

export const PAYME_ERROR = {
  TRANSPORT: -32300,
  PARSE: -32700,
  INVALID_PARAMS: -32600,
  METHOD_NOT_FOUND: -32601,
  INSUFFICIENT_PRIVILEGE: -32504,
  WRONG_AMOUNT: -31001,
  ORDER_NOT_FOUND: -31050,
  TRANSACTION_NOT_FOUND: -31003,
  CANNOT_PERFORM: -31008,
  CANNOT_CANCEL: -31007,
} as const;

export type PaymeMethod =
  | 'CheckPerformTransaction'
  | 'CreateTransaction'
  | 'PerformTransaction'
  | 'CancelTransaction'
  | 'CheckTransaction'
  | 'GetStatement';

export interface PaymeRequest {
  id?: number | string;
  method: string;
  params: {
    id?: string;
    time?: number;
    amount?: number;
    reason?: number;
    account?: Record<string, string>;
    from?: number;
    to?: number;
  };
}

export interface PaymeError {
  code: number;
  message: { uz: string; ru: string; en: string };
  data?: string;
}

export type PaymeResponse =
  | { jsonrpc: '2.0'; id?: number | string; result: Record<string, unknown> }
  | { jsonrpc: '2.0'; id?: number | string; error: PaymeError };

export const TIYIN = 100;

export function toTiyin(uzs: number): number {
  return Math.round(uzs * TIYIN);
}

function err(code: number, uz: string, data?: string): PaymeError {
  return { code, message: { uz, ru: uz, en: uz }, data };
}

/** Basic auth check: `Basic base64("Paycom:<merchant key>")`, constant-time. */
export function verifyPaymeAuth(authorization: string | null, merchantKey: string, login = 'Paycom'): boolean {
  if (!authorization || !merchantKey) return false;
  const [scheme, encoded] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'basic' || !encoded) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return false;
  }
  const expected = createHash('sha256').update(`${login}:${merchantKey}`).digest();
  const actual = createHash('sha256').update(decoded).digest();
  return timingSafeEqual(expected, actual);
}

/** Payme checkout redirect URL (base64 encoded parameters). */
export function buildPaymeCheckoutUrl(options: {
  merchantId: string;
  orderId: string;
  amountUzs: number;
  returnUrl?: string;
  baseUrl?: string;
}): string {
  const parts = [
    `m=${options.merchantId}`,
    `ac.order_id=${options.orderId}`,
    `a=${toTiyin(options.amountUzs)}`,
    'l=uz',
  ];
  if (options.returnUrl) parts.push(`c=${options.returnUrl}`);
  const encoded = Buffer.from(parts.join(';'), 'utf8').toString('base64');
  return `${options.baseUrl ?? 'https://checkout.paycom.uz'}/${encoded}`;
}

export type PaymeTransactionState = 1 | 2 | -1 | -2;

export interface PaymeOrderView {
  orderId: string;
  paymentId: string;
  /** Amount owed, in UZS. */
  amount: number;
  payable: boolean;
}

export interface PaymeTransactionView {
  providerTransactionId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  state: PaymeTransactionState;
  createTime: number;
  performTime: number;
  cancelTime: number;
  reason: number | null;
}

export interface PaymeStore {
  findOrder(orderId: string): Promise<PaymeOrderView | null>;
  findTransaction(providerTransactionId: string): Promise<PaymeTransactionView | null>;
  createTransaction(input: {
    providerTransactionId: string;
    orderId: string;
    paymentId: string;
    amount: number;
    time: number;
  }): Promise<PaymeTransactionView>;
  performTransaction(providerTransactionId: string): Promise<PaymeTransactionView>;
  cancelTransaction(providerTransactionId: string, reason: number): Promise<PaymeTransactionView>;
  /** Transactions in a time window, used by GetStatement reconciliation. */
  listTransactions(from: number, to: number): Promise<PaymeTransactionView[]>;
}

const TRANSACTION_TIMEOUT_MS = 12 * 60 * 60 * 1000;

/**
 * Handles a verified Payme JSON-RPC call. Authentication is checked by the
 * route before this is invoked; amounts are always compared against the
 * order total stored in the database.
 */
export async function handlePaymeRequest(request: PaymeRequest, store: PaymeStore): Promise<PaymeResponse> {
  const { id, method, params } = request;
  const respond = (result: Record<string, unknown>): PaymeResponse => ({ jsonrpc: '2.0', id, result });
  const fail = (error: PaymeError): PaymeResponse => ({ jsonrpc: '2.0', id, error });

  switch (method as PaymeMethod) {
    case 'CheckPerformTransaction': {
      const orderId = params.account?.order_id;
      if (!orderId) return fail(err(PAYME_ERROR.ORDER_NOT_FOUND, 'Buyurtma topilmadi', 'order_id'));
      const order = await store.findOrder(orderId);
      if (!order) return fail(err(PAYME_ERROR.ORDER_NOT_FOUND, 'Buyurtma topilmadi', 'order_id'));
      if (!order.payable) return fail(err(PAYME_ERROR.CANNOT_PERFORM, "Buyurtma to'lovga yaroqsiz"));
      if (params.amount !== toTiyin(order.amount)) {
        return fail(err(PAYME_ERROR.WRONG_AMOUNT, "Noto'g'ri summa"));
      }
      return respond({ allow: true });
    }

    case 'CreateTransaction': {
      const providerTransactionId = params.id;
      const orderId = params.account?.order_id;
      if (!providerTransactionId || !orderId) {
        return fail(err(PAYME_ERROR.INVALID_PARAMS, "Parametrlar noto'g'ri"));
      }

      const existing = await store.findTransaction(providerTransactionId);
      if (existing) {
        if (existing.state !== 1) return fail(err(PAYME_ERROR.CANNOT_PERFORM, 'Tranzaksiya holati mos emas'));
        return respond({
          create_time: existing.createTime,
          transaction: existing.paymentId,
          state: existing.state,
        });
      }

      const order = await store.findOrder(orderId);
      if (!order) return fail(err(PAYME_ERROR.ORDER_NOT_FOUND, 'Buyurtma topilmadi', 'order_id'));
      if (!order.payable) return fail(err(PAYME_ERROR.CANNOT_PERFORM, "Buyurtma to'lovga yaroqsiz"));
      if (params.amount !== toTiyin(order.amount)) {
        return fail(err(PAYME_ERROR.WRONG_AMOUNT, "Noto'g'ri summa"));
      }

      const created = await store.createTransaction({
        providerTransactionId,
        orderId: order.orderId,
        paymentId: order.paymentId,
        amount: order.amount,
        time: params.time ?? Date.now(),
      });
      return respond({ create_time: created.createTime, transaction: created.paymentId, state: created.state });
    }

    case 'PerformTransaction': {
      if (!params.id) return fail(err(PAYME_ERROR.INVALID_PARAMS, "Parametrlar noto'g'ri"));
      const tx = await store.findTransaction(params.id);
      if (!tx) return fail(err(PAYME_ERROR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi'));

      if (tx.state === 2) {
        return respond({ transaction: tx.paymentId, perform_time: tx.performTime, state: tx.state });
      }
      if (tx.state !== 1) return fail(err(PAYME_ERROR.CANNOT_PERFORM, 'Tranzaksiya bekor qilingan'));
      if (Date.now() - tx.createTime > TRANSACTION_TIMEOUT_MS) {
        const cancelled = await store.cancelTransaction(tx.providerTransactionId, 4);
        return fail(err(PAYME_ERROR.CANNOT_PERFORM, `Tranzaksiya muddati tugadi (${cancelled.state})`));
      }

      const performed = await store.performTransaction(tx.providerTransactionId);
      return respond({
        transaction: performed.paymentId,
        perform_time: performed.performTime,
        state: performed.state,
      });
    }

    case 'CancelTransaction': {
      if (!params.id) return fail(err(PAYME_ERROR.INVALID_PARAMS, "Parametrlar noto'g'ri"));
      const tx = await store.findTransaction(params.id);
      if (!tx) return fail(err(PAYME_ERROR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi'));
      if (tx.state < 0) {
        return respond({ transaction: tx.paymentId, cancel_time: tx.cancelTime, state: tx.state });
      }
      const cancelled = await store.cancelTransaction(tx.providerTransactionId, params.reason ?? 0);
      return respond({
        transaction: cancelled.paymentId,
        cancel_time: cancelled.cancelTime,
        state: cancelled.state,
      });
    }

    case 'CheckTransaction': {
      if (!params.id) return fail(err(PAYME_ERROR.INVALID_PARAMS, "Parametrlar noto'g'ri"));
      const tx = await store.findTransaction(params.id);
      if (!tx) return fail(err(PAYME_ERROR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi'));
      return respond({
        create_time: tx.createTime,
        perform_time: tx.performTime,
        cancel_time: tx.cancelTime,
        transaction: tx.paymentId,
        state: tx.state,
        reason: tx.reason,
      });
    }

    case 'GetStatement': {
      const list = await store.listTransactions(params.from ?? 0, params.to ?? Date.now());
      return respond({
        transactions: list.map((tx) => ({
          id: tx.providerTransactionId,
          time: tx.createTime,
          amount: toTiyin(tx.amount),
          account: { order_id: tx.orderId },
          create_time: tx.createTime,
          perform_time: tx.performTime,
          cancel_time: tx.cancelTime,
          transaction: tx.paymentId,
          state: tx.state,
          reason: tx.reason,
        })),
      });
    }

    default:
      return fail(err(PAYME_ERROR.METHOD_NOT_FOUND, 'Metod topilmadi', method));
  }
}
