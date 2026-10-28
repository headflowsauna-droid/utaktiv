import { describe, it, expect, beforeEach } from 'vitest';
import {
  SOLJAKTEN_EVENTYR,
  getAdventureProgress,
  saveAdventureProgress,
  resetAdventure,
} from '../engine/familieEventyr';
import { creditEarnedLocal, earnedBalance, purchasedBalance, resetPointEntriesForTests } from '../engine/pointsLedger';

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

describe('Full Spillflyt-revisjon: Familieeventyret (Steg 1 til 10)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPointEntriesForTests();
  });

  it('Gjennomfører hele spillflyten fra start til slutt og verifiserer tilstandsendringer', () => {
    const adv = SOLJAKTEN_EVENTYR;

    // 1. Start et nytt familieeventyr
    let progress = getAdventureProgress(adv.id);
    expect(progress.currentStep).toBe(1);
    expect(progress.childSecretFound).toBeUndefined();
    expect(progress.isCompleted).toBe(false);

    // 2. Fullfør barnets observasjonsoppgave (Steg 1)
    const m1 = adv.missions[0];
    expect(m1.roleResponsible).toBe('child');
    const childChoice = m1.options?.find(o => o.isCorrect);
    expect(childChoice).toBeDefined();
    expect(childChoice?.id).toBe('eikeblad');

    // 3. Kontroller at ledetråden lagres
    saveAdventureProgress({
      adventureId: adv.id,
      currentStep: 2,
      childSecretFound: childChoice!.id,
      isCompleted: false,
    });
    progress = getAdventureProgress(adv.id);
    expect(progress.currentStep).toBe(2);
    expect(progress.childSecretFound).toBe('eikeblad');

    // 4. Fullfør den voksnes oppgave ved å bruke barnets informasjon (Steg 2)
    const m2 = adv.missions[1];
    expect(m2.roleResponsible).toBe('adult');
    expect(m2.requiresChildSecret).toBe(true);
    const adultChoice = m2.options?.find(o => o.isCorrect);
    expect(adultChoice).toBeDefined();
    expect(adultChoice?.id).toBe('nokkel_trekant');

    saveAdventureProgress({
      adventureId: adv.id,
      currentStep: 3,
      childSecretFound: progress.childSecretFound,
      adultLogicSolved: true,
      isCompleted: false,
    });
    progress = getAdventureProgress(adv.id);
    expect(progress.currentStep).toBe(3);
    expect(progress.adultLogicSolved).toBe(true);

    // 5. Fullfør den felles oppgaven (Steg 3: Sol-Fusjonen)
    const m3 = adv.missions[2];
    expect(m3.roleResponsible).toBe('together');
    expect(m3.options?.[0].id).toBe('fusjon_fullfort');

    // 6. Kontroller at familien får en samlet seier
    saveAdventureProgress({
      adventureId: adv.id,
      currentStep: 3,
      childSecretFound: progress.childSecretFound,
      adultLogicSolved: true,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    });
    progress = getAdventureProgress(adv.id);
    expect(progress.isCompleted).toBe(true);
    expect(progress.completedAt).toBeDefined();

    // 7. Kontroller belønningen og poengsaldoen
    const rewardPoints = adv.reward.points; // 15
    expect(rewardPoints).toBe(15);
    const today = new Date().toISOString().split('T')[0];
    const grantRes = creditEarnedLocal({
      points: rewardPoints,
      reason: 'checkin',
      idempotencyKey: `familie-eventyr-${adv.id}-${today}`
    });
    expect(grantRes.applied).toBe(15);
    expect(earnedBalance()).toBe(15);
    // Kjøpt saldo forblir 0
    expect(purchasedBalance()).toBe(0);

    // 7b. Verifiser deterministisk dato-låst idempotens (duplikatkall samme dag gir 0)
    const duplicateRes = creditEarnedLocal({
      points: rewardPoints,
      reason: 'checkin',
      idempotencyKey: `familie-eventyr-${adv.id}-${today}`
    });
    expect(duplicateRes.applied).toBe(0);
    expect(earnedBalance()).toBe(15);

    // 8. Oppdater siden og undersøk om fremgangen beholdes
    // (Simulert ved ny lesing fra localStorage)
    const reloadedProgress = getAdventureProgress(adv.id);
    expect(reloadedProgress.isCompleted).toBe(true);
    expect(reloadedProgress.childSecretFound).toBe('eikeblad');

    // 9. Test pause, fortsettelse og avslutning / omstart
    resetAdventure(adv.id);
    const resetProg = getAdventureProgress(adv.id);
    expect(resetProg.currentStep).toBe(1);
    expect(resetProg.isCompleted).toBe(false);
    expect(resetProg.childSecretFound).toBeUndefined();
  });
});
