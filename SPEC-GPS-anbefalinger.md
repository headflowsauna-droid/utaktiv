# SPEC: GPS-baserte anbefalinger i Utaktiv

**Til:** Antigravity (kodeagent)  
**Fra:** Alexander / Grok Bot  
**Status:** Implementert MVP + Nasjonal by- og partnerstøtte

---

## 0. Rammer (må følges)
- **Stack:** Vite + React 18 + TypeScript + Tailwind + Lucide.
- **Ikke slett eller endre oppførselen til eksisterende funksjoner:** `profile.ts`, `activities.ts`, `solar.ts` og `recommender.ts` skal virke som før når posisjon/`context` mangler.
- **Tester:** Alle nye motorregler får tester i `src/test/`.
- **Miljøvariabler:** API-nøkler og klientnavn i `.env.local` (aldri committes).
- **Lanseringsbyer:** Bergen, Oslo, Stavanger, Kristiansand, Trondheim, Bodø. Modellen tåler at flere byer legges til som data, ikke kode.

---

## 1. Brukerflyt for posisjon
1. Ved første åpning (eller via toppfeltet): vis forklaring før nettleserens spørsmål (*"Vi bruker posisjonen bare på telefonen din for å finne ting i nærheten. Den lagres ikke hos oss."*). Knapper: **«Bruk posisjon»** / **«Velg by selv»**.
2. **«Bruk posisjon»** → `navigator.geolocation.getCurrentPosition` med `{ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }`. Grov posisjon holder.
3. Avslag, feil eller timeout → vis byvelger (de seks byene). Lagre valget i `localStorage` (`utaktiv.city`).
4. Byvelger er alltid tilgjengelig i toppfeltet, også når GPS er på (*"Bergen · i nærheten"* / *"Bodø · valgt by"*).
5. Spør aldri på nytt automatisk etter avslag. Innstillinger har bryter for å skru posisjon av/på.
6. Bruk `navigator.permissions.query({ name: 'geolocation' })` der det støttes for å vise riktig tilstand.

---

## 2. Personvern og GDPR
- Avstand beregnes på enheten. Rå GPS-koordinater sendes ikke til egen server og lagres aldri i `localStorage`.
- Til MET Norway og Entur sendes koordinater avrundet til maks **4 desimaler**.
- Siste posisjon holdes kun i minnet / `sessionStorage`, aldri i `localStorage` med full presisjon.

---

## 3. Datamodell (`src/engine/places.ts`)
```ts
export type Category = 'festival' | 'alpine' | 'xc_trail' | 'outdoor_bath' | 'sauna' | 'cafe' | 'climbing' | 'concert' | 'hike' | 'other';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'all_year';

export interface OpeningHours {
  weekly: { day: number; open: string; close: string }[]; // 0 = søndag, "07:00"
  exceptions?: { date: string; closed?: boolean; open?: string; close?: string }[];
  seasonRange?: { from: string; to: string }; // "MM-DD"
}

export interface Place {
  id: string;
  name: string;
  cityId: string;
  lat: number;
  lng: number;
  categories: Category[];
  indoor: boolean;
  outdoor: boolean;
  seasons: Season[];
  openingHours?: OpeningHours;
  url?: string;
  source: string;
  verifiedAt?: string;
}

export interface Partner {
  id: string;
  placeIds: string[];
  name: string;
  commissionNok?: number;
  commissionPct?: number;
  status: 'prospect' | 'active' | 'paused';
}

export interface Deal {
  id: string;
  partnerId: string;
  placeId: string;
  title: string;
  priceNok: number;
  originalPriceNok?: number;
  validFrom: string;
  validTo: string;
  trigger?: {
    minSunElevationDeg?: number;
    maxCloudCover?: number;
    weekdays?: number[];
    hours?: [string, string];
  };
  quota?: number;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}
```

---

