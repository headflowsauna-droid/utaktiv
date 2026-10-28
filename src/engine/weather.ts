/**
 * MET Norway locationforecast. Finner ikke på tall når kallet feiler.
 */

export const MET_USER_AGENT = 'Utaktiv/1.0 (https://utaktiv.no)';
const MET_ENDPOINT = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const CACHE_MS = 20 * 60 * 1000;

export interface MetForecast {
  cloudCoverPercent: number;
  temperatureC: number;
  windMps: number;
  precipitationMm: number;
  updatedAt: string;
  source: 'met-norway';
}

export interface MetOutlookPoint {
  time: string;
  cloudCoverPercent: number;
  temperatureC: number;
  windMps: number;
  precipitationMm: number;
}

export interface MetTimeseriesEntry {
  time: string;
  data?: {
    instant?: {
      details?: {
        air_temperature?: number;
        cloud_area_fraction?: number;
        wind_speed?: number;
      };
    };
    next_1_hours?: {
      details?: {
        precipitation_amount?: number;
      };
    };
  };
}

export class MetForecastError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'MetForecastError';
    this.status = status;
  }
}

interface CacheEntry {
  at: number;
  forecast: MetForecast;
  outlook: MetOutlookPoint[];
}

const cache = new Map<string, CacheEntry>();

export function clearMetForecastCache(): void {
  cache.clear();
}

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function runsInsidePackagedApp(): boolean {
  if (typeof window === 'undefined') return false;
  const protocol = window.location.protocol;
  return protocol === 'file:' || protocol === 'content:';
}

/** Nettleseren kan ikke sette User-Agent. Dev-serveren proxyer /api/met. Android-pakken kaller MET direkte. */
export function metRequestUrl(lat: number, lng: number): string {
  const query = `lat=${Number(lat.toFixed(4))}&lon=${Number(lng.toFixed(4))}`;
  if (typeof window !== 'undefined' && !runsInsidePackagedApp()) {
    return `/api/met/weatherapi/locationforecast/2.0/compact?${query}`;
  }
  return `${MET_ENDPOINT}?${query}`;
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new MetForecastError(`Mangler ${field} i MET-svar`);
  }
  return value;
}

/** Nærmeste tidspunkt. Ugyldige tidsstempler hoppes over. */
export function pickTimeseriesNear<T extends { time: string }>(
  timeseries: readonly T[],
  date: Date
): T | null {
  const target = date.getTime();
  let best: T | null = null;
  let bestDiff = Infinity;

  for (const entry of timeseries) {
    const stamp = Date.parse(entry.time);
    if (Number.isNaN(stamp)) continue;
    const diff = Math.abs(stamp - target);
    if (diff < bestDiff) {
      best = entry;
      bestDiff = diff;
    }
  }

  return best;
}

function forecastFromEntry(entry: MetTimeseriesEntry): MetForecast {
  const details = entry.data?.instant?.details;
  const cloud = requireFinite(details?.cloud_area_fraction, 'cloud_area_fraction');
  const temperatureC = requireFinite(details?.air_temperature, 'air_temperature');
  const windMps = requireFinite(details?.wind_speed, 'wind_speed');
  const precipitation = entry.data?.next_1_hours?.details?.precipitation_amount;
  const precipitationMm =
    typeof precipitation === 'number' && Number.isFinite(precipitation) ? precipitation : 0;

  return {
    cloudCoverPercent: Math.max(0, Math.min(100, cloud)),
    temperatureC,
    windMps,
    precipitationMm,
    updatedAt: entry.time,
    source: 'met-norway',
  };
}

function readTimeseries(body: unknown): MetTimeseriesEntry[] {
  if (!body || typeof body !== 'object') {
    throw new MetForecastError('Ugyldig MET-svar');
  }
  const timeseries = (body as { properties?: { timeseries?: unknown } }).properties?.timeseries;
  if (!Array.isArray(timeseries) || timeseries.length === 0) {
    throw new MetForecastError('MET-svar uten timeserier');
  }
  return timeseries as MetTimeseriesEntry[];
}

/**
 * Henter kompakt varsel. Cache i 20 min per posisjon avrundet til 2 desimaler.
 * Kaster MetForecastError ved nettverks- eller parsefeil.
 */
export async function fetchMetForecast(
  lat: number,
  lng: number,
  fetchImpl: typeof fetch = fetch
): Promise<MetForecast> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new MetForecastError('Ugyldig posisjon');
  }

  const key = cacheKey(lat, lng);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return { ...hit.forecast };
  }

  const url = metRequestUrl(lat, lng);
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': MET_USER_AGENT,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MET Norway-kall feilet';
    throw new MetForecastError(message);
  }

  if (!response.ok) {
    throw new MetForecastError(`MET Norway svarte ${response.status}`, response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new MetForecastError('Ugyldig JSON fra MET Norway');
  }

  const nearest = pickTimeseriesNear(readTimeseries(body), new Date());
  if (!nearest) {
    throw new MetForecastError('Ingen gyldig tid i MET-svar');
  }

  const forecast = forecastFromEntry(nearest);
  const outlook = readTimeseries(body)
    .map(pointFromEntry)
    .filter((point): point is MetOutlookPoint => point !== null);
  cache.set(key, { at: Date.now(), forecast, outlook });
  return { ...forecast };
}

function pointFromEntry(entry: MetTimeseriesEntry): MetOutlookPoint | null {
  try {
    const forecast = forecastFromEntry(entry);
    return {
      time: entry.time,
      cloudCoverPercent: forecast.cloudCoverPercent,
      temperatureC: forecast.temperatureC,
      windMps: forecast.windMps,
      precipitationMm: forecast.precipitationMm,
    };
  } catch {
    return null;
  }
}

/** Kommende timer fra samme MET-kall. Brukes av sol-alarmen. */
export async function fetchMetOutlook(
  lat: number,
  lng: number,
  fetchImpl: typeof fetch = fetch
): Promise<MetOutlookPoint[]> {
  const key = cacheKey(lat, lng);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return hit.outlook.map(point => ({ ...point }));
  }
  await fetchMetForecast(lat, lng, fetchImpl);
  const stored = cache.get(key);
  return stored ? stored.outlook.map(point => ({ ...point })) : [];
}
