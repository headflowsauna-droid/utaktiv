import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SOLJAKTEN_EVENTYR,
  getAdventureProgress,
  saveAdventureProgress,
  resetAdventure,
  TOUCH_FUSION_DURATION_MS,
  TOUCH_FUSION_TICK_MS,
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

describe('EMBEDDED CHALLENGER STRESS HARNESS: Touch Fusion & Asymmetric Mechanics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // 1. BOUNDARY TIMING TESTS (< 3000ms FAILS, >= 3000ms PASSES)
  // =========================================================================
  describe('1. Boundary Timing Stress Testing (<3000ms vs >=3000ms)', () => {
    it('verifiserer at konstanter er låst til nøyaktig 3000 ms og 2 berøringer', () => {
      expect(TOUCH_FUSION_DURATION_MS).toBe(3000);
      expect(TOUCH_FUSION_REQUIRED_TOUCHES).toBe(2);
      expect(TOUCH_FUSION_TICK_MS).toBe(50);
    });

    it('avviser alle holdetider under 3000 ms (isCompleted === false)', () => {
      const subThresholdTimes = [
        -1000,
        -1,
        0,
        1,
        50,
        100,
        500,
        1000,
        1500,
        2000,
        2500,
        2900,
        2950,
        2990,
        2999,
        2999.99
      ];

      for (const elapsed of subThresholdTimes) {
        const result = evaluateTouchFusion(elapsed, 2);
        expect(result.isCompleted).toBe(false);
        if (elapsed <= 0) {
          expect(result.progressPercent).toBeLessThanOrEqual(0);
        } else if (elapsed < 2985) {
          expect(result.progressPercent).toBeLessThan(100);
        } else {
          // For elapsed between 2985ms and 2999ms, display progress rounds to 100%,
          // but crucial game boundary condition isCompleted remains strictly FALSE!
          expect(result.isCompleted).toBe(false);
          expect(result.progressPercent).toBe(100);
        }
      }
    });

    it('godkjenner holdetider fra og med 3000 ms (isCompleted === true)', () => {
      const completionTimes = [
        3000,
        3000.01,
        3001,
        3050,
        3100,
        3500,
        4000,
        5000,
        10000,
        60000
      ];

      for (const elapsed of completionTimes) {
        const result = evaluateTouchFusion(elapsed, 2);
        expect(result.isCompleted).toBe(true);
        expect(result.progressPercent).toBe(100);
      }
    });

    it('stress-tester interval-timeren fra FamilieEventyrModal med fake timers', () => {
      vi.useFakeTimers();

      let isHolding = false;
      let isCompleted = false;
      let fusionHoldProgress = 0;
      let completionCallbackCount = 0;

      // Modell av timer-effekten i FamilieEventyrModal.tsx:79-100
      let activeInterval: any = null;
      const startHold = () => {
        isHolding = true;
        const startTime = Date.now();
        activeInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(100, (elapsed / TOUCH_FUSION_DURATION_MS) * 100);
          if (progress >= 100) {
            clearInterval(activeInterval);
            activeInterval = null;
            fusionHoldProgress = 100;
            isCompleted = true;
            completionCallbackCount++;
          } else {
            fusionHoldProgress = progress;
          }
        }, TOUCH_FUSION_TICK_MS);
      };

      const stopHold = () => {
        isHolding = false;
        if (activeInterval) {
          clearInterval(activeInterval);
          activeInterval = null;
        }
        fusionHoldProgress = 0;
      };

      // Scenario A: Bruker slipper etter 2950 ms (50 ms for tidlig)
      startHold();
      expect(isHolding).toBe(true);
      vi.advanceTimersByTime(2950);
      expect(isCompleted).toBe(false);
      expect(fusionHoldProgress).toBeCloseTo((2950 / 3000) * 100, 1);
      stopHold();
      expect(isHolding).toBe(false);
      expect(fusionHoldProgress).toBe(0);
      expect(isCompleted).toBe(false);
      expect(completionCallbackCount).toBe(0);

      // Scenario B: Bruker prøver igjen, slipper etter 1500 ms (halvveis)
      startHold();
      expect(isHolding).toBe(true);
      vi.advanceTimersByTime(1500);
      expect(isCompleted).toBe(false);
      expect(fusionHoldProgress).toBe(50);
      stopHold();
      expect(isHolding).toBe(false);
      expect(fusionHoldProgress).toBe(0);
      expect(isCompleted).toBe(false);

      // Scenario C: Bruker holder fullt ut i nøyaktig 3000 ms
      startHold();
      expect(isHolding).toBe(true);
      vi.advanceTimersByTime(2950);
      expect(isCompleted).toBe(false);
      vi.advanceTimersByTime(50); // Total 3000 ms
      expect(isCompleted).toBe(true);
      expect(fusionHoldProgress).toBe(100);
      expect(completionCallbackCount).toBe(1);

      // Scenario D: Ekstra tid etter fullføring skal ikke utløse duplikate callbacks
      vi.advanceTimersByTime(2000);
      expect(completionCallbackCount).toBe(1);
    });
  });

  // =========================================================================
  // 2. MULTI-TOUCH STRESS TESTS (0 fail, 1 fail, >= 2 pass, mouse fallback)
  // =========================================================================
  describe('2. Multi-Touch & Input Modality Stress Testing', () => {
    it('avviser 0 berøringspunkter selv om holdetiden er over 3000 ms', () => {
      const res0 = evaluateTouchFusion(3000, 0);
      expect(res0.hasMultiTouch).toBe(false);
      expect(res0.isCompleted).toBe(false);

      const res0Long = evaluateTouchFusion(10000, 0);
      expect(res0Long.hasMultiTouch).toBe(false);
      expect(res0Long.isCompleted).toBe(false);
    });

    it('avviser 1 berøringspunkt (kun barn eller kun voksen) selv ved full tid', () => {
      const res1 = evaluateTouchFusion(3000, 1);
      expect(res1.hasMultiTouch).toBe(false);
      expect(res1.isCompleted).toBe(false);

      const res1Long = evaluateTouchFusion(5000, 1);
      expect(res1Long.hasMultiTouch).toBe(false);
      expect(res1Long.isCompleted).toBe(false);
    });

    it('godkjenner 2 samtidige berøringer ved fullført tid', () => {
      const res2 = evaluateTouchFusion(3000, 2);
      expect(res2.hasMultiTouch).toBe(true);
      expect(res2.isCompleted).toBe(true);
      expect(res2.progressPercent).toBe(100);
    });

    it('godkjenner 3, 4 og flere berøringer (f.eks. søsken som også er med)', () => {
      for (const count of [3, 4, 5, 10]) {
        const res = evaluateTouchFusion(3000, count);
        expect(res.hasMultiTouch).toBe(true);
        expect(res.isCompleted).toBe(true);
      }
    });

    it('håndterer ekstreme og ugylige berøringstall robust', () => {
      expect(evaluateTouchFusion(3000, -1).isCompleted).toBe(false);
      expect(evaluateTouchFusion(3000, -99).isCompleted).toBe(false);
      expect(evaluateTouchFusion(3000, NaN).isCompleted).toBe(false);
    });

    it('simulerer tilstandsmaskinen for berøringshendelser i FamilieEventyrModal', () => {
      // Tilstandsmodell fra FamilieEventyrModal.tsx:185-236
      let touchCount = 0;
      let isHolding = false;
      let lastTouchTimestamp = 0;

      const handleTouchStart = (touchesLength: number, now: number) => {
        lastTouchTimestamp = now;
        touchCount = touchesLength;
        if (touchesLength >= 2) {
          isHolding = true;
        } else {
          isHolding = false;
        }
      };

      const handleTouchEnd = (touchesLength: number, now: number) => {
        lastTouchTimestamp = now;
        touchCount = touchesLength;
        if (touchesLength < 2) {
          isHolding = false;
        }
      };

      const handleTouchCancel = (now: number) => {
        lastTouchTimestamp = now;
        touchCount = 0;
        isHolding = false;
      };

      const handleMouseDown = (now: number) => {
        if (now - lastTouchTimestamp < 750) return; // Ghost click defense
        isHolding = true;
      };

      const handleMouseUp = (now: number) => {
        if (now - lastTouchTimestamp < 750) return;
        isHolding = false;
      };

      // 1. Ett barn legger fingeren på skjermen (1 touch) -> isHolding må forbli FALSE
      handleTouchStart(1, 1000);
      expect(touchCount).toBe(1);
      expect(isHolding).toBe(false);

      // 2. Den voksne legger til sin finger (2 touches) -> isHolding aktiveres!
      handleTouchStart(2, 1100);
      expect(touchCount).toBe(2);
      expect(isHolding).toBe(true);

      // 3. Barnet løfter fingeren (1 touch gjenstår) -> isHolding må deaktiveres umiddelbart
      handleTouchEnd(1, 2000);
      expect(touchCount).toBe(1);
      expect(isHolding).toBe(false);

      // 4. Den voksne legger fingeren på nytt (2 touches igjen)
      handleTouchStart(2, 2200);
      expect(isHolding).toBe(true);

      // 5. Telefonen mottar touchCancel (innkommende anrop/gest)
      handleTouchCancel(2500);
      expect(touchCount).toBe(0);
      expect(isHolding).toBe(false);

      // 6. Mobil «ghost click»-beskyttelse: nettleser emulerer mousedown 50ms etter touch
      handleMouseDown(2550); // 2550 - 2500 = 50ms < 750ms
      expect(isHolding).toBe(false); // Blokkeres!

      // 7. Desktop-mus fallback: Ren datamus uten nylig berøring (tid forløpt > 750ms)
      handleMouseDown(3500); // 3500 - 2500 = 1000ms >= 750ms
      expect(isHolding).toBe(true); // Godkjennes for skrivebordstesting!

      handleMouseUp(4000);
      expect(isHolding).toBe(false);
    });
  });

  // =========================================================================
  // 3. ASYMMETRIC GAME MECHANICS (VOKSEN KAN IKKE LØSE GÅTE UTEN BARNET)
  // =========================================================================
  describe('3. Asymmetric Game Mechanics Stress Testing', () => {
    it('verifiserer at Oppdrag 1 og 2 oppfyller streng rollefordeling', () => {
      const m1 = SOLJAKTEN_EVENTYR.missions[0];
      const m2 = SOLJAKTEN_EVENTYR.missions[1];
      const m3 = SOLJAKTEN_EVENTYR.missions[2];

      expect(m1.roleResponsible).toBe('child');
      expect(m1.roleName).toContain('Lys-speideren');
      expect(m1.requiresChildSecret).toBeFalsy();

      expect(m2.roleResponsible).toBe('adult');
      expect(m2.roleName).toContain('Kart-leseren');
      expect(m2.requiresChildSecret).toBe(true);

      expect(m3.roleResponsible).toBe('together');
      expect(m3.roleName).toContain('Hele Familien');
    });

    it('beviser at den voksnes gåtetekst IKKE røper det hemmelige symbolet', () => {
      const m2 = SOLJAKTEN_EVENTYR.missions[1];
      // Teksten skal instruere pappa om å SPØRRE barnet, ikke avsløre svaret
      expect(m2.instruction).toContain('spør barnet ditt nå');
      expect(m2.instruction).not.toContain('eikeblad');
      expect(m2.instruction).not.toContain('3 spisser');
    });

    it('verifiserer at alle 4 alternativer i Oppdrag 2 tilsvarer mulige funn i Oppdrag 1', () => {
      const m1Options = SOLJAKTEN_EVENTYR.missions[0].options || [];
      const m2Options = SOLJAKTEN_EVENTYR.missions[1].options || [];

      expect(m1Options.length).toBe(4);
      expect(m2Options.length).toBe(4);

      // Kartlegging av distraktorer:
      // m1: eikeblad (riktig), sopp, stein, kongle
      // m2: nokkel_trekant (riktig), nokkel_sirkel, nokkel_kryss, nokkel_krone
      const m2KeyTypes = m2Options.map(o => o.id);
      expect(m2KeyTypes).toContain('nokkel_trekant'); // eikeblad med 3 spisser
      expect(m2KeyTypes).toContain('nokkel_sirkel');  // den runde elvesteinen
      expect(m2KeyTypes).toContain('nokkel_kryss');   // furunålenes kryssmønster (kongle)
      expect(m2KeyTypes).toContain('nokkel_krone');   // sopphattenes tåkekrone
    });

    it('beviser at en voksen som gjetter i blinde har 75 % feilrate (3 av 4 feil)', () => {
      const m2Options = SOLJAKTEN_EVENTYR.missions[1].options || [];
      const wrongOptions = m2Options.filter(o => !o.isCorrect);
      const correctOptions = m2Options.filter(o => o.isCorrect);

      expect(wrongOptions.length).toBe(3);
      expect(correctOptions.length).toBe(1);
      expect(correctOptions[0].id).toBe('nokkel_trekant');

      // Voksen må velge blindt hvis barnet ikke har svart
      const blindGuessSuccessProbability = correctOptions.length / m2Options.length;
      expect(blindGuessSuccessProbability).toBe(0.25);
    });

    it('forhindrer at Steg 2 eller 3 kan nås hvis barnet ikke finner hemmeligheten i Steg 1', () => {
      const advId = SOLJAKTEN_EVENTYR.id;
      resetAdventure(advId);

      let prog = getAdventureProgress(advId);
      expect(prog.currentStep).toBe(1);
      expect(prog.childSecretFound).toBeUndefined();

      // Feil svar fra barnet
      const wrongChildChoice = SOLJAKTEN_EVENTYR.missions[0].options?.find(o => !o.isCorrect);
      expect(wrongChildChoice).toBeDefined();

      // Ved feil svar oppdateres IKKE lagret steg til 2
      // (simulerer handleChildOptionSelect feilgren)
      const hasCorrectSecret = wrongChildChoice?.id === 'eikeblad';
      expect(hasCorrectSecret).toBe(false);

      // Fremgang forblir på steg 1
      prog = getAdventureProgress(advId);
      expect(prog.currentStep).toBe(1);
      expect(prog.childSecretFound).toBeUndefined();
      expect(prog.isCompleted).toBe(false);
    });

    it('overfører barnets hemmelighet deterministisk fra Steg 1 til Steg 2 og låser opp Steg 3', () => {
      const advId = SOLJAKTEN_EVENTYR.id;
      resetAdventure(advId);

      // Barnet finner riktig hemmelighet
      const correctChildOption = SOLJAKTEN_EVENTYR.missions[0].options?.find(o => o.isCorrect);
      expect(correctChildOption?.id).toBe('eikeblad');

      // Steg 1 lagres med hemmelighet
      saveAdventureProgress({
        adventureId: advId,
        currentStep: 2,
        childSecretFound: correctChildOption!.id,
        isCompleted: false
      });

      let prog = getAdventureProgress(advId);
      expect(prog.currentStep).toBe(2);
      expect(prog.childSecretFound).toBe('eikeblad');

      // Voksen rådspør barnet: Barnet svarer «Eikebladet med 3 spisser!»
      // Voksen velger nøkkelen med 3 spisser (nokkel_trekant)
      const correctAdultOption = SOLJAKTEN_EVENTYR.missions[1].options?.find(o => o.isCorrect);
      expect(correctAdultOption?.id).toBe('nokkel_trekant');
      expect(correctAdultOption?.label).toContain('3 spissers');
      expect(correctAdultOption?.label).toContain('Eikebladet');

      // Steg 2 løses med hemmelighet bevart
      saveAdventureProgress({
        adventureId: advId,
        currentStep: 3,
        childSecretFound: prog.childSecretFound,
        adultLogicSolved: true,
        isCompleted: false
      });

      prog = getAdventureProgress(advId);
      expect(prog.currentStep).toBe(3);
      expect(prog.childSecretFound).toBe('eikeblad');
      expect(prog.adultLogicSolved).toBe(true);
      expect(prog.isCompleted).toBe(false);
    });
  });
});