## 4. Ny motor (`src/engine/location.ts`)
- `haversineKm(a: LatLng, b: LatLng): number` (jordradius 6371 km)
- `radiusBucket(km): 'walk' | 'near' | 'city' | 'day_trip' | 'far'` med grenser `1 / 5 / 20 / 120 km`
- `estimateTravelMin(km, mode: 'walk' | 'bike' | 'transit' | 'car')`: grovt anslag (gange 4,5 km/t, sykkel 15, kollektiv 20 inkl. venting, bil 50) × omvei-faktor 1,3
- `nearestCity(pos, cities): City`
- `isOpenNow(place, date): boolean | null` (`null` når åpningstider mangler)
- `isInSeason(place, date): boolean`

---

## 5. Utvidet scoring i `recommender.ts`
- Behold eksisterende funksjon og signatur. Legg til valgfritt argument `context?: RecommendationContext`. Uten `context` er resultatet identisk med tidligere.
- Vekter:
  - Profilmatch: 30
  - Avstand: 20 (`walk=1, near=0.8, city=0.5, day_trip=0.2, far=0`)
  - Åpen nå / i dag: 15 (`stengt nå → 0, ukjent → 0.5, åpen → 1`)
  - Sesong: 10 (utenfor sesong → filtreres bort helt)
  - Sol og vær fra `solar.ts`: 15 (utendørs får bonus ved høy sol og lite skydekke, innendørs får bonus ved regn/mørke)
  - Partnertilbud: maks 10
- **Annonsetak:** Tilbudsbonus kan aldri overstige 10 poeng, og en partner kan bare løfte et sted som allerede scorer minst 40 uten bonus. Maks 2 av de 5 øverste kortene kan være partnerkort. Partnerkort merkes `"Partnertilbud"`.
- **Hard filter før scoring:** utenfor sesong, permanent stengt, avstand > 120 km (med mindre bruker har valgt `"dagstur"`).

---

## 6. Datakilder (verifisert 24.10.2026)
- **Statisk partner- og stedsdatabase (MVP):** `src/data/places.json` (klargjort for Supabase PostGIS i v2).
- **Entur Journey Planner v3:** `https://api.entur.io/journey-planner/v3/graphql` med `ET-Client-Name: utaktiv-app` og koordinater avrundet til maks 4 desimaler.
- **MET Norway Locationforecast 2.0:** `https://api.met.no/weatherapi/locationforecast/2.0/compact` med koordinater avrundet til maks 4 desimaler.
- **Skiløyper:** Lenker direkte til `sporet.no` (Skisporet + iMarka). Ingen skraping.

---

## 7. UI-komponenter (`src/components/`)
- `LocationPrompt` – personvernsforklaring + «Bruk posisjon» / «Velg by selv».
- `LocationStatus` – statuspille i toppfeltet («Bergen · i nærheten» / «Bodø · valgt by»).
- `DistanceBadge` – f.eks. «800 m · 14 min gange».
- `OpenNowBadge` – «Åpent nå» / «Stengt nå» (skjules når ukjent).
- `DealBadge` – merket «Partnertilbud».

---

## 9. Tester i `src/test/gpsRecommender.test.ts` (16 krav)
1. `haversineKm` Bergen sentrum → Fløyen gir riktig avstand innen 5 %.
2. `haversineKm(a, a) === 0`.
3. `radiusBucket` på alle grenseverdier (1, 5, 20, 120 km).
4. `estimateTravelMin` øker monotont med avstand og er størst for gange.
5. `nearestCity` gir Voss-koordinat → Bergen, Sandnes → Stavanger.
6. `isOpenNow` innenfor, utenfor, over midnatt (22:00–02:00), unntaksdato stengt, ukjent → `null`.
7. `isInSeason` for vinterdata i juli → `false`; `all_year` → `true`; sesong over nyttår (des–mar).
8. `recommend` uten `context` gir identisk output som før.
9. Sted utenfor sesong filtreres bort.
10. Stengt sted rangeres under åpent sted med lik profilmatch.
11. Utendørs sted rangeres høyere ved sol enn ved regn; innendørs motsatt.
12. Tilbudsbonus overstiger aldri 10 poeng.
13. Sted under 40 poeng får ikke partnerbonus.
14. Maks 2 partnerkort blant topp 5.
15. Avvist posisjon → by fra `localStorage` brukes, og ingen koordinater lagres.
16. Koordinater sendt til MET/Entur er avrundet til maks 4 desimaler.
