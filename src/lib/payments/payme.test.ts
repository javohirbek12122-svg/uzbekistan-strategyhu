import { describe, expect, it, vi } from 'vitest';
import {
  PAYME_ERROR,
  buildPaymeCheckoutUrl,
  handlePaymeRequest,
  toTiyin,
  verifyPaymeAuth,
  type PaymeOrderView,
  type PaymeStore,
  type PaymeTransactionView,
} from './payme';

const MERCHANT_KEY = 'payme-merchant-key';

const order: PaymeOrderView = {
  orderId: 'order-1',
  paymentId: 'payment-1',
  amount: 150_000,
  payable: true,
};

const tx = (overrides: Partial<PaymeTransactionView> = {}): PaymeTransactionView => ({
  providerTransactionId: 'ptx-1',
  paymentId: 'payment-1',
  orderId: 'order-1',
  amount: 150_000,
  state: 1,
  createTime: Date.now(),
  performTime: 0,
  cancelTime: 0,
  reason: null,
  ...overrides,
});

function store(options: { order?: PaymeOrderView | null; transaction?: PaymeTransactionView | null } = {}) {
  return {
    findOrder: vi.fn(async () => options.order ?? null),
    findTransaction: vi.fn(async () => options.transaction ?? null),
    createTransaction: vi.fn(async (input) => tx({ providerTransactionId: input.providerTransactionId })),
    performTransaction: vi.fn(async (id) => tx({ providerTransactionId: id, state: 2, performTime: Date.now() })),
    cancelTransaction: vi.fn(async (id, reason) =>
      tx({ providerTransactionId: id, state: -1, cancelTime: Date.now(), reason }),
    ),
    listTransactions: vi.fn(async () => (options.transaction ? [options.transaction] : [])),
  } satisfies PaymeStore & Record<string, unknown>;
}

function errorOf(response: Awaited<ReturnType<typeof handlePaymeRequest>>): number | undefined {
  return 'error' in response ? response.error.code : undefined;
}

function resultOf(response: Awaited<ReturnType<typeof handlePaymeRequest>>): Record<string, unknown> {
  if (!('result' in response)) throw new Error(`expected a result, got error ${errorOf(response)}`);
  return response.result;
}

describe('toTiyin', () => {
  it('converts som to tiyin', () => {
    expect(toTiyin(150_000)).toBe(15_000_000);
    expect(toTiyin(0.01)).toBe(1);
  });
});

describe('verifyPaymeAuth', () => {
  const header = (value: string) => `Basic ${Buffer.from(value, 'utf8').toString('base64')}`;

  it('accepts the merchant key', () => {
    expect(verifyPaymeAuth(header(`Paycom:${MERCHANT_KEY}`), MERCHANT_KEY)).toBe(true);
  });

  it('rejects a wrong key, wrong login, wrong scheme, or missing header', () => {
    expect(verifyPaymeAuth(header('Paycom:nope'), MERCHANT_KEY)).toBe(false);
    expect(verifyPaymeAuth(header(`admin:${MERCHANT_KEY}`), MERCHANT_KEY)).toBe(false);
    expect(verifyPaymeAuth(`Bearer ${MERCHANT_KEY}`, MERCHANT_KEY)).toBe(false);
    expect(verifyPaymeAuth(null, MERCHANT_KEY)).toBe(false);
    expect(verifyPaymeAuth(header(`Paycom:${MERCHANT_KEY}`), '')).toBe(false);
  });
});

describe('buildPaymeCheckoutUrl', () => {
  it('encodes merchant, order and tiyin amount', () => {
    const url = buildPaymeCheckoutUrl({ merchantId: 'm1', orderId: 'order-1', amountUzs: 150_000 });
    const encoded = url.split('/').pop() ?? '';
    expect(Buffer.from(encoded, 'base64').toString('utf8')).toBe('m=m1;ac.order_id=order-1;a=15000000;l=uz');
  });
});

