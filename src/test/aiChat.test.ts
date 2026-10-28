import { describe, it, expect } from 'vitest';
import {
  buildWeatherContext,
  generateLocalFallbackReply,
  sendConciergeMessage,
} from '../engine/aiChat';
import { getSolarStatus } from '../engine/solar';
import { DEFAULT_USER_PROFILE } from '../engine/profile';
import { MetForecast } from '../engine/weather';

describe('Sol Concierge AI Engine & Weather Context', () => {
  const solar = getSolarStatus(new Date('2026-06-15T12:00:00Z'), 60.39, 5.32, 40);

  it('bygger riktig værkonsensus fra sol og met-varsel', () => {
    const met: MetForecast = {
      cloudCoverPercent: 20,
      temperatureC: 14.5,
      windMps: 2.1,
      precipitationMm: 0,
      updatedAt: '2026-06-15T12:00:00Z',
      source: 'met-norway',
    };

    const ctx = buildWeatherContext(solar, met);
    expect(ctx.temperatureC).toBe(14.5);
    expect(ctx.precipitationMm).toBe(0);
    expect(ctx.cloudCoverPercent).toBe(20);
    expect(ctx.condition).toBe('Klart og solrikt');
  });

  it('detekterer regnbyger når nedbør er over 1.0 mm', () => {
    const met: MetForecast = {
      cloudCoverPercent: 90,
      temperatureC: 8,
      windMps: 4.5,
      precipitationMm: 2.3,
      updatedAt: '2026-06-15T12:00:00Z',
      source: 'met-norway',
    };

    const ctx = buildWeatherContext(solar, met);
    expect(ctx.precipitationMm).toBe(2.3);
    expect(ctx.condition).toBe('Regnbyger');
  });

  it('genererer lokalt regnværssvar med badstue og kafé når det regner', () => {
    const weather = {
      precipitationMm: 1.5,
      temperatureC: 8,
      lux: 4000,
      cloudCoverPercent: 95,
      condition: 'Regnbyger',
    };

    const reply = generateLocalFallbackReply(
      [{ role: 'user', content: 'Hva skal vi finne på i regnet?' }],
      'Bergen',
      weather,
      DEFAULT_USER_PROFILE
    );

    expect(reply.toLowerCase()).toMatch(/fløyen|badstue|skomakerdiket/);
  });

  it('genererer familie- og barnetilpasset svar når profil har barn', () => {
    const profileWithKids = {
      ...DEFAULT_USER_PROFILE,
      hasChildren: true,
      children: [
        { id: 'c1', name: 'Mia', age: 5, needsStroller: false, energyLevel: 'high' as const, interests: [] },
        { id: 'c2', name: 'Jonas', age: 8, needsStroller: false, energyLevel: 'high' as const, interests: [] },
      ],
    };

    const reply = generateLocalFallbackReply(
      [{ role: 'user', content: 'Hva passer for familien i dag?' }],
      'Bergen',
      { precipitationMm: 0, temperatureC: 12, lux: 15000, cloudCoverPercent: 20 },
      profileWithKids
    );

    expect(reply).toContain('Mia og Jonas');
    expect(reply).toContain('Trollskogen');
  });

  it('sendConciergeMessage faller grasiøst tilbake når endepunkt ikke svarer', async () => {
    const res = await sendConciergeMessage({
      messages: [{ role: 'user', content: 'Hei fra Bergen!' }],
      city: 'Bergen',
    }, 'http://127.0.0.1:9999/unreachable-endpoint');

    expect(res.success).toBe(true);
    expect(res.isFallback).toBe(true);
    expect(res.reply.length).toBeGreaterThan(20);
  });
});
