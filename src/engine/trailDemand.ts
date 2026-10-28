/**
 * Nasjonal Etterspørsels- og Mulighetsmotor («Gullkartet») for Utaktiv
 * Lar familier, eldre, turgåere og bedrifter søke etter og ønske seg tilbud langs turen
 * i hele Norge: Badstue, Hytteleie, Elsykkel på grusstier, Padling, Via Ferrata,
 * Nordlys, Reinsdyr/Samisk opplevelse, Jakt/Fiske, Billeie, Turbuss og Utstyrsboks.
 *
 * Sikkerhet & Personvern:
 * - Ingen rå GPS-koordinater lagres.
 * - All brukerinput trimmes, lengdebegrenses og renses for HTML/skript-tegn.
 * - localStorage er begrenset til maks 100 forespørsler (FIFO) for å forhindre minnelekkasje/DoS.
 */

export type OutdoorOpportunityCategory =
  | 'sauna'
  | 'cabin'
  | 'ebike_gravel'
  | 'paddling'
  | 'via_ferrata'
  | 'northern_lights'
  | 'reindeer_nature'
  | 'hunting_fishing'
  | 'car_rental'
  | 'tour_bus'
  | 'gear_box';

export type AudienceSegment = 'family' | 'senior' | 'corporate' | 'friends';

export interface OpportunityCategoryMeta {
  id: OutdoorOpportunityCategory;
  title: string;
  shortTitle: string;
  emoji: string;
  description: string;
  partnerTypes: string[];
  avgBasketNok: number;
  estimatedCommissionPct: number;
}

export interface TrailOpportunityRequest {
  id: string;
  category: OutdoorOpportunityCategory;
  city: string;
  trailOrAreaName: string;
  audience: AudienceSegment;
  partySize: number;
  note: string;
  createdAt: string;
}

export interface AggregatedDemandHotspot {
  id: string;
  city: string;
  region: string;
  trailOrAreaName: string;
  category: OutdoorOpportunityCategory;
  requestCount: number;
  interestedPeopleCount: number;
  crowdBusThreshold?: number; // F.eks. 25 påmeldte utløser turbuss
  potentialPartnerExamples: string[];
  highlightReason: string;
}

const STORAGE_KEY = 'utaktiv.trail_demand_requests.v1';
const MAX_STORED_REQUESTS = 100;
const MAX_TEXT_LENGTH = 140;

const memoryDemandStore: TrailOpportunityRequest[] = [];

