/**
 * Concierge- og anbefalingsmotor for Utaktiv
 * Matcher bruker- og familieprofilen med aktiviteter, solstatus, GPS-avstand,
 * åpningstider, sesong og partnertilbud med annonsetak.
 * I henhold til SPEC-GPS-anbefalinger.md (seksjon 5).
 */

import { UserProfile, isFamilyCompatible } from './profile';
import { ActivityItem } from './activities';
import { SolarStatus } from './solar';
import { City, Deal, Place, activityToPlace } from './places';
import {
  LatLng,
  estimateTravelMin,
  haversineKm,
  isInSeason,
  isOpenNow,
  radiusBucket,
} from './location';

export const RECOMMENDATION_WEIGHTS = {
  profile: 30,
  distance: 20,
  openNow: 15,
  season: 10,
  weather: 15,
  deal: 10,
} as const;

export interface RecommendationWeather {
  precipitationMm?: number;
  temperatureC?: number;
  windMps?: number;
  cloudCoverPercent?: number;
  isOpplett?: boolean;
  isRain?: boolean;
}

export interface RecommendationContext {
  position?: LatLng;
  city?: City;
  now?: Date;
  deals?: Deal[];
  placesMap?: Record<string, Place>;
  allowDayTrip?: boolean;
  weather?: RecommendationWeather;
}

export interface ScoredRecommendation {
  activity: ActivityItem;
  score: number; // 0 - 100
  matchReasons: string[];
  sunBenefitText: string;
  familyVerdict: string;
  familyDetails: ReturnType<typeof isFamilyCompatible>;
  distanceKm?: number;
  travelMinWalk?: number;
  openNow?: boolean | null;
  isPartnerDeal?: boolean;
  deal?: Deal;
}

function computeLegacyRecommendation(
  profile: UserProfile,
  activity: ActivityItem,
  solar: SolarStatus
): ScoredRecommendation {
  let score = 50; // Grunnscore
  const matchReasons: string[] = [];

  // 1. Musikk- og artistmatch
  if (activity.artists && activity.artists.length > 0) {
    const artistMatch = activity.artists.some(artist =>
      profile.musicTaste.favoriteArtists.some(
        fav =>
          fav.toLowerCase().includes(artist.toLowerCase()) ||
          artist.toLowerCase().includes(fav.toLowerCase())
      )
    );

    if (artistMatch) {
      score += 35;
      matchReasons.push(
        `Favorittartist-treff: ${activity.artists.join(', ')} er i din spilleliste!`
      );
    }
  }

  // 2. Familie- og barnekompatibilitet
  const famCheck = isFamilyCompatible(profile, activity);
  if (profile.hasChildren && profile.children.length > 0) {
    if (famCheck.badgeType === 'all_match') {
      score += 30;
      matchReasons.push(`Familie-match: ${famCheck.summaryHeadline}`);
    } else if (famCheck.badgeType === 'partial_match') {
      score += 10;
      matchReasons.push(`Delvis familiematch: ${famCheck.summaryHeadline}`);
    } else if (famCheck.badgeType === 'stroller_warning') {
      score -= 40;
      matchReasons.push(famCheck.summaryHeadline);
    } else if (famCheck.badgeType === 'adults_only') {
      score -= 30;
    }

    // Sjekk barnas spesifikke interesser mot aktivitetstittel og beskrivelse
    const fullText = `${activity.title} ${activity.description} ${activity.category} ${activity.locationName}`.toLowerCase();
    profile.children.forEach(child => {
      const matchingInterests = child.interests.filter(interest =>
        fullText.includes(interest.toLowerCase())
      );
      if (matchingInterests.length > 0) {
        score += 15;
        matchReasons.push(
          `Barnas favoritter: ${child.name} elsker ${matchingInterests.join(', ')}!`
        );
      }
    });
  } else {
    if (famCheck.compatible) {
      score += 10;
    }
  }

  // 3. TripAdvisor rating og popularitet
  if (activity.tripAdvisorRating && activity.tripAdvisorRating >= 4.5) {
    score += 15;
    matchReasons.push(
      `Topprangert på TripAdvisor (${activity.tripAdvisorRating}★ fra ${activity.reviewCount ?? 0} anmeldelser)`
    );
  }

  // 4. Sol- og lysberegning
  let sunBenefitText = 'Gir god dagslyseksponering.';
  if (activity.isOutdoor) {
    score += 15;
    if (solar.circadianWindow === 'morning') {
      sunBenefitText =
        'Optimalt formiddagslys: Nullstiller døgnrytmen og øker kognitivt fokus.';
    } else if (solar.circadianWindow === 'midday') {
      sunBenefitText = `Maksimalt dagslys (~${activity.estimatedLux.toLocaleString('no-NO')} luks) for D-vitamin og energi.`;
    } else {
      sunBenefitText =
        'Kveldslys: Myk solnedgang som lar melatonin stige naturlig før leggetid.';
    }

    if (activity.sunFacing === 'west') {
      matchReasons.push('Vestvendt beliggenhet gir uforstyrret ettermiddagssol');
    }
  }

  // Normaliser score mellom 0 og 100
  const finalScore = Math.max(10, Math.min(100, score));

  return {
    activity,
    score: finalScore,
    matchReasons,
    sunBenefitText,
    familyVerdict: famCheck.summaryHeadline,
    familyDetails: famCheck,
  };
}

