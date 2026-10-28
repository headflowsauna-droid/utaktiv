import { beforeEach, describe, expect, it } from 'vitest';
import { adjustUserPointsBalance, getUserPointsBalance } from '../engine/gamification';
import {
  creditEarnedLocal,
  earnedBalance,
  purchasedBalance,
  resetPointEntriesForTests,
  seedPurchasedForTests,
  spendPurchasedLocal,
} from '../engine/pointsLedger';

describe('Poengpotter', () => {
  beforeEach(() => {
    resetPointEntriesForTests();
  });

  it('takker dagslys på 40 og ignorerer samme nøkkel', () => {
    const first = creditEarnedLocal({ points: 100, reason: 'daylight', idempotencyKey: 'lys-1' });
    const second = creditEarnedLocal({ points: 100, reason: 'daylight', idempotencyKey: 'lys-1' });

    expect(first.applied).toBe(40);
    expect(second.applied).toBe(0);
    expect(earnedBalance()).toBe(40);
    expect(purchasedBalance()).toBe(0);
  });

  it('stopper opptjente poeng på 300 samme dag', () => {
    expect(creditEarnedLocal({ points: 80, reason: 'chore', idempotencyKey: 'c1' }).applied).toBe(80);
    expect(creditEarnedLocal({ points: 80, reason: 'chore', idempotencyKey: 'c2' }).applied).toBe(80);
    expect(creditEarnedLocal({ points: 80, reason: 'chore', idempotencyKey: 'c3' }).applied).toBe(80);
    expect(creditEarnedLocal({ points: 80, reason: 'chore', idempotencyKey: 'c4' }).applied).toBe(60);
    expect(creditEarnedLocal({ points: 80, reason: 'chore', idempotencyKey: 'c5' }).applied).toBe(0);
    expect(earnedBalance()).toBe(300);
  });

  it('trekker bare kjøpte poeng og gjentar ikke samme nøkkel', () => {
    expect(spendPurchasedLocal(10, 'tom').ok).toBe(false);
    expect(spendPurchasedLocal(10, 'tom').error).toBe('Du har 0 kjøpte poeng.');

    seedPurchasedForTests(500);
    const spent = spendPurchasedLocal(200, 'billett-1');
    expect(spent.ok).toBe(true);
    expect(spent.balance).toBe(300);
    expect(spendPurchasedLocal(200, 'billett-1').balance).toBe(300);
    expect(spendPurchasedLocal(400, 'for-mye').ok).toBe(false);
    expect(purchasedBalance()).toBe(300);
  });

  it('lar ikke et positivt justeringstall lage kjøpte poeng', () => {
    seedPurchasedForTests(100);
    expect(adjustUserPointsBalance(50)).toBe(100);
    expect(getUserPointsBalance()).toBe(100);
    expect(adjustUserPointsBalance(-40)).toBe(60);
  });
});