export const OPPORTUNITY_CATEGORIES: OpportunityCategoryMeta[] = [
  {
    id: 'sauna',
    title: 'Badstue & Varmestue ved løypa',
    shortTitle: 'Badstue',
    emoji: '🔥',
    description: 'Varm panoramabadstue eller fjordbadstue rett ved målgang etter vinterturen eller skituren.',
    partnerTypes: ['Heit Sauna', 'Pust', 'KOK', 'Damp', 'Norske badstuprodusenter'],
    avgBasketNok: 550,
    estimatedCommissionPct: 15,
  },
  {
    id: 'cabin',
    title: 'Hytteleie, Dagsturhytte & Koie',
    shortTitle: 'Hytteleie',
    emoji: '🛖',
    description: 'Leie av skogskoie, DNT-hytte, kystledhytte, støl eller varm dagsturhytte langs ruten.',
    partnerTypes: ['Inatur', 'DNT', 'Statskog', 'Lokale grunneiere & fjellstyrer'],
    avgBasketNok: 1650,
    estimatedCommissionPct: 12,
  },
  {
    id: 'ebike_gravel',
    title: 'Elsykkel på grusstier & Sykkelturer',
    shortTitle: 'Elsykkel & Grussti',
    emoji: '🚲',
    description: 'Utleie av elsykkel, grussykkel eller sykkelvogn for barn ved bilfrie grusveier og fjellveier.',
    partnerTypes: ['Rallarvegen Sykkelutleie', 'Lokal sykkelutleie', 'Skianlegg sommer/høst'],
    avgBasketNok: 890,
    estimatedCommissionPct: 15,
  },
  {
    id: 'paddling',
    title: 'Padleturer (Kajakk, Kano & SUP)',
    shortTitle: 'Padletur',
    emoji: '🛶',
    description: 'Rolig kanotur for familien på skogsvann eller skjærgårdskajakk med selvbetjent utlånsboks.',
    partnerTypes: ['Selvbetjente kajakkbokser', 'Padlesentre', 'Kystled & friluftsråd'],
    avgBasketNok: 690,
    estimatedCommissionPct: 15,
  },
  {
    id: 'via_ferrata',
    title: 'Via Ferrata, Klatrepark & Zipline',
    shortTitle: 'Via Ferrata & Klatring',
    emoji: '🧗',
    description: 'Sikrede klatrestier i fjellet med spektakulær utsikt og klatreparker i skogen for familier og bedrifter.',
    partnerTypes: ['Loen Active', 'Høyt & Lavt', 'Fjellhaugen / Straumsfjellet', 'Klatreparker'],
    avgBasketNok: 1190,
    estimatedCommissionPct: 12,
  },
  {
    id: 'northern_lights',
    title: 'Nordlys-jakt & Stjernehimmel-turer',
    shortTitle: 'Nordlys',
    emoji: '🌌',
    description: 'Kveldstur uten lysforurensning med bål, varm drikke, lavvo og nordlysvarsel i sanntid.',
    partnerTypes: ['Nordlysguider i Nord-Norge', 'Fjellstuer', 'Lavvo- og villmarkscamper'],
    avgBasketNok: 1450,
    estimatedCommissionPct: 15,
  },
  {
    id: 'reindeer_nature',
    title: 'Reinsdyr, Samisk kultur & Dyreopplevelser',
    shortTitle: 'Reinsdyr & Natur',
    emoji: '🦌',
    description: 'Møt reinsdyr på nært hold, hør samisk historiefortelling og joik rundt bålet i lavvo, eller dra på sledekjøring.',
    partnerTypes: ['Samiske reindriftsfamilier', 'Siida-opplevelser', 'Besøksgårder & hundekjørere'],
    avgBasketNok: 1350,
    estimatedCommissionPct: 15,
  },
  {
    id: 'hunting_fishing',
    title: 'Småviltjakt, Isfiske & Sanketurer',
    shortTitle: 'Jakt, Fiske & Sanking',
    emoji: '🎯',
    description: 'Jaktkort og introduksjonsjakt med kjentmann, isfiske på fjellvann for familier, eller sopp- og bærsanking.',
    partnerTypes: ['Inatur', 'Statskog', 'NJFF lokallag', 'Lokale jakt- og fiskeguider'],
    avgBasketNok: 1250,
    estimatedCommissionPct: 12,
  },
  {
    id: 'car_rental',
    title: 'Billeie & Bildeling til turen («Tur-bilen»)',
    shortTitle: 'Billeie til turen',
    emoji: '🚗',
    description: 'Leie av elbil med skiboks eller sykkelstativ i 4 timer eller en helg for familier og eldre uten egen bil.',
    partnerTypes: ['Hyre', 'Getaround', 'Avis / Hertz', 'Bilkollektivet'],
    avgBasketNok: 1490,
    estimatedCommissionPct: 12,
  },
  {
    id: 'tour_bus',
    title: 'Turbuss & Skibuss («Folkekrav-bussen»)',
    shortTitle: 'Turbuss / Skibuss',
    emoji: '🚌',
    description: 'Direktebuss fra sentrum til turløypa, skianlegget eller badstuen når nok familier eller seniorer melder seg på.',
    partnerTypes: ['Tide Buss', 'Vy Buss', 'Lokale turbusselskaper', 'Fjordbåter'],
    avgBasketNok: 320,
    estimatedCommissionPct: 18,
  },
  {
    id: 'gear_box',
    title: 'Utstyrsboks ved løypestart («Prøv uten å eie»)',
    shortTitle: 'Utstyrsleie',
    emoji: '🎒',
    description: 'Lås opp bæremeis, truger, fiskeutstyr, hengekøye, akebrett eller vedsekk på parkeringen med Vipps.',
    partnerTypes: ['BUA / Utstyrsbokser', 'Sportsbutikker', 'Skianlegg & Turisthytter'],
    avgBasketNok: 250,
    estimatedCommissionPct: 20,
  },
];

