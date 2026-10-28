/**
 * Eventyrstien & Naturvokterne — Pedagogisk spillmotor for Utaktiv
 * 
 * Filosofi:
 * 1. Oppdag -> 2. Gjør noe i naturen -> 3. Bli venn -> 4. Bruk funnet (Askeladden).
 * Trygghet: Ingen risting eller svinging av telefonen.
 * Etikk: Felles familiebeholdning, tak på maks 15 Solmynter per tur for å hindre skjermavhengighet.
 * Ingen FOMO, ingen loot-bokser, ingen individuelle konkurransetabeller.
 */

export interface AnimalFriend {
  id: string;
  name: string;
  species: 'rev' | 'ugle' | 'ekorn';
  title: string;
  personality: string;
  ability: string;
  avatarEmoji: string;
  greetingText: string;
  riddleQuestion?: string;
  riddleOptions?: string[];
  correctRiddleIndex?: number;
  riddleExplanation?: string;
  associatedToolId: string;
  isBefriended: boolean;
}

export interface KnapsackItem {
  id: string;
  name: string;
  emoji: string;
  category: 'tool' | 'nature_find' | 'key_item';
  description: string;
  lore: string;
  isFound: boolean;
  requiredForChest: boolean;
}

export interface SolkastetResult {
  isHit: boolean;
  score: number;
  message: string;
  hint?: string;
}

export interface NatureQuestState {
  animals: AnimalFriend[];
  knapsack: KnapsackItem[];
  coinsThisHike: number;
  maxCoinsPerHike: number;
  chestUnlocked: boolean;
  isSafePaused: boolean;
  currentStoryTitle: string;
  currentStoryChapter: string;
}

export const INITIAL_ANIMALS: AnimalFriend[] = [
  {
    id: 'rev-mikkel',
    name: 'Mikkel Rev',
    species: 'rev',
    title: 'Skogens luring & stiviser',
    personality: 'Nysgjerrig, leken og elsker å kaste lysballer.',
    ability: 'Finner snarveier og løser lurerier på stien.',
    avatarEmoji: '🦊',
    greetingText: '«Hei der på stien! Jeg har mistet en solball i lyngen. Kan dere hjelpe meg å kaste den opp i furukurven?»',
    associatedToolId: 'tool-solsteinspeil',
    isBefriended: false,
  },
  {
    id: 'ugle-hubro',
    name: 'Hubroen Ugle',
    species: 'ugle',
    title: 'Dagslysets og tretoppenes vokter',
    personality: 'Klok, rolig og opptatt av mønstre i naturen.',
    ability: 'Viser vei etter solhøyde og vindretning.',
    avatarEmoji: '🦉',
    greetingText: '«Huu-huu! Familien ser klok ut. Klarer dere min gåte om dagslysets hemmelighet?»',
    riddleQuestion: 'Hva er det som gjør deg våken og glad om dagen, og hjelper deg å sove dypt når kvelden kommer?',
    riddleOptions: [
      'Lys fra mobilen under dyna',
      'Ekte dagslys ute på tur',
      'Tre kopper sterk kaffe'
    ],
    correctRiddleIndex: 1,
    riddleExplanation: 'Helt riktig! Naturlig dagslys ute nullstiller døgnrytmen vår og gir kroppen energi.',
    associatedToolId: 'tool-ravfjaer',
    isBefriended: false,
  },
  {
    id: 'ekorn-notteliten',
    name: 'Nøtteliten Ekorn',
    species: 'ekorn',
    title: 'Askeladdens raske hjelper',
    personality: 'Morsom, vimsete og en mester til å finne skatter i mosen.',
    ability: 'Lukter seg frem til skjulte kongler og nøkler.',
    avatarEmoji: '🐿️',
    greetingText: '«Pip! Jeg fant, jeg fant! Men jeg glemte hvor jeg la konglen min. Kan familien finne noe rundt på bakken og vise meg?»',
    associatedToolId: 'tool-furukongle',
    isBefriended: false,
  },
];