describe('handlePaymeRequest', () => {
  it('allows CheckPerformTransaction for a payable order with the exact amount', async () => {
    const response = await handlePaymeRequest(
      { id: 1, method: 'CheckPerformTransaction', params: { amount: 15_000_000, account: { order_id: 'order-1' } } },
      store({ order }),
    );
    expect(resultOf(response)).toEqual({ allow: true });
  });

  it('rejects a mismatched amount', async () => {
    const response = await handlePaymeRequest(
      { id: 1, method: 'CheckPerformTransaction', params: { amount: 100, account: { order_id: 'order-1' } } },
      store({ order }),
    );
    expect(errorOf(response)).toBe(PAYME_ERROR.WRONG_AMOUNT);
  });

  it('rejects an unknown order and an unpayable order', async () => {
    expect(
      errorOf(
        await handlePaymeRequest(
          { method: 'CheckPerformTransaction', params: { amount: 15_000_000, account: { order_id: 'x' } } },
          store({ order: null }),
        ),
      ),
    ).toBe(PAYME_ERROR.ORDER_NOT_FOUND);

    expect(
      errorOf(
        await handlePaymeRequest(
          { method: 'CheckPerformTransaction', params: { amount: 15_000_000, account: { order_id: 'order-1' } } },
          store({ order: { ...order, payable: false } }),
        ),
      ),
    ).toBe(PAYME_ERROR.CANNOT_PERFORM);
  });

  it('creates a transaction and is idempotent for a repeated call', async () => {
    const fresh = store({ order });
    const created = await handlePaymeRequest(
      { method: 'CreateTransaction', params: { id: 'ptx-1', time: 1, amount: 15_000_000, account: { order_id: 'order-1' } } },
      fresh,
    );
    expect(resultOf(created).state).toBe(1);
    expect(fresh.createTransaction).toHaveBeenCalledOnce();

    const again = store({ order, transaction: tx() });
    expect(resultOf(await handlePaymeRequest(
      { method: 'CreateTransaction', params: { id: 'ptx-1', amount: 15_000_000, account: { order_id: 'order-1' } } },
      again,
    )).state).toBe(1);
    expect(again.createTransaction).not.toHaveBeenCalled();
  });

  it('does not create a transaction when the amount is wrong', async () => {
    const db = store({ order });
    const response = await handlePaymeRequest(
      { method: 'CreateTransaction', params: { id: 'ptx-1', amount: 1, account: { order_id: 'order-1' } } },
      db,
    );
    expect(errorOf(response)).toBe(PAYME_ERROR.WRONG_AMOUNT);
    expect(db.createTransaction).not.toHaveBeenCalled();
  });

  it('performs a pending transaction and stays idempotent once performed', async () => {
    const db = store({ order, transaction: tx() });
    expect(resultOf(await handlePaymeRequest({ method: 'PerformTransaction', params: { id: 'ptx-1' } }, db)).state).toBe(2);

    const done = store({ order, transaction: tx({ state: 2, performTime: 111 }) });
    expect(resultOf(await handlePaymeRequest({ method: 'PerformTransaction', params: { id: 'ptx-1' } }, done))).toMatchObject({
      state: 2,
      perform_time: 111,
    });
    expect(done.performTransaction).not.toHaveBeenCalled();
  });

  it('cancels an expired pending transaction instead of performing it', async () => {
    const db = store({ order, transaction: tx({ createTime: Date.now() - 13 * 60 * 60 * 1000 }) });
    expect(errorOf(await handlePaymeRequest({ method: 'PerformTransaction', params: { id: 'ptx-1' } }, db))).toBe(
      PAYME_ERROR.CANNOT_PERFORM,
    );
    expect(db.cancelTransaction).toHaveBeenCalledWith('ptx-1', 4);
    expect(db.performTransaction).not.toHaveBeenCalled();
  });

  it('cancels a transaction and reports unknown transactions', async () => {
    const db = store({ order, transaction: tx({ state: 2 }) });
    expect(resultOf(await handlePaymeRequest({ method: 'CancelTransaction', params: { id: 'ptx-1', reason: 5 } }, db)).state).toBe(-1);

    expect(errorOf(await handlePaymeRequest({ method: 'CheckTransaction', params: { id: 'nope' } }, store({ order })))).toBe(
      PAYME_ERROR.TRANSACTION_NOT_FOUND,
    );
  });

  it('returns statements with tiyin amounts', async () => {
    const db = store({ order, transaction: tx() });
    const result = resultOf(await handlePaymeRequest({ method: 'GetStatement', params: { from: 0, to: 10 } }, db));
    expect(result.transactions).toMatchObject([{ id: 'ptx-1', amount: 15_000_000, account: { order_id: 'order-1' } }]);
  });

  it('rejects unknown methods', async () => {
    expect(errorOf(await handlePaymeRequest({ method: 'Nope', params: {} }, store({ order })))).toBe(
      PAYME_ERROR.METHOD_NOT_FOUND,
    );
  });
});
