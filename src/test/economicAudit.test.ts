import { describe, it, expect, beforeEach } from 'vitest';
import { creditEarnedLocal, earnedBalance, purchasedBalance, resetPointEntriesForTests } from '../engine/pointsLedger';
import { collectARDrop, BERGEN_AR_DROPS } from '../engine/arDrops';

if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; },
  };
}

describe('Økonomisk Revisjon for Skattejakten og Familieeventyr', () => {
  beforeEach(() => {
    resetPointEntriesForTests();
    localStorage.clear();
  });

  it('avslører at Skattekisten (500 poeng) blir avkortet til 50 poeng på grunn av eventCap', () => {
    // Skattekisten kaller grantEarned({ points: 500, reason: "checkin", idempotencyKey: "skattekiste-Bergen-" + Date.now() })
    const res = creditEarnedLocal({
      points: 500,
      reason: 'checkin',
      idempotencyKey: `skattekiste-Bergen-${Date.now()}`
    });

    // Forventer vi 500? Koden gir bare 50!
    expect(res.applied).toBe(50);
    expect(earnedBalance()).toBe(50);
  });

  it('avslører at Date.now() i idempotencyKey tillater uendelig poengsanking inntil dagstaket', () => {
    // Brukeren spiller Familieeventyret 20 ganger
    for (let i = 0; i < 20; i++) {
      creditEarnedLocal({
        points: 15,
        reason: 'checkin',
        idempotencyKey: `familie-eventyr-${Date.now() + i}` // Simulerer nye kall med Date.now()
      });
    }

    // Fordi nøkkelen endrer seg for hvert kall, blir alle 20 forsøk godkjent (20 * 15 = 300)
    expect(earnedBalance()).toBe(300);
  });

  it('avslører at opptjente poeng aldri øker kjøpte poeng (purchasedBalance)', () => {
    creditEarnedLocal({
      points: 15,
      reason: 'checkin',
      idempotencyKey: 'familie-1'
    });

    expect(earnedBalance()).toBe(15);
    // Brukerens synlige hovedsaldo i WalletModal / kjøp er 0
    expect(purchasedBalance()).toBe(0);
  });

  it('verifiserer at AR-motor nå er synkronisert med pointsLedger', () => {
    const coinDrop = BERGEN_AR_DROPS.find(d => d.id === 'drop_floyen_sving')!;
    const res = collectARDrop(coinDrop, coinDrop.lat, coinDrop.lng, false);
    
    expect(res.success).toBe(true);
    expect(res.pointsAdded).toBe(2);

    // AR motor skrev til sol_earned_balance
    expect(localStorage.getItem('sol_earned_balance')).toBe('2');

    // Og pointsLedger er nå 100 % synkronisert med de opptjente poengene:
    expect(earnedBalance()).toBe(2);
    expect(purchasedBalance()).toBe(0);
  });
});
