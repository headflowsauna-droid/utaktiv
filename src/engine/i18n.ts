export type SupportedLanguage = 'no' | 'en';

const STORAGE_KEY = 'utaktiv_preferred_language';

export function getStoredLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'no' || saved === 'en') return saved;
    // Auto-detect browser language: if English, default to English for tourists!
    if (typeof navigator !== 'undefined' && navigator.language && !navigator.language.startsWith('no') && !navigator.language.startsWith('nb') && !navigator.language.startsWith('nn')) {
      return 'en';
    }
  } catch {
    // fallback
  }
  return 'no';
}

export function saveStoredLanguage(lang: SupportedLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export const TRANSLATIONS = {
  no: {
    // Brand & Header
    brandTagline: 'Dagslys, fjellturer, skiløyper & det som skjer i nærheten',
    exploreNorwayTitle: 'Norge fra topp til bunn',
    exploreNorwaySubtitle: 'Velg en region — finn dagens beste dagslysvindu, fjellene og dine lokale favorittsteder',
    languageToggle: 'Språk / Language',
    norwegian: 'Norsk',
    english: 'English',
    
    // Header & Actions
    friends: 'Venner',
    points: 'poeng',
    earned: 'opptjent',
    tripSavings: 'Turspleis',
    tripSavingsSub: 'Sett av litt til neste tur',
    familyPlanner: 'Tur & Bursdag',
    familyPlannerSub: 'Hvem er med? Lag invitasjon',
    sunJunior: 'Sol Junior',
    sunJuniorSub: 'Oppdrag og premie for ungene',
    sunMarket: 'Sol-Børsen',
    sunMarketSub: 'Bruk poengene på noe kult',
    
    // Hero Banner
    heroWinterBadge: 'Ut i naturen • Dagslys, turer & det som skjer nær deg',
    nearYou: 'i nærheten',
    selectedCity: 'valgt by',
    hideRadar: 'Skjul måler',
    seeRadar: 'Se solradar',
    goodDaylight: 'Bra dagslys ute nå — stikk ut!',
    eveningCozy: 'Kveld — tid for badstue og ro',
    heroHeadingPrefix: 'Få mer ut av',
    heroHeadingHighlight: 'Tjen poeng på hver tur',
    heroHeadingSuffix: '– løs dem inn på noe du faktisk husker.',
    heroDescriptionIntro: 'Se hva du rekker i dag:',
    heroDescriptionBody: 'Vi regner ut når dagslyset er på sitt beste og viser deg turer, skiløyper, fjordopplevelser og arrangementer — akkurat der du er. Sjekk inn ute med GPS, samle Luks-poeng og bytt dem mot skillingsboller, badstue eller konsertbilletter.',
    
    // Feed Filters & Sorting
    all: 'Alt',
    hikes: 'Fjelltur',
    ski: 'Skiløyper',
    nature: 'Fjord & Kyst',
    family: 'Familie',
    concerts: 'Konsert',
    festivals: 'Festival',
    sports: 'Sport & Løp',
    cafebar: 'Uteservering',
    accommodation: 'Overnatting & Hostel',
    seniorFilter: 'Senior & Rolig gange',
    touristFilter: 'Turist & Ikoniske perler',
    
    // Safety & Comfort Badges (Senior & Tourist)
    seniorSafetyBadge: 'Senior-trygghet',
    touristSecurityBadge: 'Turist-sikkerhet',
    surfacePaved: 'Asfaltert / Fast dekke',
    surfaceFirmGravel: 'Bred, fast grusvei',
    surfaceTrailRoots: 'Skogssti m/røtter',
    surfaceRoughRock: 'Ujevnt fjell og stein',
    benchesFrequent: 'Tett med hvilebenker 🪑',
    benchesOccasional: 'Noen hvilebenker',
    benchesNone: 'Ingen hvilebenker',
    toiletNearby: 'Offentlig toalett',
    toiletNone: 'Ingen toalett',
    parkingDistance: 'Parkering',
    shelteredSun: 'Lun solvegg',
    footwearSneakers: 'Vanlige joggesko holder',
    footwearHiking: 'Tursko m/god såle',
    footwearMountainBoots: 'Stødige fjellstøvler kreves',
    safeStartBefore: 'Siste trygge start',
    travelWarning: 'Advarsel reisetid',
    microclimateTip: 'Lokalt vær & føre',
    
    // Card Details
    completed: 'Fullført ✓',
    solPoints: 'Luks-poeng',
    easy: '🟢 Enkel',
    medium: '🔵 Middels',
    demanding: '🔴 Krevende',
    expert: '⚫ Ekspert',
    bookTickets: 'Bestill billetter',
    checkinGps: 'Sjekk inn (GPS)',
    planTrip: 'Planlegg tur',
    inviteFriends: 'Inviter venner',
    shareExperience: 'Gi som gave',
    viewOnMap: 'Se i kart',
    distance: 'avstand',
    minWalk: 'min gange',
    
    // Regions
    regionVestland: 'Vestland & Bergen (Åsane & 7-fjell)',
    regionVestlandTag: 'De 7 fjell, Åsane (Vikinghytten, Postveien, Sætregården) og Bryggen',
    regionHardanger: 'Eidfjord & Hardangerfjorden',
    regionHardangerTag: 'Kjeåsen, Vøringsfossen, Husedalen, Sjel & Gane og gratis badstue ved fjorden',
    regionRogaland: 'Rogaland & Lysefjorden',
    regionRogalandTag: 'Preikestolen, Kjerag og Jæren der havet møter himmelen',
    regionNordland: 'Nord-Norge & Midnattssol',
    regionNordlandTag: 'Sol klokka 02 om natta, nordlys og tinder som stikker opp av havet',
    regionTrondelag: 'Trøndelag & Bymarka',
    regionTrondelagTag: 'Nidelva, Nidarosdomen og Bymarka rett utenfor døra',
    regionAgder: 'Sørlandets Skjærgård',
    regionAgderTag: 'Svaberg og sjø, hvite trebyer og sommer som varer lenger her',
    regionOstland: 'Oslomarka & Hovedstaden',
    regionOstlandTag: 'Operataket, Oslofjorden og Nordmarka — 15 minutter fra sentrum',
  },
  en: {
    // Brand & Header
    brandTagline: 'Daylight, Scenic Fjords, Hiking & Cultural Events',
    exploreNorwayTitle: 'Journey Through Norway',
    exploreNorwaySubtitle: 'Tap a region to experience real-time daylight, majestic fjords, peaks and cultural highlights',
    languageToggle: 'Language / Språk',
    norwegian: 'Norsk',
    english: 'English',
    
    // Header & Actions
    friends: 'Friends',
    points: 'points',
    earned: 'earned',
    tripSavings: 'Trip Savings',
    tripSavingsSub: 'Group funds for trips',
    familyPlanner: 'Trips & Events',
    familyPlannerSub: 'Organize invites & hikes',
    sunJunior: 'Sun Junior',
    sunJuniorSub: 'Family quests & rewards',
    sunMarket: 'Sun Market',
    sunMarketSub: 'Activities & gift cards',
    
    // Hero Banner
    heroWinterBadge: 'Explore Norway • Daylight, Fjords & Adventure Guide',
    nearYou: 'near you',
    selectedCity: 'destination',
    hideRadar: 'Hide sensor',
    seeRadar: 'Live Sun Radar',
    goodDaylight: 'Great natural daylight now',
    eveningCozy: 'Evening / Time for sauna & relax',
    heroHeadingPrefix: 'Discover the pure magic of',
    heroHeadingHighlight: 'Earn points on every hike',
    heroHeadingSuffix: '– redeem them for unique Norwegian adventures.',
    heroDescriptionIntro: 'Your ultimate Norwegian expedition guide:',
    heroDescriptionBody: 'Chase the sun and capture the magic of Norway. We calculate the optimal daylight windows and guide you to world-famous hikes, fjord excursions, groomed ski tracks and hidden gems. Check in via GPS outdoors, collect Luks points, and redeem them for warm cinnamon buns, fjord saunas and tickets.',
    
    // Feed Filters & Sorting
    all: 'All',
    hikes: 'Hikes',
    ski: 'Skiing',
    nature: 'Fjords & Coast',
    family: 'Family',
    concerts: 'Concerts',
    festivals: 'Festivals',
    sports: 'Sports & Runs',
    cafebar: 'Scenic Cafes',
    accommodation: 'Accommodation & Hostels',
    seniorFilter: 'Senior & Easy Walk',
    touristFilter: 'Tourist & Iconic Highlights',
    
    // Safety & Comfort Badges (Senior & Tourist)
    seniorSafetyBadge: 'Senior Safety',
    touristSecurityBadge: 'Tourist Security',
    surfacePaved: 'Paved & smooth',
    surfaceFirmGravel: 'Firm gravel path',
    surfaceTrailRoots: 'Forest trail with roots',
    surfaceRoughRock: 'Rough mountain rock',
    benchesFrequent: 'Frequent rest benches 🪑',
    benchesOccasional: 'Occasional rest benches',
    benchesNone: 'No rest benches',
    toiletNearby: 'Public restroom',
    toiletNone: 'No restroom',
    parkingDistance: 'Parking',
    shelteredSun: 'Sheltered sun corner',
    footwearSneakers: 'Sneakers are fine',
    footwearHiking: 'Hiking shoes recommended',
    footwearMountainBoots: 'Sturdy mountain boots required',
    safeStartBefore: 'Latest safe start',
    travelWarning: 'Travel time warning',
    microclimateTip: 'Microclimate & weather tip',
    
    // Card Details
    completed: 'Completed ✓',
    solPoints: 'Luks points',
    easy: '🟢 Easy',
    medium: '🔵 Moderate',
    demanding: '🔴 Demanding',
    expert: '⚫ Expert',
    bookTickets: 'Book Tickets',
    checkinGps: 'Check in (GPS)',
    planTrip: 'Plan Adventure',
    inviteFriends: 'Invite Companions',
    shareExperience: 'Send as Gift',
    viewOnMap: 'View on Map',
    distance: 'distance',
    minWalk: 'min walk',
    
    // Regions
    regionVestland: 'Western Fjords & Bergen',
    regionVestlandTag: 'The 7 Mountains, Åsane trails, fjord cruises & coastal light',
    regionHardanger: 'Eidfjord & Hardangerfjord',
    regionHardangerTag: 'Kjeåsen, Vøringsfossen, Sjel & Gane restaurant & free fjord sauna',
    regionRogaland: 'Rogaland & Lysefjord',
    regionRogalandTag: 'Pulpit Rock (Preikestolen), Kjerag & golden beaches',
    regionNordland: 'Arctic Norway & Midnight Sun',
    regionNordlandTag: 'Midnight sun, northern lights & jagged peaks',
    regionTrondelag: 'Trøndelag & Bymarka',
    regionTrondelagTag: 'Historic wharves, Nidaros Cathedral & wild pine forests',
    regionAgder: 'Southern Archipelago',
    regionAgderTag: 'Sunny smooth rocks, historic lighthouses & coastal breeze',
    regionOstland: 'Oslo & The Great Forests',
    regionOstlandTag: 'The Opera House, Oslo Fjord & vast ski trails',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.no;

export function t(key: TranslationKey, lang: SupportedLanguage): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.no;
  return dict[key] || TRANSLATIONS.no[key] || (key as string);
}
