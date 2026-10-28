import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCommunityBlueprint,
  calculateRentalYield,
  getTinydomeTicketCount,
  addTinydomeTickets,
  setTinydomeTicketCount,
  MIN_COMMUNITY_UNITS,
  MAX_COMMUNITY_UNITS,
  GRAND_PRIZE_VALUE_NOK
} from '../engine/tinydome';
import {
  TINYDOME_COMMUNITY,
  getEarnedLuxPoints,
  awardHikeCompletionLuxPoints,
  HIKE_COMPLETION_LUX_POINTS,
  LUX_REWARD_CATALOG
} from '../engine/tinydomeCommunity';

class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, val: string) { this.store[key] = String(val); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

describe('Tinydome Eco-Samfunn & Belønningsmotor', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MockStorage }).localStorage = new MockStorage();
  });

  describe('Samfunnsoppsett & Arkitektur', () => {
    it('genererer standard antall enheter innenfor 6 til 20 grensen', () => {
      const units = generateCommunityBlueprint('eidfjord-waterfront', 12);
      expect(units.length).toBe(12);
      expect(units[0].unitNumber).toBe(1);
      expect(units[0].status).toBe('draw_prize');
    });

    it('håndhever minimum 6 og maksimum 20 enheter', () => {
      const tooFew = generateCommunityBlueprint('eidfjord-waterfront', 2);
      expect(tooFew.length).toBe(MIN_COMMUNITY_UNITS);

      const tooMany = generateCommunityBlueprint('eidfjord-waterfront', 50);
      expect(tooMany.length).toBe(MAX_COMMUNITY_UNITS);
    });

    it('sikrer at alle enheter har minst 50% glass og ingen teltreferanser', () => {
      const units = generateCommunityBlueprint('eidfjord-waterfront', 15);
      units.forEach(unit => {
        expect(unit.glassCoveragePercent).toBeGreaterThanOrEqual(50);
        expect(unit.glassCoveragePercent).toBeLessThanOrEqual(100);
        expect(unit.glassMaterial).not.toMatch(/telt|duk/i);
      });
    });

    it('inneholder alle obligatoriske fellesfasiliteter', () => {
      const amenityIds = TINYDOME_COMMUNITY.amenities.map(a => a.id);
      expect(amenityIds).toContain('sauna');
      expect(amenityIds).toContain('playground');
      expect(amenityIds).toContain('firepit_lavvo');
      expect(amenityIds).toContain('watercraft');
    });
  });

  describe('Avkastningskalkulator & Eierandel', () => {
    it('beregner riktig leieinntekt for 4 uker utleie (ca 32 000 kr netto)', () => {
      const calc = calculateRentalYield({ weeksSublet: 4 });
      expect(calc.weeksSublet).toBe(4);
      expect(calc.weeksKeptForSelf).toBe(0);
      expect(calc.sharePriceNok).toBe(GRAND_PRIZE_VALUE_NOK);
      // Brutto 24 netter * 2800 = 67200, minus 15% plattformgebyr = 57120
      expect(calc.netAnnualRentalIncomeNok).toBeGreaterThan(30000);
      expect(calc.annualRoiPercent).toBeGreaterThan(20);
    });

    it('håndterer 0 uker til utleie (100% ferie for familien)', () => {
      const calc = calculateRentalYield({ weeksSublet: 0 });
      expect(calc.weeksSublet).toBe(0);
      expect(calc.weeksKeptForSelf).toBe(4);
      expect(calc.netAnnualRentalIncomeNok).toBe(0);
      expect(calc.annualRoiPercent).toBe(0);
    });
  });

  describe('Lodd & Luks-poeng Tracker', () => {
    it('håndterer tildeling av sommerlodd korrekt', () => {
      expect(getTinydomeTicketCount()).toBe(0);
      const afterOne = addTinydomeTickets(1);
      expect(afterOne).toBe(1);
      expect(getTinydomeTicketCount()).toBe(1);

      setTinydomeTicketCount(5);
      expect(getTinydomeTicketCount()).toBe(5);
    });

    it('tildeler 5 000 luks-poeng ved fullført tur i Bergen', () => {
      const initial = getEarnedLuxPoints();
      expect(initial).toBeGreaterThanOrEqual(5000);

      const afterHike = awardHikeCompletionLuxPoints();
      expect(afterHike).toBe(initial + HIKE_COMPLETION_LUX_POINTS);
    });

    it('inneholder belønningskatalog for konsertbillett, middag og sauna', () => {
      const rewardIds = LUX_REWARD_CATALOG.map(r => r.id);
      expect(rewardIds).toContain('concert_ticket');
      expect(rewardIds).toContain('dinner_sauna');
      expect(rewardIds).toContain('tinydome_summer_ticket');
    });
  });
});