function isDealActiveNow(deal: Deal, now: Date, solar: SolarStatus): boolean {
  const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (deal.validFrom && isoDate < deal.validFrom) return false;
  if (deal.validTo && isoDate > deal.validTo) return false;
  if (typeof deal.quota === 'number' && deal.quota <= 0) return false;

  if (deal.trigger) {
    if (
      typeof deal.trigger.minSunElevationDeg === 'number' &&
      solar.solarAltitudeDegrees < deal.trigger.minSunElevationDeg
    ) {
      return false;
    }
    if (
      typeof deal.trigger.maxCloudCover === 'number' &&
      solar.cloudCoverPercent > deal.trigger.maxCloudCover
    ) {
      return false;
    }
    if (
      deal.trigger.weekdays &&
      deal.trigger.weekdays.length > 0 &&
      !deal.trigger.weekdays.includes(now.getDay())
    ) {
      return false;
    }
  }

  return true;
}

export function rankActivitiesForProfile(
  profile: UserProfile,
  activities: ActivityItem[],
  solar: SolarStatus,
  context?: RecommendationContext
): ScoredRecommendation[] {
  // Uten context: 100 % identisk med tidligere oppførsel
  if (!context) {
    return activities
      .map(act => computeLegacyRecommendation(profile, act, solar))
      .sort((a, b) => b.score - a.score);
  }

  const now = context.now ?? new Date();
  const results: ScoredRecommendation[] = [];

  for (const activity of activities) {
    const place: Place = context.placesMap?.[activity.id] ?? activityToPlace(activity);

    // 1. Hard filter: permanent stengt eller utenfor sesong
    if (place.permanentlyClosed) continue;
    if (!isInSeason(place, now)) continue;

    // 2. Avstandsberegning og 120 km hard filter
    let distanceKm: number | undefined;
    let travelMinWalk: number | undefined;
    let distFactor = 0.8; // Default innen valgt by når GPS mangler

    if (context.position) {
      distanceKm = haversineKm(context.position, { lat: place.lat, lng: place.lng });
      travelMinWalk = estimateTravelMin(distanceKm, 'walk');
      const bucket = radiusBucket(distanceKm);
      if (bucket === 'far' && !context.allowDayTrip) {
        continue; // Hard-filtrer steder > 120 km med mindre bruker har valgt dagstur
      }
      const bucketMap: Record<ReturnType<typeof radiusBucket>, number> = {
        walk: 1.0,
        near: 0.8,
        city: 0.5,
        day_trip: 0.2,
        far: 0.0,
      };
      distFactor = bucketMap[bucket];
    } else if (context.city) {
      const sameCity =
        activity.city.toLowerCase() === context.city.name.toLowerCase() ||
        place.cityId.toLowerCase() === context.city.id.toLowerCase();
      distFactor = sameCity ? 0.8 : 0.2;
    }

    // Gjenbruk profilgrunnlag og begrunnelser
    const legacy = computeLegacyRecommendation(profile, activity, solar);
    const matchReasons = [...legacy.matchReasons];

    // Vekt 1: Profilmatch (0..30)
    // Legacy-score uten utendørs-solbonus (15p) mappes til 0..30
    const rawProfileScore = activity.isOutdoor ? legacy.score - 15 : legacy.score;
    const profilePoints = Math.max(
      0,
      Math.min(
        RECOMMENDATION_WEIGHTS.profile,
        (rawProfileScore / 85) * RECOMMENDATION_WEIGHTS.profile
      )
    );

    // Vekt 2: Avstand (0..20)
    const distancePoints = distFactor * RECOMMENDATION_WEIGHTS.distance;
    if (typeof distanceKm === 'number' && distanceKm <= 5) {
      matchReasons.unshift(
        distanceKm < 1
          ? `Rett i nærheten (${Math.round(distanceKm * 1000)} m unna)`
          : `Kort vei herfra (${distanceKm.toFixed(1)} km)`
      );
    }

    // Vekt 3: Åpen nå (0..15): stengt -> 0, ukjent -> 0.5, åpen -> 1
    const openState = isOpenNow(place, now);
    const openNowFactor = openState === true ? 1.0 : openState === false ? 0.0 : 0.5;
    const openNowPoints = openNowFactor * RECOMMENDATION_WEIGHTS.openNow;

    // Vekt 4: Sesong (0..10): kun steder i sesong når hit
    const seasonPoints = RECOMMENDATION_WEIGHTS.season;

    // Vekt 5: Sol og vær fra solar.ts og sanntids meteorologi (0..15)
    // Utendørs får høy score ved sol og lavt skydekke; innendørs, kafé og badstue får høy score ved regn/kulde/mørke
    const precipMm = context.weather?.precipitationMm ?? 0;
    const isRainingNow = precipMm > 0.2 || context.weather?.isRain === true;
    const isOpplettNow = context.weather?.isOpplett ?? (precipMm <= 0.1);
    const effectiveCloud = context.weather?.cloudCoverPercent ?? solar.cloudCoverPercent;
    const cloudFraction = Math.max(0, Math.min(100, effectiveCloud)) / 100;
    const isSunnyWeather = isOpplettNow && cloudFraction <= 0.4 && (solar.solarAltitudeDegrees > 0 || solar.actualEstimatedLux >= 10000);

    const isSauna =
      activity.title.toLowerCase().includes('badstue') ||
      activity.title.toLowerCase().includes('sauna') ||
      activity.addOns?.some(a => a.type === 'sauna');

    const isCafe =
      activity.category === 'cafebar' ||
      activity.addOns?.some(a => a.type === 'cafe') ||
      activity.title.toLowerCase().includes('kafé') ||
      activity.title.toLowerCase().includes('kafe');

    let weatherFactor = 0.5;

    if (isSauna) {
      // Fjordbadstue er den ultimate aktiviteten ved regn, kulde og mørke, men også herlig ved sol
      if (isRainingNow || cloudFraction >= 0.7 || solar.solarAltitudeDegrees <= 0) {
        weatherFactor = 1.0;
        matchReasons.unshift('🌧️ Sanntids-vær: Varm fjordbadstue er uslåelig i regnværet!');
      } else {
        weatherFactor = 0.85;
      }
    } else if (isCafe) {
      // Kafé og lune kosestopp gir topp opplevelse i regnvær
      if (isRainingNow || cloudFraction >= 0.75) {
        weatherFactor = 1.0;
        matchReasons.unshift('☕ Sanntids-vær: Varm kakao og lunt kaféstopp mens det regner');
      } else {
        weatherFactor = 0.75;
      }
    } else if (place.outdoor && !place.indoor) {
      if (isRainingNow) {
        const isForest = activity.trail?.type === 'forest_trail' || activity.description.toLowerCase().includes('skog');
        if (isForest) {
          weatherFactor = 0.6;
          matchReasons.unshift('🌲 Lun skogssti: Tett trekronetak skjermer godt mot regnet');
        } else {
          // Åpent fjell i regn
          weatherFactor = Math.max(0.1, 0.4 - Math.min(0.3, precipMm * 0.1));
        }
      } else {
        // Utendørs opplett / sol
        weatherFactor = isSunnyWeather ? 1.0 : Math.max(0.1, 1 - cloudFraction * 0.9);
        if (isSunnyWeather) {
          matchReasons.unshift('☀️ Sanntids-vær: Sol og opplett akkurat nå – fang dagslyset!');
        }
      }
    } else if (place.indoor && !place.outdoor) {
      // Innendørs
      weatherFactor = isRainingNow || cloudFraction >= 0.65 || solar.solarAltitudeDegrees <= 0 ? 1.0 : 0.25;
      if (isRainingNow) {
        matchReasons.unshift('🌧️ Tørt og lunt innendørs mens regnet faller');
      }
    } else {
      weatherFactor = 0.7;
    }
    const weatherPoints = weatherFactor * RECOMMENDATION_WEIGHTS.weather;

    const baseScore =
      profilePoints + distancePoints + openNowPoints + seasonPoints + weatherPoints;

    // Vekt 6: Partnertilbud med annonsetak (maks 10 poeng, og kun dersom baseScore >= 40)
    const matchedDeal = context.deals?.find(
      d => (d.placeId === place.id || d.placeId === activity.id) && isDealActiveNow(d, now, solar)
    );

    let dealBonus = 0;
    let isPartnerDeal = false;

    if (matchedDeal && baseScore >= 40) {
      // Beregn rabatt-basert bonus men aldri over 10 poeng (RECOMMENDATION_WEIGHTS.deal)
      const requestedBonus = matchedDeal.originalPriceNok
        ? Math.min(10, Math.max(5, Math.round((1 - matchedDeal.priceNok / matchedDeal.originalPriceNok) * 25)))
        : 10;
      dealBonus = Math.min(RECOMMENDATION_WEIGHTS.deal, requestedBonus);
      isPartnerDeal = true;
      matchReasons.unshift(`Partnertilbud: ${matchedDeal.title} (${matchedDeal.priceNok} kr)`);
    }

    const totalScore = Math.max(0, Math.min(100, Math.round((baseScore + dealBonus) * 10) / 10));

    results.push({
      activity,
      score: totalScore,
      matchReasons,
      sunBenefitText: legacy.sunBenefitText,
      familyVerdict: legacy.familyVerdict,
      familyDetails: legacy.familyDetails,
      distanceKm,
      travelMinWalk,
      openNow: openState,
      isPartnerDeal,
      deal: isPartnerDeal ? matchedDeal : undefined,
    });
  }

  // Sorter synkende etter score
  results.sort((a, b) => b.score - a.score);

  // Annonsetak på topp 5: Maks 2 av de 5 øverste kortene kan være partnerkort
  const finalOrdered: ScoredRecommendation[] = [];
  const deferredPartnerCards: ScoredRecommendation[] = [];
  let partnerCountInTop5 = 0;

  for (const item of results) {
    if (finalOrdered.length < 5 && item.isPartnerDeal) {
      if (partnerCountInTop5 < 2) {
        partnerCountInTop5++;
        finalOrdered.push(item);
      } else {
        deferredPartnerCards.push(item);
      }
    } else {
      finalOrdered.push(item);
      // Så snart topp 5 er fylt, legg til eventuelle utsatte partnerkort fra posisjon 6+
      if (finalOrdered.length === 5 && deferredPartnerCards.length > 0) {
        finalOrdered.push(...deferredPartnerCards);
        deferredPartnerCards.length = 0;
      }
    }
  }

  if (deferredPartnerCards.length > 0) {
    for (const def of deferredPartnerCards) {
      if (finalOrdered.length < 5) {
        // Maks 2 partnerkort i topp 5: fjern partnerstatus hvis det må inn i topp 5 pga. få øvrige kort
        finalOrdered.push({
          ...def,
          isPartnerDeal: false,
          deal: undefined,
        });
      } else {
        finalOrdered.push(def);
      }
    }
  }

  return finalOrdered;
}
