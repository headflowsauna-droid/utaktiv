import { describe, expect, it, beforeEach } from 'vitest';
import { SOURCED_STOPS } from '../data/sourcedStops';
import { INITIAL_ACTIVITIES } from '../engine/activities';
import { describePlaceSun, findSunTimes, formatOsloClock, type HorizonProfile } from '../engine/sunPlace';
import { getStopsForRoute } from '../engine/businessTips';
import { clearPendingTipsForTests, savePendingTip } from '../engine/localTips';
import { togglePresetInBookingNote, isPresetInBookingNote } from '../components/TurBuilderModal';
import { buildTripItinerary } from '../engine/plakatRenderer';
import { SJEL_OG_GANE_MENU, HEIT_EIDFJORD_BOOKING } from '../components/EidfjordPartnerModal';

const oct = new Date('2026-10-25T12:00:00Z');
const dec = new Date('2026-12-21T12:00:00Z');
const BERGEN = { lat: 60.3913, lng: 5.3221 };

describe('sol på et punkt', () => {
  it('gir ulik solnedgang i oktober og desember', () => {
    const autumn = findSunTimes(oct, BERGEN.lat, BERGEN.lng);
    const winter = findSunTimes(dec, BERGEN.lat, BERGEN.lng);
    expect(autumn.sunset).not.toBeNull();
    expect(winter.sunset).not.toBeNull();
    expect(formatOsloClock(autumn.sunset!)).not.toBe(formatOsloClock(winter.sunset!));
  });

  it('sier at fjellet ikke er trukket fra når ryggen mangler', () => {
    const sentence = describePlaceSun({ ...BERGEN, now: oct });
    expect(sentence.ridgeKnown).toBe(false);
    expect(sentence.sentenceNo).toContain('Fjellet er ikke trukket fra');
  });

  it('sier at terrenget stenger sola når ryggen er høyere', () => {
    const horizon: HorizonProfile = {
      id: 'test',
      lat: BERGEN.lat,
      lng: BERGEN.lng,
      groundMeters: 20,
      ridgeDeg: Array(24).fill(80),
      fetchedOn: '2026-10-25',
      source: 'test',
    };
    const sentence = describePlaceSun({ ...BERGEN, now: oct, horizon });
    expect(sentence.sentenceNo).toContain('Terrenget ligger over sola');
  });

  it('de nye stoppene har ingen billett og ingen tillegg', () => {
    expect(SOURCED_STOPS.length).toBeGreaterThanOrEqual(4);
    for (const stop of SOURCED_STOPS) {
      expect(stop.ticket).toBeUndefined();
      expect(stop.addOns).toBeUndefined();
      expect(stop.stopKind).toBeTruthy();
      expect(INITIAL_ACTIVITIES.some(a => a.id === stop.id)).toBe(true);
    }
    const names = SOURCED_STOPS.map(s => `${s.title} ${s.description}`).join(' ');
    expect(names).toContain('Sætregården');
    expect(names).toContain('Steinhellebrua');
    expect(names).not.toContain('Øvre-Eide er');
    expect(names).toContain('ikke Øvre-Eide');
  });

  describe('Stopp & bedrifter langs veien (businessTips & localTips)', () => {
    beforeEach(() => {
      clearPendingTipsForTests();
    });

    it('viser Sætregården som bekreftet stopp på Den trondhjemske postvei og Veten i Åsane', () => {
      const postveiStops = getStopsForRoute(
        'act-postveien-asane-bergen',
        'Den Trondhjemske Postvei gjennom Åsane',
        'Bergen'
      );
      expect(postveiStops.verifiedStops.some(s => s.name.includes('Sætregården'))).toBe(true);
      expect(postveiStops.verifiedStops[0].address).toContain('Falkangervegen 235');
    });

    it('viser Sjel og Gane og Gratis badstue helt nede ved fjorden i Eidfjord', () => {
      const gratisSauna = INITIAL_ACTIVITIES.find(a => a.id === 'act-gratis-sauna-eidfjord');
      expect(gratisSauna).toBeDefined();
      expect(gratisSauna?.stopKind).toBe('free');
      expect(gratisSauna?.city).toBe('Eidfjord');

      const voringsfossen = INITIAL_ACTIVITIES.find(a => a.id === 'act-voringsfossen-trappebro');
      expect(voringsfossen?.addOns?.some(a => a.title.includes('Sjel og Gane'))).toBe(true);
      expect(voringsfossen?.addOns?.some(a => a.title.includes('Gratis Badstue') && a.priceNok === 0)).toBe(true);

      const eidfjordStops = getStopsForRoute(
        'act-voringsfossen-trappebro',
        'Vøringsfossen Spektakulære Trappebro',
        'Eidfjord'
      );
      expect(eidfjordStops.verifiedStops.some(s => s.name.includes('Sjel og Gane'))).toBe(true);
      expect(eidfjordStops.verifiedStops.some(s => s.name.includes('Gratis Badstue'))).toBe(true);
    });

    it('lar brukere tipse om en bedrift langs en turrute og knytter tipset til ruten', () => {
      savePendingTip({
        city: 'Bergen',
        trail: 'Vikinghytten fra Hjortland',
        placeName: 'Hjortland Gårdskiosk',
        offer: 'Nystekte sveler og kaffe ved parkeringen i helgene',
        link: 'https://example.com',
        kind: 'place',
      });

      const vikingStops = getStopsForRoute(
        'act-vikinghytten-hjortland-asane',
        'Vikinghytten fra Hjortland (Åsane / Vardegga 590 moh.)',
        'Bergen'
      );
      expect(vikingStops.userTippedStops.length).toBe(1);
      expect(vikingStops.userTippedStops[0].placeName).toBe('Hjortland Gårdskiosk');
    });

    it('lar brukere velge BÅDE bolle og fjordbadstue samtidig i TurBuilderModal', () => {
      let note: string | undefined = undefined;
      note = togglePresetInBookingNote(note, '2x Skillingsbolle & kaffe');
      expect(isPresetInBookingNote(note, '2x Skillingsbolle & kaffe')).toBe(true);
      expect(isPresetInBookingNote(note, 'Fjordbadstue etter turen')).toBe(false);

      note = togglePresetInBookingNote(note, 'Fjordbadstue etter turen');
      expect(isPresetInBookingNote(note, '2x Skillingsbolle & kaffe')).toBe(true);
      expect(isPresetInBookingNote(note, 'Fjordbadstue etter turen')).toBe(true);
      expect(note).toBe('2x Skillingsbolle & kaffe + Fjordbadstue etter turen');

      // Toggle off bolle, behold badstue
      note = togglePresetInBookingNote(note, '2x Skillingsbolle & kaffe');
      expect(isPresetInBookingNote(note, '2x Skillingsbolle & kaffe')).toBe(false);
      expect(isPresetInBookingNote(note, 'Fjordbadstue etter turen')).toBe(true);
      expect(note).toBe('Fjordbadstue etter turen');
    });

    it('bygger en detaljert kjøreplan som viser når og hvor vi spiser bolle og tar sauna', () => {
      const postveien = INITIAL_ACTIVITIES.find(a => a.id === 'act-postveien-asane-bergen')!;
      const itinerary = buildTripItinerary({
        city: 'Bergen',
        createdAt: new Date().toISOString(),
        stops: [
          {
            activityId: postveien.id,
            title: postveien.title,
            locationName: postveien.locationName,
            scheduledTime: '11:00',
            preBooked: true,
            preBookingNote: '2x Skillingsbolle & kaffe + Fjordbadstue etter turen',
          },
        ],
      });

      expect(itinerary.narrative).toContain('Vi møtes kl. 11:00');
      expect(itinerary.narrative.toLowerCase()).toContain('skillingsbolle');
      expect(itinerary.narrative).toContain('Sætregården');
      expect(itinerary.narrative).toContain('Heit Bergen Sauna');
      expect(itinerary.steps.some(s => s.kind === 'food')).toBe(true);
      expect(itinerary.steps.some(s => s.kind === 'sauna')).toBe(true);
    });

    it('inneholder menykortet for Sjel & Gane (kokken Arthur) og direkte Heit Sauna-booking uten egen betalingsmellommann', () => {
      expect(SJEL_OG_GANE_MENU.address).toContain('Eidfjordvegen 300');
      expect(SJEL_OG_GANE_MENU.menykortUrl).toContain('menykort.menu/restaurants/eidfjord/sjel-og-gane');
      expect(SJEL_OG_GANE_MENU.sections.some(s => s.items.some(i => i.dish.includes('seirygg')))).toBe(true);

      expect(HEIT_EIDFJORD_BOOKING.dropInUrl).toContain('minside.periode.no/booking');
      expect(HEIT_EIDFJORD_BOOKING.dropInUrl).toContain('utm_source=utaktiv');
      expect(HEIT_EIDFJORD_BOOKING.privateUrl).toContain('utm_source=utaktiv');

      const sjelAct = INITIAL_ACTIVITIES.find(a => a.id === 'act-sjel-og-gane-eidfjord');
      const heitAct = INITIAL_ACTIVITIES.find(a => a.id === 'act-heit-eidfjord-sauna');
      expect(sjelAct?.ticket).toBeUndefined();
      expect(heitAct?.ticket).toBeUndefined();
    });
  });
});
