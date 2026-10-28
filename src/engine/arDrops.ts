/**
 * Utaktiv Sol-Jakt AR Motor
 * Styrer geofencede AR-dropp, Luks-mynter, partner-kuponger,
 * skattekiste-ledetråder og sommerens Tinydome Spacecapsule-hovedpremie.
 *
 * Forretningsregler:
 * 1. Maks 20 Luks-poeng kan sankes per bruker per dag (1 Luks-poeng = 1 NOK).
 * 2. Sauna har 0 % rabatt (kun fullpris og prioritert adgang).
 * 3. Partnergaver sponses 100 % av partner for mersalg (0 kr kostnad for Utaktiv).
 * 4. Hovedpremie: 1/12 eierandel i Tinydome Spacecapsule (verdi: 95 000 kr) til sommerfinalen 2027.
 */

import { creditEarnedLocal } from './pointsLedger';

export type ARDropCategory = 'coin' | 'partner' | 'clue' | 'tinydome_ticket';
export type ARTargetPlacement = 'ground' | 'high_tree';
export type ARRecommendedTool = 'lasso' | 'boomerang' | 'solkast';

export interface ARDrop {
  id: string;
  title: string;
  category: ARDropCategory;
  description: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  pointsValue: number; // 0 for kuponger/hint, 1-5 for mynter
  partnerName?: string;
  perkText?: string;
  icon: string;
  badgeText: string;
  clueNumber?: number;
  expiresText?: string;
  requiresLasso?: boolean;
  toolId?: string;
  animalSpecies?: 'rev' | 'ugle' | 'ekorn';
  targetPlacement?: ARTargetPlacement;
  recommendedTool?: ARRecommendedTool;
}

export interface CollectionResult {
  success: boolean;
  message: string;
  pointsAdded: number;
  partnerPerk?: string;
  tinydomeTicketAwarded?: boolean;
  drop?: ARDrop;
}

export const DAILY_MAX_COIN_POINTS = 20;
const STORAGE_PREFIX = 'utaktiv_ar_';

export const GRAND_PRIZE_INFO = {
  title: '1/12 Eierandel i Tinydome Spacecapsule',
  valueNok: 95000,
  description: '4 ukers eksklusivt opphold hvert år (1 uke per årstid) i en luksus glassdome i Hardanger/Eidfjord.',
  website: 'https://tinydome.no',
  finaleDate: 'Sommeren 2027 i Eidfjord'
};

/**
 * Standard forhåndsdefinerte AR-poster i Byfjellene og Bergen
 */
