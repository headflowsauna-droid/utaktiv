/**
 * GPS-sjekkinn og turstempling for Utaktiv
 * Bruker Haversine-formelen for å beregne avstand i meter og verifisere oppmøte.
 */

export interface CompletedCheckin {
  id: string;
  activityId: string;
  activityTitle: string;
  badgeName: string;
  completedAt: string; // ISO
  luxEarned: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

/**
 * Beregner avstand mellom to koordinater i meter (Haversine)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Jordens radius i meter
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Validerer om brukeren er innenfor sjekkinn-radiusen (f.eks. 350 meter)
 */
export function verifyCheckinProximity(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  allowedRadiusMeters = 500
): { canCheckin: boolean; distanceMeters: number } {
  const distance = calculateDistanceMeters(userLat, userLng, targetLat, targetLng);
  return {
    canCheckin: distance <= allowedRadiusMeters,
    distanceMeters: distance,
  };
}

const STORAGE_KEY = 'sol_uteliv_checkins_v1';

export function getCompletedCheckins(): CompletedCheckin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCheckin(checkin: CompletedCheckin): CompletedCheckin[] {
  const existing = getCompletedCheckins();
  const updated = [checkin, ...existing.filter(c => c.activityId !== checkin.activityId)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignoreres hvis kvote er full
  }
  return updated;
}
