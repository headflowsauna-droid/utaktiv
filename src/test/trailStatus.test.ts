import { describe, expect, it } from 'vitest';
import { conditionsFromMet, fetchTrailConditions } from '../engine/trailStatus';
import { clearMetForecastCache, type MetForecast } from '../engine/weather';

const met: MetForecast = {
  cloudCoverPercent: 20,
  temperatureC: 3.2,
  windMps: 2.5,
  precipitationMm: 0,
  updatedAt: '2026-01-12T10:00:00Z',
  source: 'met-norway',
};

describe('Løypeføre', () => {
  it('oppsummerer været på norsk og later ikke som preparering er live', () => {
    const conditions = conditionsFromMet('act-lysloype', met);

    expect(conditions.grooming).toBe('unknown');
    expect(conditions.source).toBe('met-norway');
    expect(conditions.activityId).toBe('act-lysloype');
    expect(conditions.summaryNb).toBe(
      '3 °C, lett vind, opphold. Prepareringsstatus er ikke livekoblet.'
    );
  });

  it('skiller lett vind, frisk vind og nedbør', () => {
    const wet = conditionsFromMet('act-ski', {
      ...met,
      temperatureC: -2.2,
      windMps: 7,
      precipitationMm: 1.4,
    });
    expect(wet.summaryNb).toContain('-2 °C');
    expect(wet.summaryNb).toContain('frisk vind');
    expect(wet.summaryNb).toContain('nedbør');
    expect(wet.summaryNb).toContain('ikke livekoblet');
  });

  it('henter MET på løypas koordinater uten å gjette preparering', async () => {
    clearMetForecastCache();
    let seenUrl = '';
    const fetchImpl = (async (input: string) => {
      seenUrl = String(input);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          properties: {
            timeseries: [
              {
                time: '2026-02-01T09:00:00Z',
                data: {
                  instant: {
                    details: { air_temperature: 1, cloud_area_fraction: 90, wind_speed: 4 },
                  },
                  next_1_hours: { details: { precipitation_amount: 0 } },
                },
              },
            ],
          },
        }),
      } as Response;
    }) as typeof fetch;

    const conditions = await fetchTrailConditions(
      { id: 'act-voss', coordinates: { lat: 60.628, lng: 6.418 } },
      fetchImpl
    );

    expect(seenUrl).toContain('lat=60.628');
    expect(seenUrl).toContain('lon=6.418');
    expect(conditions.activityId).toBe('act-voss');
    expect(conditions.grooming).toBe('unknown');
    expect(conditions.temperatureC).toBe(1);
    expect(conditions.summaryNb).toContain('Prepareringsstatus er ikke livekoblet.');
  });
});
