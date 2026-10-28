/**
 * Datamodell for Steder (Places), Partnere og Værutløste Tilbud (Deals)
 * I henhold til SPEC-GPS-anbefalinger.md (seksjon 3)
 */

import { ActivityItem } from './activities';

export type Category =
  | 'festival'
  | 'alpine'
  | 'xc_trail'
  | 'outdoor_bath'
  | 'sauna'
  | 'cafe'
  | 'climbing'
  | 'concert'
  | 'hike'
  | 'accommodation'
  | 'hostel'
  | 'other';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'all_year';

export interface OpeningHours {
  /** Ukedag: 0 = søndag, 1 = mandag ... 6 = lørdag */
  weekly: { day: number; open: string; close: string }[]; // f.eks. "07:00"
  exceptions?: { date: string; closed?: boolean; open?: string; close?: string }[];
  seasonRange?: { from: string; to: string }; // "MM-DD", f.eks. "12-01" til "03-31"
}

export interface Place {
  id: string;
  name: string;
  cityId: string;
  lat: number;
  lng: number;
  categories: Category[];
  indoor: boolean;
  outdoor: boolean;
  seasons: Season[];
  openingHours?: OpeningHours;
  url?: string;
  source: string;
  verifiedAt?: string;
  permanentlyClosed?: boolean;
}

export interface Partner {
  id: string;
  placeIds: string[];
  name: string;
  commissionNok?: number;
  commissionPct?: number;
  status: 'prospect' | 'active' | 'paused';
}

export interface Deal {
  id: string;
  partnerId: string;
  placeId: string;
  title: string;
  priceNok: number;
  originalPriceNok?: number;
  validFrom: string;
  validTo: string;
  trigger?: {
    minSunElevationDeg?: number;
    maxCloudCover?: number;
    weekdays?: number[];
    hours?: [string, string];
  };
  quota?: number;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

/**
 * Adapter som mapper en ActivityItem fra activities.ts til en Place
 * uten å endre eller mutere den eksisterende ActivityItem-typen.
 */
export function activityToPlace(activity: ActivityItem): Place {
  const catMap: Record<ActivityItem['category'], Category> = {
    festival: 'festival',
    concert: 'concert',
    show: 'concert',
    family: 'climbing',
    nature: 'outdoor_bath',
    cafebar: 'cafe',
    sports: 'other',
    hike: 'hike',
    ski: 'xc_trail',
    accommodation: 'accommodation',
    hostel: 'hostel',
  };

  const mappedCategory = catMap[activity.category] || 'other';
  const isSki = activity.category === 'ski' || activity.trail?.type === 'cross_country_ski';
  const isSummerConcert = activity.category === 'concert' || activity.category === 'festival';

  const seasons: Season[] = isSki
    ? ['winter']
    : isSummerConcert
    ? ['spring', 'summer', 'autumn', 'all_year']
    : ['all_year'];

  return {
    id: activity.id,
    name: activity.title,
    cityId: activity.city.toLowerCase().replace('ø', 'o').replace('å', 'a'),
    lat: activity.coordinates.lat,
    lng: activity.coordinates.lng,
    categories: [mappedCategory],
    indoor: !activity.isOutdoor,
    outdoor: activity.isOutdoor,
    seasons,
    url: activity.sourceUrl,
    source: activity.ticket?.provider || 'Utaktiv Kuratert',
    verifiedAt: '2026-10-24',
  };
}
