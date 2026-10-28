import { describe, it, expect, beforeEach } from 'vitest';
import {
  haversineKm,
  radiusBucket,
  estimateTravelMin,
  nearestCity,
  isOpenNow,
  isInSeason,
  roundCoord,
  roundPositionForExternalApi,
  saveSelectedCityToStorage,
  getSelectedCityFromStorage,
  getStoredKeysSnapshot,
  clearCityStorage,
  CITY_STORAGE_KEY,
} from '../engine/location';
import { City, Deal, Place } from '../engine/places';
import { rankActivitiesForProfile } from '../engine/recommender';
import { INITIAL_ACTIVITIES, ActivityItem } from '../engine/activities';
import { DEFAULT_USER_PROFILE as DEFAULT_PROFILE } from '../engine/profile';
import { getSolarStatus, SolarStatus } from '../engine/solar';
import { metRequestUrl } from '../engine/weather';

const LAUNCH_CITIES: City[] = [
  { id: 'bergen', name: 'Bergen', lat: 60.3913, lng: 5.3221 },
  { id: 'oslo', name: 'Oslo', lat: 59.9139, lng: 10.7522 },
  { id: 'stavanger', name: 'Stavanger', lat: 58.97, lng: 5.7331 },
  { id: 'kristiansand', name: 'Kristiansand', lat: 58.1599, lng: 8.0182 },
  { id: 'trondheim', name: 'Trondheim', lat: 63.4305, lng: 10.3951 },
  { id: 'bodo', name: 'Bodø', lat: 67.2804, lng: 14.4049 },
];

