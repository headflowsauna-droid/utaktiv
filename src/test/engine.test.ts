import { describe, it, expect } from 'vitest';
import { DEFAULT_USER_PROFILE, isFamilyCompatible, UserProfile, getStoredProfile, saveStoredProfile } from '../engine/profile';
import { INITIAL_ACTIVITIES, filterActivitiesForCity } from '../engine/activities';
import { calculateSolarAltitude, estimateLux, getSolarStatus } from '../engine/solar';
import { rankActivitiesForProfile } from '../engine/recommender';
import { calculateDistanceMeters, verifyCheckinProximity } from '../engine/checkin';
import { calculateCommissionNok, buildAffiliateUrl } from '../engine/tickets';
import { calculateLuxPoints, STORE_VOUCHERS, INITIAL_JUNIOR_CHORES, getUserPointsBalance } from '../engine/gamification';
import { resetPointEntriesForTests, seedPurchasedForTests } from '../engine/pointsLedger';
import { 
  TOPUP_PACKAGES, 
  topupWallet, 
  transferPoints, 
  payWithPoints, 
} from '../engine/wallet';
import { 
  createGiftCard, 
  redeemGiftCard 
} from '../engine/gifting';
import { 
  createPlannedEvent, 
  updateInviteeStatus, 
  generateInvitationShareText, 
  getPlannedEvents 
} from '../engine/planner';
import {
  getSavingGoals,
  createSavingGoal,
  contributeToGoal,
  generateSpleisShareText
} from '../engine/savings';
import {
  getStoredSocialState,
  saveStoredSocialState,
  getFriendsForActivity,
  SocialState
} from '../engine/friends';

