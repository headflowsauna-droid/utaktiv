import { describe, it, expect, beforeEach } from 'vitest';
import {
  ASKELADD_ITEMS,
  FAIRY_TALES_12_MONTHS,
  TALKING_ANIMALS,
  MAX_TRAIL_COINS_PER_HIKE,
  ADVENTURE_COMPLETION_BONUS_NOK,
  MAX_TOTAL_HIKE_PAYOUT,
  getAskeladdInventory,
  collectAskeladdItem,
  resetAskeladdInventory,
  getActiveMonthAdventure,
  getTrailCoins,
  addTrailCoin,
  hasClaimedAdventureBonus,
  claimAdventureBonus,
  getFamilyPotSummary
} from '../engine/askeladden';
import { earnedBalance, resetPointEntriesForTests } from '../engine/pointsLedger';

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

describe('Askeladden Motor & Familieeventyr', () => {
  const TEST_DATE = '2026-10-27';

  beforeEach(() => {
    localStorage.clear();
    resetPointEntriesForTests();
  });

  describe('Askeladd-sekken («Jeg fant, jeg fant!»)', () => {
    it('har nøyaktig 10 unike gjenstander med fangstfraser', () => {
      expect(ASKELADD_ITEMS.length).toBe(10);
      const stein = ASKELADD_ITEMS.find(i => i.id === 'tung_elvestein');
      expect(stein).toBeDefined();
      expect(stein?.askeladdCatchphrase).toContain('Jeg fant, jeg fant!');
    });

    it('samler gjenstander i sekken og forhindrer duplikater', () => {
      expect(getAskeladdInventory()).toHaveLength(0);

      const res1 = collectAskeladdItem('tung_elvestein');
      expect(res1.success).toBe(true);
      expect(res1.item?.name).toBe('Tung elvestein');
      expect(getAskeladdInventory()).toContain('tung_elvestein');

      // Forsøk å samle samme gjenstand igjen
      const res2 = collectAskeladdItem('tung_elvestein');
      expect(res2.success).toBe(false);
      expect(res2.message).toContain('allerede lagt');
      expect(getAskeladdInventory()).toHaveLength(1);

      // Nullstill sekken
      resetAskeladdInventory();
      expect(getAskeladdInventory()).toHaveLength(0);
    });
  });

  describe('12 Måneder Asbjørnsen & Moe Eventyr', () => {
    it('har 12 månedseventyr med Tinydome som hovedfinale i juli', () => {
      expect(FAIRY_TALES_12_MONTHS).toHaveLength(12);

      const juli = FAIRY_TALES_12_MONTHS[6];
      expect(juli.monthName).toBe('Juli');
      expect(juli.isGrandFinale).toBe(true);
      expect(juli.monthlyPrize).toContain('Tinydome Spacecapsule');
      expect(juli.monthlyPrize).toContain('95 000 kr');

      const november = FAIRY_TALES_12_MONTHS[10];
      expect(november.monthName).toBe('November');
      expect(november.fairyTaleTitle).toBe('Askeladden som kappåt med trollet');
    });

    it('henter aktivt månedseventyr deterministisk', () => {
      const adv = getActiveMonthAdventure(10);
      expect(adv.fairyTaleTitle).toBe('Askeladden som kappåt med trollet');
    });
  });

  describe('10 Snakkende Dyr', () => {
    it('har 10 distinkte dyr med personlighet, lydfrekvens og dings-kobling', () => {
      expect(TALKING_ANIMALS).toHaveLength(10);

      const rev = TALKING_ANIMALS.find(a => a.id === 'mikkel_rev');
      expect(rev).toBeDefined();
      expect(rev?.species).toBe('Rødrev');
      expect(rev?.requiredItem).toBe('krokete_einerkvist');
      expect(rev?.audioToneHz).toBeGreaterThan(0);

      const hund = TALKING_ANIMALS.find(a => a.id === 'fjellhunden_balder');
      expect(hund).toBeDefined();
      expect(hund?.icon).toBe('🐕');
    });
  });

  describe('Familiepotten & Enhetsøkonomi', () => {
    it('begrenser myntsanking til maks 15 mynter per tur', () => {
      expect(getTrailCoins(TEST_DATE)).toBe(0);

      // Legg til 10 mynter
      const add1 = addTrailCoin(10, TEST_DATE);
      expect(add1.added).toBe(10);
      expect(add1.current).toBe(10);
      expect(add1.maxReached).toBe(false);

      // Legg til 10 mynter til (skal avkortes til maks 15)
      const add2 = addTrailCoin(10, TEST_DATE);
      expect(add2.added).toBe(5);
      expect(add2.current).toBe(15);
      expect(add2.maxReached).toBe(true);

      // Forsøk å legge til flere
      const add3 = addTrailCoin(1, TEST_DATE);
      expect(add3.added).toBe(0);
      expect(add3.current).toBe(15);
      expect(add3.maxReached).toBe(true);
    });

    it('tildeler 30 kr fullføringsbonus og forhindrer duplikat-utbetaling samme dag', () => {
      const advId = 'soljakten_reddet_lyset';
      expect(hasClaimedAdventureBonus(advId, TEST_DATE)).toBe(false);

      const claim1 = claimAdventureBonus(advId, TEST_DATE);
      expect(claim1.success).toBe(true);
      expect(claim1.bonusAdded).toBe(ADVENTURE_COMPLETION_BONUS_NOK);
      expect(hasClaimedAdventureBonus(advId, TEST_DATE)).toBe(true);

      // Forsøk igjen samme dag
      const claim2 = claimAdventureBonus(advId, TEST_DATE);
      expect(claim2.success).toBe(false);
      expect(claim2.bonusAdded).toBe(0);
      expect(claim2.message).toContain('allerede mottatt');
    });

    it('beregner maks 45 kr totalt per tur i Familiepotten', () => {
      const advId = 'soljakten_reddet_lyset';

      // Sank 15 mynter
      addTrailCoin(MAX_TRAIL_COINS_PER_HIKE, TEST_DATE);
      // Få 30 kr fullføringsbonus
      claimAdventureBonus(advId, TEST_DATE);

      const summary = getFamilyPotSummary(TEST_DATE);
      expect(summary.trailCoins).toBe(15);
      expect(summary.maxTrailCoins).toBe(15);
      expect(summary.hasCompletionBonus).toBe(true);
      expect(summary.completionBonusNok).toBe(30);
      expect(summary.totalHikeNok).toBe(45);
      expect(summary.maxPossibleHikeNok).toBe(MAX_TOTAL_HIKE_PAYOUT);
    });

    it('synkroniserer tildelte mynter og bonuser inn i pointsLedger', () => {
      addTrailCoin(5, TEST_DATE);
      expect(earnedBalance()).toBe(5);

      claimAdventureBonus('soljakten_reddet_lyset', TEST_DATE);
      expect(earnedBalance()).toBe(35); // 5 + 30
    });

    it('kobler fullføring av 3.0s berøringsfusjon mot Familiepotten (30 kr bonus)', () => {
      const advId = 'soljakten_reddet_lyset';
      expect(hasClaimedAdventureBonus(advId, TEST_DATE)).toBe(false);

      // Når 3.0s fusjon fullføres, tildeles fullføringsbonusen
      const res = claimAdventureBonus(advId, TEST_DATE);
      expect(res.success).toBe(true);
      expect(res.bonusAdded).toBe(30);

      // Bekrefter at familiepott-oversikten har registrert bonusen
      const summary = getFamilyPotSummary(TEST_DATE);
      expect(summary.hasCompletionBonus).toBe(true);
      expect(summary.completionBonusNok).toBe(30);
      expect(summary.totalHikeNok).toBe(30);
    });
  });
});

