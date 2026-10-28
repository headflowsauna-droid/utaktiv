import { describe, it, expect, beforeEach } from 'vitest';
import {
  SOLJAKTEN_EVENTYR,
  getAdventureProgress,
  saveAdventureProgress,
  resetAdventure,
  AdventureProgress,
  TOUCH_FUSION_DURATION_MS,
  TOUCH_FUSION_REQUIRED_TOUCHES,
  evaluateTouchFusion
} from '../engine/familieEventyr';

// In-memory localStorage polyfill for Node.js Vitest environment
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

describe('Utaktiv Familieeventyr Motor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('har definert Soljakten med 3 unike samarbeidstrinn', () => {
    expect(SOLJAKTEN_EVENTYR.missions.length).toBe(3);
    expect(SOLJAKTEN_EVENTYR.reward.points).toBe(15);
    expect(SOLJAKTEN_EVENTYR.missions[0].roleResponsible).toBe('child');
    expect(SOLJAKTEN_EVENTYR.missions[1].roleResponsible).toBe('adult');
    expect(SOLJAKTEN_EVENTYR.missions[2].roleResponsible).toBe('together');
  });

  it('passer på at Oppdrag 1 (Barnet) har riktig hemmelig fasit', () => {
    const m1 = SOLJAKTEN_EVENTYR.missions[0];
    const correctOption = m1.options?.find(o => o.isCorrect);
    expect(correctOption).toBeDefined();
    expect(correctOption?.id).toBe('eikeblad');
  });

  it('passer på at Oppdrag 2 (Voksen) krever barnets hemmelighet', () => {
    const m2 = SOLJAKTEN_EVENTYR.missions[1];
    expect(m2.requiresChildSecret).toBe(true);
    const correctOption = m2.options?.find(o => o.isCorrect);
    expect(correctOption?.id).toBe('nokkel_trekant');
  });

  it('lagrer, henter og tilbakestiller familiens fremgang i eventyret', () => {
    const advId = SOLJAKTEN_EVENTYR.id;
    const initialProg = getAdventureProgress(advId);
    expect(initialProg.currentStep).toBe(1);
    expect(initialProg.isCompleted).toBe(false);

    const updatedProg: AdventureProgress = {
      adventureId: advId,
      currentStep: 2,
      childSecretFound: 'eikeblad',
      isCompleted: false
    };
    saveAdventureProgress(updatedProg);

    const fetched = getAdventureProgress(advId);
    expect(fetched.currentStep).toBe(2);
    expect(fetched.childSecretFound).toBe('eikeblad');

    resetAdventure(advId);
    const afterReset = getAdventureProgress(advId);
    expect(afterReset.currentStep).toBe(1);
    expect(afterReset.childSecretFound).toBeUndefined();
  });

  describe('Felles 3.0-sekunders berøringsfusjon & multitouch (Krav R1)', () => {
    it('konfigurerer Oppdrag 3 til nøyaktig 3.0 sekunder (3000 ms) holdetid', () => {
      const m3 = SOLJAKTEN_EVENTYR.missions[2];
      expect(m3.step).toBe(3);
      expect(m3.roleResponsible).toBe('together');
      expect(m3.options?.[0].label).toContain('3 sekunder');
      expect(TOUCH_FUSION_DURATION_MS).toBe(3000);
      expect(TOUCH_FUSION_REQUIRED_TOUCHES).toBe(2);
    });

    it('krever multi-touch: 1 berøring avvises, 2 berøringer godkjennes', () => {
      // 1 finger (kun én person)
      const single = evaluateTouchFusion(3000, 1);
      expect(single.hasMultiTouch).toBe(false);
      expect(single.isCompleted).toBe(false);

      // 2 fingre (barnet og den voksne sammen)
      const dual = evaluateTouchFusion(3000, 2);
      expect(dual.hasMultiTouch).toBe(true);
      expect(dual.isCompleted).toBe(true);
      expect(dual.progressPercent).toBe(100);
    });

    it('beregner progress presist og krever fulle 3000 ms før fullføring', () => {
      // 0 ms -> 0 %
      expect(evaluateTouchFusion(0, 2).progressPercent).toBe(0);
      expect(evaluateTouchFusion(0, 2).isCompleted).toBe(false);

      // 1500 ms (halvveis) -> 50 %
      expect(evaluateTouchFusion(1500, 2).progressPercent).toBe(50);
      expect(evaluateTouchFusion(1500, 2).isCompleted).toBe(false);

      // 2000 ms (gammel 2.0s grense) -> 67 % og IKKE fullført
      expect(evaluateTouchFusion(2000, 2).progressPercent).toBe(67);
      expect(evaluateTouchFusion(2000, 2).isCompleted).toBe(false);

      // 2900 ms -> 97 % og fremdeles ikke fullført
      expect(evaluateTouchFusion(2900, 2).progressPercent).toBe(97);
      expect(evaluateTouchFusion(2900, 2).isCompleted).toBe(false);

      // 3000 ms -> 100 % og fullført seier
      expect(evaluateTouchFusion(3000, 2).progressPercent).toBe(100);
      expect(evaluateTouchFusion(3000, 2).isCompleted).toBe(true);
    });
  });
});
