import { describe, expect, it } from 'vitest';
import { getUserPointsBalance } from '../engine/gamification';
import { isCloudEnabled, recordStripeCreditLocal } from '../engine/cloudSync';

describe('Skysynk og lokal Stripe-kreditering', () => {
  it('gjenspeiler om Supabase-miljøet er aktivt', () => {
    expect(typeof isCloudEnabled()).toBe('boolean');
    expect(isCloudEnabled()).toBe(true);
  });

  it('krediterer ikke kjøpte poeng fra nettleseren', () => {
    const sessionId = `cs_test_${Date.now()}`;
    const before = getUserPointsBalance();
    const first = recordStripeCreditLocal(sessionId, 'topup-starter');
    const second = recordStripeCreditLocal(sessionId, 'topup-starter');

    expect(first.applied).toBe(false);
    expect(second.applied).toBe(false);
    expect(getUserPointsBalance()).toBe(before);
    expect(recordStripeCreditLocal(sessionId, 'finnes-ikke').applied).toBe(false);
  });
});
