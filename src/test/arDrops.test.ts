import { describe, it, expect, beforeEach } from 'vitest';
import {
  BERGEN_AR_DROPS,
  DAILY_MAX_COIN_POINTS,
  GRAND_PRIZE_INFO,
  calculateDistanceMeters,
  collectARDrop,
  getDailyCoinPointsCollected,
  getTinydomeTicketCount,
  hasCollectedDropToday
} from '../engine/arDrops';

// In-memory localStorage polyfill for Node.js Vitest environment
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; },
  };
}

describe('Utaktiv Sol-Jakt AR & Tinydome Motor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('har definert faste geofencede drops og grand prize for Tinydome', () => {
    expect(BERGEN_AR_DROPS.length).toBeGreaterThan(4);
    expect(GRAND_PRIZE_INFO.valueNok).toBe(95000);
    expect(GRAND_PRIZE_INFO.title).toContain('Tinydome Spacecapsule');
  });

  it('beregner avstand med Haversine nøyaktig', () => {
    // Fløyen til Skomakerdiket er ca 400-500 meter
    const dist = calculateDistanceMeters(60.3985, 5.3340, 60.3970, 5.3395);
    expect(dist).toBeGreaterThan(200);
    expect(dist).toBeLessThan(800);
  });

  it('samler Luks-mynt innenfor geofence og legger til poeng', () => {
    const coinDrop = BERGEN_AR_DROPS.find(d => d.id === 'drop_floyen_sving')!;
    
    // Test for langt unna
    const failRes = collectARDrop(coinDrop, 60.0000, 5.0000, false);
    expect(failRes.success).toBe(false);
    expect(failRes.pointsAdded).toBe(0);

    // Test rett ved (forceUnlock eller nøyaktig posisjon)
    const successRes = collectARDrop(coinDrop, coinDrop.lat, coinDrop.lng, false);
    expect(successRes.success).toBe(true);
    expect(successRes.pointsAdded).toBe(coinDrop.pointsValue);
    expect(hasCollectedDropToday(coinDrop.id)).toBe(true);
    expect(getDailyCoinPointsCollected()).toBe(coinDrop.pointsValue);
  });

  it('håndhever dags-taket på maksimalt 20 Luks-poeng', () => {
    const todayKey = new Date().toISOString().split('T')[0];
    // Sett at bruker allerede har sanket 18 poeng i dag
    localStorage.setItem(`utaktiv_ar_daily_pts_${todayKey}`, '18');

    const coinDrop = BERGEN_AR_DROPS.find(d => d.pointsValue === 5)!;
    const res = collectARDrop(coinDrop, undefined, undefined, true);
    expect(res.success).toBe(true);
    // Skal kun gi 2 poeng for å nå taket på 20
    expect(res.pointsAdded).toBe(2);
    expect(getDailyCoinPointsCollected()).toBe(DAILY_MAX_COIN_POINTS);

    // Forsøk på ny mynt skal avvises
    const anotherDrop = BERGEN_AR_DROPS.find(d => d.id === 'drop_ulriken_topp')!;
    const overRes = collectARDrop(anotherDrop, undefined, undefined, true);
    expect(overRes.success).toBe(false);
    expect(overRes.message).toContain('dags-taket');
  });

  it('tildeler lodd til sommerfinalens 1/12 Tinydome Spacecapsule', () => {
    const ticketDrop = BERGEN_AR_DROPS.find(d => d.id === 'drop_tinydome_summer_ticket')!;
    expect(getTinydomeTicketCount()).toBe(0);

    const res = collectARDrop(ticketDrop, undefined, undefined, true);
    expect(res.success).toBe(true);
    expect(res.tinydomeTicketAwarded).toBe(true);
    expect(getTinydomeTicketCount()).toBe(1);
    expect(res.message).toContain('95 000 kr');
  });
});
