import { describe, expect, it } from 'vitest';
import { canTransition, evaluateSla, trackingProgress } from './orders';

describe('canTransition', () => {
  it('allows the documented order flow', () => {
    expect(canTransition('created', 'pending_payment')).toBe(true);
    expect(canTransition('paid', 'confirmed')).toBe(true);
    expect(canTransition('shipped', 'delivered')).toBe(true);
    expect(canTransition('delivered', 'completed')).toBe(true);
  });

  it('rejects skipping or reversing states', () => {
    expect(canTransition('created', 'shipped')).toBe(false);
    expect(canTransition('delivered', 'packing')).toBe(false);
    expect(canTransition('cancelled', 'paid')).toBe(false);
    expect(canTransition('refunded', 'paid')).toBe(false);
  });
});

describe('trackingProgress', () => {
  it('maps payment states to the first step', () => {
    expect(trackingProgress('pending_payment')).toBe(trackingProgress('created'));
  });

  it('grows monotonically and ends at 100', () => {
    expect(trackingProgress('shipped')).toBeGreaterThan(trackingProgress('confirmed'));
    expect(trackingProgress('completed')).toBe(100);
  });

  it('is zero for terminated orders', () => {
    expect(trackingProgress('cancelled')).toBe(0);
    expect(trackingProgress('refunded')).toBe(0);
  });
});

describe('evaluateSla', () => {
  const promisedAt = '2026-01-10T10:00:00.000Z';

  it('is not late when delivered before the promise', () => {
    expect(evaluateSla({ promisedAt, deliveredAt: '2026-01-10T09:00:00.000Z' })).toEqual({
      isLate: false,
      hoursLate: 0,
      compensation: 0,
    });
  });

  it('owes the fixed compensation once the promise passes', () => {
    const result = evaluateSla({ promisedAt, deliveredAt: '2026-01-10T13:30:00.000Z' });
    expect(result.isLate).toBe(true);
    expect(result.hoursLate).toBe(4);
    expect(result.compensation).toBe(5000);
  });

  it('uses now for undelivered orders and honours a custom amount', () => {
    const result = evaluateSla({
      promisedAt,
      now: new Date('2026-01-11T10:00:00.000Z'),
      compensationAmount: 10_000,
    });
    expect(result.isLate).toBe(true);
    expect(result.hoursLate).toBe(24);
    expect(result.compensation).toBe(10_000);
  });

  it('ignores orders without a promise time', () => {
    expect(evaluateSla({ promisedAt: null }).isLate).toBe(false);
  });
});
