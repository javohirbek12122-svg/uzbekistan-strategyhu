import { createHash } from 'node:crypto';

/**
 * Click Merchant API (SHOP-API "Prepare / Complete" flow).
 * Amounts are plain UZS with two decimals on the wire.
 */

export const CLICK_ERROR = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INCORRECT_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  BAD_REQUEST: -8,
  TRANSACTION_CANCELLED: -9,
} as const;

export const CLICK_ACTION = { PREPARE: 0, COMPLETE: 1 } as const;

export interface ClickRequest {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id?: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string;
  error?: string;
  error_note?: string;
  sign_time: string;
  sign_string: string;
}

export interface ClickResponse {
  click_trans_id: number;
  merchant_trans_id: string;
  merchant_prepare_id?: number;
  merchant_confirm_id?: number;
  error: number;
  error_note: string;
}

/**
 * sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
 *                   [+ merchant_prepare_id] + amount + action + sign_time)
 */
export function clickSignString(params: {
  click_trans_id: string;
  service_id: string;
  secretKey: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string;
  sign_time: string;
}): string {
  const middle = params.merchant_prepare_id ? params.merchant_prepare_id : '';
  return createHash('md5')
    .update(
      `${params.click_trans_id}${params.service_id}${params.secretKey}${params.merchant_trans_id}${middle}${params.amount}${params.action}${params.sign_time}`,
    )
    .digest('hex');
}

export function verifyClickSign(request: ClickRequest, secretKey: string): boolean {
  if (!secretKey || !request.sign_string) return false;
  const expected = clickSignString({
    click_trans_id: request.click_trans_id,
    service_id: request.service_id,
    secretKey,
    merchant_trans_id: request.merchant_trans_id,
    merchant_prepare_id: request.action === String(CLICK_ACTION.COMPLETE) ? request.merchant_prepare_id : undefined,
    amount: request.amount,
    action: request.action,
    sign_time: request.sign_time,
  });
  return expected.toLowerCase() === request.sign_string.toLowerCase();
}

export function amountsMatch(wire: string, expectedUzs: number): boolean {
  const parsed = Number.parseFloat(wire);
  if (!Number.isFinite(parsed)) return false;
  return Math.abs(parsed - expectedUzs) < 0.5;
}

export interface ClickOrderView {
  orderId: string;
  paymentId: string;
  amount: number;
  payable: boolean;
  alreadyPaid: boolean;
  cancelled: boolean;
}

export interface ClickStore {
  findOrder(orderId: string): Promise<ClickOrderView | null>;
  markPrepared(input: { orderId: string; paymentId: string; clickTransId: string }): Promise<void>;
  markPaid(input: { orderId: string; paymentId: string; clickTransId: string }): Promise<void>;
  cancel(input: { orderId: string; paymentId: string; clickTransId: string; error: number }): Promise<void>;
}

export function buildClickCheckoutUrl(options: {
  serviceId: string;
  merchantId: string;
  orderId: string;
  amountUzs: number;
  returnUrl?: string;
}): string {
  const url = new URL('https://my.click.uz/services/pay');
  url.searchParams.set('service_id', options.serviceId);
  url.searchParams.set('merchant_id', options.merchantId);
  url.searchParams.set('amount', String(options.amountUzs));
  url.searchParams.set('transaction_param', options.orderId);
  if (options.returnUrl) url.searchParams.set('return_url', options.returnUrl);
  return url.toString();
}

export async function handleClickRequest(
  request: ClickRequest,
  secretKey: string,
  store: ClickStore,
): Promise<ClickResponse> {
  const base = {
    click_trans_id: Number(request.click_trans_id),
    merchant_trans_id: request.merchant_trans_id,
  };

  if (!verifyClickSign(request, secretKey)) {
    return { ...base, error: CLICK_ERROR.SIGN_CHECK_FAILED, error_note: 'SIGN CHECK FAILED' };
  }

  const order = await store.findOrder(request.merchant_trans_id);
  if (!order) {
    return { ...base, error: CLICK_ERROR.USER_NOT_FOUND, error_note: 'Order not found' };
  }
  if (!amountsMatch(request.amount, order.amount)) {
    return { ...base, error: CLICK_ERROR.INCORRECT_AMOUNT, error_note: 'Incorrect amount' };
  }
  if (order.cancelled) {
    return { ...base, error: CLICK_ERROR.TRANSACTION_CANCELLED, error_note: 'Transaction cancelled' };
  }

  if (request.action === String(CLICK_ACTION.PREPARE)) {
    if (order.alreadyPaid) {
      return { ...base, error: CLICK_ERROR.ALREADY_PAID, error_note: 'Already paid' };
    }
    await store.markPrepared({
      orderId: order.orderId,
      paymentId: order.paymentId,
      clickTransId: request.click_trans_id,
    });
    return {
      ...base,
      merchant_prepare_id: Number(request.click_trans_id),
      error: CLICK_ERROR.SUCCESS,
      error_note: 'Success',
    };
  }

  if (request.action === String(CLICK_ACTION.COMPLETE)) {
    if (request.error && Number(request.error) < 0) {
      await store.cancel({
        orderId: order.orderId,
        paymentId: order.paymentId,
        clickTransId: request.click_trans_id,
        error: Number(request.error),
      });
      return { ...base, error: CLICK_ERROR.TRANSACTION_CANCELLED, error_note: 'Transaction cancelled' };
    }
    if (order.alreadyPaid) {
      return {
        ...base,
        merchant_confirm_id: Number(request.click_trans_id),
        error: CLICK_ERROR.ALREADY_PAID,
        error_note: 'Already paid',
      };
    }
    await store.markPaid({
      orderId: order.orderId,
      paymentId: order.paymentId,
      clickTransId: request.click_trans_id,
    });
    return {
      ...base,
      merchant_confirm_id: Number(request.click_trans_id),
      error: CLICK_ERROR.SUCCESS,
      error_note: 'Success',
    };
  }

  return { ...base, error: CLICK_ERROR.ACTION_NOT_FOUND, error_note: 'Action not found' };
}
