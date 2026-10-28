/**
 * Turfølge. Navn og barnas identitet holdes ute av det som vises før begge har godtatt.
 */

export type AdultAgeBand = '18-29' | '30-44' | '45-59' | '60+' | 'uoppgitt';
export type ChildAgeBand = '0-3' | '4-6' | '7-12' | '13-17';
export type PartyLabel = 'voksne' | 'voksne-med-smaabarn' | 'voksne-med-skolebarn';
export type CompanionKind = 'plan' | 'trail';
export type InterestStatus = 'pending' | 'accepted' | 'declined';

export interface PublicMatchCard {
  city: string;
  adultBand: AdultAgeBand;
  childBands: ChildAgeBand[];
  tags: string[];
}

export interface CompanionMessage {
  id: string;
  fromUserId: string;
  body: string;
  at: string;
}

export interface CompanionPost {
  id: string;
  authorId: string;
  authorName: string;
  city: string;
  activityId: string;
  activityTitle: string;
  startsAt: string;
  expiresAt: string | null;
  kind: CompanionKind;
  partyLabel: PartyLabel;
  adultBand: AdultAgeBand;
  childBands: ChildAgeBand[];
  tags: string[];
  note: string;
  status: 'open' | 'closed';
}

export interface CompanionInterest {
  id: string;
  postId: string;
  fromUserId: string;
  fromName: string;
  status: InterestStatus;
  messages: CompanionMessage[];
}

export function childAgeBand(age: number): ChildAgeBand | null {
  if (!Number.isFinite(age) || age < 0 || age > 17) return null;
  if (age <= 3) return '0-3';
  if (age <= 6) return '4-6';
  if (age <= 12) return '7-12';
  return '13-17';
}

export function bandsForChildren(children: { age: number }[]): ChildAgeBand[] {
  const bands = new Set<ChildAgeBand>();
  for (const child of children) {
    const band = childAgeBand(child.age);
    if (band) bands.add(band);
  }
  return [...bands];
}

export function partyLabelFor(childBands: ChildAgeBand[]): PartyLabel {
  if (childBands.some(band => band === '0-3' || band === '4-6')) return 'voksne-med-smaabarn';
  if (childBands.length > 0) return 'voksne-med-skolebarn';
  return 'voksne';
}

/** Felles ønsker, barnebånd og voksenbånd. Byen må være den samme. */
export function scoreMatch(left: PublicMatchCard, right: PublicMatchCard): number {
  if (!left.city || left.city.toLowerCase() !== right.city.toLowerCase()) return 0;
  const sharedTags = left.tags.filter(tag => right.tags.includes(tag)).length;
  const sharedChildren = left.childBands.filter(band => right.childBands.includes(band)).length;
  const sameAdult = left.adultBand !== 'uoppgitt' && left.adultBand === right.adultBand ? 2 : 0;
  return sharedTags * 3 + sharedChildren * 4 + sameAdult;
}

export function rankPosts<T extends { card: PublicMatchCard }>(mine: PublicMatchCard, posts: T[]): T[] {
  return [...posts].sort((a, b) => scoreMatch(mine, b.card) - scoreMatch(mine, a.card));
}

export function cardFromPost(post: CompanionPost): PublicMatchCard {
  return {
    city: post.city,
    adultBand: post.adultBand,
    childBands: post.childBands,
    tags: post.tags,
  };
}

export function canRevealNames(post: CompanionPost, interest: CompanionInterest | undefined, viewerId: string): boolean {
  if (viewerId === post.authorId) return true;
  return interest?.fromUserId === viewerId && interest.status === 'accepted';
}

export function publicAuthorLabel(post: CompanionPost, interest: CompanionInterest | undefined, viewerId: string): string {
  if (canRevealNames(post, interest, viewerId)) return post.authorName;
  return 'Noen som vil ha følge';
}

export function trailExpiry(from: Date): string {
  return new Date(from.getTime() + 3 * 60 * 60 * 1000).toISOString();
}

export function isTrailLive(post: CompanionPost, now: Date): boolean {
  if (post.kind !== 'trail' || post.status !== 'open') return false;
  if (!post.expiresAt) return false;
  return new Date(post.expiresAt).getTime() > now.getTime();
}
