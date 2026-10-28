/**
 * Utaktiv Tinydome Eco-Samfunn Vestlandet Motor
 *
 * Forretnings- og arkitekturmotor for planlagte Tinydome-samfunn på Vestlandet:
 * - 6 til 20 luksuriøse, helårsisolerte Space Capsule / Geodesic glassboenheter.
 * - Minimum 50% til 100% buet herdet termo-panoramaglass eller optisk polykarbonat.
 * - STRENG KVALITETSREGEL: Ekte solide arkitektoniske byggverk — INGEN telt eller duker.
 * - 1/12 Eierandelsmodell (95 000 NOK, 4 uker/år, ca 32 000 NOK årlig estimert leieinntekt).
 * - Lodd- og trekningstracker koblet mot Sol-Jakt AR og turgåing.
 */

export interface TinydomeLocation {
  id: string;
  name: string;
  region: string;
  county: string;
  lat: number;
  lng: number;
  minUnits: number;
  maxUnits: number;
  defaultUnits: number;
  waterfrontDistanceMeters: number;
  description: string;
  scenicHighlight: string;
  sunConditions: string;
  accessInfo: string;
  nearbyPartners: string[];
}

export interface TinydomeUnit {
  id: string;
  unitNumber: number;
  name: string;
  glassCoveragePercent: number; // 50% to 100%
  glassMaterial: 'Buet 3-lags herdet termo-panoramaglass' | 'Optisk UV-skjermet polykarbonat (Makrolon)' | '100% Helglass Geodesic krystall-kuppel';
  structureType: 'Space Capsule Futura' | 'Geodesic Glass Dome' | 'Nordic Fjord Capsule';
  floorAreaM2: number;
  capacityGuests: number;
  bedSetup: string;
  features: string[];
  status: 'draw_prize' | 'available_share' | 'reserved';
  viewDirection: 'Fjordpanorama Sørvest' | 'Fjell- & Breutsikt' | 'Vannkant 180°' | 'Stjernehimmel 360°';
}

export interface RentalYieldCalculation {
  weeksSublet: number;
  totalNightsEligible: number;
  estimatedOccupiedNights: number;
  nightlyRateNok: number;
  grossRentalIncomeNok: number;
  platformAndCleaningFeeNok: number;
  netAnnualRentalIncomeNok: number;
  sharePriceNok: number;
  annualRoiPercent: number;
  weeksKeptForSelf: number;
}

export interface ArchitecturalSpecDetail {
  title: string;
  description: string;
  metric: string;
  noTentGuarantee: boolean;
}

export const GRAND_PRIZE_VALUE_NOK = 95000;
export const WEEKS_PER_SHARE = 4;
export const DEFAULT_NIGHTLY_RATE_NOK = 2800;
export const DEFAULT_PLATFORM_FEE_PERCENT = 15;
export const MIN_COMMUNITY_UNITS = 6;
export const MAX_COMMUNITY_UNITS = 20;
export const DEFAULT_COMMUNITY_UNITS = 12;

export const STORAGE_KEY_TINYDOME_TICKETS = 'utaktiv_tinydome_tickets';

/**
 * Utvalgte godkjente lokasjoner på Vestlandet for Tinydome-samfunn
 */
