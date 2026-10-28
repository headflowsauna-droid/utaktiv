/**
 * Bruker- og familieprofileringsmotor for Utaktiv
 */

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  needsStroller: boolean; // under 3 år eller ved spesielle behov
  energyLevel: 'low' | 'medium' | 'high';
  interests: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  transportMode: 'foot' | 'bike' | 'public' | 'car';
  hasChildren: boolean;
  children: ChildProfile[];
  musicTaste: {
    favoriteArtists: string[];
    genres: string[];
    outdoorConcertsOnly: boolean;
  };
  activityPreferences: string[];
  preferredDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  avatarUrl?: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'user-guest',
  name: 'Gjest',
  address: 'Sentrum',
  city: 'Bergen',
  coordinates: {
    lat: 60.3913,
    lng: 5.3221,
  },
  transportMode: 'foot',
  hasChildren: false,
  children: [],
  musicTaste: {
    favoriteArtists: ['Jason Mraz', 'Jack Johnson', 'Sigrid', 'Sondre Lerche', 'Lumineers'],
    genres: ['akustisk pop', 'folk', 'indie', 'vise'],
    outdoorConcertsOnly: true,
  },
  activityPreferences: ['fjelltur', 'uteshow', 'uteservering', 'utsiktspunkt', 'park'],
  preferredDays: ['friday', 'saturday', 'sunday'],
};

export function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<UserProfile>;
  return typeof row.name === 'string'
    && typeof row.city === 'string'
    && !!row.coordinates
    && typeof row.coordinates.lat === 'number'
    && typeof row.coordinates.lng === 'number'
    && Array.isArray(row.children);
}

export const PROFILE_STORAGE_KEY = 'sol_uteliv_profile';

let _memoryProfile: UserProfile | null = null;

export function getStoredProfile(): UserProfile {
  if (_memoryProfile) {
    return _memoryProfile;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name && Array.isArray(parsed.children)) {
          _memoryProfile = parsed;
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Kunne ikke laste profil fra localStorage:', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveStoredProfile(profile: UserProfile): void {
  _memoryProfile = profile;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  } catch (e) {
    console.error('Kunne ikke lagre profil til localStorage:', e);
  }
}

export interface ChildCompatibilityDetail {
  childId: string;
  childName: string;
  childAge: number;
  compatible: boolean;
  reason: string;
  strollerIssue?: boolean;
}

export interface FamilyCompatibilityResult {
  compatible: boolean;
  reason: string;
  childDetails: ChildCompatibilityDetail[];
  summaryHeadline: string;
  matchingCount: number;
  totalChildrenCount: number;
  badgeType: 'all_match' | 'partial_match' | 'adults_only' | 'stroller_warning';
}

/**
 * Sjekker om en aktivitet matcher familiens sammensetning (spesielt barnevogn og aldersgrenser)
 */
export function isFamilyCompatible(
  profile: UserProfile,
  activity: {
    targetAgeMin?: number;
    targetAgeMax?: number;
    strollerAccessible: boolean;
  }
): FamilyCompatibilityResult {
  const hasChildren = profile.hasChildren || (Array.isArray(profile.children) && profile.children.length > 0);
  if (!hasChildren) {
    return {
      compatible: true,
      reason: 'Perfekt for voksne',
      childDetails: [],
      summaryHeadline: 'Voksenaktivitet',
      matchingCount: 0,
      totalChildrenCount: 0,
      badgeType: 'all_match',
    };
  }

  const childDetails: ChildCompatibilityDetail[] = profile.children.map(child => {
    // 1. Sjekk barnevognkrav
    const strollerIssue = (child.needsStroller || child.age < 3) && !activity.strollerAccessible;
    if (strollerIssue) {
      return {
        childId: child.id,
        childName: child.name,
        childAge: child.age,
        compatible: false,
        reason: `Krever barnevogn – terrenget er ikke tilpasset vogn for ${child.name}`,
        strollerIssue: true,
      };
    }

    // 2. Sjekk for ung
    if (activity.targetAgeMin !== undefined && child.age < activity.targetAgeMin) {
      return {
        childId: child.id,
        childName: child.name,
        childAge: child.age,
        compatible: false,
        reason: `For ung (min. ${activity.targetAgeMin} år, ${child.name} er ${child.age} år)`,
      };
    }

    // 3. Sjekk for gammel
    if (activity.targetAgeMax !== undefined && child.age > activity.targetAgeMax) {
      return {
        childId: child.id,
        childName: child.name,
        childAge: child.age,
        compatible: false,
        reason: `Mest for yngre barn (opp til ${activity.targetAgeMax} år)`,
      };
    }

    return {
      childId: child.id,
      childName: child.name,
      childAge: child.age,
      compatible: true,
      reason: `Perfekt for ${child.name} (${child.age} år)`,
    };
  });

  const matchingKids = childDetails.filter(c => c.compatible);
  const strollerFailures = childDetails.filter(c => c.strollerIssue);
  const matchingCount = matchingKids.length;
  const totalChildrenCount = profile.children.length;

  if (strollerFailures.length > 0) {
    const strollerKidNames = strollerFailures.map(c => c.childName).join(', ');
    return {
      compatible: false,
      reason: `Ikke egnet med barnevogn for de minste barna (${strollerKidNames})`,
      childDetails,
      summaryHeadline: `⚠️ Krever barnevogn – uegnet for ${strollerKidNames}`,
      matchingCount,
      totalChildrenCount,
      badgeType: 'stroller_warning',
    };
  }

  if (matchingCount === totalChildrenCount) {
    const names = profile.children.map(c => `${c.name} (${c.age} år)`).join(' & ');
    return {
      compatible: true,
      reason: `Skreddersydd for barnas alder (${names})`,
      childDetails,
      summaryHeadline: `Passer for ${names} ✓`,
      matchingCount,
      totalChildrenCount,
      badgeType: 'all_match',
    };
  }

  if (matchingCount > 0) {
    const okNames = matchingKids.map(c => `${c.childName} (${c.childAge})`).join(', ');
    const notOkReasons = childDetails.filter(c => !c.compatible).map(c => `${c.childName}: ${c.reason}`).join(' • ');
    return {
      compatible: true, // Delvis match tillates, men markeres tydelig
      reason: `Passer best for ${okNames} (men ${notOkReasons})`,
      childDetails,
      summaryHeadline: `Passer ${okNames} • ${notOkReasons}`,
      matchingCount,
      totalChildrenCount,
      badgeType: 'partial_match',
    };
  }

  // Ingen barn matcher
  const minAge = activity.targetAgeMin;
  const maxAge = activity.targetAgeMax;
  let reason = 'Passer ikke for barnas alder';
  if (minAge !== undefined && profile.children.every(c => c.age < minAge)) {
    reason = `Passer best for eldre barn (fra ${minAge} år)`;
  } else if (maxAge !== undefined && profile.children.every(c => c.age > maxAge)) {
    reason = `Mest spennende for yngre barn (opp til ${maxAge} år)`;
  }

  return {
    compatible: false,
    reason,
    childDetails,
    summaryHeadline: `Voksen/Ungdom – ${reason}`,
    matchingCount: 0,
    totalChildrenCount,
    badgeType: 'adults_only',
  };
}
