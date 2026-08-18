import { describe, expect, it, vi } from 'vitest';
import {
  CLICK_ERROR,
  amountsMatch,
  clickSignString,
  handleClickRequest,
  verifyClickSign,
  type ClickOrderView,
  type ClickRequest,
  type ClickStore,
} from './click';

const SECRET = 'click-secret';

function signedRequest(overrides: Partial<ClickRequest> = {}): ClickRequest {
  const base = {
    click_trans_id: '900001',
    service_id: '12345',
    merchant_trans_id: 'order-1',
    amount: '150000.00',
    action: '0',
    sign_time: '2026-01-10 10:00:00',
    ...overrides,
  } as ClickRequest;

  return {
    ...base,
    sign_string: clickSignString({
      click_trans_id: base.click_trans_id,
      service_id: base.service_id,
      secretKey: SECRET,
      merchant_trans_id: base.merchant_trans_id,
      merchant_prepare_id: base.action === '1' ? base.merchant_prepare_id : undefined,
      amount: base.amount,
      action: base.action,
      sign_time: base.sign_time,
    }),
  };
}

function store(order: ClickOrderView | null): ClickStore & {
  markPrepared: ReturnType<typeof vi.fn>;
  markPaid: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
} {
  return {
    findOrder: vi.fn(async () => order),
    markPrepared: vi.fn(async () => undefined),
    markPaid: vi.fn(async () => undefined),
    cancel: vi.fn(async () => undefined),
  };
}

const order: ClickOrderView = {
  orderId: 'order-1',
  paymentId: 'payment-1',
  amount: 150_000,
  payable: true,
  alreadyPaid: false,
  cancelled: false,
};

describe('verifyClickSign', () => {
  it('accepts a correctly signed request', () => {
    expect(verifyClickSign(signedRequest(), SECRET)).toBe(true);
  });

  it('rejects a tampered amount', () => {
    const request = signedRequest();
    expect(verifyClickSign({ ...request, amount: '1000.00' }, SECRET)).toBe(false);
  });

  it('rejects an unknown secret or a missing signature', () => {
    expect(verifyClickSign(signedRequest(), 'other')).toBe(false);
    expect(verifyClickSign({ ...signedRequest(), sign_string: '' }, SECRET)).toBe(false);
  });
});

describe('amountsMatch', () => {
  it('compares within a sub-som tolerance', () => {
    expect(amountsMatch('150000.00', 150_000)).toBe(true);
    expect(amountsMatch('150000.20', 150_000)).toBe(true);
    expect(amountsMatch('149000.00', 150_000)).toBe(false);
    expect(amountsMatch('abc', 150_000)).toBe(false);
  });
});

describe('handleClickRequest', () => {
  it('fails the signature check without touching the store', async () => {
    const db = store(order);
    const response = await handleClickRequest({ ...signedRequest(), sign_string: 'deadbeef' }, SECRET, db);
    expect(response.error).toBe(CLICK_ERROR.SIGN_CHECK_FAILED);
    expect(db.findOrder).not.toHaveBeenCalled();
  });

  it('rejects an amount that differs from the stored order total', async () => {
    const db = store({ ...order, amount: 200_000 });
    const response = await handleClickRequest(signedRequest(), SECRET, db);
    expect(response.error).toBe(CLICK_ERROR.INCORRECT_AMOUNT);
    expect(db.markPrepared).not.toHaveBeenCalled();
  });

  it('prepares a valid transaction', async () => {
    const db = store(order);
    const response = await handleClickRequest(signedRequest(), SECRET, db);
    expect(response.error).toBe(CLICK_ERROR.SUCCESS);
    expect(response.merchant_prepare_id).toBe(900001);
    expect(db.markPrepared).toHaveBeenCalledOnce();
  });

  it('completes a prepared transaction', async () => {
    const db = store(order);
    const response = await handleClickRequest(
      signedRequest({ action: '1', merchant_prepare_id: '900001' }),
      SECRET,
      db,
    );
    expect(response.error).toBe(CLICK_ERROR.SUCCESS);
    expect(db.markPaid).toHaveBeenCalledOnce();
  });

  it('does not pay twice', async () => {
    const db = store({ ...order, alreadyPaid: true });
    const response = await handleClickRequest(
      signedRequest({ action: '1', merchant_prepare_id: '900001' }),
      SECRET,
      db,
    );
    expect(response.error).toBe(CLICK_ERROR.ALREADY_PAID);
    expect(db.markPaid).not.toHaveBeenCalled();
  });

  it('cancels when Click reports an error on complete', async () => {
    const db = store(order);
    const response = await handleClickRequest(
      signedRequest({ action: '1', merchant_prepare_id: '900001', error: '-5017' }),
      SECRET,
      db,
    );
    expect(response.error).toBe(CLICK_ERROR.TRANSACTION_CANCELLED);
    expect(db.cancel).toHaveBeenCalledOnce();
  });

  it('reports unknown orders', async () => {
    const response = await handleClickRequest(signedRequest(), SECRET, store(null));
    expect(response.error).toBe(CLICK_ERROR.USER_NOT_FOUND);
  });
});