export const INITIAL_KNAPSACK: KnapsackItem[] = [
  {
    id: 'tool-solsteinspeil',
    name: 'Solsteinspeilet',
    emoji: '🪞',
    category: 'tool',
    description: 'Et glatt speil slipt av bergkrystall.',
    lore: 'Når du fanger en solstråle med dette speilet, lyser det opp skjulte symboler i mørke bergsprekker.',
    isFound: false,
    requiredForChest: true,
  },
  {
    id: 'tool-ravfjaer',
    name: 'Ravfjæren',
    emoji: '🪶',
    category: 'tool',
    description: 'En gyllen fjær mistet av Hubroen.',
    lore: 'Holdes den opp mot himmelen, snur den seg alltid mot den luneste stien i le for vestavinden.',
    isFound: false,
    requiredForChest: false,
  },
  {
    id: 'tool-furukongle',
    name: 'Gullkonglen',
    emoji: '🌰',
    category: 'nature_find',
    description: 'En perfekt, tørr furukongle fra skogbunnen.',
    lore: 'Ekornet elsker denne! Viser at familien har øyne for de små underverkene på stien.',
    isFound: false,
    requiredForChest: false,
  },
  {
    id: 'tool-gullnokkel',
    name: 'Gullnøkkel-biten',
    emoji: '🗝️',
    category: 'key_item',
    description: 'En gammel nøkkelbit formet som et eikeblad.',
    lore: 'Passer nøyaktig i nøkkelhullet på den glemte skattekisten i skogkanten.',
    isFound: false,
    requiredForChest: true,
  },
  {
    id: 'tool-vaffelhjerte',
    name: 'Vaffelhjertet',
    emoji: '🧇',
    category: 'nature_find',
    description: 'Et nystekt vaffelhjerte med duft av kardemomme.',
    lore: 'Gjør selv den mest skeptiske rev tam og vennlig.',
    isFound: false,
    requiredForChest: false,
  },
  {
    id: 'tool-trefloyte',
    name: 'Askeladdens Seljefløyte',
    emoji: '🪵',
    category: 'tool',
    description: 'En liten trefløyte skåret i fersk selje.',
    lore: 'Når du blåser i den, svarer fuglene i trekronene med samme tone.',
    isFound: false,
    requiredForChest: false,
  },
];

const STORAGE_KEY = 'utaktiv_nature_quest_v1';

export function getInitialQuestState(): NatureQuestState {
  return {
    animals: INITIAL_ANIMALS,
    knapsack: INITIAL_KNAPSACK,
    coinsThisHike: 0,
    maxCoinsPerHike: 15,
    chestUnlocked: false,
    isSafePaused: false,
    currentStoryTitle: 'Mysteriet om Solens Voktere',
    currentStoryChapter: 'Kapittel 1: Skogens første møte ved Byfjorden',
  };
}

export function loadQuestState(): NatureQuestState {
  if (typeof window === 'undefined') return getInitialQuestState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialQuestState();
    const parsed = JSON.parse(raw);
    return {
      ...getInitialQuestState(),
      ...parsed,
    };
  } catch {
    return getInitialQuestState();
  }
}

export function saveQuestState(state: NatureQuestState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage failures
  }
}

/**
 * Beregner Solkastet trygt med fingeren (slingshot / swipe)
 * aimOffset: Horisontal siktevinkel (-50 til +50)
 * power: Trekkstyrke (0 til 100)
 */
export function evaluateSolkastet(aimOffset: number, power: number): SolkastetResult {
  // Trygg sone: power mellom 45 og 85, aimOffset mellom -20 og +20
  const isPowerGood = power >= 40 && power <= 90;
  const isAimGood = Math.abs(aimOffset) <= 25;

  if (isPowerGood && isAimGood) {
    return {
      isHit: true,
      score: 100,
      message: '✨ Fulltreffer! Solballen landet rett i kurven med et magisk glimt!',
    };
  }

  if (!isPowerGood && power < 40) {
    return {
      isHit: false,
      score: 40,
      message: 'Nesten! Dra litt lenger bakover med fingeren for mer fart.',
      hint: 'Kurven er gjort litt større nå så det blir lettere å treffe!',
    };
  }

  if (!isPowerGood && power > 90) {
    return {
      isHit: false,
      score: 50,
      message: 'Oi, litt for mye kraft! Prøv et litt mykere kast.',
      hint: 'Bruk en rolig, myk bevegelse.',
    };
  }

  return {
    isHit: false,
    score: 60,
    message: 'Nesten! Juster siktet litt mot midten.',
    hint: 'Sikt rett mot den glødende kurven.',
  };
}

/**
 * Legg til mynter i familiepotten med strengt tak på 15 mynter per tur
 */
