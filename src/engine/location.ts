/**
 * Posisjons-, avstands-, sesong- og åpningstidsmotor for Utaktiv
 * Rene funksjoner uten nettverkskall. All avstandsberegning skjer lokalt på enheten (GDPR-sikkert).
 * I henhold til SPEC-GPS-anbefalinger.md (seksjon 1, 2 og 4).
 */

import { City, Place, Season } from './places';

export interface LatLng {
  lat: number;
  lng: number;
}

export type RadiusBucket = 'walk' | 'near' | 'city' | 'day_trip' | 'far';
export type TravelMode = 'walk' | 'bike' | 'transit' | 'car';

const EARTH_RADIUS_KM = 6371;
const DETOUR_FACTOR = 1.3;

const SPEED_KMH: Record<TravelMode, number> = {
  walk: 4.5,
  bike: 15,
  transit: 20,
  car: 50,
};

export const CITY_STORAGE_KEY = 'utaktiv.city';

/**
 * Avrunder koordinat til maks oppgitte desimaler (standard 4 desimaler for MET/Entur i hht. GDPR).
 */
export function roundCoord(value: number, maxDecimals = 4): number {
  const factor = Math.pow(10, maxDecimals);
  return Math.round(value * factor) / factor;
}

export function roundPositionForExternalApi(pos: LatLng, maxDecimals = 4): LatLng {
  return {
    lat: roundCoord(pos.lat, maxDecimals),
    lng: roundCoord(pos.lng, maxDecimals),
  };
}

/**
 * Beregner luftlinjeavstand i kilometer med Haversine-formelen (jordradius 6371 km).
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  if (a.lat === b.lat && a.lng === b.lng) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
  return EARTH_RADIUS_KM * c;
}

/**
 * Kategoriserer avstand i bøtter med grenser 1 / 5 / 20 / 120 km.
 */
export function radiusBucket(km: number): RadiusBucket {
  if (km <= 1) return 'walk';
  if (km <= 5) return 'near';
  if (km <= 20) return 'city';
  if (km <= 120) return 'day_trip';
  return 'far';
}

/**
 * Grovt reisetidsanslag i minutter (inkl. omvei-faktor 1.3).
 */
export function estimateTravelMin(km: number, mode: TravelMode): number {
  if (km <= 0) return 0;
  const speed = SPEED_KMH[mode];
  const effectiveKm = km * DETOUR_FACTOR;
  const minutes = (effectiveKm / speed) * 60;
  return Math.max(1, Math.round(minutes));
}

/**
 * Finner nærmeste by ut fra brukerens koordinater.
 */
export function nearestCity(pos: LatLng, cities: City[]): City {
  if (cities.length === 0) {
    throw new Error('nearestCity krever minst én by i listen');
  }
  let best = cities[0];
  let bestDist = haversineKm(pos, { lat: best.lat, lng: best.lng });

  for (let i = 1; i < cities.length; i++) {
    const d = haversineKm(pos, { lat: cities[i].lat, lng: cities[i].lng });
    if (d < bestDist) {
      bestDist = d;
      best = cities[i];
    }
  }
  return best;
}

function parseMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  return parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10);
}

function formatYyyyMmDd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMmDd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

/**
 * Sjekker om et sted er åpent akkurat nå på oppgitt tidspunkt.
 * Returnerer null dersom åpningstider mangler.
 * Håndterer unntaksdatoer (exceptions) og åpningstider som krysser midnatt (f.eks. 22:00–02:00).
 */
