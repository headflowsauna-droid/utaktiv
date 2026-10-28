import { describe, it, expect, beforeEach } from 'vitest';
import {
  OPPORTUNITY_CATEGORIES,
  sanitizeUserText,
  submitOpportunityRequest,
  getStoredOpportunityRequests,
  clearOpportunityRequestsForTests,
  getAggregatedDemandHotspots,
  calculateDemandMarketValue,
} from '../engine/trailDemand';
import { INITIAL_ACTIVITIES } from '../engine/activities';

describe('Nasjonal Etterspørsels- og Mulighetsmotor («Gullkartet»)', () => {
  beforeEach(() => {
    clearOpportunityRequestsForTests();
  });

  it('skal inneholde alle 11 nasjonale opplevelses- og transportkategorier', () => {
    const ids = OPPORTUNITY_CATEGORIES.map(c => c.id);
    expect(ids).toContain('sauna');
    expect(ids).toContain('cabin');
    expect(ids).toContain('ebike_gravel');
    expect(ids).toContain('paddling');
    expect(ids).toContain('via_ferrata');
    expect(ids).toContain('northern_lights');
    expect(ids).toContain('reindeer_nature');
    expect(ids).toContain('hunting_fishing');
    expect(ids).toContain('car_rental');
    expect(ids).toContain('tour_bus');
    expect(ids).toContain('gear_box');
    expect(OPPORTUNITY_CATEGORIES.length).toBe(11);
  });

  it('skal rense bort potensielle XSS-tegn og begrense tekstlengde', () => {
    const malicious = '<script>alert("xss")</script>javascript:void(0) Ønsker badstue ved Fløyen!';
    const cleaned = sanitizeUserText(malicious);
    expect(cleaned).not.toContain('<');
    expect(cleaned).not.toContain('>');
    expect(cleaned).not.toContain('javascript:');
    expect(cleaned).toContain('Ønsker badstue ved Fløyen!');
  });

  it('skal registrere familieønske om badstue eller turbuss og øke aggregert etterspørsel', () => {
    const beforeBergen = getAggregatedDemandHotspots({ city: 'Bergen', category: 'sauna' })[0];
    const initialPeople = beforeBergen.interestedPeopleCount;

    const req = submitOpportunityRequest({
      category: 'sauna',
      city: 'Bergen',
      trailOrAreaName: 'Fløyen / Skomakerdiket',
      audience: 'family',
      partySize: 5,
      note: 'Vi ønsker varm skogsbadstue etter søndagsturen med barna',
    });

    expect(req.id).toContain('req-');
    expect(req.partySize).toBe(5);

    const afterBergen = getAggregatedDemandHotspots({ city: 'Bergen', category: 'sauna' })[0];
    expect(afterBergen.interestedPeopleCount).toBe(initialPeople + 5);
    expect(afterBergen.requestCount).toBe(beforeBergen.requestCount + 1);
  });

  it('skal opprette ny hotspot når brukere ønsker en kategori i en by som ikke hadde den fra før', () => {
    submitOpportunityRequest({
      category: 'reindeer_nature',
      city: 'Trondheim',
      trailOrAreaName: 'Røros / Bymarka vintertur',
      audience: 'senior',
      partySize: 12,
      note: 'Pensjonistforening ønsker reinsdyrbesøk og sledekjøring',
    });

    const trondheimReindeer = getAggregatedDemandHotspots({
      city: 'Trondheim',
      category: 'reindeer_nature',
    });
    expect(trondheimReindeer.length).toBe(1);
    expect(trondheimReindeer[0].interestedPeopleCount).toBe(12);
  });

  it('skal begrense antall lagrede forespørsler til maks 100 for å beskytte minne og localStorage', () => {
    for (let i = 0; i < 115; i++) {
      submitOpportunityRequest({
        category: 'car_rental',
        city: 'Oslo',
        trailOrAreaName: `Rute ${i}`,
        audience: 'family',
        partySize: 4,
      });
    }
    const stored = getStoredOpportunityRequests();
    expect(stored.length).toBeLessThanOrEqual(100);
  });

  it('skal beregne estimert årlig omsetningspotensial (GMV) og Utaktiv-provisjon for Gullkartet', () => {
    const hotspots = getAggregatedDemandHotspots();
    const metrics = calculateDemandMarketValue(hotspots);
    expect(metrics.totalInterestedPeople).toBeGreaterThan(2000);
    expect(metrics.estimatedAnnualGmvNok).toBeGreaterThan(1000000);
    expect(metrics.estimatedUtaktivCommissionNok).toBeGreaterThan(150000);
  });

  it('skal ha nasjonale aktiviteter for nordlys, reinsdyr, jakt/isfiske, via ferrata, padling og elsykkel på grus', () => {
    const ids = INITIAL_ACTIVITIES.map(a => a.id);
    expect(ids).toContain('act-byfjellene-grus-ebike-bergen');
    expect(ids).toContain('act-nordlys-reinsdyr-bodo');
    expect(ids).toContain('act-lysefjorden-viaferrata-kajakk-stavanger');
    expect(ids).toContain('act-jakt-isfiske-koie-trondheim');
    expect(ids).toContain('act-skjergard-padling-kystled-kristiansand');
    expect(ids).toContain('act-nordmarka-ebike-koie-oslo');
  });

  it('skal aldri lagre eller lekke rå GPS-koordinater i TrailOpportunityRequest', () => {
    const req = submitOpportunityRequest({
      category: 'sauna',
      city: 'Bergen',
      trailOrAreaName: 'Fløyen',
      audience: 'family',
      partySize: 4,
      note: 'Test uten GPS',
    });

    const keys = Object.keys(req);
    expect(keys).not.toContain('lat');
    expect(keys).not.toContain('lng');
    expect(keys).not.toContain('latitude');
    expect(keys).not.toContain('longitude');
    expect(keys).not.toContain('gps');
    expect(keys).not.toContain('coordinates');
  });

  it('skal rense komplekse injeksjonsforsøk i by, løypenavn og notat', () => {
    const req = submitOpportunityRequest({
      category: 'sauna',
      city: '<b>Bergen</b><iframe src="evil.com">',
      trailOrAreaName: '<script>malicious()</script>Stoltzekleiven',
      audience: 'friends',
      partySize: 2,
      note: 'javascript:alert(document.cookie)<b>Test</b>',
    });

    expect(req.city).not.toContain('<');
    expect(req.city).not.toContain('>');
    expect(req.city).toBe('Bergen');
    expect(req.trailOrAreaName).not.toContain('<');
    expect(req.trailOrAreaName).toBe('Stoltzekleiven');
    expect(req.note).not.toContain('javascript:');
    expect(req.note).not.toContain('<');
    expect(req.note).toBe('alert(document.cookie)Test');
  });

  it('skal håndtere FIFO-rekkefølge korrekt ved over 100 forespørsler', () => {
    for (let i = 1; i <= 105; i++) {
      submitOpportunityRequest({
        category: 'cabin',
        city: 'Bergen',
        trailOrAreaName: `Hytte ${i}`,
        audience: 'family',
        partySize: 2,
      });
    }

    const stored = getStoredOpportunityRequests();
    expect(stored.length).toBe(100);
    // Siste innsendte (105) skal ligge først i FIFO
    expect(stored[0].trailOrAreaName).toBe('Hytte 105');
    // De 5 eldste (1-5) skal ha blitt skjøvet ut
    const names = stored.map(s => s.trailOrAreaName);
    expect(names).not.toContain('Hytte 1');
    expect(names).not.toContain('Hytte 5');
    expect(names).toContain('Hytte 6');
  });

  it('skal verifisere at alle 11 kategorier har gyldige B2B- og provisjonsparametere', () => {
    for (const cat of OPPORTUNITY_CATEGORIES) {
      expect(cat.avgBasketNok).toBeGreaterThan(0);
      expect(cat.estimatedCommissionPct).toBeGreaterThanOrEqual(10);
      expect(cat.estimatedCommissionPct).toBeLessThanOrEqual(25);
      expect(cat.partnerTypes.length).toBeGreaterThan(0);
      expect(cat.emoji.length).toBeGreaterThan(0);
    }
  });
});
