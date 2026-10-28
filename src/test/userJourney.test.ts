import { beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_ACTIVITIES } from '../engine/activities';
import {
  createPlannedEvent,
  updateInviteeStatus,
  addInviteeToEvent,
  payForEventWithPoints,
  generateInvitationShareText,
} from '../engine/planner';
import {
  payWithPoints,
  getWalletLedger,
} from '../engine/wallet';
import {
  resetPointEntriesForTests,
  seedPurchasedForTests,
  purchasedBalance,
  earnedBalance,
  creditEarnedLocal,
} from '../engine/pointsLedger';
import { calculateCommissionNok, buildAffiliateUrl } from '../engine/tickets';
import { getStoredLanguage, saveStoredLanguage, t } from '../engine/i18n';

// In-memory localStorage polyfill for Node.js Vitest environment
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: 0,
    key: (_index: number) => null,
  };
}

describe('Brukerreise: Far/Konsertgjenger på Helgetur til Bergen', () => {
  beforeEach(() => {
    resetPointEntriesForTests();
    localStorage.clear();
  });

  describe('Steg 1: Utforske aktivitetskatalogen og finne overnatting/basecamp i Bergen', () => {
    it('inneholder sentrale Bergen-opplevelser: Jason Mraz, 7-Fjellsturen og Høyt & Lavt', () => {
      const bergenActivities = INITIAL_ACTIVITIES.filter(
        a => a.city.toLowerCase() === 'bergen'
      );
      expect(bergenActivities.length).toBeGreaterThanOrEqual(5);

      const jasonMraz = bergenActivities.find(a => a.id === 'act-jason-mraz');
      expect(jasonMraz).toBeDefined();
      expect(jasonMraz?.locationName).toContain('Koengen');
      expect(jasonMraz?.category).toBe('concert');

      const syvFjell = bergenActivities.find(a => a.id === 'act-7fjell');
      expect(syvFjell).toBeDefined();
      expect(syvFjell?.title).toContain('7-Fjellsturen');
      expect(syvFjell?.trail?.distanceKm).toBe(35.0);
      expect(syvFjell?.ticket?.priceNok).toBe(450);

      const hoytLavt = bergenActivities.find(a => a.id === 'act-hoytoglavt');
      expect(hoytLavt).toBeDefined();
      expect(hoytLavt?.title).toContain('Høyt & Lavt');
    });

    it('har kuraterte overnattingsbaser for Bergen med fasiliteter og avstander', () => {
      const accommodations = INITIAL_ACTIVITIES.filter(
        a =>
          a.city.toLowerCase() === 'bergen' &&
          (a.category === 'accommodation' || a.category === 'hostel' || a.accommodation)
      );

      expect(accommodations.length).toBeGreaterThanOrEqual(3);

      // 1. Montana Hostel ved Ulriken
      const montana = accommodations.find(a => a.id === 'act-montana-hostel-bergen');
      expect(montana).toBeDefined();
      expect(montana?.category).toBe('hostel');
      expect(montana?.accommodation?.priceLevel).toBe('budget');
      expect(montana?.accommodation?.pricePerNightNok).toBe(490);
      expect(montana?.accommodation?.amenities).toContain('Gjestekjøkken');
      expect(montana?.accommodation?.amenities).toContain('Tørkerom for fjelltøy');
      expect(montana?.accommodation?.proximity.sunOrMountainTrail).toContain('Ulriken');
      expect(montana?.accommodation?.proximity.concertVenue).toContain('Koengen');

      // 2. Citybox Bergen Sentrum
      const citybox = accommodations.find(a => a.id === 'act-citybox-bergen');
      expect(citybox).toBeDefined();
      expect(citybox?.category).toBe('accommodation');
      expect(citybox?.accommodation?.priceLevel).toBe('moderate');
      expect(citybox?.accommodation?.pricePerNightNok).toBe(790);
      expect(citybox?.accommodation?.proximity.cityCenter).toContain('sentrum');

      // 3. DNT Turnerhytten på Fløyen/Vidden
      const dntCabin = accommodations.find(a => a.id === 'act-dnt-floyen-cabin');
      expect(dntCabin).toBeDefined();
      expect(dntCabin?.category).toBe('hostel');
      expect(dntCabin?.accommodation?.type).toBe('dnt_cabin');
      expect(dntCabin?.accommodation?.pricePerNightNok).toBe(350);
      expect(dntCabin?.accommodation?.proximity.sunOrMountainTrail).toContain('Vidden');
    });

    it('støtter presis kategorifiltrering for Overnatting & Hostel i feeden', () => {
      const feedFilter = 'accommodation';
      const filtered = INITIAL_ACTIVITIES.filter(act => {
        if (feedFilter === 'accommodation') {
          return act.category === 'accommodation' || act.category === 'hostel';
        }
        return true;
      });

      expect(filtered.length).toBeGreaterThanOrEqual(3);
      expect(filtered.every(a => a.category === 'accommodation' || a.category === 'hostel')).toBe(true);
    });
  });

  describe('Steg 2: Planlegge tur fra et aktivitetskort (onOpenPlanActivity-flyten)', () => {
    it('forhåndsutfyller planleggeren når brukeren klikker "Planlegg tur"', () => {
      const syvFjell = INITIAL_ACTIVITIES.find(a => a.id === 'act-7fjell')!;
      expect(syvFjell).toBeDefined();

      // Simulering av tilstanden som settes i App.tsx og leses i PlannerModal
      const initialActivity = syvFjell;
      const initialTab = 'new_trip';

      const prepopulated = {
        category: (initialActivity.category === 'family' ? 'birthday' : 'outdoor_trip') as 'outdoor_trip',
        selectedActivityId: initialActivity.id,
        title: `Fellestur: ${initialActivity.title}`,
        locationName: initialActivity.locationName,
        city: initialActivity.city,
        pricePerPersonNok: initialActivity.ticket?.priceNok || 0,
        paymentMode: (initialActivity.ticket?.priceNok ? 'split_costs' : 'free_event') as 'split_costs',
        durationMinutes: initialActivity.durationMinutes || 180,
      };

      expect(prepopulated.title).toBe('Fellestur: 7-Fjellsturen i Bergen (DNT)');
      expect(prepopulated.locationName).toBe('Bergen Turlag / 7 Fjell');
      expect(prepopulated.city).toBe('Bergen');
      expect(prepopulated.pricePerPersonNok).toBe(450);
      expect(prepopulated.paymentMode).toBe('split_costs');
      expect(initialTab).toBe('new_trip');
    });

    it('oppretter arrangement med valgt aktivitet, overnattingsbase, inviterte og RSVP', () => {
      const syvFjell = INITIAL_ACTIVITIES.find(a => a.id === 'act-7fjell')!;
      const montanaHostel = INITIAL_ACTIVITIES.find(a => a.id === 'act-montana-hostel-bergen')!;

      const newTrip = createPlannedEvent({
        category: 'outdoor_trip',
        title: `Bergenshelg: 7-Fjellsturen & Koengen Konsert`,
        description: 'Vi tar 7-fjellsturen på dagtid og bor på Montana Hostel med utsikt over byen!',
        activityId: syvFjell.id,
        accommodationId: montanaHostel.id,
        locationName: syvFjell.locationName,
        city: 'Bergen',
        date: '2027-05-30',
        time: '07:00',
        durationMinutes: 480,
        themeEmoji: '🏔️',
        dressCodeAdvice: 'Fjellstøvler, gnagsårplaster, skalljakke og termos.',
        organizerName: 'Alexander Robertsen',
        organizerPhone: '+47 912 34 567',
        paymentMode: 'split_costs',
        pricePerPersonNok: 450,
        invitees: [
          { id: 'inv-alex', name: 'Alexander (Far)', phone: '+47 912 34 567', status: 'accepted' },
          { id: 'inv-lars', name: 'Lars (Kamerat)', phone: '+47 988 11 222', status: 'invited' },
        ],
        packingList: ['Drikkeflaske', 'Energibarer', 'Lakenpose til hostelet'],
      });

      expect(newTrip.id).toBeDefined();
      expect(newTrip.activityId).toBe('act-7fjell');
      expect(newTrip.accommodationId).toBe('act-montana-hostel-bergen');
      expect(newTrip.paymentMode).toBe('split_costs');
      expect(newTrip.invitees.length).toBe(2);

      // Kamerat Lars svarer JA (RSVP accepted)
      const rsvpRes = updateInviteeStatus(newTrip.id, 'inv-lars', 'accepted');
      expect(rsvpRes.success).toBe(true);
      expect(rsvpRes.event?.invitees.find(i => i.id === 'inv-lars')?.status).toBe('accepted');

      // Legger til en venn til i reisefølget
      const addRes = addInviteeToEvent(newTrip.id, {
        name: 'Milla Robertsen',
        phone: '+47 923 45 678',
      });
      expect(addRes.success).toBe(true);
      expect(addRes.newInvitee?.name).toBe('Milla Robertsen');

      // Genererer delbar invitasjonslenke for SMS/Spond
      const shareText = generateInvitationShareText(rsvpRes.event!);
      expect(shareText).toContain('Bli med på tur: Bergenshelg: 7-Fjellsturen & Koengen Konsert');
      expect(shareText).toContain('https://utaktiv.no/invitasjon/');
    });
  });

  describe('Steg 3: Billettbestilling, Sol-lommebok og provisjonsmotor', () => {
    it('beregner riktig provisjon og bygger affiliate-lenke med partner-ID', () => {
      const ticketPrice = 450;
      const commissionPercent = 10;
      const commission = calculateCommissionNok(ticketPrice, commissionPercent);
      expect(commission).toBe(45); // 45 NOK formidlingsprovisjon

      const url = buildAffiliateUrl('https://bergenoghordalandturlag.no/7fjell', 'sol_alexander_partner');
      expect(url).toContain('ref=sol_app');
      expect(url).toContain('aff_id=sol_alexander_partner');
    });

    it('bruker kjøpte Luks-poeng til å betale billett, trekker saldo og logger transaksjon', async () => {
      // 1 Luks-poeng = 1 NOK
      // Brukeren har kjøpt en poengpakke på 300 poeng (verdi 300 kr)
      seedPurchasedForTests(300);
      expect(purchasedBalance()).toBe(300);

      const syvFjell = INITIAL_ACTIVITIES.find(a => a.id === 'act-7fjell')!;
      const ticketTotalNok = 450; // 450 kr

      // Brukeren velger å innløse opptil 300 poeng (300 kr)
      const payRes = await payWithPoints(
        syvFjell.title,
        300,
        ticketTotalNok,
        syvFjell.id
      );

      expect(payRes.success).toBe(true);
      expect(payRes.pointsUsed).toBe(300);
      expect(payRes.discountNok).toBe(300);
      expect(payRes.remainingNok).toBe(150); // Kun 150 kr gjenstår å betale
      expect(payRes.newBalance).toBe(0);
      expect(purchasedBalance()).toBe(0);

      // Verifiserer transaksjonsloggen i Sol-lommeboken
      const txs = getWalletLedger();
      const lastTx = txs[0];
      expect(lastTx).toBeDefined();
      expect(lastTx.type).toBe('activity_payment');
      expect(lastTx.points).toBe(-300);
      expect(lastTx.nokValue).toBe(300);
      expect(lastTx.title).toContain(syvFjell.title);
    });

    it('sikrer to-potters integritet: opptjente dagslyspoeng kan IKKE brukes til betaling', async () => {
      // Bruker har samlet opptjente dagslyspoeng via sensoren
      creditEarnedLocal({ points: 40, reason: 'daylight', idempotencyKey: 'lys-tur-1' });
      expect(earnedBalance()).toBe(40);
      expect(purchasedBalance()).toBe(0);

      // Prøver å betale en billett på 200 kr med poeng
      const payRes = await payWithPoints('Konsert', 400, 200, 'act-jason-mraz');
      expect(payRes.success).toBe(false);
      expect(payRes.error).toContain('Du har 0 kjøpte poeng');
      expect(purchasedBalance()).toBe(0);
    });

    it('betaler for arrangement i Turplanleggeren med Luks-poeng', async () => {
      seedPurchasedForTests(400); // 400 poeng = 400 kr (1:1)
      expect(purchasedBalance()).toBe(400);

      const event = createPlannedEvent({
        category: 'activity_park',
        title: 'Høyt & Lavt Klatredag med venner',
        description: 'Moro i tretoppene på Nesttun',
        locationName: 'Nesttun',
        city: 'Bergen',
        date: '2027-06-12',
        time: '11:00',
        durationMinutes: 240,
        themeEmoji: '🧗',
        dressCodeAdvice: 'Treningstøy',
        organizerName: 'Alexander',
        organizerPhone: '+47 912 34 567',
        paymentMode: 'organizer_pays_all',
        pricePerPersonNok: 200,
        invitees: [
          { id: 'i1', name: 'Oliver', phone: '+47 912 34 567', status: 'accepted' },
          { id: 'i2', name: 'Henrik', phone: '+47 987 65 432', status: 'accepted' },
        ],
        packingList: ['Hansker', 'Vannflaske'],
      });

      // 2 deltakere x 200 kr = 400 kr = 400 poeng
      const payResult = await payForEventWithPoints(event.id, 400);
      expect(payResult.success).toBe(true);
      expect(payResult.remainingNok).toBe(0);
      expect(purchasedBalance()).toBe(0);
    });
  });

  describe('Steg 4: Flerspråklighet (i18n: Norsk / Engelsk)', () => {
    it('oversetter filter og begreper presist på norsk og engelsk', () => {
      saveStoredLanguage('no');
      expect(getStoredLanguage()).toBe('no');
      expect(t('accommodation', 'no')).toBe('Overnatting & Hostel');
      expect(t('hikes', 'no')).toBe('Fjelltur');
      expect(t('concerts', 'no')).toBe('Konsert');
      expect(t('familyPlanner', 'no')).toBe('Tur & Bursdag');

      saveStoredLanguage('en');
      expect(getStoredLanguage()).toBe('en');
      expect(t('accommodation', 'en')).toBe('Accommodation & Hostels');
      expect(t('hikes', 'en')).toBe('Hikes');
      expect(t('concerts', 'en')).toBe('Concerts');
      expect(t('familyPlanner', 'en')).toBe('Trips & Events');
    });
  });
});