export const INITIAL_DEMAND_HOTSPOTS: AggregatedDemandHotspot[] = [
  {
    id: 'hotspot-bergen-floyen-sauna',
    city: 'Bergen',
    region: 'Vestland',
    trailOrAreaName: 'Fløyen / Skomakerdiket & Brushytten',
    category: 'sauna',
    requestCount: 142,
    interestedPeopleCount: 418,
    potentialPartnerExamples: ['Heit Sauna (Skogsbadstue)', 'Fløibanen / Fløistuen'],
    highlightReason: 'Barnefamilier og seniorer ønsker varm skogsbadstue oppe ved Skomakerdiket etter vinterturen.',
  },
  {
    id: 'hotspot-bergen-byfjell-ebike',
    city: 'Bergen',
    region: 'Vestland',
    trailOrAreaName: 'Fjellveien – Munkebotn – Sandviksfjellet (Grusvei)',
    category: 'ebike_gravel',
    requestCount: 89,
    interestedPeopleCount: 234,
    potentialPartnerExamples: ['Bergen Elsykkelutleie', 'Bysykkel / Sportsbutikk'],
    highlightReason: 'Stor etterspørsel etter elsykkel med barnevogn på de bilfrie grusveiene i Byfjellene.',
  },
  {
    id: 'hotspot-bergen-eikedalen-bus',
    city: 'Bergen',
    region: 'Vestland',
    trailOrAreaName: 'Bergen Sentrum -> Eikedalen / Kvamskogen Skibuss & Badstue',
    category: 'tour_bus',
    requestCount: 64,
    interestedPeopleCount: 196,
    crowdBusThreshold: 25,
    potentialPartnerExamples: ['Tide Buss', 'Eikedalen Skisenter'],
    highlightReason: 'Familier uten bil og seniorgrupper ønsker direkte ekspressbuss på solskinnsdager i vinter.',
  },
  {
    id: 'hotspot-bodo-keiservarden-aurora',
    city: 'Bodø',
    region: 'Nordland',
    trailOrAreaName: 'Keiservarden & Bodømarka Nordlys- og Lavvotur',
    category: 'northern_lights',
    requestCount: 118,
    interestedPeopleCount: 340,
    potentialPartnerExamples: ['Pust Badstue Bodø', 'Lokale Nordlysguider & Turisthytta'],
    highlightReason: 'Kombinasjon av kveldstur under nordlyset i Bodømarka med varm lavvo og badstue i havna.',
  },
  {
    id: 'hotspot-bodo-reindeer-sapmi',
    city: 'Bodø',
    region: 'Nordland',
    trailOrAreaName: 'Saltfjellet / Salten – Reinsdyr, Lavvo & Samisk historie',
    category: 'reindeer_nature',
    requestCount: 95,
    interestedPeopleCount: 310,
    potentialPartnerExamples: ['Lokale reindriftsutøvere i Salten / Nord-Norge'],
    highlightReason: 'Barnefamilier, skoler og turister etterspør ekte møter med reinsdyr og samisk bålkultur.',
  },
  {
    id: 'hotspot-oslo-nordmarka-cabin-car',
    city: 'Oslo',
    region: 'Østlandet',
    trailOrAreaName: 'Sognsvann / Kikut – Elsykkel på grusvei + Skogskoie',
    category: 'cabin',
    requestCount: 164,
    interestedPeopleCount: 490,
    potentialPartnerExamples: ['DNT Oslo og Omegn', 'Inatur', 'Hyre Bildeling'],
    highlightReason: 'Høy etterspørsel etter 1-klikks pakke med helgebil/elsykkel og overnatting i markakoie.',
  },
  {
    id: 'hotspot-trondheim-bymarka-hunting',
    city: 'Trondheim',
    region: 'Trøndelag',
    trailOrAreaName: 'Trøndelag / Bymarka & Fjellstyrene – Introduksjonsjakt & Isfiske',
    category: 'hunting_fishing',
    requestCount: 77,
    interestedPeopleCount: 215,
    potentialPartnerExamples: ['Inatur', 'Statskog', 'NJFF Sør-Trøndelag'],
    highlightReason: 'Foreldre og unge voksne ønsker lavterskel isfiske og småviltjakt med guide og ferdig lånt utstyr.',
  },
  {
    id: 'hotspot-stavanger-lysefjorden-viaferrata',
    city: 'Stavanger',
    region: 'Rogaland',
    trailOrAreaName: 'Lysefjorden / Straumsfjellet – Via Ferrata, Kajakk & Badstue',
    category: 'via_ferrata',
    requestCount: 103,
    interestedPeopleCount: 288,
    potentialPartnerExamples: ['Damp Sauna', 'Høyt & Lavt', 'Lysefjorden Kajakk & Via Ferrata'],
    highlightReason: 'Bedrifter (sykefraværstiltak) og familier med tenåringer ønsker ferdig dagspakke med transport.',
  },
  {
    id: 'hotspot-kristiansand-skjergard-paddling',
    city: 'Kristiansand',
    region: 'Agder',
    trailOrAreaName: 'Odderøya & Bragdøya – Skjærgårdskajakk, Kystledhytte & Sjøbad',
    category: 'paddling',
    requestCount: 81,
    interestedPeopleCount: 229,
    potentialPartnerExamples: ['Bystranda Sauna', 'Bragdøya Kystlag', 'Kajakkboks'],
    highlightReason: 'Familier ønsker selvbetjent kano-/kajakkboks kombinert med oppvarmet badstue året rundt.',
  },
];

