/**
 * Sol på et punkt. Høyde og asimut kommer fra solar.ts.
 * Ryggen kommer fra en horisont som er målt i Kartverket, når den finnes.
 * Klokkeslettet regnes for datoen. Det lagres ikke.
 */

import { calculateSolarAltitude } from './solar';

export interface HorizonProfile {
  id: string;
  lat: number;
  lng: number;
  groundMeters: number;
  /** Én verdi per 15 grader, fra nord og med klokken. 0 betyr åpent vann eller lavere terreng. */
  ridgeDeg: number[];
  fetchedOn: string;
  source: string;
}

export interface SunSentence {
  sunriseLabel: string | null;
  sunsetLabel: string | null;
  litFromLabel: string | null;
  litToLabel: string | null;
  ridgeKnown: boolean;
  sentenceNo: string;
  sentenceEn: string;
}

const OSLO = 'Europe/Oslo';

interface OsloParts {
  key: string;
  hh: number;
  mm: number;
}

function osloParts(date: Date): OsloParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: OSLO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  let hh = Number(pick('hour'));
  if (hh === 24) hh = 0;
  return {
    key: `${pick('year')}-${pick('month')}-${pick('day')}`,
    hh,
    mm: Number(pick('minute')),
  };
}

export function osloDateKey(date: Date): string {
  return osloParts(date).key;
}