describe('Utaktiv Engine', () => {
  describe('Profil & Familiekompatibilitet', () => {
    it('skal godkjenne en vognvennlig aktivitet for familie med småbarn', () => {
      const familyWithBaby: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        children: [{ id: 'b1', name: 'Baby', age: 1, needsStroller: true, energyLevel: 'low', interests: [] }],
      };

      const result = isFamilyCompatible(familyWithBaby, {
        strollerAccessible: true,
        targetAgeMin: 0,
      });

      expect(result.compatible).toBe(true);
    });

    it('skal avvise krevende sti uten barnevognstilgang hvis familien har småbarn', () => {
      const familyWithBaby: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        children: [{ id: 'b1', name: 'Baby', age: 1, needsStroller: true, energyLevel: 'low', interests: [] }],
      };

      const result = isFamilyCompatible(familyWithBaby, {
        strollerAccessible: false,
      });

      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('barnevogn');
    });
  });

  describe('Sol & Luks-motor', () => {
    it('skal beregne positiv solhøyde midt på dagen om sommeren i Bergen', () => {
      const summerMidday = new Date('2026-06-21T11:00:00Z');
      const { altitude } = calculateSolarAltitude(summerMidday, 60.39, 5.32);
      expect(altitude).toBeGreaterThan(45);
    });

    it('skal redusere luks ved 100% skydekke sammenlignet med klar himmel', () => {
      const clearLux = estimateLux(40, 0);
      const cloudyLux = estimateLux(40, 100);
      expect(cloudyLux).toBeLessThan(clearLux);
      expect(cloudyLux).toBeGreaterThan(500);
    });

    it('skal returnere korrekt sirkadisk vindu', () => {
      const morningDate = new Date('2026-06-21T07:30:00');
      const status = getSolarStatus(morningDate, 60.39, 5.32, 20);
      expect(status.circadianWindow).toBe('morning');
      expect(status.melatoninImpact).toContain('døgnklokken');
    });
  });

  describe('Billettsalg, Provisjon & Kommersialisering', () => {
    it('skal beregne korrekt provisjon for billettformidling', () => {
      // 795 kr billett med 5% provisjon = 40 kr
      const comm = calculateCommissionNok(795, 5);
      expect(comm).toBe(40);

      // Voss Ekstremsportveko: 2190 kr med 6% provisjon = 131 kr
      const vossComm = calculateCommissionNok(2190, 6);
      expect(vossComm).toBe(131);
    });

    it('skal bygge affiliate-URL med partner-id', () => {
      const url = buildAffiliateUrl('https://ticketmaster.no/event/123', 'sol_partner_42');
      expect(url).toContain('ref=sol_app');
      expect(url).toContain('aff_id=sol_partner_42');
    });
  });

  describe('GPS-avstand og Turstempling', () => {
    it('skal beregne nøyaktig avstand i meter med Haversine', () => {
      // To punkter i Bergen sentrum ca 500m fra hverandre
      const dist = calculateDistanceMeters(60.3913, 5.3221, 60.3950, 5.3250);
      expect(dist).toBeGreaterThan(350);
      expect(dist).toBeLessThan(650);
    });

    it('skal godkjenne innsjekk når brukeren er innenfor tillatt radius', () => {
      const result = verifyCheckinProximity(60.3913, 5.3221, 60.3915, 5.3222, 100);
      expect(result.canCheckin).toBe(true);
      expect(result.distanceMeters).toBeLessThan(50);
    });
  });

  describe('Aktiviteter & Anbefalinger (Matchmaking)', () => {
    it('skal filtrere aktiviteter for valgt by', () => {
      const bergenActs = filterActivitiesForCity(INITIAL_ACTIVITIES, 'Bergen');
      expect(bergenActs.length).toBeGreaterThanOrEqual(4);
      expect(bergenActs.every(a => a.city === 'Bergen')).toBe(true);
    });

    it('skal inneholde 7-fjellsturen, Trolljeger og Høyt & Lavt', () => {
      const titles = INITIAL_ACTIVITIES.map(a => a.title);
      expect(titles.some(t => t.includes('7-Fjell'))).toBe(true);
      expect(titles.some(t => t.includes('Trolljeger'))).toBe(true);
      expect(titles.some(t => t.includes('Høyt & Lavt'))).toBe(true);
      expect(titles.some(t => t.includes('Ekstremsportveko'))).toBe(true);
    });

    it('skal gi toppscore til Jason Mraz-konsert når brukeren har ham som favorittartist', () => {
      const solar = getSolarStatus(new Date(), 60.39, 5.32);
      const ranked = rankActivitiesForProfile(DEFAULT_USER_PROFILE, INITIAL_ACTIVITIES, solar);

      const mraz = ranked.find(r => r.activity.artists?.includes('Jason Mraz'));
      expect(mraz).toBeDefined();
      expect(mraz!.score).toBeGreaterThanOrEqual(80);
      expect(mraz!.matchReasons.some(r => r.includes('Jason Mraz'))).toBe(true);
    });
  });

  describe('Gamifisering & Sol Junior Dagslyspoeng', () => {
    it('skal beregne dagslyspoeng med UV- og luks-multiplikator', () => {
      // 30 min med 20 000 luks og UV 2.0
      // luxFactor = 2, uvFactor = 1 + 2*0.25 = 1.5, points = 30 * 2 * 1.5 * 5 = 450
      const points = calculateLuxPoints(20000, 30, 2.0);
      expect(points).toBe(450);
    });

    it('skal gi høyere poengsum ved høyere UV-indeks (solskinnsmultiplikator)', () => {
      const lowUvPoints = calculateLuxPoints(30000, 45, 1.0);
      const highUvPoints = calculateLuxPoints(30000, 45, 4.0);
      expect(highUvPoints).toBeGreaterThan(lowUvPoints);
    });

    it('skal inneholde kuponger for Jason Mraz, 7-Fjell og Klatrepark i Sol Store', () => {
      expect(STORE_VOUCHERS.length).toBeGreaterThanOrEqual(4);
      expect(STORE_VOUCHERS.some(v => v.title.includes('Jason Mraz'))).toBe(true);
      expect(STORE_VOUCHERS.some(v => v.title.includes('7-Fjell'))).toBe(true);
    });

    it('skal inneholde trygge nabooppgaver for Sol Junior', () => {
      expect(INITIAL_JUNIOR_CHORES.length).toBeGreaterThanOrEqual(3);
      const gressklipp = INITIAL_JUNIOR_CHORES.find(c => c.title.includes('plenen'));
      expect(gressklipp).toBeDefined();
      expect(gressklipp!.activityPoints).toBe(150);
      expect(gressklipp!.sponsorNok).toBe(150);
    });
  });

  describe('Sol Lommebok, Valuta & Forretningsmodell', () => {
    it('skal inneholde poengpakker med 1 poeng = 1 kr og 1050 poeng for 1000 kr', () => {
      expect(TOPUP_PACKAGES.length).toBe(4);
      const starter = TOPUP_PACKAGES.find(p => p.id === 'topup-starter');
      const season = TOPUP_PACKAGES.find(p => p.id === 'topup-season');

      expect(starter).toBeDefined();
      expect(starter!.priceNok).toBe(100);
      expect(starter!.totalPoints).toBe(100);

      expect(season).toBeDefined();
      expect(season!.priceNok).toBe(1000);
      expect(season!.bonusPoints).toBe(50);
      expect(season!.totalPoints).toBe(1050); // 1 050 poeng for 1 000 kr
    });

    it('skal ikke lage kjøpte poeng fra klienten', () => {
      const initialBal = getUserPointsBalance();
      const res = topupWallet('topup-family', 'vipps');

      expect(res.success).toBe(false);
      expect(res.error).toContain('Stripe');
      expect(getUserPointsBalance()).toBe(initialBal);
    });

    it('skal nekte å sende poeng mellom personer', () => {
      const transferRes = transferPoints('Oliver Robertsen', '+47 912 34 567', 350, 'God innsats!');
      expect(transferRes.success).toBe(false);
      expect(transferRes.error).toBe('Poeng kan ikke sendes mellom personer.');
    });

    it('skal nekte P2P overføring også når beløpet er stort', () => {
      const hugePoints = 99999999;
      const transferRes = transferPoints('Milla', '+47 923 45 678', hugePoints);
      expect(transferRes.success).toBe(false);
      expect(transferRes.error).toBe('Poeng kan ikke sendes mellom personer.');
    });

    it('skal tillate delbetaling og fullbetaling av billetter med kjøpte Luks-poeng (1 poeng = 1 kr)', async () => {
      resetPointEntriesForTests();
      seedPurchasedForTests(200);

      const payRes = await payWithPoints('Klatrepark Inngang', 100, 150, 'act-hoyt');
      expect(payRes.success).toBe(true);
      expect(payRes.pointsUsed).toBe(100);
      expect(payRes.discountNok).toBe(100);
      expect(payRes.remainingNok).toBe(50);

      const fullPay = await payWithPoints('Kaffe & Bolle', 50, 50);
      expect(fullPay.success).toBe(true);
      expect(fullPay.pointsUsed).toBe(50);
      expect(fullPay.discountNok).toBe(50);
      expect(fullPay.remainingNok).toBe(0);
    });
  });

  describe('Gavemotor: Gi Poeng & Aktiviteter i Gave', () => {
    it('skal nekte å gi bort poeng', async () => {
      const balanceBefore = getUserPointsBalance();

      const res = await createGiftCard({
        type: 'points',
        pointsAmount: 500,
        nokValue: 50,
        senderName: 'Bestemor Torill',
        recipientName: 'Oliver Robertsen',
        recipientContact: '+47 912 34 567',
        message: 'Gratulerer med dagen gutten min!',
        theme: 'birthday',
        paymentMethod: 'points',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('kan ikke gis bort');
      expect(getUserPointsBalance()).toBe(balanceBefore);
    });

    it('skal opprette gavekort for en spesifikk aktivitet (f.eks. klatrepark)', async () => {
      const res = await createGiftCard({
        type: 'activity',
        nokValue: 360,
        activityId: 'act-hoytoglavt',
        activityTitle: 'Høyt & Lavt Klatrepark Nesttun',
        senderName: 'Tante Lise',
        recipientName: 'Milla Robertsen',
        recipientContact: '+47 923 45 678',
        message: 'Her er klatrebillett til deg!',
        theme: 'family',
        paymentMethod: 'vipps',
      });

      expect(res.success).toBe(true);
      expect(res.gift!.activityTitle).toBe('Høyt & Lavt Klatrepark Nesttun');
      expect(res.gift!.isRedeemed).toBe(false);
    });

    it('skal løse inn et aktivitetskort uten å lage kjøpte poeng', async () => {
      const createRes = await createGiftCard({
        type: 'activity',
        nokValue: 100,
        activityId: 'act-hoytoglavt',
        activityTitle: 'Høyt og Lavt',
        senderName: 'Onkel Dag',
        recipientName: 'Oliver',
        recipientContact: '+47 912 34 567',
        message: 'Kos deg!',
        theme: 'birthday',
        paymentMethod: 'card',
      });

      const giftCode = createRes.gift!.code;
      const balBefore = getUserPointsBalance();

      const redeemRes = redeemGiftCard(giftCode, 'Alexander');
      expect(redeemRes.success).toBe(true);
      expect(redeemRes.gift!.isRedeemed).toBe(true);
      expect(redeemRes.pointsCredited).toBe(0);
      expect(getUserPointsBalance()).toBe(balBefore);

      const doubleRedeem = redeemGiftCard(giftCode, 'Alexander');
      expect(doubleRedeem.success).toBe(false);
      expect(doubleRedeem.error).toContain('allerede løst inn');
    });
  });

  describe('Tur-, Bursdags- & Aktivitetsplanlegger (Bursdagsbesøk & Svømmehall)', () => {
    it('skal opprette barnebursdag med svarfrist, råd om klær og felles gaveønske', () => {
      const event = createPlannedEvent({
        category: 'birthday',
        title: 'Olivers 10-års Utebursdag på Fløyen',
        description: 'Feiring ved Skomakerdiket',
        locationName: 'Skomakerdiket, Fløyen',
        city: 'Bergen',
        date: '2027-05-15',
        time: '12:00',
        durationMinutes: 180,
        birthdayKidName: 'Oliver Robertsen',
        birthdayKidAge: 10,
        rsvpDeadline: '2027-05-10',
        themeEmoji: '🎂',
        dressCodeAdvice: 'Gode tursko og regntøy ved behov',
        wishlistNote: 'Oliver ønsker seg Luks-poeng til tretoppklatring!',
        organizerName: 'Alexander Robertsen',
        organizerPhone: '+47 912 34 567',
        paymentMode: 'organizer_pays_all',
        pricePerPersonNok: 0,
        invitees: [
          { id: 'i1', name: 'Henrik', phone: '+47 987 65 432', status: 'invited' },
          { id: 'i2', name: 'Emma', phone: '+47 965 43 210', status: 'invited' },
        ],
        packingList: ['Termos', 'Sitteunderlag'],
      });

      expect(event.id).toBeDefined();
      expect(event.category).toBe('birthday');
      expect(event.birthdayKidAge).toBe(10);
      expect(event.wishlistNote).toContain('Luks-poeng');
    });

    it('skal inkludere svømmehall (AdO Arena) som godkjent familie- og bursdagsaktivitet', () => {
      const ado = INITIAL_ACTIVITIES.find(a => a.id === 'act-ado-arena');
      expect(ado).toBeDefined();
      expect(ado!.title).toContain('AdO Arena');
      expect(ado!.title).toContain('Svømmehall');
      expect(ado!.locationName).toContain('Store Lungegårdsvannet');
    });

    it('skal oppdatere RSVP og registrere allergi og gavedonasjon for inviterte', () => {
      const events = getPlannedEvents();
      const firstEvent = events[0];
      const invitee = firstEvent.invitees[0];

      const res = updateInviteeStatus(firstEvent.id, invitee.id, 'accepted', 'Laktosefri', 250);
      expect(res.success).toBe(true);

      const updatedInv = res.event!.invitees.find(i => i.id === invitee.id);
      expect(updatedInv!.status).toBe('accepted');
      expect(updatedInv!.allergy).toBe('Laktosefri');
      expect(updatedInv!.giftPointsPledged).toBe(250);
    });

    it('skal generere en ferdig delevennlig invitasjonstekst til SMS, Spond og WhatsApp', () => {
      const events = getPlannedEvents();
      const birthdayEvt = events.find(e => e.category === 'birthday') || events[0];
      const shareText = generateInvitationShareText(birthdayEvt);

      expect(shareText).toContain('Du er invitert');
      expect(shareText).toContain('Dato:');
      expect(shareText).toContain('Sted:');
      expect(shareText).toContain('https://utaktiv.no/invitasjon/');
    });
  });

  describe('Reisesparing & Sol-Spleis (Felles sparekonto for turer og opplevelser)', () => {
    it('skal hente standard reisesparekontoer (Lofoten, Finse)', () => {
      const goals = getSavingGoals();
      expect(goals.length).toBeGreaterThanOrEqual(2);
      const lofoten = goals.find(g => g.id === 'save-lofoten-2027');
      expect(lofoten).toBeDefined();
      expect(lofoten!.destination).toContain('Lofoten');
      expect(lofoten!.targetAmountNok).toBe(6000);
      expect(lofoten!.contributors.length).toBeGreaterThanOrEqual(2);
    });

    it('skal opprette en ny reisesparekonto med målbeløp og startinnskudd', async () => {
      resetPointEntriesForTests();
      seedPurchasedForTests(2000);
      const balanceBefore = getUserPointsBalance();

      const res = await createSavingGoal({
        title: 'Galdhøpiggen Topptur med venner',
        destination: 'Jotunheimen / Spiterstulen',
        category: 'mountain',
        targetAmountNok: 4000,
        targetDate: '2027-08-15',
        description: 'Telt og guidet brekryssing over Styggebreen til Norges tak.',
        creatorName: 'Alexander',
        initialDepositPoints: 100, // 100 NOK (1 poeng = 1 kr)
      });

      expect(res.success).toBe(true);
      expect(res.goal).toBeDefined();
      expect(res.goal!.title).toBe('Galdhøpiggen Topptur med venner');
      expect(res.goal!.currentPoints).toBe(100);
      expect(res.goal!.currentAmountNok).toBe(100);
      expect(res.goal!.shareCode).toContain('SOL-SPLEIS-');

      // Verifiser at startinnskudd ble trukket fra lommeboka
      expect(getUserPointsBalance()).toBe(balanceBefore - 100);
    });

    it('skal sette inn bidrag (poeng) fra familie eller venner og oppdatere reisekassa', async () => {
      resetPointEntriesForTests();
      seedPurchasedForTests(3000);
      const goals = getSavingGoals();
      const goal = goals[0];
      const pointsBefore = goal.currentPoints;
      const nokBefore = goal.currentAmountNok;

      const contributeRes = await contributeToGoal(
        goal.id,
        'Bestemor Torill',
        'Besteforelder',
        100,
        'Litt ekstra reiselommepenger til barna!'
      );

      expect(contributeRes.success).toBe(true);
      expect(contributeRes.goal!.currentPoints).toBe(pointsBefore + 100);
      expect(contributeRes.goal!.currentAmountNok).toBe(nokBefore + 100);

      const latestContrib = contributeRes.goal!.contributors[0];
      expect(latestContrib.name).toBe('Bestemor Torill');
      expect(latestContrib.role).toBe('Besteforelder');
      expect(latestContrib.nokValue).toBe(100);
    });

    it('skal avvise innskudd hvis lommeboka ikke har dekning', async () => {
      const goals = getSavingGoals();
      const goal = goals[0];
      const hugeAmount = 99999999;

      const contributeRes = await contributeToGoal(
        goal.id,
        'Test Person',
        'Venn',
        hugeAmount
      );

      expect(contributeRes.success).toBe(false);
      expect(contributeRes.error).toContain('tilgjengelig');
    });

    it('skal generere en ferdig delevennlig spleistekst for SMS, Spond og familiechat', () => {
      const goals = getSavingGoals();
      const goal = goals[0];
      const shareText = generateSpleisShareText(goal);

      expect(shareText).toContain('familietur');
      expect(shareText).toContain(goal.destination);
      expect(shareText).toContain(goal.shareCode);
      expect(shareText).toContain('https://utaktiv.no?spleis=');
    });
  });

  describe('Profil, Barn & Lokal Lagring', () => {
    it('skal lagre og hente profil fra localStorage', () => {
      const customProfile: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        name: 'Alexander Test',
        children: [
          {
            id: 'child-test-1',
            name: 'Milla',
            age: 4,
            needsStroller: false,
            energyLevel: 'high',
            interests: ['lekeplass', 'is'],
          },
        ],
      };

      saveStoredProfile(customProfile);
      const loaded = getStoredProfile();
      expect(loaded.name).toBe('Alexander Test');
      expect(loaded.children.length).toBe(1);
      expect(loaded.children[0].name).toBe('Milla');
    });

    it('skal gi detaljert familiekompatibilitet og riktig badge for barna', () => {
      const profileWithKids: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        hasChildren: true,
        children: [
          {
            id: 'c-1',
            name: 'Milla',
            age: 4,
            needsStroller: false,
            energyLevel: 'high',
            interests: ['lekeplass'],
          },
          {
            id: 'c-2',
            name: 'Oliver',
            age: 7,
            needsStroller: false,
            energyLevel: 'high',
            interests: ['klatring'],
          },
        ],
      };

      // 1. Aktivitet som passer begge
      const bothMatch = isFamilyCompatible(profileWithKids, {
        strollerAccessible: true,
        targetAgeMin: 3,
        targetAgeMax: 12,
      });
      expect(bothMatch.compatible).toBe(true);
      expect(bothMatch.badgeType).toBe('all_match');
      expect(bothMatch.summaryHeadline).toContain('Passer for Milla (4 år) & Oliver (7 år)');

      // 2. Aktivitet for eldre barn (f.eks. min 12 år)
      const adultOnly = isFamilyCompatible(profileWithKids, {
        strollerAccessible: true,
        targetAgeMin: 12,
      });
      expect(adultOnly.compatible).toBe(false);
      expect(adultOnly.badgeType).toBe('adults_only');

      // 3. Aktivitet som krever vogn når barn trenger vogn
      const profileWithStrollerKid: UserProfile = {
        ...profileWithKids,
        children: [
          {
            id: 'c-baby',
            name: 'Lillebror',
            age: 1,
            needsStroller: true,
            energyLevel: 'low',
            interests: [],
          },
        ],
      };
      const strollerWarning = isFamilyCompatible(profileWithStrollerKid, {
        strollerAccessible: false,
      });
      expect(strollerWarning.compatible).toBe(false);
      expect(strollerWarning.badgeType).toBe('stroller_warning');
      expect(strollerWarning.summaryHeadline).toContain('Krever barnevogn');
    });
  });

  describe('Sosialt & Facebook-lignende Vennenettverk (Utaktiv Friends)', () => {
    it('skal laste inn standard venner, forespørsler og feed', () => {
      const social = getStoredSocialState();
      expect(social.friends.length).toBeGreaterThanOrEqual(4);
      expect(social.incomingRequests.length).toBeGreaterThanOrEqual(2);
      expect(social.feed.length).toBeGreaterThanOrEqual(3);
    });

    it('skal finne venner som skal til en spesifikk aktivitet (social proof)', () => {
      const social = getStoredSocialState();
      const floyenFriends = getFriendsForActivity('act-floyen-lekeplass', social.friends);
      expect(floyenFriends.length).toBeGreaterThan(0);
      expect(floyenFriends.some(f => f.name === 'Kristian Dahl')).toBe(true);
    });

    it('skal kunne godkjenne en venneforespørsel og flytte til venner', () => {
      const social = getStoredSocialState();
      const req = social.incomingRequests[0];
      const friendCountBefore = social.friends.length;

      const updatedState: SocialState = {
        ...social,
        incomingRequests: social.incomingRequests.filter(r => r.id !== req.id),
        friends: [
          {
            id: req.userId,
            name: req.name,
            avatar: req.avatar,
            city: req.city,
            mutualFriendsCount: req.mutualFriendsCount,
            totalLux: 5000,
            currentStreakDays: 1,
            isOnline: true,
          },
          ...social.friends,
        ],
      };

      saveStoredSocialState(updatedState);
      const loaded = getStoredSocialState();
      expect(loaded.friends.length).toBe(friendCountBefore + 1);
      expect(loaded.incomingRequests.some(r => r.id === req.id)).toBe(false);
      expect(loaded.friends.some(f => f.name === req.name)).toBe(true);
    });
  });
});
