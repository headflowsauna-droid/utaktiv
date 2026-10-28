# Spesifikasjon og Arkitektur: Utaktiv

Dette dokumentet definerer datamodeller, matching-algoritmer og scraper-integrasjoner for **Utaktiv**.

---

## 1. Datamodeller

### 1.1 Bruker- og Familieprofil (`UserProfile`)
```typescript
export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  needsStroller: boolean;      // Under 3 år -> krever vognvennlig underlag
  energyLevel: 'low' | 'medium' | 'high';
  interests: string[];         // f.eks. ["lekeplass", "klatring", "dyr", "is", "bading"]
}

export interface UserProfile {
  id: string;
  name: string;
  address: string;             // F.eks. "Fantoftvegen, Bergen"
  city: string;                // F.eks. "Bergen"
  coordinates: {
    lat: number;
    lng: number;
  };
  transportMode: 'foot' | 'bike' | 'public' | 'car';
  hasChildren: boolean;
  children: ChildProfile[];
  musicTaste: {
    favoriteArtists: string[]; // F.eks. ["Jason Mraz", "Jack Johnson", "Sigrid", "Sondre Lerche"]
    genres: string[];          // F.eks. ["akustisk", "pop", "indie", "jazz", "folk"]
    outdoorConcertsOnly: boolean;
  };
  activityPreferences: string[]; // F.eks. ["fjelltur", "park", "show", "uteservering", "utsikt"]
  preferredDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
}
```

### 1.2 Aktivitet & Event (`ActivityItem`)
```typescript
export interface ActivityItem {
  id: string;
  title: string;               // F.eks. "Jason Mraz – Sommerkonsert på Koengen"
  category: 'concert' | 'show' | 'family' | 'nature' | 'cafebar' | 'festival';
  description: string;
  locationName: string;        // F.eks. "Koengen / Bergenhus Festning" eller "Fløyen"
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isOutdoor: boolean;          // Er arrangementet eller stedet utendørs?
  date?: string;               // ISO-dato hvis tidsfestet event (f.eks. konsert)
  time?: string;               // F.eks. "18:00"
  durationMinutes: number;     // F.eks. 120
  targetAgeMin?: number;       // For barneshow
  targetAgeMax?: number;
  strollerAccessible: boolean; // Barnevognvennlig
  tripAdvisorRating?: number;  // F.eks. 4.8
  reviewCount?: number;
  sourceUrl: string;
  artists?: string[];          // For konserter
  estimatedLux: number;        // Forventet luks ved sol/dagtid
}
```

---

## 2. Scraping- og Aggregerings-kilder

1. **Konserter & Festivaler:**
   * **Ticketmaster & Songkick API/Scraper:** Filtrerer på utendørsarenaer (Koengen, Sverresborg, Sukkerbiten, Ravnedalen, Bislett etc.) og matcher mot artistlisten i brukerprofilen.
2. **TripAdvisor & Google Places:**
   * Henter de 20 best ratede utendørsattraksjonene i brukerens by (parker, utsiktspunkter, uteserveringer).
3. **Barnas Turlag & Kommunekalendere:**
   * Henter gratis familieshow, trollstier, lysvandringer og naturarrangementer.

---

## 3. Concierge Matching-Algoritme (`recommender.ts`)

Algoritmen beregner en **MatchScore (0–100)** for hver aktivitet:
1. **Familie- og Alderskompatibilitet (Vekt: 35 %):**
   * Hvis familien har barn under 3 år og turen/stedet ikke er vognvennlig: Trekk 40 poeng.
   * Hvis aktiviteten er rettet mot barnas aldersgruppe: +30 poeng.
2. **Musikk- og Interesse-match (Vekt: 35 %):**
   * Direkte artisttreff (f.eks. Jason Mraz): +50 poeng (umiddelbar topp-anbefaling).
   * Sjanger/kategori-match: +20 poeng.
3. **Sol- & Dagslysfaktor (Vekt: 30 %):**
   * Er aktiviteten utendørs midt på dagen i et gunstig luks-vindu (>5000 luks): +25 poeng.
   * Finner den sted under en registrert «solluke» i skydekket: +15 bonuspoeng.
