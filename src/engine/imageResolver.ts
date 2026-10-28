import { PLACE_IMAGES, PlaceImageSet } from '../data/placeImages';

const DEFAULT_FALLBACK_HERO =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80';
const DEFAULT_FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80';

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
}

/**
 * Finner beste bildematch for et stedsnavn og by.
 */
export function resolveImage(locationName?: string, city?: string): PlaceImageSet | null {
  if (!locationName && !city) return null;

  const locNorm = locationName ? normalize(locationName) : '';
  const cityNorm = city ? normalize(city) : '';

  // 1. Eksakt treff på locationName
  if (locNorm) {
    const exact = PLACE_IMAGES.find(p => normalize(p.locationName) === locNorm);
    if (exact) return exact;

    // 2. Delvis treff i locationName
    const partial = PLACE_IMAGES.find(
      p => locNorm.includes(normalize(p.locationName)) || normalize(p.locationName).includes(locNorm)
    );
    if (partial) return partial;
  }

  // 3. Treff på by
  if (cityNorm) {
    const byCity = PLACE_IMAGES.find(p => p.city.toLowerCase() === cityNorm);
    if (byCity) return byCity;
  }

  return null;
}

/**
 * Henter hero-URL for et sted eller en aktivitet
 */
export function getActivityHeroUrl(locationName?: string, city?: string, explicitUrl?: string): string {
  if (explicitUrl && explicitUrl.trim().length > 0) {
    return explicitUrl;
  }
  const match = resolveImage(locationName, city);
  return match ? match.heroUrl : DEFAULT_FALLBACK_HERO;
}

/**
 * Henter thumbnail-URL for et sted eller en aktivitet
 */
export function getActivityThumbUrl(locationName?: string, city?: string, explicitUrl?: string): string {
  if (explicitUrl && explicitUrl.trim().length > 0) {
    return explicitUrl;
  }
  const match = resolveImage(locationName, city);
  return match ? match.thumbUrl : DEFAULT_FALLBACK_THUMB;
}

/**
 * Henter beskrivende alt-tekst for bildet
 */
export function getActivityAltText(locationName?: string, city?: string): string {
  const match = resolveImage(locationName, city);
  if (match) return match.altText;
  return locationName ? `Utsikt og stemning ved ${locationName}` : 'Norsk naturlandskap';
}
