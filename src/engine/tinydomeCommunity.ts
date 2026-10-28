/**
 * Tinydome Eco-Samfunn Vestlandet & Eierandelsmodell
 * 
 * Spesifikasjoner:
 * - 6 til 20 Space Capsule boenheter på en privat flytebrygge/sjøtomt i Hardanger/Eidfjord.
 * - Arkitektonisk vinkling: Alle enheter har 180-graders fri utsikt til fjord og fjell,
 *   men er vinklet slik at ingen har innsyn til hverandre (100% privatliv).
 * - Ekte buede panoramavinduer (ikke telt!).
 * - Fellesfasiliteter: Felles flytende fjordbadstue, lekeplass, bålpanne, grill,
 *   sosial lavvo, samt robåt og kajakker (redningsvester påbudt på bryggen).
 * - App-styrt fellesskap: Dynamisk poeng- og lotterisystem for ukesfordeling,
 *   bestilling av renhold/utvask, internett, lokalmatkasser og ukesbytte.
 */

export interface TinydomeAmenity {
  id: string;
  name: string;
  icon: string;
  description: string;
  safetyNote?: string;
}

export interface TinydomeUnit {
  id: string;
  unitNumber: number;
  name: string;
  viewAngleDeg: number;
  capacity: string;
  panoramicGlassCoverage: string;
  status: 'pilot' | 'planlagt';
}

export interface TinydomeCommunityConfig {
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  unitCountMin: number;
  unitCountMax: number;
  currentPlannedUnits: number;
  privacyGuarantee: string;
  architectureType: string;
  sharePriceNok: number; // 95 000 kr for 1/12
  yearlyWeeks: number; // 4 uker per år (1 per sesong)
  estimatedYearlyRentalIncomeNok: number; // ca 32 000 kr
  completionTargetDate: string; // Juli 2027
  amenities: TinydomeAmenity[];
}

export const TINYDOME_COMMUNITY: TinydomeCommunityConfig = {
  name: 'Tinydome Eco-Samfunn Vestlandet',
  location: 'Eidfjord / Hardangerfjorden Waterfront',
  coordinates: { lat: 60.4682, lng: 7.0715 },
  unitCountMin: 6,
  unitCountMax: 20,
  currentPlannedUnits: 12,
  privacyGuarantee: 'Vinklet arkitektur: 100% fri fjordutsikt for alle enheter, 0% innsyn mellom naboer.',
  architectureType: 'Space Capsule med buede panoramavinduer i herdet glass (ingen teltduk).',
  sharePriceNok: 95000,
  yearlyWeeks: 4,
  estimatedYearlyRentalIncomeNok: 32000,
  completionTargetDate: 'Juli 2027 (Sommerfinalen i Eidfjord)',
  amenities: [
    {
      id: 'sauna',
      name: 'Felles Fjordbadstue',
      icon: '🧖‍♀️',
      description: 'Flytende sedertre-badstue med panorama-glassvegg mot fjorden og direkte badestige for forfriskende sjøbad.'
    },
    {
      id: 'playground',
      name: 'Naturlekeplass for barn',
      icon: '🛝',
      description: 'Trygg lekeplass i naturmaterialer med klatretårn, husker og sandkasse like ved samfunnets hjerte.',
      safetyNote: 'Barn må bruke redningsvest når de ferdes på flytebryggen utenfor boenhetene.'
    },
    {
      id: 'firepit_lavvo',
      name: 'Bålpanne, Grill & Sosial Lavvo',
      icon: '🔥',
      description: 'Stort felles samlingspunkt for kveldshygge, historiefortelling, grilling og fellesskap i all slags vær.'
    },
    {
      id: 'watercraft',
      name: 'Kajakker & Robåt',
      icon: '🛶',
      description: 'Stabile sjøkajakker og klassisk robåt tilgjengelig for alle beboere for rolige turer på blikkstille vann.',
      safetyNote: 'Redningsvester i alle størrelser henger lett tilgjengelig i utstyrsboden.'
    }
  ]
};

/**
 * 5 000 luks-poeng belønning for fullført tur i Bergen
 */
export const HIKE_COMPLETION_LUX_POINTS = 5000;

export interface LuxRewardOption {
  id: string;
  title: string;
  costLux: number;
  icon: string;
  description: string;
}

export const LUX_REWARD_CATALOG: LuxRewardOption[] = [
  {
    id: 'concert_ticket',
    title: 'Konsertbillett i Bergen',
    costLux: 5000,
    icon: '🎟️',
    description: 'Innløs 5 000 luks-poeng i rabattert billett til kultur- og konsertopplevelser i Bergen.'
  },
  {
    id: 'dinner_sauna',
    title: 'Middag & Fjordbadstue',
    costLux: 5000,
    icon: '🍽️',
    description: 'Nyt et lokalt måltid kombinert med en dampende økt i fjordbadstuen.'
  },
  {
    id: 'tinydome_summer_ticket',
    title: 'Ekstra Sommerlodd til Eidfjord-finalen',
    costLux: 2500,
    icon: '🛸',
    description: 'Doble dine vinnersjanser til 1/12 eierandel i Tinydome Space Capsule (verdi 95 000 kr).'
  }
];

/**
 * Henter antall opptjente luks-poeng fra lokalt minne
 */
export function getEarnedLuxPoints(): number {
  if (typeof localStorage === 'undefined') return 5000;
  const stored = localStorage.getItem('utaktiv_lux_points');
  if (!stored) {
    // Standard start-pott for aktiv turgåer
    localStorage.setItem('utaktiv_lux_points', '5000');
    return 5000;
  }
  return parseInt(stored, 10) || 0;
}

/**
 * Legger til luks-poeng ved fullført tur
 */
export function awardHikeCompletionLuxPoints(): number {
  if (typeof localStorage === 'undefined') return 5000;
  const current = getEarnedLuxPoints();
  const updated = current + HIKE_COMPLETION_LUX_POINTS;
  localStorage.setItem('utaktiv_lux_points', updated.toString());
  return updated;
}

/**
 * Beregner estimert leieinntekt basert på antall uker eieren velger å leie ut
 * Gjennomsnittlig ukesleie estimeres til 8 000 kr per uke.
 */
export function calculateRentalYield(weeksRentedOut: number): number {
  const boundedWeeks = Math.max(0, Math.min(4, weeksRentedOut));
  const ratePerWeek = 8000;
  return boundedWeeks * ratePerWeek;
}
