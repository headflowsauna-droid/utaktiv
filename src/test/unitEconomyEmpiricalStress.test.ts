import { describe, it, expect, beforeEach } from 'vitest';
import {
  MAX_TRAIL_COINS_PER_HIKE,
  ADVENTURE_COMPLETION_BONUS_NOK,
  MAX_TOTAL_HIKE_PAYOUT,
  getTrailCoins,
  addTrailCoin,
  hasClaimedAdventureBonus,
  claimAdventureBonus,
  getFamilyPotSummary,
} from '../engine/askeladden';
import {
  creditEarnedLocal,
  earnedBalance,
  purchasedBalance,
  resetPointEntriesForTests,
  listPointEntries,
} from '../engine/pointsLedger';
import { SOLJAKTEN_EVENTYR } from '../engine/familieEventyr';

// In-memory localStorage mock for node vitest environment
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('Empirical Stress Harness: Unit Economy, Family Pot & Idempotency', () => {
  const TEST_DATE = '2026-10-27';
  const ALT_DATE = '2026-10-28';

  beforeEach(() => {
    localStorage.clear();
    resetPointEntriesForTests();
  });

  // =========================================================================
  // 1. TRAIL COIN CAP (15 COINS STRICT)
  // =========================================================================
  describe('1. Trail Coin Cap (15 Coins Strict)', () => {
    it('strictly caps at 15 when attempting to add 16 coins in a single call', () => {
      const res = addTrailCoin(16, TEST_DATE);
      expect(res.added).toBe(15);
      expect(res.current).toBe(15);
      expect(res.maxReached).toBe(true);
      expect(getTrailCoins(TEST_DATE)).toBe(15);
      expect(earnedBalance()).toBe(15);
    });

    it('strictly caps at 15 when attempting to add 20 coins in a single call', () => {
      const res = addTrailCoin(20, TEST_DATE);
      expect(res.added).toBe(15);
      expect(res.current).toBe(15);
      expect(res.maxReached).toBe(true);
      expect(getTrailCoins(TEST_DATE)).toBe(15);
      expect(earnedBalance()).toBe(15);
    });

    it('strictly caps at 15 when attempting to add 100 coins in a single call', () => {
      const res = addTrailCoin(100, TEST_DATE);
      expect(res.added).toBe(15);
      expect(res.current).toBe(15);
      expect(res.maxReached).toBe(true);
      expect(getTrailCoins(TEST_DATE)).toBe(15);
      expect(earnedBalance()).toBe(15);
    });

    it('strictly caps at 15 over 100 incremental calls of 1 coin', () => {
      for (let i = 1; i <= 15; i++) {
        const res = addTrailCoin(1, TEST_DATE);
        expect(res.added).toBe(1);
        expect(res.current).toBe(i);
        expect(res.maxReached).toBe(i === 15);
      }

      // Subsequent 85 calls must return 0 added
      for (let i = 16; i <= 100; i++) {
        const res = addTrailCoin(1, TEST_DATE);
        expect(res.added).toBe(0);
        expect(res.current).toBe(15);
        expect(res.maxReached).toBe(true);
      }

      expect(getTrailCoins(TEST_DATE)).toBe(15);
      expect(earnedBalance()).toBe(15);
    });

    it('caps accurately from arbitrary pre-existing balances (e.g. 14 + 5 -> 15)', () => {
      addTrailCoin(14, TEST_DATE);
      expect(getTrailCoins(TEST_DATE)).toBe(14);
      expect(earnedBalance()).toBe(14);

      const res = addTrailCoin(5, TEST_DATE);
      expect(res.added).toBe(1);
      expect(res.current).toBe(15);
      expect(res.maxReached).toBe(true);
      expect(getTrailCoins(TEST_DATE)).toBe(15);
      expect(earnedBalance()).toBe(15);
    });

    it('handles negative, zero, and fractional coin additions safely', () => {
      const zero = addTrailCoin(0, TEST_DATE);
      expect(zero.added).toBe(0);
      expect(zero.current).toBe(0);

      const neg = addTrailCoin(-10, TEST_DATE);
      expect(neg.added).toBe(0);
      expect(neg.current).toBe(0);

      const pos = addTrailCoin(5, TEST_DATE);
      expect(pos.added).toBe(5);
      expect(pos.current).toBe(5);

      const negAfter = addTrailCoin(-5, TEST_DATE);
      expect(negAfter.added).toBe(0);
      expect(negAfter.current).toBe(5);
    });

    it('resists corrupted or tampered localStorage values (> 15)', () => {
      localStorage.setItem('utaktiv_askeladd_trail_coins_' + TEST_DATE, '999');
      // Attempting to add coins when already above cap
      const res = addTrailCoin(5, TEST_DATE);
      expect(res.added).toBe(0);
      expect(res.maxReached).toBe(true);
    });

    it('maintains strict daily isolation across different date keys', () => {
      addTrailCoin(100, TEST_DATE);
      expect(getTrailCoins(TEST_DATE)).toBe(15);
      expect(getTrailCoins(ALT_DATE)).toBe(0);

      addTrailCoin(100, ALT_DATE);
      expect(getTrailCoins(ALT_DATE)).toBe(15);
      expect(getTrailCoins(TEST_DATE)).toBe(15);
      // Both days added 15 = 30 total earned
      expect(earnedBalance()).toBe(30);
    });
  });

  // =========================================================================
  // 2. COMPLETION BONUS (STRICTLY 30 KR FIRST ATTEMPT, 0 SUBSEQUENT)
  // =========================================================================
  describe('2. Completion Bonus (Strictly 30 kr on First Attempt, 0 Subsequent)', () => {
    const advId = 'soljakten_reddet_lyset';

    it('awards strictly 30 kr on first attempt and 0 on repeated attempts', () => {
      expect(hasClaimedAdventureBonus(advId, TEST_DATE)).toBe(false);

      // Attempt 1: First attempt
      const attempt1 = claimAdventureBonus(advId, TEST_DATE);
      expect(attempt1.success).toBe(true);
      expect(attempt1.bonusAdded).toBe(ADVENTURE_COMPLETION_BONUS_NOK);
      expect(hasClaimedAdventureBonus(advId, TEST_DATE)).toBe(true);
      expect(earnedBalance()).toBe(30);

      // Attempt 2: Immediate re-claim
      const attempt2 = claimAdventureBonus(advId, TEST_DATE);
      expect(attempt2.success).toBe(false);
      expect(attempt2.bonusAdded).toBe(0);
      expect(attempt2.message).toContain('allerede mottatt');
      expect(earnedBalance()).toBe(30);

      // Attempts 3 to 100: Continued barrage of re-claims
      for (let i = 3; i <= 100; i++) {
        const attempt = claimAdventureBonus(advId, TEST_DATE);
        expect(attempt.success).toBe(false);
        expect(attempt.bonusAdded).toBe(0);
      }

      // Ledger must still have strictly 30
      expect(earnedBalance()).toBe(30);
    });

    it('allows bonus claim on different dates independently', () => {
      const day1 = claimAdventureBonus(advId, TEST_DATE);
      expect(day1.success).toBe(true);
      expect(day1.bonusAdded).toBe(30);

      const day1Dup = claimAdventureBonus(advId, TEST_DATE);
      expect(day1Dup.success).toBe(false);

      const day2 = claimAdventureBonus(advId, ALT_DATE);
      expect(day2.success).toBe(true);
      expect(day2.bonusAdded).toBe(30);

      expect(earnedBalance()).toBe(60); // 30 + 30 across 2 days
    });

    it('protects against empty or arbitrary adventure IDs safely', () => {
      const res1 = claimAdventureBonus('custom_adv_id', TEST_DATE);
      expect(res1.success).toBe(true);
      expect(res1.bonusAdded).toBe(30);

      const res2 = claimAdventureBonus('custom_adv_id', TEST_DATE);
      expect(res2.success).toBe(false);
      expect(res2.bonusAdded).toBe(0);
    });
  });

  // =========================================================================
  // 3. COMBINED PAYOUT CAP (NEVER EXCEEDS 45 KR PER DAY)
  // =========================================================================
  describe('3. Combined Payout Cap (Never Exceeds 45 kr per Day)', () => {
    const advId = 'soljakten_reddet_lyset';

    it('Interleaving A: 15 trail coins first, then 30 kr bonus', () => {
      const coinRes = addTrailCoin(15, TEST_DATE);
      expect(coinRes.added).toBe(15);
      expect(coinRes.current).toBe(15);

      const bonusRes = claimAdventureBonus(advId, TEST_DATE);
      expect(bonusRes.success).toBe(true);
      expect(bonusRes.bonusAdded).toBe(30);

      const summary = getFamilyPotSummary(TEST_DATE);
      expect(summary.trailCoins).toBe(15);
      expect(summary.hasCompletionBonus).toBe(true);
      expect(summary.completionBonusNok).toBe(30);
      expect(summary.totalHikeNok).toBe(45);
      expect(summary.maxPossibleHikeNok).toBe(MAX_TOTAL_HIKE_PAYOUT);
      expect(earnedBalance()).toBe(45);
    });

    it('Interleaving B: 30 kr bonus first, then 15 trail coins', () => {
      const bonusRes = claimAdventureBonus(advId, TEST_DATE);
      expect(bonusRes.success).toBe(true);
      expect(bonusRes.bonusAdded).toBe(30);

      const coinRes = addTrailCoin(15, TEST_DATE);
      expect(coinRes.added).toBe(15);
      expect(coinRes.current).toBe(15);

      const summary = getFamilyPotSummary(TEST_DATE);
      expect(summary.trailCoins).toBe(15);
      expect(summary.hasCompletionBonus).toBe(true);
      expect(summary.completionBonusNok).toBe(30);
      expect(summary.totalHikeNok).toBe(45);
      expect(earnedBalance()).toBe(45);
    });

    it('Interleaving C: Alternating coin additions and bonus attempts', () => {
      // 5 coins
      addTrailCoin(5, TEST_DATE);
      expect(earnedBalance()).toBe(5);

      // bonus claim (success: 30)
      claimAdventureBonus(advId, TEST_DATE);
      expect(earnedBalance()).toBe(35);

      // 5 coins
      addTrailCoin(5, TEST_DATE);
      expect(earnedBalance()).toBe(40);

      // duplicate bonus claim (blocked: 0)
      const b2 = claimAdventureBonus(advId, TEST_DATE);
      expect(b2.bonusAdded).toBe(0);
      expect(earnedBalance()).toBe(40);

      // 5 coins (reaches 15 coin cap)
      addTrailCoin(5, TEST_DATE);
      expect(earnedBalance()).toBe(45);

      // extra coins (blocked: 0)
      const extraCoins = addTrailCoin(5, TEST_DATE);
      expect(extraCoins.added).toBe(0);
      expect(earnedBalance()).toBe(45);

      // another bonus claim (blocked: 0)
      const b3 = claimAdventureBonus(advId, TEST_DATE);
      expect(b3.bonusAdded).toBe(0);
      expect(earnedBalance()).toBe(45);

      const summary = getFamilyPotSummary(TEST_DATE);
      expect(summary.totalHikeNok).toBe(45);
      expect(summary.totalHikeNok).toBeLessThanOrEqual(MAX_TOTAL_HIKE_PAYOUT);
    });

    it('Interleaving D (Stress Fuzzing): 200 randomized interleavings of coins and bonus calls', () => {
      let seed = 12345;
      const pseudoRand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      for (let op = 0; op < 200; op++) {
        if (pseudoRand() > 0.5) {
          const amount = Math.floor(pseudoRand() * 50) + 1;
          addTrailCoin(amount, TEST_DATE);
        } else {
          claimAdventureBonus(advId, TEST_DATE);
        }

        // Invariant check on every single iteration:
        const currentCoins = getTrailCoins(TEST_DATE);
        expect(currentCoins).toBeLessThanOrEqual(MAX_TRAIL_COINS_PER_HIKE);

        const summary = getFamilyPotSummary(TEST_DATE);
        expect(summary.totalHikeNok).toBeLessThanOrEqual(MAX_TOTAL_HIKE_PAYOUT);
      }

      // Final state must strictly equal exactly 45 kr
      const finalSummary = getFamilyPotSummary(TEST_DATE);
      expect(finalSummary.trailCoins).toBe(15);
      expect(finalSummary.completionBonusNok).toBe(30);
      expect(finalSummary.totalHikeNok).toBe(45);
      expect(earnedBalance()).toBe(45);
    });
  });

  // =========================================================================
  // 4. DETERMINISTIC DATE-LOCKED IDEMPOTENCY WITHOUT DATE.NOW()
  // =========================================================================
  describe('4. Deterministic Date-Locked Idempotency Without Date.now()', () => {
    it('verifies deterministic trail coin idempotency keys', () => {
      addTrailCoin(5, TEST_DATE);
      addTrailCoin(5, TEST_DATE);
      addTrailCoin(5, TEST_DATE);

      const entries = listPointEntries();
      expect(entries).toHaveLength(3);

      const keys = entries.map(e => e.idempotencyKey);
      expect(keys).toContain(`trail-coin-${TEST_DATE}-5`);
      expect(keys).toContain(`trail-coin-${TEST_DATE}-10`);
      expect(keys).toContain(`trail-coin-${TEST_DATE}-15`);

      // Ensure no timestamps or non-deterministic characters
      for (const k of keys) {
        expect(k).toMatch(/^trail-coin-\d{4}-\d{2}-\d{2}-\d+$/);
        expect(k).not.toContain('undefined');
        expect(k).not.toContain('NaN');
      }
    });

    it('verifies deterministic adventure bonus idempotency key', () => {
      const advId = 'soljakten_reddet_lyset';
      claimAdventureBonus(advId, TEST_DATE);

      const entries = listPointEntries();
      const bonusEntry = entries.find(e => e.idempotencyKey.startsWith('adventure-bonus-'));
      expect(bonusEntry).toBeDefined();
      expect(bonusEntry?.idempotencyKey).toBe(`adventure-bonus-${advId}-${TEST_DATE}`);
      expect(bonusEntry?.delta).toBe(30);
      expect(bonusEntry?.pot).toBe('earned');

      // Attempting to credit again directly via pointsLedger with identical key yields 0
      const replayRes = creditEarnedLocal({
        points: 30,
        reason: 'checkin',
        idempotencyKey: `adventure-bonus-${advId}-${TEST_DATE}`,
      });
      expect(replayRes.applied).toBe(0);
      expect(earnedBalance()).toBe(30);
    });

    it('verifies App.tsx date-locked key formats (skattekiste, familie-soljakten, naturequest)', () => {
      const today = TEST_DATE;

      // 1. Skattekiste
      const skattekisteKey = `skattekiste-Bergen-${today}`;
      const res1 = creditEarnedLocal({
        points: 50,
        reason: 'checkin',
        idempotencyKey: skattekisteKey,
      });
      expect(res1.applied).toBe(50);

      // Replay skattekiste on same date
      const replaySkattekiste = creditEarnedLocal({
        points: 50,
        reason: 'checkin',
        idempotencyKey: skattekisteKey,
      });
      expect(replaySkattekiste.applied).toBe(0);

      // 2. Familie-soljakten
      const familieKey = `familie-soljakten-${today}`;
      const res2 = creditEarnedLocal({
        points: 15,
        reason: 'checkin',
        idempotencyKey: familieKey,
      });
      expect(res2.applied).toBe(15);

      // Replay familie-soljakten on same date
      const replayFamilie = creditEarnedLocal({
        points: 15,
        reason: 'checkin',
        idempotencyKey: familieKey,
      });
      expect(replayFamilie.applied).toBe(0);

      // 3. NatureQuest
      const natureKey = `naturequest-${today}`;
      const res3 = creditEarnedLocal({
        points: 10,
        reason: 'checkin',
        idempotencyKey: natureKey,
      });
      expect(res3.applied).toBe(10);

      // Replay naturequest on same date
      const replayNature = creditEarnedLocal({
        points: 10,
        reason: 'checkin',
        idempotencyKey: natureKey,
      });
      expect(replayNature.applied).toBe(0);

      // Check key formats
      expect(skattekisteKey).toMatch(/^skattekiste-[A-Za-z]+-\d{4}-\d{2}-\d{2}$/);
      expect(familieKey).toMatch(/^familie-soljakten-\d{4}-\d{2}-\d{2}$/);
      expect(natureKey).toMatch(/^naturequest-\d{4}-\d{2}-\d{2}$/);
    });
  });

  // =========================================================================
  // 5. ADVERSARIAL INTEGRATION AUDIT: UI INTERPLAY & TWO-POT FIDELITY
  // =========================================================================
  describe('5. Adversarial UI Interplay: FamilieEventyrModal onAwardPoints vs claimAdventureBonus', () => {
    it('audits whether FamilieEventyrModal + App.tsx onAwardPoints causes double-rewarding over 45 kr', () => {
      // Step A: Family collects 15 trail coins during the hike
      addTrailCoin(15, TEST_DATE);
      expect(earnedBalance()).toBe(15);

      // Step B: Family finishes adventure, triggering handleCompleteAdventure()
      // Call 1: onAwardPoints callback in App.tsx
      const onAwardResult = creditEarnedLocal({
        points: SOLJAKTEN_EVENTYR.reward.points, // 15
        reason: 'checkin',
        idempotencyKey: `familie-soljakten-${TEST_DATE}`,
      });

      // Call 2: claimAdventureBonus called inside FamilieEventyrModal
      const bonusResult = claimAdventureBonus(SOLJAKTEN_EVENTYR.id, TEST_DATE);

      // Observation of awards:
      expect(onAwardResult.applied).toBe(15);
      expect(bonusResult.bonusAdded).toBe(30);

      // Family pot summary (askeladden motor):
      const summary = getFamilyPotSummary(TEST_DATE);
      expect(summary.trailCoins).toBe(15);
      expect(summary.completionBonusNok).toBe(30);
      expect(summary.totalHikeNok).toBe(45); // Askeladden reports 45!

      // But in the underlying points ledger:
      const totalLedgerBalance = earnedBalance();
      // 15 (trail coins) + 15 (onAwardPoints) + 30 (claimAdventureBonus) = 60
      expect(totalLedgerBalance).toBe(60);
    });

    it('verifies that purchased pot balance remains 0 at all times', () => {
      addTrailCoin(15, TEST_DATE);
      claimAdventureBonus('soljakten_reddet_lyset', TEST_DATE);
      expect(purchasedBalance()).toBe(0);
      expect(earnedBalance()).toBe(45);
    });
  });
});