/**
 * Rens og begrens brukertekst for å forhindre XSS og for lange strenger
 */
export function sanitizeUserText(input: string, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Hent alle lagrede brukerønsker fra localStorage (eller minne-fallback i testmiljø)
 */
export function getStoredOpportunityRequests(): TrailOpportunityRequest[] {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...memoryDemandStore];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_STORED_REQUESTS);
      }
    }
  } catch {
    // Fallback til minnelager
  }
  return [...memoryDemandStore];
}

/**
 * Registrer et nytt ønske / behov fra en familie, seniorgruppe eller bedrift
 */
export function submitOpportunityRequest(input: {
  category: OutdoorOpportunityCategory;
  city: string;
  trailOrAreaName: string;
  audience: AudienceSegment;
  partySize: number;
  note?: string;
}): TrailOpportunityRequest {
  const validCategories = new Set(OPPORTUNITY_CATEGORIES.map(c => c.id));
  const safeCategory: OutdoorOpportunityCategory = validCategories.has(input.category)
    ? input.category
    : 'sauna';

  const safeCity = sanitizeUserText(input.city || 'Bergen', 40) || 'Bergen';
  const safeTrail =
    sanitizeUserText(input.trailOrAreaName || `Tursti i ${safeCity}`, 80) || `Tursti i ${safeCity}`;
  const safePartySize = Math.max(1, Math.min(100, Math.round(Number(input.partySize) || 2)));
  const safeNote = sanitizeUserText(input.note || '', MAX_TEXT_LENGTH);

  const newRequest: TrailOpportunityRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: safeCategory,
    city: safeCity,
    trailOrAreaName: safeTrail,
    audience: input.audience || 'family',
    partySize: safePartySize,
    note: safeNote,
    createdAt: new Date().toISOString(),
  };

  const existing = getStoredOpportunityRequests();
  const updated = [newRequest, ...existing].slice(0, MAX_STORED_REQUESTS);

  memoryDemandStore.length = 0;
  memoryDemandStore.push(...updated);

  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignorer hvis localStorage er full
  }

  return newRequest;
}

/**
 * Nullstill lagrede ønsker (for enhetstester)
 */
export function clearOpportunityRequestsForTests(): void {
  memoryDemandStore.length = 0;
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignorer
  }
}

/**
 * Kombiner eksisterende nasjonale hotspots med brukerens egne innsendte ønsker
 * og filtrer etter by og/eller kategori.
 */
