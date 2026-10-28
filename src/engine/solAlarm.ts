/**
 * Rene sol-alarmfunksjoner. Ingen Notification-kall — må kunne kjøre i node.
 */

import { estimateLux } from './solar';

const WEEKDAYS_NB = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'] as const;

export interface SolWindow {
  time: string;
  lux: number;
  cloudCoverPercent: number;
}

export function skyLabelFromCloud(cloudCoverPercent: number): 'klarvær' | 'delvis sky' | 'overskyet' {
  if (cloudCoverPercent < 30) return 'klarvær';
  if (cloudCoverPercent < 70) return 'delvis sky';
  return 'overskyet';
}

/** Første prøve i gitt rekkefølge som når luks-terskelen. */
export function findSolWindow(
  samples: { time: string; cloudCoverPercent: number; altitudeDegrees: number }[],
  minLux: number
): SolWindow | null {
  for (const sample of samples) {
    const lux = estimateLux(sample.altitudeDegrees, sample.cloudCoverPercent);
    if (lux >= minLux) {
      return {
        time: sample.time,
        lux,
        cloudCoverPercent: sample.cloudCoverPercent,
      };
    }
  }
  return null;
}

export function formatSolAlarm(city: string, solWindow: SolWindow): string {
  const parsed = new Date(solWindow.time);
  const valid = !Number.isNaN(parsed.getTime());
  const hh = valid ? String(parsed.getHours()).padStart(2, '0') : '--';
  const mm = valid ? String(parsed.getMinutes()).padStart(2, '0') : '--';
  const weekday = valid ? WEEKDAYS_NB[parsed.getDay()] : 'ukjent dag';
  const lux = Math.round(solWindow.lux);
  const sky = skyLabelFromCloud(solWindow.cloudCoverPercent);
  return `Det meldes ${lux} luks og ${sky} i ${city} kl. ${hh}:${mm} ${weekday}.`;
}
