/**
 * Føre på løyper fra MET. Prepareringsstatus er bevisst ikke live.
 * Skisporet.no og UT.no har ikke et stabilt nøkkelfritt API vi kaller.
 */

import { fetchMetForecast, type MetForecast } from './weather';

export interface TrailConditions {
  activityId: string;
  temperatureC: number;
  windMps: number;
  precipitationMm: number;
  cloudCoverPercent: number;
  grooming: 'unknown';
  source: 'met-norway';
  updatedAt: string;
  summaryNb: string;
}

function windLabel(windMps: number): string {
  if (windMps < 0.5) return 'nesten vindstille';
  if (windMps < 5) return 'lett vind';
  if (windMps < 10) return 'frisk vind';
  return 'sterk vind';
}

function precipLabel(precipitationMm: number): string {
  if (precipitationMm < 0.1) return 'opphold';
  if (precipitationMm < 1) return 'yr';
  return 'nedbør';
}

export function summarizeTrailNb(met: Pick<MetForecast, 'temperatureC' | 'windMps' | 'precipitationMm'>): string {
  const temp = `${Math.round(met.temperatureC)} °C`;
  return `${temp}, ${windLabel(met.windMps)}, ${precipLabel(met.precipitationMm)}. Prepareringsstatus er ikke livekoblet.`;
}

export function conditionsFromMet(activityId: string, met: MetForecast): TrailConditions {
  return {
    activityId,
    temperatureC: met.temperatureC,
    windMps: met.windMps,
    precipitationMm: met.precipitationMm,
    cloudCoverPercent: met.cloudCoverPercent,
    grooming: 'unknown',
    source: met.source,
    updatedAt: met.updatedAt,
    summaryNb: summarizeTrailNb(met),
  };
}

/** Ett MET-kall for løypas koordinater. Ikke bruk denne per kort i feeden. */
export async function fetchTrailConditions(
  activity: { id: string; coordinates: { lat: number; lng: number } },
  fetchImpl?: typeof fetch
): Promise<TrailConditions> {
  const met = await fetchMetForecast(activity.coordinates.lat, activity.coordinates.lng, fetchImpl);
  return conditionsFromMet(activity.id, met);
}