export const TINYDOME_LOCATIONS: TinydomeLocation[] = [
  {
    id: 'eidfjord-waterfront',
    name: 'Hardangerfjord & Eidfjord Fjordkant',
    region: 'Hardanger',
    county: 'Vestland',
    lat: 60.4682,
    lng: 7.0725,
    minUnits: 6,
    maxUnits: 20,
    defaultUnits: 12,
    waterfrontDistanceMeters: 15,
    description:
      'Plassert direkte i vannkanten mot Hardangerfjorden med ubrutt sikt mot Simadalsfjorden og de stupbratte vestlandsveggene. Kombinerer roen ved fjorden med gangavstand til historiske Hæreid-platået.',
    scenicHighlight: 'Panoramautsikt over fjorden der midnattssolen lyser opp fjordbassenget i juni og juli.',
    sunConditions: 'Optimal sør-vestvendt solvinkel med dagslys fra tidlig morgen til sene kveldstimer.',
    accessInfo: '2,5 timer med bil fra Bergen lufthavn Flesland via Hardangerbrua. Helårsvei helt frem.',
    nearbyPartners: ['Heit Fjordbadstue Eidfjord (150 m)', 'Sjel & Gane Gourmet (Kokken Arthur)', 'Hardangervidda Natursenter']
  },
  {
    id: 'byfjellene-bergen',
    name: 'Byfjellene & Ulriken Panorama',
    region: 'Bergen',
    county: 'Vestland',
    lat: 60.3739,
    lng: 5.3817,
    minUnits: 6,
    maxUnits: 12,
    defaultUnits: 8,
    waterfrontDistanceMeters: 450,
    description:
      'Spektakulær plassering over tregrensen på Byfjellene i Bergen. Panoramautsikt over Bergensdalen, Byfjorden og Nordsjøskjærgården.',
    scenicHighlight: '360° stjernekikkervindu over sengen og direkte utsyn mot solnedgangen i havet.',
    sunConditions: 'Høyfjellsbeliggenhet med maksimal dagslyseksponering og null lysforurensing om natten.',
    accessInfo: 'Tilgang via Ulriksbanen eller Fløibanen kombinert med naturskånsom sti.',
    nearbyPartners: ['Fløistuen Kafé', 'Skomakerstuen', 'Heit Sauna Bergen']
  },
  {
    id: 'folgefonna-jondal',
    name: 'Folgefonna Utsikt & Jondal Fjordterrasse',
    region: 'Indre Hardanger',
    county: 'Vestland',
    lat: 60.2764,
    lng: 6.2541,
    minUnits: 6,
    maxUnits: 16,
    defaultUnits: 10,
    waterfrontDistanceMeters: 25,
    description:
      'Et magisk møtepunkt mellom isbre og dypblå fjord. Dagslys og brevann skaper et helt unikt turkis lys i kuplene.',
    scenicHighlight: 'Direkte sikt mot Folgefonnas snødekte kappe og krystallklare badeviker.',
    sunConditions: 'Bred solvegg med lune kveldsvinder og skjermet for de hardeste kastevindene.',
    accessInfo: 'Fergeforbindelse Tørvikbygd–Jondal eller bil fra Odda/Rosendal.',
    nearbyPartners: ['Fonnavegen Fjordbad', 'Jondal Kajakk & Fjellføring', 'Hardanger Siderprodusenter']
  }
];

/**
 * Arkitektoniske spesifikasjoner — med eksplisitt garanti mot telt og duk
 */
export const ARCHITECTURAL_SPECS: ArchitecturalSpecDetail[] = [
  {
    title: '50% til 100% Panoramaglass',
    description:
      'Kuplene er konstruert med ekte buet 3-lags herdet isolerglass (argonfylt) eller optisk polykarbonat (Makrolon UV-blokkerende). Ingen teltduk, ingen blafring i vind, og krystallklar optisk sikt.',
    metric: '50% – 100% transparent flate',
    noTentGuarantee: true
  },
  {
    title: 'Solid Nordisk Værbestandighet',
    description:
      'Bygget på fast fundament med bærende rammer i romfarts-aluminium og limtre av kjernefuru. Tåler orkan på 45 m/s og 350 kg/m² snølast. 100% lydisolert mot vestlandsregn.',
    metric: '-25°C til +30°C sertifisert',
    noTentGuarantee: true
  },
  {
    title: 'Helårs Inneklima & Komfort',
    description:
      'Integrert inverter-varmepumpe, termisk gulvvarme og smart ventilasjon med varmegjenvinning (FTX). Aldri klam luft eller kondens, uansett årstid.',
    metric: 'Kontinuerlig 21°C innetemperatur',
    noTentGuarantee: true
  },
  {
    title: 'Nordisk Minimalistisk Interiør',
    description:
      'Skreddersydd innredning i hvitoljet nordisk eik og lokal skifer. Integrert luksusdobbeltseng under stjernekikkervindu, kaffebar, oppvarmet baderom med regndusj og vannbesparende toalett.',
    metric: '28 – 42 m² luksusboareal',
    noTentGuarantee: true
  },
  {
    title: 'Bærekraftig Off-Grid Kapasitet',
    description:
      'Integrerte transparente solceller i toppkrona, batteribank for overskuddskraft og skånsom pælefundamentering som etterlater null varige sår i sårbar vestlandsnatur.',
    metric: '100% reversibel etablering',
    noTentGuarantee: true
  }
];

/**
 * Genererer et nøyaktig samfunnsoppsett (blueprint) med mellom 6 og 20 boenheter
 */
