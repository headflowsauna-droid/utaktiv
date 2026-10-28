import { describe, expect, it } from 'vitest';
import { INITIAL_ACTIVITIES, ActivityItem } from '../engine/activities';
import { TRANSLATIONS, t } from '../engine/i18n';

describe('Senior-trygghet og Turist-sikkerhet i Utaktiv', () => {
  describe('1. Datastruktur og berikelse av SeniorSafetyInfo', () => {
    it('alle 7 byer (Bergen, Stavanger, Trondheim, Kristiansand, Bodø, Oslo, Eidfjord) har aktiviteter beriket med SeniorSafetyInfo', () => {
      const cities = ['Bergen', 'Stavanger', 'Trondheim', 'Kristiansand', 'Bodø', 'Oslo', 'Eidfjord'];
      for (const city of cities) {
        const cityActivities = INITIAL_ACTIVITIES.filter(
          a => a.city.toLowerCase() === city.toLowerCase() && a.seniorSafety !== undefined
        );
        expect(
          cityActivities.length,
          `Byen ${city} skal ha minst én aktivitet beriket med senior-trygghetsdata`
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it('Fjellveien & Fløyen i Bergen har tilrettelagt underlag, hyppige hvilebenker, toalett og lun solvegg', () => {
      const floyen = INITIAL_ACTIVITIES.find(a => a.id === 'act-floyen-fjellveien-bergen');
      expect(floyen).toBeDefined();
      expect(floyen?.seniorSafety).toBeDefined();

      const safety = floyen!.seniorSafety!;
      expect(safety.surface).toBe('firm_gravel');
      expect(safety.benchDensity).toBe('frequent');
      expect(safety.hasPublicRestroom).toBe(true);
      expect(safety.restroomDistanceMeters).toBeLessThanOrEqual(150);
      expect(safety.parkingDistanceMeters).toBeLessThanOrEqual(150);
      expect(safety.shelteredSunCorner).toBe(true);
    });

    it('Sola Strand i Stavanger er asfaltert/trillevennlig med hyppige benker og kort vei til bil', () => {
      const sola = INITIAL_ACTIVITIES.find(a => a.id === 'act-solastrand-stavanger');
      expect(sola).toBeDefined();
      expect(sola?.seniorSafety).toBeDefined();

      const safety = sola!.seniorSafety!;
      expect(safety.surface).toBe('paved');
      expect(safety.benchDensity).toBe('frequent');
      expect(safety.hasPublicRestroom).toBe(true);
      expect(safety.parkingDistanceMeters).toBe(40);
      expect(safety.shelteredSunCorner).toBe(true);
    });

    it('Sørenga i Oslo har fast dekke, toalett og lun trebrygge', () => {
      const sorenga = INITIAL_ACTIVITIES.find(a => a.id === 'act-sorenga-oslo');
      expect(sorenga).toBeDefined();
      expect(sorenga?.seniorSafety).toBeDefined();

      const safety = sorenga!.seniorSafety!;
      expect(safety.surface).toBe('paved');
      expect(safety.benchDensity).toBe('frequent');
      expect(safety.hasPublicRestroom).toBe(true);
      expect(safety.shelteredSunCorner).toBe(true);
    });

    it('Ladestien i Trondheim har fast grus og hyppige benker langs fjorden', () => {
      const ladestien = INITIAL_ACTIVITIES.find(a => a.id === 'act-ladestien-trondheim');
      expect(ladestien).toBeDefined();
      expect(ladestien?.seniorSafety?.surface).toBe('firm_gravel');
      expect(ladestien?.seniorSafety?.benchDensity).toBe('frequent');
      expect(ladestien?.seniorSafety?.hasPublicRestroom).toBe(true);
    });

    it('Baneheia i Kristiansand og Keiservarden i Bodø har senior-informasjon', () => {
      const baneheia = INITIAL_ACTIVITIES.find(a => a.id === 'act-baneheia-kristiansand');
      expect(baneheia?.seniorSafety?.surface).toBe('firm_gravel');
      expect(baneheia?.seniorSafety?.benchDensity).toBe('frequent');

      const keiservarden = INITIAL_ACTIVITIES.find(a => a.id === 'act-keiservarden-bodo');
      expect(keiservarden?.seniorSafety?.surface).toBe('firm_gravel');
      expect(keiservarden?.seniorSafety?.hasPublicRestroom).toBe(true);
    });

    it('Sjel & Gane i Eidfjord har historisk fine dining med paved dekke, toalett, 30m parkering og lun solvegg', () => {
      const sjel = INITIAL_ACTIVITIES.find(a => a.id === 'act-sjel-og-gane-eidfjord');
      expect(sjel).toBeDefined();
      expect(sjel?.city).toBe('Eidfjord');
      expect(sjel?.category).toBe('cafebar');
      expect(sjel?.seniorSafety).toBeDefined();

      const safety = sjel!.seniorSafety!;
      expect(safety.surface).toBe('paved');
      expect(safety.hasPublicRestroom).toBe(true);
      expect(safety.parkingDistanceMeters).toBeLessThanOrEqual(30);
      expect(safety.shelteredSunCorner).toBe(true);
      expect(sjel?.sunFacing).toBe('south');
    });

    it('Heit Eidfjord Badstue i vannkanten har fast brygge, toalett og gratis badstue i nærheten', () => {
      const heit = INITIAL_ACTIVITIES.find(a => a.id === 'act-heit-eidfjord-sauna');
      expect(heit).toBeDefined();
      expect(heit?.city).toBe('Eidfjord');
      expect(heit?.category).toBe('nature');
      expect(heit?.seniorSafety?.surface).toBe('paved');
      expect(heit?.seniorSafety?.hasPublicRestroom).toBe(true);
      expect(heit?.seniorSafety?.shelteredSunCorner).toBe(true);

      const gratis = INITIAL_ACTIVITIES.find(a => a.id === 'act-gratis-sauna-eidfjord');
      expect(gratis).toBeDefined();
      expect(gratis?.stopKind).toBe('free');
    });

    it('Hamaren Aktivitetspark i Fyresdal er 100% universelt tilrettelagt for eldre og barnevogner', () => {
      const hamaren = INITIAL_ACTIVITIES.find(a => a.id === 'act-hamaren-treetop-walk');
      expect(hamaren).toBeDefined();
      expect(hamaren?.category).toBe('family');
      expect(hamaren?.strollerAccessible).toBe(true);
      expect(hamaren?.seniorSafety?.surface).toBe('paved');
      expect(hamaren?.seniorSafety?.benchDensity).toBe('frequent');
      expect(hamaren?.seniorSafety?.hasPublicRestroom).toBe(true);
      expect(hamaren?.trail?.difficulty).toBe('green');
    });
  });

  describe('2. Datastruktur og berikelse av TouristSecurityInfo', () => {
    it('Preikestolen advarer mot reisetid fra Bergen, krever fjellstøvler og har trygg starttid', () => {
      const preikestolen = INITIAL_ACTIVITIES.find(a => a.id === 'act-preikestolen-stavanger');
      expect(preikestolen).toBeDefined();
      expect(preikestolen?.touristSecurity).toBeDefined();

      const sec = preikestolen!.touristSecurity!;
      expect(sec.requiredFootwear).toBe('sturdy_mountain_boots');
      expect(sec.drivingTimeWarning).toContain('5,5 timers');
      expect(sec.drivingTimeWarning).toContain('ferjer');
      expect(sec.drivingTimeWarningEn).toBeDefined();
      expect(sec.latestSafeStartHour).toContain('13:00');
      expect(sec.microclimateTip).toBeDefined();
    });

    it('Vidden over Bergens Tak krever fjellstøvler og tidlig starttid pga. høyfjellsvær', () => {
      const vidden = INITIAL_ACTIVITIES.find(a => a.id === 'act-vidden-bergen');
      expect(vidden).toBeDefined();
      expect(vidden?.touristSecurity).toBeDefined();

      const sec = vidden!.touristSecurity!;
      expect(sec.requiredFootwear).toBe('sturdy_mountain_boots');
      expect(sec.latestSafeStartHour).toContain('12:30');
      expect(sec.microclimateTip?.toLowerCase()).toContain('tåke');
    });

    it('Sola Strand tillater joggesko', () => {
      const sola = INITIAL_ACTIVITIES.find(a => a.id === 'act-solastrand-stavanger');
      expect(sola?.touristSecurity?.requiredFootwear).toBe('sneakers_fine');
    });

    it('Keiservarden i Bodø gir informasjon om midnattssol og turskokrav', () => {
      const keiservarden = INITIAL_ACTIVITIES.find(a => a.id === 'act-keiservarden-bodo');
      expect(keiservarden?.touristSecurity?.requiredFootwear).toBe('hiking_shoes');
      expect(keiservarden?.touristSecurity?.latestSafeStartHour).toContain('Midnattssol');
    });

    it('Kjeåsen Fjellgård i Eidfjord krever tursko og advarer om smal tunnel med timetrafikk', () => {
      const kjeasen = INITIAL_ACTIVITIES.find(a => a.id === 'act-kjeasen-eidfjord');
      expect(kjeasen).toBeDefined();
      expect(kjeasen?.touristSecurity).toBeDefined();

      const sec = kjeasen!.touristSecurity!;
      expect(sec.requiredFootwear).toBe('hiking_shoes');
      expect(sec.drivingTimeWarning).toContain('tunnel');
      expect(sec.drivingTimeWarning).toContain('timetrafikk');
      expect(sec.drivingTimeWarningEn).toBeDefined();
    });

    it('Vøringsfossen trappebro beskriver 99 trinn over juvet og vannsprut-regnbue', () => {
      const voringsfossen = INITIAL_ACTIVITIES.find(a => a.id === 'act-voringsfossen-trappebro');
      expect(voringsfossen).toBeDefined();
      expect(voringsfossen?.description).toContain('99 trinn');
      expect(voringsfossen?.touristSecurity?.microclimateTip).toContain('regnbue');
    });

    it('Torghatten har sherpatrapp og Sommarøy har flytende badstue og midnattssol', () => {
      const torghatten = INITIAL_ACTIVITIES.find(a => a.id === 'act-torghatten-helgeland');
      expect(torghatten).toBeDefined();
      expect(torghatten?.touristSecurity?.requiredFootwear).toBe('hiking_shoes');
      expect(torghatten?.trail?.trailMarking).toContain('Sherpatrapp');

      const sommaroy = INITIAL_ACTIVITIES.find(a => a.id === 'act-sommaroy-arctic-beach-sauna');
      expect(sommaroy).toBeDefined();
      expect(sommaroy?.touristSecurity?.latestSafeStartHour).toContain('Midnattssol');
      const saunaAddon = sommaroy?.addOns?.find(a => a.type === 'sauna');
      expect(saunaAddon).toBeDefined();
    });
  });

  describe('3. Flerspråklighet (i18n.ts) for Senior & Turist', () => {
    const requiredKeys = [
      'seniorFilter',
      'touristFilter',
      'seniorSafetyBadge',
      'touristSecurityBadge',
      'surfacePaved',
      'surfaceFirmGravel',
      'surfaceTrailRoots',
      'surfaceRoughRock',
      'benchesFrequent',
      'benchesOccasional',
      'benchesNone',
      'toiletNearby',
      'toiletNone',
      'parkingDistance',
      'shelteredSun',
      'footwearSneakers',
      'footwearHiking',
      'footwearMountainBoots',
      'safeStartBefore',
      'travelWarning',
      'microclimateTip',
    ] as const;

    it('alle sikkerhets- og trygghetsnøkler finnes i både TRANSLATIONS.no og TRANSLATIONS.en', () => {
      for (const key of requiredKeys) {
        expect(TRANSLATIONS.no[key], `Mangler norsk oversettelse for ${key}`).toBeTruthy();
        expect(TRANSLATIONS.en[key], `Mangler engelsk oversettelse for ${key}`).toBeTruthy();
      }
    });

    it('t() funksjonen oversetter korrekt til norsk og engelsk', () => {
      expect(t('seniorFilter', 'no')).toBe('Senior & Rolig gange');
      expect(t('seniorFilter', 'en')).toBe('Senior & Easy Walk');

      expect(t('touristFilter', 'no')).toBe('Turist & Ikoniske perler');
      expect(t('touristFilter', 'en')).toBe('Tourist & Iconic Highlights');

      expect(t('footwearMountainBoots', 'no')).toBe('Stødige fjellstøvler kreves');
      expect(t('footwearMountainBoots', 'en')).toBe('Sturdy mountain boots required');
    });
  });

  describe('4. Filtreringslogikk i Tur- og Opplevelsesfeeden', () => {
    // Simulerer filterlogikken fra ActivityFeed.tsx
    const filterActivities = (
      activities: ActivityItem[],
      filter: 'all' | 'senior' | 'tourist'
    ): ActivityItem[] => {
      if (filter === 'all') return activities;

      if (filter === 'senior') {
        return activities.filter(a => {
          return (
            (a.seniorSafety && (
              a.seniorSafety.surface === 'paved' ||
              a.seniorSafety.surface === 'firm_gravel' ||
              a.seniorSafety.benchDensity === 'frequent'
            )) ||
            (!a.seniorSafety && a.strollerAccessible && (
              a.trail?.difficulty === 'green' ||
              a.category === 'nature' ||
              a.category === 'cafebar' ||
              a.category === 'accommodation' ||
              a.category === 'hostel'
            ))
          );
        });
      }

      if (filter === 'tourist') {
        return activities.filter(a => {
          return (
            Boolean(a.touristSecurity) ||
            (a.tripAdvisorRating !== undefined && a.tripAdvisorRating >= 4.8) ||
            a.category === 'accommodation' ||
            a.category === 'hostel' ||
            a.trail?.type === 'mountain_hike'
          );
        });
      }

      return activities;
    };

    it('senior-filter inkluderer rolige, asfalterte og grusede turer som Fjellveien, Sola Strand og Sørenga', () => {
      const seniorList = filterActivities(INITIAL_ACTIVITIES, 'senior');
      const seniorIds = seniorList.map(a => a.id);

      expect(seniorIds).toContain('act-floyen-fjellveien-bergen');
      expect(seniorIds).toContain('act-solastrand-stavanger');
      expect(seniorIds).toContain('act-sorenga-oslo');
      expect(seniorIds).toContain('act-ladestien-trondheim');
      expect(seniorIds).toContain('act-baneheia-kristiansand');
      expect(seniorIds).toContain('act-sjel-og-gane-eidfjord');
      expect(seniorIds).toContain('act-hamaren-treetop-walk');

      // Krevende fjellturer skal IKKE være med i seniorfilteret
      expect(seniorIds).not.toContain('act-7fjell');
      expect(seniorIds).not.toContain('act-vidden-bergen');
    });

    it('turist-filter inkluderer ikoniske perler som Preikestolen, Vidden, Keiservarden og Montana Hostel', () => {
      const touristList = filterActivities(INITIAL_ACTIVITIES, 'tourist');
      const touristIds = touristList.map(a => a.id);

      expect(touristIds).toContain('act-preikestolen-stavanger');
      expect(touristIds).toContain('act-vidden-bergen');
      expect(touristIds).toContain('act-keiservarden-bodo');
      expect(touristIds).toContain('act-montana-hostel-bergen');
      expect(touristIds).toContain('act-kjeasen-eidfjord');
      expect(touristIds).toContain('act-voringsfossen-trappebro');
      expect(touristIds).toContain('act-torghatten-helgeland');
      expect(touristIds).toContain('act-sommaroy-arctic-beach-sauna');
    });
  });
});