describe('SPEC Seksjon 9: GPS-baserte anbefalinger (16 tester)', () => {
  beforeEach(() => {
    clearCityStorage();
  });

  // 1. haversineKm Bergen sentrum → Fløyen gir riktig avstand innen 5 %
  it('1. haversineKm Bergen sentrum (Torgallmenningen) -> Fløyen gir riktig avstand innen 5 %', () => {
    const torgallmenningen = { lat: 60.39299, lng: 5.32415 };
    const floyenTop = { lat: 60.3988, lng: 5.3435 };
    // Luftlinje er ca. 1.244 km
    const expectedKm = 1.244;
    const actualKm = haversineKm(torgallmenningen, floyenTop);
    const diffRatio = Math.abs(actualKm - expectedKm) / expectedKm;
    expect(diffRatio).toBeLessThan(0.05);
  });

  // 2. haversineKm(a,a) === 0
  it('2. haversineKm(a, a) === 0', () => {
    const a = { lat: 60.3913, lng: 5.3221 };
    expect(haversineKm(a, a)).toBe(0);
  });

  // 3. radiusBucket på alle grenseverdier (1, 5, 20, 120 km)
  it('3. radiusBucket på alle grenseverdier (1, 5, 20, 120 km)', () => {
    expect(radiusBucket(0)).toBe('walk');
    expect(radiusBucket(1)).toBe('walk');
    expect(radiusBucket(1.01)).toBe('near');
    expect(radiusBucket(5)).toBe('near');
    expect(radiusBucket(5.01)).toBe('city');
    expect(radiusBucket(20)).toBe('city');
    expect(radiusBucket(20.01)).toBe('day_trip');
    expect(radiusBucket(120)).toBe('day_trip');
    expect(radiusBucket(120.01)).toBe('far');
  });

  // 4. estimateTravelMin øker monotont med avstand og er størst for gange
  it('4. estimateTravelMin øker monotont med avstand og er størst for gange', () => {
    const d1 = estimateTravelMin(1, 'walk');
    const d2 = estimateTravelMin(3, 'walk');
    const d3 = estimateTravelMin(10, 'walk');
    expect(d1).toBeLessThan(d2);
    expect(d2).toBeLessThan(d3);

    const walkMin = estimateTravelMin(5, 'walk');
    const bikeMin = estimateTravelMin(5, 'bike');
    const transitMin = estimateTravelMin(5, 'transit');
    const carMin = estimateTravelMin(5, 'car');

    expect(walkMin).toBeGreaterThan(bikeMin);
    expect(bikeMin).toBeGreaterThan(transitMin);
    expect(transitMin).toBeGreaterThan(carMin);
  });

  // 5. nearestCity gir Voss-koordinat → Bergen, Sandnes → Stavanger
  it('5. nearestCity gir Voss-koordinat -> Bergen, Sandnes -> Stavanger', () => {
    const voss = { lat: 60.628, lng: 6.418 };
    const sandnes = { lat: 58.8524, lng: 5.7352 };

    expect(nearestCity(voss, LAUNCH_CITIES).id).toBe('bergen');
    expect(nearestCity(sandnes, LAUNCH_CITIES).id).toBe('stavanger');
  });

  // 6. isOpenNow innenfor, utenfor, over midnatt (22:00–02:00), unntaksdato stengt, ukjent → null
  it('6. isOpenNow innenfor, utenfor, over midnatt (22:00–02:00), unntaksdato stengt, ukjent -> null', () => {
    const unknownPlace: Place = {
      id: 'p-unknown',
      name: 'Fjelltopp',
      cityId: 'bergen',
      lat: 60.39,
      lng: 5.32,
      categories: ['hike'],
      indoor: false,
      outdoor: true,
      seasons: ['all_year'],
      source: 'test',
    };
    expect(isOpenNow(unknownPlace, new Date('2026-07-15T12:00:00'))).toBeNull();

    const cafePlace: Place = {
      ...unknownPlace,
      id: 'p-cafe',
      openingHours: {
        weekly: [
          { day: 3, open: '09:00', close: '17:00' }, // Onsdag
          { day: 5, open: '22:00', close: '02:00' }, // Fredag kveld -> Lørdag natt
        ],
        exceptions: [{ date: '2026-12-24', closed: true }],
      },
    };

    // Onsdag 2026-07-15 kl 12:00 (innenfor)
    expect(isOpenNow(cafePlace, new Date('2026-07-15T12:00:00'))).toBe(true);
    // Onsdag 2026-07-15 kl 18:30 (utenfor)
    expect(isOpenNow(cafePlace, new Date('2026-07-15T18:30:00'))).toBe(false);
    // Fredag 2026-07-17 kl 23:30 (over midnatt del 1)
    expect(isOpenNow(cafePlace, new Date('2026-07-17T23:30:00'))).toBe(true);
    // Lørdag 2026-07-18 kl 01:15 (over midnatt del 2)
    expect(isOpenNow(cafePlace, new Date('2026-07-18T01:15:00'))).toBe(true);
    // Lørdag 2026-07-18 kl 03:00 (stengt etter 02:00)
    expect(isOpenNow(cafePlace, new Date('2026-07-18T03:00:00'))).toBe(false);
    // Unntaksdato 2026-12-24 kl 12:00 -> stengt
    const xmasPlace: Place = {
      ...cafePlace,
      openingHours: {
        weekly: [{ day: 4, open: '09:00', close: '17:00' }], // Torsdag 2026-12-24
        exceptions: [{ date: '2026-12-24', closed: true }],
      },
    };
    expect(isOpenNow(xmasPlace, new Date('2026-12-24T12:00:00'))).toBe(false);
  });

  // 7. isInSeason for vinterdata i juli → false; all_year → true; sesong over nyttår (des–mar)
  it('7. isInSeason for vinterdata i juli -> false; all_year -> true; sesong over nyttår (des–mar)', () => {
    const winterSkiPlace: Place = {
      id: 'p-ski',
      name: 'Eikedalen',
      cityId: 'bergen',
      lat: 60.39,
      lng: 5.91,
      categories: ['alpine'],
      indoor: false,
      outdoor: true,
      seasons: ['winter'],
      openingHours: {
        weekly: [],
        seasonRange: { from: '12-01', to: '03-31' },
      },
      source: 'test',
    };

    const allYearPlace: Place = {
      ...winterSkiPlace,
      id: 'p-allyear',
      seasons: ['all_year'],
      openingHours: undefined,
    };

    expect(isInSeason(winterSkiPlace, new Date('2026-07-15T12:00:00'))).toBe(false);
    expect(isInSeason(winterSkiPlace, new Date('2026-12-20T12:00:00'))).toBe(true);
    expect(isInSeason(winterSkiPlace, new Date('2026-02-10T12:00:00'))).toBe(true);
    expect(isInSeason(allYearPlace, new Date('2026-07-15T12:00:00'))).toBe(true);
  });

  // 8. recommend uten context gir identisk output som før (snapshot av dagens resultat)
  it('8. rankActivitiesForProfile uten context gir identisk output som før', () => {
    const solar = getSolarStatus(new Date('2026-06-15T13:00:00Z'), 60.3913, 5.3221, 15);
    const subset = INITIAL_ACTIVITIES.slice(0, 6);
    const runA = rankActivitiesForProfile(DEFAULT_PROFILE, subset, solar);
    const runB = rankActivitiesForProfile(DEFAULT_PROFILE, subset, solar, undefined);

    expect(runA).toEqual(runB);
    expect(runA.length).toBe(subset.length);
    expect(runA[0].isPartnerDeal).toBeUndefined();
  });

  // 9. Sted utenfor sesong filtreres bort
  it('9. Sted utenfor sesong filtreres bort når context er oppgitt', () => {
    const solar = getSolarStatus(new Date('2026-07-15T12:00:00Z'), 60.3913, 5.3221, 15);
    const skiAct = INITIAL_ACTIVITIES.find(a => a.category === 'ski')!;
    const hikeAct = INITIAL_ACTIVITIES.find(a => a.category === 'hike')!;

    const ranked = rankActivitiesForProfile(
      DEFAULT_PROFILE,
      [skiAct, hikeAct],
      solar,
      {
        now: new Date('2026-07-15T12:00:00Z'),
        position: { lat: 60.3913, lng: 5.3221 },
      }
    );

    expect(ranked.some(r => r.activity.id === skiAct.id)).toBe(false);
    expect(ranked.some(r => r.activity.id === hikeAct.id)).toBe(true);
  });

  // 10. Stengt sted rangeres under åpent sted med lik profilmatch
  it('10. Stengt sted rangeres under åpent sted med lik profilmatch', () => {
    const solar = getSolarStatus(new Date('2026-06-15T12:00:00'), 60.3913, 5.3221, 20);
    const baseAct: ActivityItem = {
      ...INITIAL_ACTIVITIES[0],
      id: 'act-open',
      title: 'Åpen Kafé',
    };
    const closedAct: ActivityItem = {
      ...INITIAL_ACTIVITIES[0],
      id: 'act-closed',
      title: 'Stengt Kafé',
    };

    const placesMap: Record<string, Place> = {
      'act-open': {
        id: 'act-open',
        name: 'Åpen Kafé',
        cityId: 'bergen',
        lat: 60.3913,
        lng: 5.3221,
        categories: ['cafe'],
        indoor: false,
        outdoor: true,
        seasons: ['all_year'],
        openingHours: {
          weekly: [{ day: 1, open: '08:00', close: '20:00' }], // Mandag 2026-06-15
        },
        source: 'test',
      },
      'act-closed': {
        id: 'act-closed',
        name: 'Stengt Kafé',
        cityId: 'bergen',
        lat: 60.3913,
        lng: 5.3221,
        categories: ['cafe'],
        indoor: false,
        outdoor: true,
        seasons: ['all_year'],
        openingHours: {
          weekly: [{ day: 1, open: '18:00', close: '22:00' }], // Stengt kl 12:00
        },
        source: 'test',
      },
    };

    const ranked = rankActivitiesForProfile(
      DEFAULT_PROFILE,
      [closedAct, baseAct],
      solar,
      {
        now: new Date('2026-06-15T12:00:00'),
        position: { lat: 60.3913, lng: 5.3221 },
        placesMap,
      }
    );

    expect(ranked[0].activity.id).toBe('act-open');
    expect(ranked[1].activity.id).toBe('act-closed');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  // 11. Utendørs sted rangeres høyere ved sol enn ved regn; innendørs motsatt
  it('11. Utendørs sted rangeres høyere ved sol enn ved regn; innendørs motsatt', () => {
    const outdoorAct: ActivityItem = {
      ...INITIAL_ACTIVITIES[0],
      id: 'act-out',
      isOutdoor: true,
    };
    const indoorAct: ActivityItem = {
      ...INITIAL_ACTIVITIES[0],
      id: 'act-in',
      isOutdoor: false,
    };

    const sunnySolar: SolarStatus = {
      ...getSolarStatus(new Date('2026-06-15T12:00:00Z'), 60.3913, 5.3221, 5),
      cloudCoverPercent: 5,
      solarAltitudeDegrees: 45,
      actualEstimatedLux: 65000,
    };

    const rainySolar: SolarStatus = {
      ...getSolarStatus(new Date('2026-06-15T12:00:00Z'), 60.3913, 5.3221, 95),
      cloudCoverPercent: 95,
      solarAltitudeDegrees: 15,
      actualEstimatedLux: 2000,
    };

    const ctx = {
      now: new Date('2026-06-15T12:00:00Z'),
      position: { lat: 60.3913, lng: 5.3221 },
    };

    const outSunny = rankActivitiesForProfile(DEFAULT_PROFILE, [outdoorAct], sunnySolar, ctx)[0].score;
    const outRainy = rankActivitiesForProfile(DEFAULT_PROFILE, [outdoorAct], rainySolar, ctx)[0].score;
    expect(outSunny).toBeGreaterThan(outRainy);

    const inSunny = rankActivitiesForProfile(DEFAULT_PROFILE, [indoorAct], sunnySolar, ctx)[0].score;
    const inRainy = rankActivitiesForProfile(DEFAULT_PROFILE, [indoorAct], rainySolar, ctx)[0].score;
    expect(inRainy).toBeGreaterThan(inSunny);
  });

  // 12. Tilbudsbonus overstiger aldri 10 poeng
  it('12. Tilbudsbonus overstiger aldri 10 poeng selv ved 90 % rabatt', () => {
    const act = INITIAL_ACTIVITIES[0];
    const solar = getSolarStatus(new Date('2026-06-15T12:00:00Z'), 60.3913, 5.3221, 10);
    const baseCtx = {
      now: new Date('2026-06-15T12:00:00Z'),
      position: { lat: act.coordinates.lat, lng: act.coordinates.lng },
    };

    const withoutDeal = rankActivitiesForProfile(DEFAULT_PROFILE, [act], solar, baseCtx)[0].score;
    const hugeDeal: Deal = {
      id: 'deal-huge',
      partnerId: 'p1',
      placeId: act.id,
      title: '90% Supersalg',
      priceNok: 50,
      originalPriceNok: 500,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
    };

    const withDeal = rankActivitiesForProfile(DEFAULT_PROFILE, [act], solar, {
      ...baseCtx,
      deals: [hugeDeal],
    })[0].score;

    expect(withDeal - withoutDeal).toBeLessThanOrEqual(10);
    expect(withDeal - withoutDeal).toBeGreaterThan(0);
  });

  // 13. Sted under 40 poeng får ikke partnerbonus
  it('13. Sted under 40 poeng får ikke partnerbonus', () => {
    // Lag en aktivitet som scorer lavt (< 40): langt unna (day_trip = 4p), stengt nå (0p), stroller_warning og overskyet
    const lowScoreAct: ActivityItem = {
      ...INITIAL_ACTIVITIES[0],
      id: 'act-low',
      coordinates: { lat: 61.15, lng: 5.3221 }, // ca. 85 km unna (day_trip = 4p)
      strollerAccessible: false,
      tripAdvisorRating: 3.0,
      isOutdoor: true,
    };

    const placesMap: Record<string, Place> = {
      'act-low': {
        id: 'act-low',
        name: 'Lavt scorende sted',
        cityId: 'bergen',
        lat: 61.15,
        lng: 5.3221,
        categories: ['hike'],
        indoor: false,
        outdoor: true,
        seasons: ['all_year'],
        openingHours: {
          weekly: [{ day: 1, open: '18:00', close: '20:00' }], // Stengt kl 12:00 -> 0p
        },
        source: 'test',
      },
    };

    const rainySolar: SolarStatus = {
      ...getSolarStatus(new Date('2026-06-15T12:00:00'), 60.3913, 5.3221, 95),
      cloudCoverPercent: 95,
      solarAltitudeDegrees: 5,
      actualEstimatedLux: 1000,
    };

    const deal: Deal = {
      id: 'deal-low',
      partnerId: 'p1',
      placeId: 'act-low',
      title: 'Billig tilbud',
      priceNok: 100,
      originalPriceNok: 300,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
    };

    const strollerProfile = {
      ...DEFAULT_PROFILE,
      hasChildren: true,
      children: [{ id: 'c1', name: 'Lille', age: 1, needsStroller: true, energyLevel: 'medium' as const, interests: [] }],
    };

    const res = rankActivitiesForProfile(strollerProfile, [lowScoreAct], rainySolar, {
      now: new Date('2026-06-15T12:00:00'),
      position: { lat: 60.3913, lng: 5.3221 },
      placesMap,
      deals: [deal],
    })[0];

    expect(res.score).toBeLessThan(40);
    expect(res.isPartnerDeal).toBe(false);
    expect(res.deal).toBeUndefined();
  });

  // 14. Maks 2 partnerkort blant topp 5
  it('14. Maks 2 partnerkort blant topp 5 selv når 4 steder har aktive deals', () => {
    const solar = getSolarStatus(new Date('2026-06-15T12:00:00Z'), 60.3913, 5.3221, 15);
    const sixActivities: ActivityItem[] = [1, 2, 3, 4, 5, 6].map(n => ({
      ...INITIAL_ACTIVITIES[0],
      id: `act-top-${n}`,
      title: `Aktivitet ${n}`,
      coordinates: { lat: 60.3913, lng: 5.3221 },
    }));

    const fourDeals: Deal[] = [1, 2, 3, 4].map(n => ({
      id: `deal-${n}`,
      partnerId: `partner-${n}`,
      placeId: `act-top-${n}`,
      title: `Tilbud ${n}`,
      priceNok: 100,
      originalPriceNok: 200,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
    }));

    const ranked = rankActivitiesForProfile(DEFAULT_PROFILE, sixActivities, solar, {
      now: new Date('2026-06-15T12:00:00Z'),
      position: { lat: 60.3913, lng: 5.3221 },
      deals: fourDeals,
    });

    const top5 = ranked.slice(0, 5);
    const partnerCardsInTop5 = top5.filter(r => r.isPartnerDeal).length;
    expect(partnerCardsInTop5).toBeLessThanOrEqual(2);
  });

  // 15. Avvist posisjon → by fra localStorage brukes, og ingen koordinater lagres
  it('15. Avvist posisjon -> by fra localStorage brukes, og ingen koordinater lagres i localStorage', () => {
    saveSelectedCityToStorage('Bodø');
    expect(getSelectedCityFromStorage()).toBe('Bodø');
    const snap = getStoredKeysSnapshot();
    expect(snap[CITY_STORAGE_KEY]).toBe('Bodø');

    // Sjekk at ingen nøkler inneholder rå GPS-koordinater
    for (const val of Object.values(snap)) {
      expect(val).not.toMatch(/67\.2804123/);
    }
  });

  // 16. Koordinater sendt til MET/Entur er avrundet til maks 4 desimaler
  it('16. Koordinater sendt til MET/Entur er avrundet til maks 4 desimaler', () => {
    const rawPos = { lat: 60.391287654, lng: 5.322098765 };
    const rounded = roundPositionForExternalApi(rawPos);

    expect(rounded.lat).toBe(60.3913);
    expect(rounded.lng).toBe(5.3221);
    expect(String(roundCoord(67.28049123, 4)).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(4);

    const url = metRequestUrl(rawPos.lat, rawPos.lng);
    expect(url).toContain('lat=60.3913');
    expect(url).toContain('lon=5.3221');
    expect(url).not.toContain('60.39128');
  });

  // 17. Sanntids vær-reaktivitet: Regnvær løfter badstue og kafé med spesifikk begrunnelse
  it('17. Sanntids vær-reaktivitet: Regnvær løfter badstue og kafé med sanntidsbegrunnelse', () => {
    const rainySolar = getSolarStatus(new Date('2026-06-15T12:00:00Z'), 60.3913, 5.3221, 95);
    const saunaAct: ActivityItem = {
      ...INITIAL_ACTIVITIES[0],
      id: 'act-sauna-test',
      title: 'Heit Bergen Fjordbadstue',
      category: 'cafebar',
      isOutdoor: true,
      addOns: [{ id: 'a1', title: 'Fjorddyp', type: 'sauna', partnerName: 'Heit', description: 'Damp', priceNok: 250, commissionNok: 30, durationMinutes: 60, badgeEmoji: '🔥' }],
    };
    const openHikeAct: ActivityItem = {
      ...INITIAL_ACTIVITIES[0],
      id: 'act-mountain-test',
      title: 'Vidden topptur',
      category: 'hike',
      isOutdoor: true,
      trail: { type: 'mountain_hike', difficulty: 'red', distanceKm: 13, elevationMeters: 600, trailMarking: 'T' },
    };

    const rankedRain = rankActivitiesForProfile(DEFAULT_PROFILE, [saunaAct, openHikeAct], rainySolar, {
      now: new Date('2026-06-15T12:00:00Z'),
      position: { lat: 60.3913, lng: 5.3221 },
      weather: {
        precipitationMm: 2.5,
        isRain: true,
        isOpplett: false,
        cloudCoverPercent: 95,
      },
    });

    // Badstue skal rankes øverst i regnvær
    expect(rankedRain[0].activity.id).toBe('act-sauna-test');
    expect(rankedRain[0].matchReasons.some(r => r.includes('🌧️ Sanntids-vær'))).toBe(true);
  });
});
