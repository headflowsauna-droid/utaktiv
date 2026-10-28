import { describe, it, expect } from 'vitest';
import {
  buildTripItinerary,
  estimateAddonItemPriceNok,
  getRouteAddonCardsForCity,
} from '../engine/plakatRenderer';
import { TurKurv } from '../hooks/useTurKurv';

describe('buildTripItinerary & Physical Turbygger calculations', () => {
  it('correctly estimates prices for bolt-on cards', () => {
    expect(estimateAddonItemPriceNok('2x Skillingsbolle & kaffe')).toBe(90);
    expect(estimateAddonItemPriceNok('Varm kakao & vaffel')).toBe(75);
    expect(estimateAddonItemPriceNok('Fjordbadstue etter turen')).toBe(199);
    expect(estimateAddonItemPriceNok('Gratis badstue ved fjorden')).toBe(0);
    expect(estimateAddonItemPriceNok('Varm suppe & surdeigsbrød')).toBe(145);
  });

  it('filters route addons so gratis badstue only appears in Eidfjord', () => {
    const bergenAddons = getRouteAddonCardsForCity('Bergen');
    expect(bergenAddons.some(c => c.id === 'addon-gratis-badstue')).toBe(false);
    expect(bergenAddons.some(c => c.id === 'addon-fjordbadstue')).toBe(true);
    expect(bergenAddons.some(c => c.id === 'addon-suppe-lunsj')).toBe(true);

    const eidfjordAddons = getRouteAddonCardsForCity('Eidfjord');
    expect(eidfjordAddons.some(c => c.id === 'addon-gratis-badstue')).toBe(true);
    expect(eidfjordAddons.some(c => c.id === 'addon-suppe-lunsj')).toBe(false);

    // Oslo and others also get paid sauna, not gratis
    const osloAddons = getRouteAddonCardsForCity('Oslo');
    expect(osloAddons.some(c => c.id === 'addon-gratis-badstue')).toBe(false);
  });

  it('calculates total price and timeline steps with time windows and sun hours', () => {
    const kurv: TurKurv = {
      city: 'Bergen',
      createdAt: '2026-10-26T12:00:00Z',
      stops: [
        {
          activityId: 'stop-floyen',
          title: 'Fløyen til Skomakerdiket',
          locationName: 'Fløibanen Nedre Stasjon',
          scheduledTime: '11:00',
          preBooked: true,
          preBookingNote: '2x Skillingsbolle & kaffe + Fjordbadstue etter turen',
          basePriceNok: 0,
        },
      ],
    };

    const itinerary = buildTripItinerary(kurv);

    expect(itinerary.steps.length).toBe(3); // Start + Food + Sauna
    expect(itinerary.totalPriceNok).toBe(90 + 199); // 289 kr
    expect(itinerary.sunWindowSummary).toContain('Sol');

    const [startStep, foodStep, saunaStep] = itinerary.steps;

    expect(startStep.kind).toBe('start');
    expect(startStep.timeWindow).toBe('Kl. 11:00–11:45');
    expect(startStep.headline).toContain('Start på tur');

    expect(foodStep.kind).toBe('food');
    expect(foodStep.timeWindow).toBe('Kl. 11:45–12:15');
    expect(foodStep.priceNok).toBe(90);

    expect(saunaStep.kind).toBe('sauna');
    expect(saunaStep.timeWindow).toBe('Kl. 12:45–14:00');
    expect(saunaStep.priceNok).toBe(199);
  });
});
