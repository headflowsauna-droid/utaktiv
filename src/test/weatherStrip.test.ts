import { describe, it, expect } from 'vitest';
import { buildOpplettSummary } from '../components/WeatherStrip';
import { SolarStatus } from '../engine/solar';
import { MetForecast, MetOutlookPoint } from '../engine/weather';

describe('WeatherStrip & Opplett-radar', () => {
  const dummySolar: SolarStatus = {
    solarAltitudeDegrees: 18,
    azimuthDegrees: 180,
    isDaylight: true,
    clearSkyLux: 25000,
    cloudCoverPercent: 25,
    actualEstimatedLux: 15000,
    uvIndex: 1,
    circadianWindow: 'midday',
    melatoninImpact: 'Høy melatonin-undertrykkelse',
    temperatureC: 11,
    weatherSource: 'met-norway',
  };

  it('detects opplett now and builds best window when dry', () => {
    const forecast: MetForecast = {
      cloudCoverPercent: 20,
      temperatureC: 12,
      windMps: 3.5,
      precipitationMm: 0,
      updatedAt: '2026-10-26T12:00:00Z',
      source: 'met-norway',
    };

    const outlook: MetOutlookPoint[] = [
      { time: '2026-10-26T12:00:00Z', cloudCoverPercent: 20, temperatureC: 12, windMps: 3.5, precipitationMm: 0 },
      { time: '2026-10-26T13:00:00Z', cloudCoverPercent: 30, temperatureC: 13, windMps: 3.2, precipitationMm: 0 },
      { time: '2026-10-26T14:00:00Z', cloudCoverPercent: 40, temperatureC: 12, windMps: 2.8, precipitationMm: 0 },
      { time: '2026-10-26T15:00:00Z', cloudCoverPercent: 50, temperatureC: 11, windMps: 3.0, precipitationMm: 0 },
    ];

    const summary = buildOpplettSummary('Bergen', dummySolar, forecast, outlook, 60.39, 5.32);

    expect(summary.isOpplettNow).toBe(true);
    expect(summary.headline).toContain('Opplett i Bergen nå');
    expect(summary.hours.length).toBeGreaterThanOrEqual(4);
    expect(summary.hours[0].isOpplett).toBe(true);
    expect(summary.hours[0].temperatureC).toBe(12);
  });

  it('identifies future opplett when raining right now', () => {
    const forecast: MetForecast = {
      cloudCoverPercent: 90,
      temperatureC: 9,
      windMps: 5.0,
      precipitationMm: 1.8,
      updatedAt: '2026-10-26T10:00:00Z',
      source: 'met-norway',
    };

    const outlook: MetOutlookPoint[] = [
      { time: '2026-10-26T10:00:00Z', cloudCoverPercent: 95, temperatureC: 9, windMps: 5.0, precipitationMm: 1.8 },
      { time: '2026-10-26T11:00:00Z', cloudCoverPercent: 90, temperatureC: 9, windMps: 4.8, precipitationMm: 1.2 },
      { time: '2026-10-26T12:00:00Z', cloudCoverPercent: 35, temperatureC: 11, windMps: 3.0, precipitationMm: 0.0 },
      { time: '2026-10-26T13:00:00Z', cloudCoverPercent: 30, temperatureC: 12, windMps: 2.5, precipitationMm: 0.0 },
    ];

    const summary = buildOpplettSummary('Bergen', dummySolar, forecast, outlook, 60.39, 5.32);

    expect(summary.isOpplettNow).toBe(false);
    expect(summary.headline).toContain('det blir opplett i Bergen fra kl.');
  });
});