export function awardFamilyCoins(currentState: NatureQuestState, amount: number): {
  state: NatureQuestState;
  coinsAwarded: number;
  cappedMessage?: string;
} {
  const current = currentState.coinsThisHike;
  const max = currentState.maxCoinsPerHike;
  const potential = current + amount;
  const actualCoins = Math.min(max, potential) - current;

  const nextState: NatureQuestState = {
    ...currentState,
    coinsThisHike: Math.min(max, potential),
  };

  let cappedMessage: string | undefined;
  if (nextState.coinsThisHike >= max) {
    cappedMessage = '🎉 Dagens makstak på 15 Solmynter er nådd! Nå legger vi mobilen i lomma og nyter turen sammen.';
  }

  saveQuestState(nextState);
  return {
    state: nextState,
    coinsAwarded: actualCoins,
    cappedMessage,
  };
}

/**
 * Løs gåte for vennskapsprøve
 */
export function answerFriendshipRiddle(
  state: NatureQuestState,
  animalId: string,
  chosenIndex: number
): { success: boolean; state: NatureQuestState; feedback: string } {
  const animal = state.animals.find(a => a.id === animalId);
  if (!animal) return { success: false, state, feedback: 'Fant ikke dyret.' };

  const isCorrect = animal.correctRiddleIndex === chosenIndex;

  if (isCorrect) {
    const updatedAnimals = state.animals.map(a =>
      a.id === animalId ? { ...a, isBefriended: true } : a
    );
    // Lås også opp dyrets tilhørende verktøy i sekken
    const updatedKnapsack = state.knapsack.map(t =>
      t.id === animal.associatedToolId ? { ...t, isFound: true } : t
    );

    const withAnimals: NatureQuestState = {
      ...state,
      animals: updatedAnimals,
      knapsack: updatedKnapsack,
    };

    const { state: finalState } = awardFamilyCoins(withAnimals, 5);

    return {
      success: true,
      state: finalState,
      feedback: `🎉 Fantastisk! ${animal.name} ble så glad at den ble med familien, og ga dere ${
        updatedKnapsack.find(k => k.id === animal.associatedToolId)?.name
      } i sekken!`,
    };
  }

  return {
    success: false,
    state,
    feedback: 'Tenk dere om en gang til sammen – dere klarer det!',
  };
}

/**
 * Finn gjenstand i naturen (Askeladdens funn)
 */
export function recordAskeladdDiscovery(
  state: NatureQuestState,
  toolId: string
): { state: NatureQuestState; item: KnapsackItem | undefined } {
  const updatedKnapsack = state.knapsack.map(item =>
    item.id === toolId ? { ...item, isFound: true } : item
  );
  const foundItem = updatedKnapsack.find(i => i.id === toolId);

  const intermediateState: NatureQuestState = {
    ...state,
    knapsack: updatedKnapsack,
  };

  const { state: finalState } = awardFamilyCoins(intermediateState, 5);

  return {
    state: finalState,
    item: foundItem,
  };
}

/**
 * Lås opp Den Hemmelige Skattekisten
 * Krever Solsteinspeilet (tool-solsteinspeil) og Gullnøkkel-biten (tool-gullnokkel)
 */
export function unlockSecretChest(
  state: NatureQuestState
): { success: boolean; state: NatureQuestState; message: string } {
  const speil = state.knapsack.find(k => k.id === 'tool-solsteinspeil')?.isFound;
  const nokkel = state.knapsack.find(k => k.id === 'tool-gullnokkel')?.isFound;

  if (!speil || !nokkel) {
    return {
      success: false,
      state,
      message: 'Kisten er låst med et mørkt solsegl! Dere må finne både Solsteinspeilet og Gullnøkkel-biten før låsen kan åpnes.',
    };
  }

  const intermediateState: NatureQuestState = {
    ...state,
    chestUnlocked: true,
    currentStoryChapter: 'Kapittel 2: Skattekisten åpner veien mot Eidfjord',
  };

  const { state: finalState } = awardFamilyCoins(intermediateState, 10);

  return {
    success: true,
    state: finalState,
    message: '✨ KLIKK! Solsteinspeilet lyste opp det hemmelige nøkkelhullet, og Gullnøkkel-biten vred låsen opp! Skattekisten er åpnet, familien har fått felles diplom og maksimal solmynt-belønning!',
  };
}