export function generateCommunityBlueprint(
  locationId: string,
  requestedUnitCount: number = DEFAULT_COMMUNITY_UNITS
): TinydomeUnit[] {
  // Begrens til mellom 6 og 20 enheter
  const count = Math.min(MAX_COMMUNITY_UNITS, Math.max(MIN_COMMUNITY_UNITS, requestedUnitCount));

  const names = [
    'Aurora Spacecapsule 01 (Hovedpremien)',
    'Hardanger Fjordglimt 02',
    'Solhøyden Panorama 03',
    'Stjernekikkern 04',
    'Fjellkrystallen 05',
    'Midnattsol Fjordbryn 06',
    'Askeladdens Utkikk 07',
    'Folgefonna Speil 08',
    'Fjordbris Sør 09',
    'Hæreid Vidsyn 10',
    'Skjærgårdskuplen 11',
    'Vikingfjord Kapsel 12',
    'Dagslysro 13',
    'Solkysten 14',
    'Simadal Utsyn 15',
    'Vårglød Panorama 16',
    'Tindekuppelen 17',
    'Kveldsol Fjordkant 18',
    'Fjellbekken Capsule 19',
    'Zenith Helglass Horizon 20'
  ];

  const glassPercentages = [100, 85, 75, 65, 80, 70, 90, 85, 60, 75, 80, 100, 65, 70, 85, 90, 75, 80, 85, 100];
  const glassMaterials: TinydomeUnit['glassMaterial'][] = [
    '100% Helglass Geodesic krystall-kuppel',
    'Buet 3-lags herdet termo-panoramaglass',
    'Buet 3-lags herdet termo-panoramaglass',
    'Optisk UV-skjermet polykarbonat (Makrolon)',
    'Buet 3-lags herdet termo-panoramaglass',
    'Buet 3-lags herdet termo-panoramaglass',
    '100% Helglass Geodesic krystall-kuppel',
    'Buet 3-lags herdet termo-panoramaglass',
    'Optisk UV-skjermet polykarbonat (Makrolon)',
    'Buet 3-lags herdet termo-panoramaglass',
    'Buet 3-lags herdet termo-panoramaglass',
    '100% Helglass Geodesic krystall-kuppel',
    'Optisk UV-skjermet polykarbonat (Makrolon)',
    'Buet 3-lags herdet termo-panoramaglass',
    'Buet 3-lags herdet termo-panoramaglass',
    '100% Helglass Geodesic krystall-kuppel',
    'Buet 3-lags herdet termo-panoramaglass',
    'Buet 3-lags herdet termo-panoramaglass',
    'Buet 3-lags herdet termo-panoramaglass',
    '100% Helglass Geodesic krystall-kuppel'
  ];

  const structures: TinydomeUnit['structureType'][] = [
    'Space Capsule Futura',
    'Geodesic Glass Dome',
    'Space Capsule Futura',
    'Nordic Fjord Capsule',
    'Geodesic Glass Dome',
    'Space Capsule Futura',
    'Geodesic Glass Dome',
    'Space Capsule Futura',
    'Nordic Fjord Capsule',
    'Geodesic Glass Dome',
    'Space Capsule Futura',
    'Geodesic Glass Dome',
    'Nordic Fjord Capsule',
    'Space Capsule Futura',
    'Geodesic Glass Dome',
    'Space Capsule Futura',
    'Geodesic Glass Dome',
    'Space Capsule Futura',
    'Nordic Fjord Capsule',
    'Geodesic Glass Dome'
  ];

  const units: TinydomeUnit[] = [];

  for (let i = 0; i < count; i++) {
    const unitNumber = i + 1;
    const isFirst = unitNumber === 1;

    units.push({
      id: `tinydome-${locationId}-unit-${unitNumber.toString().padStart(2, '0')}`,
      unitNumber,
      name: names[i] || `Tinydome Kapsel ${unitNumber}`,
      glassCoveragePercent: glassPercentages[i % glassPercentages.length],
      glassMaterial: glassMaterials[i % glassMaterials.length],
      structureType: structures[i % structures.length],
      floorAreaM2: 28 + (unitNumber % 3) * 6,
      capacityGuests: unitNumber % 2 === 0 ? 4 : 2,
      bedSetup: unitNumber % 2 === 0 ? 'King-size dobbeltseng + 2 oppredde hemsplasser' : 'Luksus King-size seng under stjernehimmel',
      features: [
        `${glassPercentages[i % glassPercentages.length]}% panorama herdet termo-panoramaglass`,
        'Vannbåren gulvvarme & FTX klimastyring',
        'Privat bad med regndusj & toalett',
        'Skandinavisk eikekjøkken & Nespresso-bar',
        'Integrert Bose lyddesign & høyhastighets Starlink WiFi'
      ],
      status: isFirst ? 'draw_prize' : (unitNumber % 3 === 0 ? 'reserved' : 'available_share'),
      viewDirection:
        unitNumber % 4 === 0
          ? 'Stjernehimmel 360°'
          : unitNumber % 3 === 0
          ? 'Fjell- & Breutsikt'
          : unitNumber % 2 === 0
          ? 'Vannkant 180°'
          : 'Fjordpanorama Sørvest'
    });
  }

  return units;
}