export function getAggregatedDemandHotspots(options?: {
  city?: string;
  category?: OutdoorOpportunityCategory | 'all';
  searchQuery?: string;
}): AggregatedDemandHotspot[] {
  const userRequests = getStoredOpportunityRequests();
  const hotspotsMap = new Map<string, AggregatedDemandHotspot>();

  for (const h of INITIAL_DEMAND_HOTSPOTS) {
    hotspotsMap.set(h.id, { ...h });
  }

  for (const req of userRequests) {
    // Sjekk om det finnes en eksisterende hotspot for samme by og kategori
    const existingMatch = Array.from(hotspotsMap.values()).find(
      h =>
        h.city.toLowerCase() === req.city.toLowerCase() &&
        h.category === req.category
    );

    if (existingMatch) {
      existingMatch.requestCount += 1;
      existingMatch.interestedPeopleCount += req.partySize;
      if (req.note) {
        existingMatch.highlightReason = `Siste ønske (${req.partySize} pers): «${req.note}»`;
      }
    } else {
      const catMeta = OPPORTUNITY_CATEGORIES.find(c => c.id === req.category);
      const customId = `custom-${req.city.toLowerCase()}-${req.category}`;
      const currentCustom = hotspotsMap.get(customId);
      if (currentCustom) {
        currentCustom.requestCount += 1;
        currentCustom.interestedPeopleCount += req.partySize;
      } else {
        hotspotsMap.set(customId, {
          id: customId,
          city: req.city,
          region: 'Norge',
          trailOrAreaName: req.trailOrAreaName,
          category: req.category,
          requestCount: 1,
          interestedPeopleCount: req.partySize,
          crowdBusThreshold: req.category === 'tour_bus' ? 25 : undefined,
          potentialPartnerExamples: catMeta?.partnerTypes || ['Lokal partner'],
          highlightReason: req.note || `Nytt ønske meldt inn for ${req.trailOrAreaName}.`,
        });
      }
    }
  }

  let results = Array.from(hotspotsMap.values());

  if (options?.city && options.city !== 'all') {
    results = results.filter(h => h.city.toLowerCase() === options.city!.toLowerCase());
  }

  if (options?.category && options.category !== 'all') {
    results = results.filter(h => h.category === options.category);
  }

  if (options?.searchQuery && options.searchQuery.trim().length > 0) {
    const q = options.searchQuery.trim().toLowerCase();
    results = results.filter(h => {
      const catMeta = OPPORTUNITY_CATEGORIES.find(c => c.id === h.category);
      return (
        h.trailOrAreaName.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.highlightReason.toLowerCase().includes(q) ||
        (catMeta && catMeta.title.toLowerCase().includes(q)) ||
        h.potentialPartnerExamples.some(p => p.toLowerCase().includes(q))
      );
    });
  }

  return results.sort((a, b) => b.interestedPeopleCount - a.interestedPeopleCount);
}

/**
 * Beregn samlet estimert årlig omsetningspotensial (GMV) og Utaktiv-provisjon
 * basert på registrert etterspørsel i «Gullkartet».
 */
export function calculateDemandMarketValue(hotspots: AggregatedDemandHotspot[]): {
  totalInterestedPeople: number;
  totalRequests: number;
  estimatedAnnualGmvNok: number;
  estimatedUtaktivCommissionNok: number;
} {
  let totalInterestedPeople = 0;
  let totalRequests = 0;
  let estimatedAnnualGmvNok = 0;
  let estimatedUtaktivCommissionNok = 0;

  for (const h of hotspots) {
    totalInterestedPeople += h.interestedPeopleCount;
    totalRequests += h.requestCount;
    const meta = OPPORTUNITY_CATEGORIES.find(c => c.id === h.category);
    const basket = meta?.avgBasketNok ?? 600;
    const commPct = meta?.estimatedCommissionPct ?? 15;
    // Antar at hver registrert gruppe/interesse gjennomfører 4 turer i året når tilbudet åpner
    const annualBookings = h.requestCount * 4;
    const gmv = annualBookings * basket;
    estimatedAnnualGmvNok += gmv;
    estimatedUtaktivCommissionNok += Math.round((gmv * commPct) / 100);
  }

  return {
    totalInterestedPeople,
    totalRequests,
    estimatedAnnualGmvNok,
    estimatedUtaktivCommissionNok,
  };
}