export function formatOsloClock(date: Date): string {
  const { hh, mm } = osloParts(date);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function osloMidnight(date: Date): Date {
  const key = osloDateKey(date);
  const [y, m, d] = key.split('-').map(Number);
  const start = Date.UTC(y, m - 1, d - 1, 0, 0, 0);
  for (let min = 0; min < 3 * 24 * 60; min += 1) {
    const t = new Date(start + min * 60000);
    const parts = osloParts(t);
    if (parts.key === key && parts.hh === 0 && parts.mm === 0) return t;
  }
  return new Date(Date.UTC(y, m - 1, d, 23, 0, 0));
}

function clockLabel(date: Date | null): string | null {
  if (!date) return null;
  return `kl. ${formatOsloClock(date)}`;
}

function interpolate(t0: Date, t1: Date, a0: number, a1: number): Date {
  const span = a1 - a0;
  const frac = span === 0 ? 0 : (0 - a0) / span;
  const clamped = Math.max(0, Math.min(1, frac));
  return new Date(t0.getTime() + clamped * (t1.getTime() - t0.getTime()));
}

export function findSunTimes(
  date: Date,
  lat: number,
  lng: number
): { sunrise: Date | null; sunset: Date | null } {
  const start = osloMidnight(date);
  let prevT = start;
  let prevAlt = calculateSolarAltitude(start, lat, lng).altitude;
  let sunrise: Date | null = null;
  let sunset: Date | null = null;

  for (let min = 1; min <= 24 * 60; min += 1) {
    const t = new Date(start.getTime() + min * 60000);
    const alt = calculateSolarAltitude(t, lat, lng).altitude;
    if (!sunrise && prevAlt <= 0 && alt > 0) sunrise = interpolate(prevT, t, prevAlt, alt);
    if (sunrise && !sunset && prevAlt > 0 && alt <= 0) sunset = interpolate(prevT, t, prevAlt, alt);
    prevT = t;
    prevAlt = alt;
  }

  return { sunrise, sunset };
}

export function ridgeAt(profile: HorizonProfile, azimuthDeg: number): number {
  const bins = profile.ridgeDeg;
  if (!bins.length) return 0;
  const step = 360 / bins.length;
  const idx = Math.round(azimuthDeg / step) % bins.length;
  const value = bins[(idx + bins.length) % bins.length];
  return Number.isFinite(value) ? value : 0;
}

function angleDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function describePlaceSun(input: {
  lat: number;
  lng: number;
  now: Date;
  horizon?: HorizonProfile | null;
  viewAzimuthDeg?: number;
  viewLabel?: string;
  cloudCoverPercent?: number;
  cloudIsMeasured?: boolean;
}): SunSentence {
  const { lat, lng, now } = input;
  const { sunrise, sunset } = findSunTimes(now, lat, lng);
  const sunriseLabel = clockLabel(sunrise);
  const sunsetLabel = clockLabel(sunset);
  const horizon = input.horizon && input.horizon.ridgeDeg.length > 0 ? input.horizon : null;

  let litFrom: Date | null = null;
  let litTo: Date | null = null;
  let viewFrom: Date | null = null;
  let viewTo: Date | null = null;

  if (horizon && sunrise && sunset) {
    const stepMs = 2 * 60000;
    for (let ms = sunrise.getTime(); ms <= sunset.getTime(); ms += stepMs) {
      const t = new Date(ms);
      const { altitude, azimuth } = calculateSolarAltitude(t, lat, lng);
      const lit = altitude > ridgeAt(horizon, azimuth) + 0.3;
      if (lit) {
        if (!litFrom) litFrom = t;
        litTo = t;
      }
      if (
        lit &&
        typeof input.viewAzimuthDeg === 'number' &&
        angleDelta(azimuth, input.viewAzimuthDeg) <= 40 &&
        altitude > 2
      ) {
        if (!viewFrom) viewFrom = t;
        viewTo = t;
      }
    }
  }

  const litFromLabel = clockLabel(litFrom);
  const litToLabel = clockLabel(litTo);
  const viewFromLabel = clockLabel(viewFrom);
  const viewToLabel = clockLabel(viewTo);

  const cloudLineNo =
    input.cloudIsMeasured && typeof input.cloudCoverPercent === 'number' && input.cloudCoverPercent >= 70
      ? ` Skydekket fra MET er ${Math.round(input.cloudCoverPercent)} prosent. Turen er der, sola er bak skyene.`
      : '';
  const cloudLineEn =
    input.cloudIsMeasured && typeof input.cloudCoverPercent === 'number' && input.cloudCoverPercent >= 70
      ? ` MET cloud cover is ${Math.round(input.cloudCoverPercent)} percent. The walk is there, the sun is behind cloud.`
      : '';

  let sentenceNo: string;
  let sentenceEn: string;

  if (!horizon) {
    sentenceNo = sunriseLabel && sunsetLabel
      ? `Sola står opp ${sunriseLabel} og går ned ${sunsetLabel}. Fjellet er ikke trukket fra, så dette er bare den astronomiske klokken.`
      : 'Solhøyden lot seg ikke regne for denne dagen.';
    sentenceEn = sunriseLabel && sunsetLabel
      ? `Sunrise ${sunriseLabel}, sunset ${sunsetLabel}. The mountain has not been subtracted, so this is only the astronomical clock.`
      : 'The sun altitude could not be calculated for this day.';
  } else if (litFromLabel && litToLabel) {
    const viewNo =
      input.viewLabel && viewFromLabel && viewToLabel
        ? ` Utsikten vender ${input.viewLabel}. Sola ligger i den retningen fra ${viewFromLabel} til ${viewToLabel}.`
        : input.viewLabel
          ? ` Utsikten vender ${input.viewLabel}. Sola står ikke i den retningen i dag.`
          : '';
    const viewEn =
      input.viewLabel && viewFromLabel && viewToLabel
        ? ` The view faces ${input.viewLabel}. The sun sits in that direction from ${viewFromLabel} to ${viewToLabel}.`
        : input.viewLabel
          ? ` The view faces ${input.viewLabel}. The sun is not in that direction today.`
          : '';
    sentenceNo = `På dette punktet står sola over terrenget fra ${litFromLabel} til ${litToLabel}.${viewNo}`;
    sentenceEn = `At this point the sun is above the terrain from ${litFromLabel} to ${litToLabel}.${viewEn}`;
  } else {
    sentenceNo = sunsetLabel
      ? `Terrenget ligger over sola hele dagen på dette punktet. Astronomisk solnedgang er ${sunsetLabel}.`
      : 'Terrenget ligger over sola hele dagen på dette punktet.';
    sentenceEn = sunsetLabel
      ? `The terrain is above the sun all day at this point. Astronomical sunset is ${sunsetLabel}.`
      : 'The terrain is above the sun all day at this point.';
  }

  return {
    sunriseLabel,
    sunsetLabel,
    litFromLabel,
    litToLabel,
    ridgeKnown: Boolean(horizon),
    sentenceNo: `${sentenceNo}${cloudLineNo}`,
    sentenceEn: `${sentenceEn}${cloudLineEn}`,
  };
}