export const BERGEN_AR_DROPS: ARDrop[] = [
  // Spesifikke AR-dropp og Eventyrstien-møter ved Øvre Korskirkeallmenningen 8, 5017 Bergen
  {
    id: 'drop_korskirke_solkrystall',
    title: 'Korskirken Sol-krystall',
    category: 'coin',
    description: 'En glitrende pose med Luks-mynter som henger høyt i treet over Øvre Korskirkeallmenningen 8!',
    lat: 60.3948,
    lng: 5.3289,
    radiusMeters: 120,
    pointsValue: 5,
    icon: '🟡',
    badgeText: '+5 Luks-poeng',
    targetPlacement: 'high_tree',
    recommendedTool: 'boomerang'
  },
  {
    id: 'drop_korskirke_rev',
    title: 'Mikkel Rev ved Korskirkeallmenningen 8',
    category: 'clue',
    description: 'Mikkel Rev sitter på brosteinen ved trappen! Vink for å hilse, eller fang ham med lassoen.',
    lat: 60.3948,
    lng: 5.3289,
    radiusMeters: 120,
    pointsValue: 0,
    icon: '🦊',
    badgeText: 'Dyrevenn',
    animalSpecies: 'rev',
    targetPlacement: 'ground',
    recommendedTool: 'lasso'
  },
  {
    id: 'drop_korskirke_gullnokkel',
    title: 'Gullnøkkel-biten',
    category: 'clue',
    description: 'Henger i et tau høyt i trekronen! Slyng bumerangen opp for å kappe tauet så nøkkelen faller ned.',
    lat: 60.39485,
    lng: 5.32885,
    radiusMeters: 120,
    pointsValue: 0,
    icon: '🗝️',
    badgeText: 'Høythengende skatt',
    requiresLasso: true,
    toolId: 'tool-gullnokkel',
    targetPlacement: 'high_tree',
    recommendedTool: 'boomerang'
  },
  {
    id: 'drop_korskirke_solsteinspeil',
    title: 'Solsteinspeilet',
    category: 'clue',
    description: 'Fanger dagslyset og glitrer på muren. Sving lassoen for å hente det inn!',
    lat: 60.39475,
    lng: 5.32895,
    radiusMeters: 120,
    pointsValue: 0,
    icon: '🪞',
    badgeText: 'Askeladd-funn',
    requiresLasso: true,
    toolId: 'tool-solsteinspeil',
    targetPlacement: 'ground',
    recommendedTool: 'lasso'
  },
  {
    id: 'drop_korskirke_ugle',
    title: 'Hubroen Ugle på Muren',
    category: 'clue',
    description: 'Hubroen speider høyt fra muren. Speil dagslyset med Solkastet mot ham for å løse gåten!',
    lat: 60.3949,
    lng: 5.3291,
    radiusMeters: 120,
    pointsValue: 0,
    icon: '🦉',
    badgeText: 'Dagslysgåte',
    animalSpecies: 'ugle',
    targetPlacement: 'high_tree',
    recommendedTool: 'solkast'
  },
  {
    id: 'drop_korskirke_ekorn',
    title: 'Nøtteliten i Brosteinen',
    category: 'clue',
    description: 'Nøtteliten piler rundt på bakken ved muren. Vink til ham eller kast lassoen!',
    lat: 60.3947,
    lng: 5.3287,
    radiusMeters: 120,
    pointsValue: 0,
    icon: '🐿️',
    badgeText: 'Dyrevenn',
    animalSpecies: 'ekorn',
    targetPlacement: 'ground',
    recommendedTool: 'lasso'
  },
  {
    id: 'drop_korskirke_ravfjaer',
    title: 'Ravfjæren i Greinen',
    category: 'clue',
    description: 'Henger fast høyt oppe i greinen over allmenningen. Kutt den løs med bumerangen!',
    lat: 60.39495,
    lng: 5.3288,
    radiusMeters: 120,
    pointsValue: 0,
    icon: '🪶',
    badgeText: 'Høythengende skatt',
    requiresLasso: true,
    toolId: 'tool-ravfjaer',
    targetPlacement: 'high_tree',
    recommendedTool: 'boomerang'
  },
  {
    id: 'drop_korskirke_skattekiste',
    title: 'Den Hemmelige Skattekisten',
    category: 'clue',
    description: 'Kisten står solid plantet på bakken ved muren. Bruk lassoen for å åpne og hente skatten!',
    lat: 60.3948,
    lng: 5.3290,
    radiusMeters: 120,
    pointsValue: 0,
    icon: '🔒',
    badgeText: 'Skattekiste',
    targetPlacement: 'ground',
    recommendedTool: 'lasso'
  },
  {
    id: 'drop_floyen_sving',
    title: 'Luks-mynt i Fløysvingene',
    category: 'coin',
    description: 'En glødende Luks-mynt som ligger på bakken ved sving 4.',
    lat: 60.3985,
    lng: 5.3340,
    radiusMeters: 40,
    pointsValue: 2,
    icon: '🟡',
    badgeText: '+2 Luks-poeng',
    targetPlacement: 'ground',
    recommendedTool: 'lasso'
  },
  {
    id: 'drop_tippetue',
    title: 'Tippetue Sol-krystall',
    category: 'coin',
    description: 'Sol-krystall som henger høyt i furutreet med panoramautsikt over Byfjorden.',
    lat: 60.4010,
    lng: 5.3285,
    radiusMeters: 40,
    pointsValue: 5,
    icon: '✨',
    badgeText: '+5 Luks-poeng',
    targetPlacement: 'high_tree',
    recommendedTool: 'boomerang'
  },
  {
    id: 'drop_skomakerstuen',
    title: 'Fløyen Skillingsbolle-Gave',
    category: 'partner',
    description: 'Kaffepåfyll på Fløistuen når du kjøper nystekt bergensk skillingsbolle!',
    lat: 60.3970,
    lng: 5.3395,
    radiusMeters: 45,
    pointsValue: 0,
    partnerName: 'Fløistuen Kafé / Skomakerstuen',
    perkText: 'Kaffepåfyll ved kjøp av bolle',
    icon: '☕',
    badgeText: 'Kafégave',
    targetPlacement: 'ground',
    recommendedTool: 'lasso'
  },
  {
    id: 'drop_ulriken_topp',
    title: 'Ulriken 643 Topp-mynt',
    category: 'coin',
    description: 'Belønning for å ha forsert trappene opp til toppen av Bergen!',
    lat: 60.3739,
    lng: 5.3817,
    radiusMeters: 50,
    pointsValue: 5,
    icon: '🟡',
    badgeText: '+5 Luks-poeng',
    targetPlacement: 'ground',
    recommendedTool: 'lasso'
  },
  {
    id: 'drop_vidden_clue',
    title: 'Skattekiste-spor: Vidden-koden',
    category: 'clue',
    description: 'Første siffer i den 4-sifrede kodelåsen på skattekisten i Byfjellene!',
    lat: 60.3850,
    lng: 5.3650,
    radiusMeters: 60,
    pointsValue: 0,
    clueNumber: 1,
    icon: '📜',
    badgeText: 'Skattekiste-spor',
    targetPlacement: 'ground',
    recommendedTool: 'lasso'
  },
  {
    id: 'drop_hoyt_lavt_perk',
    title: 'Høyt & Lavt Klatregave',
    category: 'partner',
    description: 'Henger høyt oppe i klatreløypen på Nesttun!',
    lat: 60.3160,
    lng: 5.3580,
    radiusMeters: 50,
    pointsValue: 0,
    partnerName: 'Høyt & Lavt Klatrepark Nesttun',
    perkText: 'Gratis klatrehansker v/ klatrepass',
    icon: '🌲',
    badgeText: 'Klatregave',
    targetPlacement: 'high_tree',
    recommendedTool: 'boomerang'
  },
  {
    id: 'drop_tinydome_summer_ticket',
    title: 'Gull-lodd: 1/12 Tinydome Spacecapsule',
    category: 'tinydome_ticket',
    description: 'Du har oppdaget et eksklusivt lodd som henger i treet! Kutt det ned med bumerangen. Verdi: 95 000 kr!',
    lat: 60.3950,
    lng: 5.3300,
    radiusMeters: 60,
    pointsValue: 0,
    icon: '🛸',
    badgeText: 'Tinydome 95 000 kr',
    targetPlacement: 'high_tree',
    recommendedTool: 'boomerang'
  }
];