export function isOpenNow(place: Place, date: Date): boolean | null {
  if (place.permanentlyClosed) return false;
  if (!place.openingHours) return null;

  const { weekly, exceptions } = place.openingHours;
  const todayStr = formatYyyyMmDd(date);
  const nowMinutes = date.getHours() * 60 + date.getMinutes();

  // 1. Sjekk unntaksdato for i dag
  if (exceptions && exceptions.length > 0) {
    const todayEx = exceptions.find(e => e.date === todayStr);
    if (todayEx) {
      if (todayEx.closed) return false;
      if (todayEx.open && todayEx.close) {
        const openMin = parseMinutes(todayEx.open);
        const closeMin = parseMinutes(todayEx.close);
        if (closeMin > openMin) {
          return nowMinutes >= openMin && nowMinutes < closeMin;
        } else {
          // Krysser midnatt
          return nowMinutes >= openMin || nowMinutes < closeMin;
        }
      }
    }
  }

  // 2. Sjekk om gårsdagens åpningstid krysset midnatt inn i dagens morgentimer
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayDay = yesterday.getDay();
  const yesterdayStr = formatYyyyMmDd(yesterday);
  const yesterdayEx = exceptions?.find(e => e.date === yesterdayStr);

  if (!yesterdayEx?.closed) {
    const prevSlots = weekly.filter(w => w.day === yesterdayDay);
    for (const slot of prevSlots) {
      const openMin = parseMinutes(slot.open);
      const closeMin = parseMinutes(slot.close);
      if (closeMin <= openMin && nowMinutes < closeMin) {
        return true;
      }
    }
  }

  // 3. Sjekk dagens ordinære åpningstid
  const currentDay = date.getDay();
  const todaySlots = weekly.filter(w => w.day === currentDay);
  if (todaySlots.length === 0) return false;

  for (const slot of todaySlots) {
    const openMin = parseMinutes(slot.open);
    const closeMin = parseMinutes(slot.close);
    if (closeMin > openMin) {
      if (nowMinutes >= openMin && nowMinutes < closeMin) return true;
    } else {
      // Krysser midnatt (f.eks. 22:00 til 02:00): åpent fra 22:00 og ut døgnet (eller hvis kl < 02:00 samme natt)
      if (nowMinutes >= openMin || nowMinutes < closeMin) return true;
    }
  }

  return false;
}

function getSeasonFromMonth(month1To12: number): Season {
  if (month1To12 === 12 || month1To12 === 1 || month1To12 === 2) return 'winter';
  if (month1To12 >= 3 && month1To12 <= 5) return 'spring';
  if (month1To12 >= 6 && month1To12 <= 8) return 'summer';
  return 'autumn';
}

/**
 * Sjekker om et sted er i sesong på oppgitt dato.
 * Støtter både seasonRange ("MM-DD" inkl. over nyttår som "12-01" til "03-31") og Season-array.
 */
export function isInSeason(place: Place, date: Date): boolean {
  const range = place.openingHours?.seasonRange;
  if (range) {
    const mmdd = formatMmDd(date);
    if (range.from <= range.to) {
      if (mmdd < range.from || mmdd > range.to) return false;
    } else {
      // Over nyttår, f.eks. "12-01" til "03-31"
      if (mmdd < range.from && mmdd > range.to) return false;
    }
  }

  if (!place.seasons || place.seasons.length === 0) return true;
  if (place.seasons.includes('all_year')) return true;

  const currentSeason = getSeasonFromMonth(date.getMonth() + 1);
  return place.seasons.includes(currentSeason);
}

const memoryCityStorage = new Map<string, string>();

/**
 * GDPR-sikker lagring av kun valgt by i localStorage (lagrer aldri rå GPS-koordinater).
 */
export function saveSelectedCityToStorage(cityNameOrId: string): void {
  memoryCityStorage.set(CITY_STORAGE_KEY, cityNameOrId);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CITY_STORAGE_KEY, cityNameOrId);
    }
  } catch {}
}

export function getSelectedCityFromStorage(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(CITY_STORAGE_KEY);
      if (val !== null) return val;
    }
  } catch {}
  return memoryCityStorage.get(CITY_STORAGE_KEY) ?? null;
}

export function getStoredKeysSnapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of memoryCityStorage.entries()) {
    out[k] = v;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) out[k] = localStorage.getItem(k) || '';
      }
    }
  } catch {}
  return out;
}

export function clearCityStorage(): void {
  memoryCityStorage.clear();
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CITY_STORAGE_KEY);
    }
  } catch {}
}
