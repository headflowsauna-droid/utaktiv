import { beforeEach, describe, expect, it } from 'vitest';
import { calculateSolarAltitude, getSolarStatus, buildSolarStatusFromMet } from '../engine/solar';
import {
  clearMetForecastCache,
  fetchMetForecast,
  metRequestUrl,
  MetForecastError,
  pickTimeseriesNear,
  MET_USER_AGENT,
} from '../engine/weather';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('MET Norway og azimut', () => {
  beforeEach(() => {
    clearMetForecastCache();
  });

  it('velger nærmeste timeserie og hopper over ugyldig tid', () => {
    const target = new Date('2026-06-21T12:00:00Z');
    const picked = pickTimeseriesNear(
      [
        { time: 'ikke-en-dato', cloud: 1 },
        { time: '2026-06-21T09:00:00Z', cloud: 10 },
        { time: '2026-06-21T12:20:00Z', cloud: 80 },
        { time: '2026-06-21T18:00:00Z', cloud: 40 },
      ],
      target
    );

    expect(picked?.cloud).toBe(80);
    expect(pickTimeseriesNear([], target)).toBeNull();
  });

  it('parser MET JSON fra nærmeste time og sender påkrevd User-Agent', async () => {
    const now = Date.now();
    const near = new Date(now + 20 * 60 * 1000).toISOString();
    const far = new Date(now + 8 * 60 * 60 * 1000).toISOString();
    let seenUrl = '';
    let seenUa = '';

    const fetchImpl = (async (input: string, init?: RequestInit) => {
      seenUrl = String(input);
      seenUa = new Headers(init?.headers).get('User-Agent') ?? '';
      return jsonResponse({
        properties: {
          timeseries: [
            {
              time: far,
              data: {
                instant: {
                  details: { air_temperature: 1, cloud_area_fraction: 99, wind_speed: 12 },
                },
                next_1_hours: { details: { precipitation_amount: 4 } },
              },
            },
            {
              time: near,
              data: {
                instant: {
                  details: { air_temperature: 14.2, cloud_area_fraction: 35, wind_speed: 3.5 },
                },
                next_1_hours: { details: { precipitation_amount: 0.2 } },
              },
            },
          ],
        },
      });
    }) as typeof fetch;

    const forecast = await fetchMetForecast(60.3913, 5.3221, fetchImpl);

    expect(seenUrl).toContain('https://api.met.no/weatherapi/locationforecast/2.0/compact?');
    expect(seenUrl).toContain('lat=60.3913');
    expect(seenUrl).toContain('lon=5.3221');
    expect(seenUa).toBe(MET_USER_AGENT);
    expect(metRequestUrl(60.3913, 5.3221)).toContain('https://api.met.no/weatherapi/locationforecast/2.0/compact?');
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { protocol: 'file:' } },
    });
    try {
      expect(metRequestUrl(60.3913, 5.3221)).toContain('https://api.met.no/');
    } finally {
      if (previousWindow === undefined) {
        delete (globalThis as { window?: Window }).window;
      } else {
        Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow });
      }
    }

    expect(forecast).toEqual({
      cloudCoverPercent: 35,
      temperatureC: 14.2,
      windMps: 3.5,
      precipitationMm: 0.2,
      updatedAt: near,
      source: 'met-norway',
    });
  });

  it('bruker cache i 20 min og kaster typet feil uten å finne på tall', async () => {
    let calls = 0;
    const time = new Date().toISOString();
    const fetchImpl = (async () => {
      calls += 1;
      return jsonResponse({
        properties: {
          timeseries: [
            {
              time,
              data: {
                instant: {
                  details: { air_temperature: 8, cloud_area_fraction: 10, wind_speed: 2 },
                },
              },
            },
          ],
        },
      });
    }) as typeof fetch;

    const first = await fetchMetForecast(63.43, 10.4, fetchImpl);
    const second = await fetchMetForecast(63.431, 10.399, fetchImpl);
    expect(first.precipitationMm).toBe(0);
    expect(second.cloudCoverPercent).toBe(10);
    expect(calls).toBe(1);

    const failing = (async () => jsonResponse({}, 403)) as typeof fetch;
    await expect(fetchMetForecast(58.97, 5.73, failing)).rejects.toBeInstanceOf(MetForecastError);
    await expect(fetchMetForecast(58.97, 5.73, failing)).rejects.toThrow(/403/);
  });

  it('gir østlig azimut før soltid-middag og vestlig etter, i Bergen om sommeren', () => {
    const morning = calculateSolarAltitude(new Date('2026-06-21T06:00:00Z'), 60.39, 5.32);
    const beforeNoon = calculateSolarAltitude(new Date('2026-06-21T11:00:00Z'), 60.39, 5.32);
    const afterNoon = calculateSolarAltitude(new Date('2026-06-21T14:00:00Z'), 60.39, 5.32);
    const afternoon = calculateSolarAltitude(new Date('2026-06-21T16:00:00Z'), 60.39, 5.32);

    expect(morning.azimuth).toBeGreaterThan(60);
    expect(morning.azimuth).toBeLessThan(150);
    expect(beforeNoon.azimuth).toBeLessThan(180);
    expect(afterNoon.azimuth).toBeGreaterThan(180);
    expect(afternoon.azimuth).toBeGreaterThan(210);
    expect(afternoon.azimuth).toBeLessThan(300);
    expect(morning.azimuth).not.toBe(afternoon.azimuth);
  });

  it('beholder standard skydekke 40 og kan bygge status fra MET', () => {
    const date = new Date('2026-06-21T11:00:00Z');
    const plain = getSolarStatus(date, 60.39, 5.32);
    expect(plain.cloudCoverPercent).toBe(40);
    expect(plain.weatherSource).toBeUndefined();
    expect(plain.azimuthDegrees).toBeLessThan(180);

    const live = buildSolarStatusFromMet(date, 60.39, 5.32, {
      cloudCoverPercent: 15,
      temperatureC: 18,
    });
    expect(live.weatherSource).toBe('met-norway');
    expect(live.cloudCoverPercent).toBe(15);
    expect(live.temperatureC).toBe(18);
    expect(live.actualEstimatedLux).toBeGreaterThan(plain.actualEstimatedLux);
  });
});