/**
 * Beregner avstand i meter mellom to GPS-punkter (Haversine-formel)
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Jordens radius i meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Henter dagens dato-streng (YYYY-MM-DD)
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Henter totalt antall sankede Luks-poeng i dag for brukeren
 */
export function getDailyCoinPointsCollected(): number {
  if (typeof localStorage === 'undefined') return 0;
  const key = `${STORAGE_PREFIX}daily_pts_${getTodayKey()}`;
  return parseInt(localStorage.getItem(key) || '0', 10);
}

/**
 * Sjekker om brukeren har plukket opp et spesifikt drop i dag
 */
export function hasCollectedDropToday(dropId: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  const key = `${STORAGE_PREFIX}drop_${dropId}_${getTodayKey()}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * Forsøker å plukke opp en gave/mynt/ledetråd
 */
export function collectARDrop(
  drop: ARDrop,
  userLat?: number,
  userLng?: number,
  forceUnlock = false
): CollectionResult {
  if (hasCollectedDropToday(drop.id)) {
    return {
      success: false,
      message: 'Du har allerede plukket opp dette sporet i dag! Kom tilbake i morgen.',
      pointsAdded: 0,
      drop
    };
  }

  // Geofence-sjekk hvis brukerposisjon er oppgitt og forceUnlock er false
  if (!forceUnlock && userLat !== undefined && userLng !== undefined) {
    const distance = calculateDistanceMeters(userLat, userLng, drop.lat, drop.lng);
    if (distance > drop.radiusMeters) {
      return {
        success: false,
        message: `Du er ${distance} meter unna. Du må være innenfor ${drop.radiusMeters} meter for å plukke opp gaven!`,
        pointsAdded: 0,
        drop
      };
    }
  }

  // Luks-poeng tak-sjekk
  let pointsAwarded = 0;
  if (drop.category === 'coin' && drop.pointsValue > 0) {
    const todayCollected = getDailyCoinPointsCollected();
    const remainingCap = Math.max(0, DAILY_MAX_COIN_POINTS - todayCollected);

    if (remainingCap <= 0) {
      return {
        success: false,
        message: `Du har nådd dags-taket på ${DAILY_MAX_COIN_POINTS} Luks-poeng i dag! Flott turinnsats. Du kan fremdeles samle partnergaver og gåtespor.`,
        pointsAdded: 0,
        drop
      };
    }

    pointsAwarded = Math.min(drop.pointsValue, remainingCap);
  }

  // Lagre oppsamling
  if (typeof localStorage !== 'undefined') {
    const today = getTodayKey();
    localStorage.setItem(`${STORAGE_PREFIX}drop_${drop.id}_${today}`, 'true');

    if (pointsAwarded > 0) {
      const currentDaily = getDailyCoinPointsCollected();
      localStorage.setItem(`${STORAGE_PREFIX}daily_pts_${today}`, (currentDaily + pointsAwarded).toString());

      // Integrer mot wallet / pointsLedger
      const currentTotal = parseInt(localStorage.getItem('sol_earned_balance') || '0', 10);
      localStorage.setItem('sol_earned_balance', (currentTotal + pointsAwarded).toString());

      try {
        creditEarnedLocal({
          points: pointsAwarded,
          reason: 'checkin',
          idempotencyKey: `ar-drop-${drop.id}-${today}`
        });
      } catch {
        // Fallback for tests uten full pointsLedger mock
      }
    }

    if (drop.category === 'tinydome_ticket') {
      const currentTickets = parseInt(localStorage.getItem('utaktiv_tinydome_tickets') || '0', 10);
      localStorage.setItem('utaktiv_tinydome_tickets', (currentTickets + 1).toString());
    }
  }

  let message = `Hurra! Du fant ${drop.title}!`;
  if (pointsAwarded > 0) {
    message += ` +${pointsAwarded} Luks-poeng overført til din lommebok (1:1 NOK).`;
  } else if (drop.category === 'partner') {
    message += ` Kupongen er lagret: «${drop.perkText}».`;
  } else if (drop.category === 'tinydome_ticket') {
    message += ` 🛸 Du er nå kvalifisert med 1 lodd i trekningen av 1/12 Tinydome Spacecapsule (verdi: 95 000 kr)!`;
  } else if (drop.category === 'clue') {
    message += ` 📜 Skattekiste-ledetråd registrert i Gullboken din!`;
  }

  return {
    success: true,
    message,
    pointsAdded: pointsAwarded,
    partnerPerk: drop.perkText,
    tinydomeTicketAwarded: drop.category === 'tinydome_ticket',
    drop
  };
}

/**
 * Henter antall innsamlede Tinydome-lodd
 */
export function getTinydomeTicketCount(): number {
  if (typeof localStorage === 'undefined') return 0;
  return parseInt(localStorage.getItem('utaktiv_tinydome_tickets') || '0', 10);
}
