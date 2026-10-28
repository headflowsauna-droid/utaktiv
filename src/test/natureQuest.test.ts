import { describe, it, expect, beforeEach } from 'vitest';
import {
  getInitialQuestState,
  evaluateSolkastet,
  awardFamilyCoins,
  answerFriendshipRiddle,
  recordAskeladdDiscovery,
  unlockSecretChest,
} from '../engine/natureQuest';

describe('Eventyrstien & Naturvokterne Engine', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('initialiserer med 3 dyr, 6 gjenstander i sekken og 0 mynter', () => {
    const state = getInitialQuestState();
    expect(state.animals.length).toBe(3);
    expect(state.animals.map(a => a.species)).toEqual(['rev', 'ugle', 'ekorn']);
    expect(state.knapsack.length).toBe(6);
    expect(state.coinsThisHike).toBe(0);
    expect(state.maxCoinsPerHike).toBe(15);
    expect(state.chestUnlocked).toBe(false);
  });

  it('Solkastet: gir fulltreffer ved riktig sikte og trekkstyrke', () => {
    const res = evaluateSolkastet(0, 65);
    expect(res.isHit).toBe(true);
    expect(res.score).toBe(100);
    expect(res.message).toContain('Fulltreffer');
  });

  it('Solkastet: gir vennlig hint og aldri tap av poeng ved bom', () => {
    const resSoft = evaluateSolkastet(0, 20);
    expect(resSoft.isHit).toBe(false);
    expect(resSoft.hint).toBeDefined();

    const resHard = evaluateSolkastet(0, 95);
    expect(resHard.isHit).toBe(false);
    expect(resHard.message).toContain('for mye kraft');
  });

  it('Familiepotten har et strengt tak på maks 15 Solmynter per tur for å hindre skjermbruk', () => {
    const state0 = getInitialQuestState();

    const { state: state1, coinsAwarded: c1 } = awardFamilyCoins(state0, 10);
    expect(state1.coinsThisHike).toBe(10);
    expect(c1).toBe(10);

    // Forsøk å gi 10 til (totalt 20) -> skal stoppe på 15
    const { state: state2, coinsAwarded: c2, cappedMessage } = awardFamilyCoins(state1, 10);
    expect(state2.coinsThisHike).toBe(15);
    expect(c2).toBe(5);
    expect(cappedMessage).toContain('makstak på 15 Solmynter er nådd');
  });

  it('Vennskapsprøven: riktig gåtesvar gjør dyret venn og låser opp tilhørende verktøy', () => {
    const state = getInitialQuestState();
    const res = answerFriendshipRiddle(state, 'ugle-hubro', 1);

    expect(res.success).toBe(true);
    const hubro = res.state.animals.find(a => a.id === 'ugle-hubro');
    expect(hubro?.isBefriended).toBe(true);

    const fjaer = res.state.knapsack.find(k => k.id === 'tool-ravfjaer');
    expect(fjaer?.isFound).toBe(true);
  });

  it('Askeladdens funn: finner gjenstand i naturen og legger i sekken', () => {
    const state = getInitialQuestState();
    const { state: nextState, item } = recordAskeladdDiscovery(state, 'tool-gullnokkel');

    expect(item?.name).toBe('Gullnøkkel-biten');
    expect(nextState.knapsack.find(k => k.id === 'tool-gullnokkel')?.isFound).toBe(true);
  });

  it('Skattekisten: krever både Solsteinspeilet og Gullnøkkel-biten for å åpnes', () => {
    const state0 = getInitialQuestState();

    // Ingen verktøy -> feiler
    const failRes = unlockSecretChest(state0);
    expect(failRes.success).toBe(false);
    expect(failRes.message).toContain('både Solsteinspeilet og Gullnøkkel-biten');

    // Finn speilet
    const { state: state1 } = recordAskeladdDiscovery(state0, 'tool-solsteinspeil');
    expect(unlockSecretChest(state1).success).toBe(false);

    // Finn nøkkelen
    const { state: state2 } = recordAskeladdDiscovery(state1, 'tool-gullnokkel');
    const successRes = unlockSecretChest(state2);

    expect(successRes.success).toBe(true);
    expect(successRes.state.chestUnlocked).toBe(true);
    expect(successRes.state.currentStoryChapter).toContain('Kapittel 2');
  });
});