/**
 * Beregner avkastning (ROI) og leieinntekter for 1/12 eierandel
 * En 1/12 eierandel gir 4 uker per år (totalt 28 netter: 1 uke vår, sommer, høst, vinter).
 * Eier kan velge hvor mange uker som beholdes til eget bruk vs. legges ut til leie via Utaktiv.
 */
export function calculateRentalYield(options: {
  weeksSublet: number;
  nightlyRateNok?: number;
  occupancyRatePercent?: number;
  platformFeePercent?: number;
}): RentalYieldCalculation {
  const weeksSublet = Math.min(WEEKS_PER_SHARE, Math.max(0, options.weeksSublet));
  const nightlyRate = Math.max(1000, options.nightlyRateNok ?? DEFAULT_NIGHTLY_RATE_NOK);
  const occupancyPercent = Math.min(100, Math.max(10, options.occupancyRatePercent ?? 85));
  const platformFeeRate = (options.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT) / 100;

  const totalNightsEligible = weeksSublet * 7;
  const estimatedOccupiedNights = Math.round((totalNightsEligible * occupancyPercent) / 100);

  const grossRentalIncomeNok = Math.round(estimatedOccupiedNights * nightlyRate);
  const platformAndCleaningFeeNok = Math.round(grossRentalIncomeNok * platformFeeRate);
  const netAnnualRentalIncomeNok = grossRentalIncomeNok - platformAndCleaningFeeNok;

  const annualRoiPercent = Number(((netAnnualRentalIncomeNok / GRAND_PRIZE_VALUE_NOK) * 100).toFixed(1));
  const weeksKeptForSelf = WEEKS_PER_SHARE - weeksSublet;

  return {
    weeksSublet,
    totalNightsEligible,
    estimatedOccupiedNights,
    nightlyRateNok: nightlyRate,
    grossRentalIncomeNok,
    platformAndCleaningFeeNok,
    netAnnualRentalIncomeNok,
    sharePriceNok: GRAND_PRIZE_VALUE_NOK,
    annualRoiPercent,
    weeksKeptForSelf
  };
}

/**
 * Henter brukerens nåværende Tinydome-lodd fra localStorage
 */
export function getTinydomeTicketCount(): number {
  if (typeof localStorage === 'undefined') return 0;
  const val = localStorage.getItem(STORAGE_KEY_TINYDOME_TICKETS);
  return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
}

/**
 * Tildeler lodd til brukeren og returnerer ny total
 */
export function addTinydomeTickets(count: number = 1): number {
  if (typeof localStorage === 'undefined') return 0;
  const current = getTinydomeTicketCount();
  const next = current + Math.max(1, count);
  localStorage.setItem(STORAGE_KEY_TINYDOME_TICKETS, next.toString());
  return next;
}

/**
 * Setter antall lodd direkte (nyttig for reset/tester)
 */
export function setTinydomeTicketCount(count: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TINYDOME_TICKETS, Math.max(0, count).toString());
}

/**
 * Liste over måter brukeren kan opptjene Tinydome-lodd på
 */
export const HOW_TO_EARN_TICKETS = [
  {
    title: 'Gull-lodd i Sol-Jakt AR',
    icon: '🛸',
    pointsDesc: '1 lodd per funnet gullcapsule',
    description: 'Sving lys-lassoen i SolCameraAR når du oppdager et svevende Tinydome-lodd i terrenget på Fløyen eller ved Korskirken.'
  },
  {
    title: 'Månedens Asbjørnsen & Moe Tur',
    icon: '📜',
    pointsDesc: '1 lodd per fullført eventyr',
    description: 'Fullfør månedens familieeventyr og løs gåten for å kvalifisere til den store sommerfinalen 2027.'
  },
  {
    title: 'Fjelltopp GPS-innsjekk',
    icon: '⛰️',
    pointsDesc: '1 lodd hver 5. topptur',
    description: 'Sjekk inn med ekte GPS på Ulriken, Fløyen eller Hæreid for å bevise at du sanker dagslys ute i naturen.'
  },
  {
    title: 'Lokal Partner-støtte',
    icon: '☕',
    pointsDesc: 'Bonuslodd ved kjøp',
    description: 'Nyt fjordbadstue hos Heit eller kaffe hos Sjel & Gane i Eidfjord for ekstra sommerlodd.'
  }
];
