/**
 * Gamifisering, Dagslysmåling & Sol Junior Nabohjelp-motor
 */

import { commitSpend } from './cloudSync';
import { earnedBalance, purchasedBalance, spendPurchasedLocal } from './pointsLedger';

export interface StoreVoucher {
  id: string;
  title: string;
  category: 'concert' | 'sports' | 'family' | 'cafebar';
  discountNok: number;
  costPoints: number; // 1 poeng = 1 NOK
  description: string;
  partnerName: string;
  expiresText: string;
  badgeEmoji: string;
  activityId?: string;
}

export interface RedeemedVoucher {
  id: string;
  voucherId: string;
  code: string;
  redeemedAt: string;
  discountNok: number;
  partnerName: string;
  title: string;
}

export interface JuniorChore {
  id: string;
  title: string;
  category: 'garden' | 'pet' | 'cleaning' | 'errand';
  description: string;
  neighborName: string;
  distanceMeters: number;
  activityPoints: number; // Opplevelsespoeng sponset av naboen (f.eks. 1500 p)
  sponsorNok: number; // Naboens sponsorverdi i kr
  estimatedMinutes: number;
  recommendedTime: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface FamilyExperienceGoal {
  title: string;
  targetPoints: number;
  rewardActivityTitle: string;
  emoji: string;
}

export const DEFAULT_FAMILY_GOAL: FamilyExperienceGoal = {
  title: 'Familiedag i Høyt & Lavt Klatrepark (Nesttun)',
  targetPoints: 350,
  rewardActivityTitle: 'Familiepass for Alexander, Milla og Oliver',
  emoji: '🌲',
};

export const STORE_VOUCHERS: StoreVoucher[] = [
  {
    id: 'vouch-jason-mraz-50',
    title: '50 kr Avslag — Jason Mraz på Koengen',
    category: 'concert',
    discountNok: 50,
    costPoints: 50,
    description: 'Bruk 50 poeng (1 poeng = 1 kr) til å redusere billettprisen på Jason Mraz sommerkonsert på Koengen.',
    partnerName: 'Ticketmaster / Bergen Live',
    expiresText: 'Gyldig til 14. juni 2027',
    badgeEmoji: '🎸',
    activityId: 'act-jason-mraz',
  },
  {
    id: 'vouch-7fjell-75',
    title: '75 kr Avslag — 7-Fjellsturen Bergen',
    category: 'sports',
    discountNok: 75,
    costPoints: 75,
    description: 'Rabatt på startkontingenten til Norges råeste dagslystur over Bergens 7 fjell.',
    partnerName: 'DNT Bergen og Hordaland Turlag',
    expiresText: 'Gyldig til 30. mai 2027',
    badgeEmoji: '🏔️',
    activityId: 'act-7fjell',
  },
  {
    id: 'vouch-hoytlavt-35',
    title: '35 kr Avslag — Høyt & Lavt Klatrepark Nesttun',
    category: 'family',
    discountNok: 35,
    costPoints: 35,
    description: 'Rabatt på barne- eller familielisens til tretoppene i klatreparken.',
    partnerName: 'Høyt & Lavt Nesttun',
    expiresText: 'Gyldig hele sesongen 2026/2027',
    badgeEmoji: '🌲',
    activityId: 'act-hoytoglavt',
  },
  {
    id: 'vouch-nordnes-kaffe',
    title: 'Gratis Sol-kaffe & Kanelsnurr',
    category: 'cafebar',
    discountNok: 45,
    costPoints: 45,
    description: 'En stor kopp ferskbrygget kaffe og nystekt bolle på bryggekanten ved Nordnes Sjøbad.',
    partnerName: 'Nordnes Sjøbad Kafé',
    expiresText: 'Ingen utløpsdato',
    badgeEmoji: '☕',
    activityId: 'act-nordnes-sol',
  },
  {
    id: 'vouch-voss-150',
    title: '150 kr Festivalrabatt — Ekstremsportveko Voss',
    category: 'sports',
    discountNok: 150,
    costPoints: 150,
    description: 'Eksklusiv Utaktiv-rabatt på ukes- eller helgepass til ekstremsport og konserter.',
    partnerName: 'Ekstremsportveko Voss',
    expiresText: 'Gyldig til 20. juni 2027',
    badgeEmoji: '🪂',
    activityId: 'act-voss-ekstremsport',
  },
];

export const INITIAL_JUNIOR_CHORES: JuniorChore[] = [
  {
    id: 'chore-gressklipp-1',
    title: 'Klippe plenen for Nabo Jens',
    category: 'garden',
    description: 'Klipp for- og bakhage i Klostergaten. Gressklipper og oppsamler står klar i boden. Nyt solskinn og dagslys!',
    neighborName: 'Jens (Klostergaten 14, Nordnes)',
    distanceMeters: 120,
    activityPoints: 150,
    sponsorNok: 150,
    estimatedMinutes: 45,
    recommendedTime: '11:00–16:00 (optimalt dagslys)',
    isCompleted: false,
  },
  {
    id: 'chore-hundetur-1',
    title: 'Gå 40 min tur med labradoren Balder i Nordnesparken',
    category: 'pet',
    description: 'Balder elsker tur langs sjøbadet og plenen. Bånd, bæsjeposer og godbiter følger med.',
    neighborName: 'Kari (Haugeveien 8, Nordnes)',
    distanceMeters: 80,
    activityPoints: 100,
    sponsorNok: 100,
    estimatedMinutes: 40,
    recommendedTime: 'Ettermiddagssol',
    isCompleted: false,
  },
  {
    id: 'chore-rake-lov',
    title: 'Rake løv og samle hageavfall for Einar',
    category: 'garden',
    description: 'Rake sammen tørt løv under epletrærne og legge i papirsekker for kompostering.',
    neighborName: 'Einar (Minde Allé 22)',
    distanceMeters: 190,
    activityPoints: 120,
    sponsorNok: 120,
    estimatedMinutes: 35,
    recommendedTime: 'Midt på dagen',
    isCompleted: false,
  },
  {
    id: 'chore-bilvask',
    title: 'Vaske naboens elbil i oppkjørselen',
    category: 'cleaning',
    description: 'Skånsom såpevask med svamp og avspyling med hageslange på solfylt gårdsplass ved Verftet.',
    neighborName: 'Tor & Silje (Georgernes Verft 5)',
    distanceMeters: 150,
    activityPoints: 200,
    sponsorNok: 200,
    estimatedMinutes: 60,
    recommendedTime: 'Klart solskinn',
    isCompleted: false,
  },
  {
    id: 'chore-vanne-blomster',
    title: 'Vanne blomsterkasser og minidrivhus for helgen',
    category: 'garden',
    description: 'Vann 6 store blomsterkasser og tomatplanter i solveggen. Nabo er bortreist i helgen.',
    neighborName: 'Ingrid (Strangehagen 12)',
    distanceMeters: 110,
    activityPoints: 80,
    sponsorNok: 80,
    estimatedMinutes: 20,
    recommendedTime: 'Kveldssol',
    isCompleted: false,
  },
  {
    id: 'chore-luke-ugress',
    title: 'Luke ugress og løvetann langs granittmuren',
    category: 'garden',
    description: 'Luke langs fortauskanten og grusgangen foran det gamle trehuset.',
    neighborName: 'Magne (Ytre Markevei 19)',
    distanceMeters: 140,
    activityPoints: 140,
    sponsorNok: 140,
    estimatedMinutes: 40,
    recommendedTime: 'Morgensol',
    isCompleted: false,
  },
  {
    id: 'chore-baere-ved',
    title: 'Bære inn 4 sekker med tørr bjørkeved fra boden',
    category: 'errand',
    description: 'Hjelp bestemor Astrid med å bære opp vinterveden til stuen i 2. etasje.',
    neighborName: 'Astrid (Nordnesbakken 4)',
    distanceMeters: 95,
    activityPoints: 100,
    sponsorNok: 100,
    estimatedMinutes: 25,
    recommendedTime: 'Dagslys',
    isCompleted: false,
  },
  {
    id: 'chore-milo-hund',
    title: 'Lufte cockapooen Milo rundt Store Lungegårdsvann',
    category: 'pet',
    description: 'Rask og kjekk tur langs den nye strandparken. Milo er snill med alle barn.',
    neighborName: 'Henrik (Møhlenpris Hovedgård)',
    distanceMeters: 220,
    activityPoints: 110,
    sponsorNok: 110,
    estimatedMinutes: 45,
    recommendedTime: 'Ettermiddag',
    isCompleted: false,
  },
  {
    id: 'chore-snoe-straa',
    title: 'Måke og strø trapp og fortau for nabolaget',
    category: 'cleaning',
    description: 'Måke lett nysnø og strø singel i bakken slik at ingen sklir på vei til bussen.',
    neighborName: 'Borettslaget Klosteret',
    distanceMeters: 70,
    activityPoints: 150,
    sponsorNok: 150,
    estimatedMinutes: 30,
    recommendedTime: 'Morgensol / Dagslys',
    isCompleted: false,
  },
  {
    id: 'chore-sykkelvask',
    title: 'Vaske og smøre to barnesykler for familien Berg',
    category: 'cleaning',
    description: 'Spyle ren kjedekasse, vaske ramme med såpe og smøre kjedet med sykkelolje.',
    neighborName: 'Camilla (Kompani-strædet 3)',
    distanceMeters: 130,
    activityPoints: 130,
    sponsorNok: 130,
    estimatedMinutes: 35,
    recommendedTime: 'Solfylt ettermiddag',
    isCompleted: false,
  },
  {
    id: 'chore-hente-epler',
    title: 'Plukke epler fra to store trær for safting',
    category: 'garden',
    description: 'Plukke ned modne røde epler i trekasser. Barnet får også med seg en pose epler hjem!',
    neighborName: 'Gerd (Mindeveien 16)',
    distanceMeters: 260,
    activityPoints: 120,
    sponsorNok: 120,
    estimatedMinutes: 40,
    recommendedTime: 'Midt på dagen',
    isCompleted: false,
  },
  {
    id: 'chore-rydde-garasje',
    title: 'Koste og spyle ren gårdsplass foran garasjen',
    category: 'cleaning',
    description: 'Koste bort sand og løv, og spyle rent foran innkjørselen for helgen.',
    neighborName: 'Thomas (Fana / Paradis)',
    distanceMeters: 310,
    activityPoints: 160,
    sponsorNok: 160,
    estimatedMinutes: 45,
    recommendedTime: 'Dagslys',
    isCompleted: false,
  },
  {
    id: 'chore-pante-flasker',
    title: 'Pante 4 store sekker med tomflasker på nærbutikken',
    category: 'errand',
    description: 'Trille sekkene bort til Spar Nordnes, mate pantemaskinen og levere bongen.',
    neighborName: 'Ove (C. Sundts gate 45)',
    distanceMeters: 180,
    activityPoints: 90,
    sponsorNok: 90,
    estimatedMinutes: 25,
    recommendedTime: 'Formiddag',
    isCompleted: false,
  },
  {
    id: 'chore-klippe-hekk',
    title: 'Trimme lav ligusterhekk mot fortauet',
    category: 'garden',
    description: 'Klippe vekk utstikkende greiner med hekksaks slik at fortauet er fritt.',
    neighborName: 'Per (Conrad Mohrs veg, Minde)',
    distanceMeters: 280,
    activityPoints: 180,
    sponsorNok: 180,
    estimatedMinutes: 50,
    recommendedTime: 'Optimal soltid',
    isCompleted: false,
  },
  {
    id: 'chore-tur-smaahunder',
    title: 'Gå tur med to dvergterriere mot Skansen',
    category: 'pet',
    description: 'Kjekk trimtur opp mot Skansedammen og utsikten. Hundene er rolige og vant til barn.',
    neighborName: 'Bente (Øvre Blekevei 7)',
    distanceMeters: 240,
    activityPoints: 120,
    sponsorNok: 120,
    estimatedMinutes: 40,
    recommendedTime: 'Kveldssol',
    isCompleted: false,
  },
];

const STORAGE_KEY_REDEEMED = 'sol_redeemed_vouchers';
const STORAGE_KEY_CHORES = 'sol_junior_chores';

/**
 * Beregner dagslyspoeng basert på luks, minutter utendørs og UV-indeks.
 * Formel: Minutter * (Luks / 10 000) * (1 + UV * 0.25)
 */
export function calculateLuxPoints(
  lux: number,
  durationMinutes: number,
  uvIndex: number = 1.0
): number {
  if (durationMinutes <= 0 || lux <= 0) return 0;
  const safeLux = Math.max(500, lux);
  const luxFactor = safeLux / 10000;
  const uvFactor = 1 + Math.max(0, uvIndex) * 0.25;
  const points = durationMinutes * luxFactor * uvFactor * 5;
  return Math.round(points);
}

/**
 * Kjøpte poeng. Den gamle lokale startsaldoen på 650 teller ikke.
 */
export function getUserPointsBalance(): number {
  return purchasedBalance();
}

export function getEarnedPointsBalance(): number {
  return earnedBalance();
}

/**
 * Positivt tall øker ikke kjøpte poeng. Negativt trekk skjer i det lokale speilet.
 * Innlogget betaling skal gå via commitSpend.
 */
export function adjustUserPointsBalance(delta: number): number {
  if (delta >= 0) return purchasedBalance();
  const spent = spendPurchasedLocal(
    Math.floor(-delta),
    `adjust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  return spent.balance;
}

/**
 * Henter innløste kuponger
 */
export function getRedeemedVouchers(): RedeemedVoucher[] {
  if (typeof window === 'undefined') return [];
  const val = localStorage.getItem(STORAGE_KEY_REDEEMED);
  return val ? JSON.parse(val) : [];
}

/**
 * Løser inn en kupong mot poeng
 */
export async function redeemStoreVoucher(voucher: StoreVoucher): Promise<{ success: boolean; voucher?: RedeemedVoucher; error?: string }> {
  const current = getUserPointsBalance();
  if (current < voucher.costPoints) {
    return { success: false, error: `Du mangler ${voucher.costPoints - current} kjøpte poeng for å løse inn denne kupongen.` };
  }

  const spent = await commitSpend(
    voucher.costPoints,
    `voucher-${voucher.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  if (!spent.ok) {
    return { success: false, error: spent.error || 'Kjøpte poeng ble ikke trukket.' };
  }

  const randomCode = `SOL-${voucher.partnerName.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const redeemed: RedeemedVoucher = {
    id: `red-${Date.now()}`,
    voucherId: voucher.id,
    code: randomCode,
    redeemedAt: new Date().toISOString(),
    discountNok: voucher.discountNok,
    partnerName: voucher.partnerName,
    title: voucher.title,
  };

  if (typeof window !== 'undefined') {
    const existing = getRedeemedVouchers();
    localStorage.setItem(STORAGE_KEY_REDEEMED, JSON.stringify([redeemed, ...existing]));
  }

  return { success: true, voucher: redeemed };
}

/**
 * Henter Sol Junior oppgaver
 */
export function getJuniorChores(): JuniorChore[] {
  if (typeof window === 'undefined') return INITIAL_JUNIOR_CHORES;
  const val = localStorage.getItem(STORAGE_KEY_CHORES);
  if (!val) {
    localStorage.setItem(STORAGE_KEY_CHORES, JSON.stringify(INITIAL_JUNIOR_CHORES));
    return INITIAL_JUNIOR_CHORES;
  }
  return JSON.parse(val);
}

/**
 * Markerer en familieoppgave som ferdig. Selve poengene kommer fra grantEarned,
 * med tak, og kan ikke veksles til kroner.
 */
export function completeJuniorChore(
  choreId: string,
  _earnedLuxBonus: number
): { success: boolean; updatedChores: JuniorChore[]; choreTitle: string } {
  const chores = getJuniorChores();
  const chore = chores.find(c => c.id === choreId);
  if (!chore || chore.isCompleted) {
    return { success: false, updatedChores: chores, choreTitle: chore?.title ?? '' };
  }

  const updated = chores.map(c =>
    c.id === choreId
      ? { ...c, isCompleted: true, completedAt: new Date().toISOString() }
      : c
  );

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CHORES, JSON.stringify(updated));
  }

  return { success: true, updatedChores: updated, choreTitle: chore.title };
}
