import { describe, expect, it } from 'vitest';
import {
  CompanionInterest,
  CompanionPost,
  bandsForChildren,
  canRevealNames,
  childAgeBand,
  isTrailLive,
  partyLabelFor,
  publicAuthorLabel,
  rankPosts,
  scoreMatch,
  trailExpiry,
  cardFromPost,
} from '../engine/companions';

function post(overrides: Partial<CompanionPost> = {}): CompanionPost {
  return {
    id: 'post-1',
    authorId: 'owner',
    authorName: 'Alexander',
    city: 'Bergen',
    activityId: 'act-floyen',
    activityTitle: 'Fløyen',
    startsAt: '2026-10-23T10:00:00.000Z',
    expiresAt: null,
    kind: 'plan',
    partyLabel: 'voksne-med-smaabarn',
    adultBand: '30-44',
    childBands: ['4-6', '7-12'],
    tags: ['fjelltur', 'park'],
    note: 'Vi går en kort tur.',
    status: 'open',
    ...overrides,
  };
}

describe('Turfølge', () => {
  it('bruker grove aldersbånd og slipper navn', () => {
    expect(childAgeBand(4)).toBe('4-6');
    expect(childAgeBand(7)).toBe('7-12');
    expect(childAgeBand(18)).toBeNull();
    expect(childAgeBand(Number.NaN)).toBeNull();
    expect(bandsForChildren([{ age: 4 }, { age: 7 }, { age: 30 }])).toEqual(['4-6', '7-12']);
    expect(partyLabelFor(['4-6'])).toBe('voksne-med-smaabarn');
    expect(partyLabelFor(['7-12'])).toBe('voksne-med-skolebarn');
    expect(partyLabelFor([])).toBe('voksne');

    const card = cardFromPost(post());
    expect(card).toEqual({
      city: 'Bergen',
      adultBand: '30-44',
      childBands: ['4-6', '7-12'],
      tags: ['fjelltur', 'park'],
    });
    expect(Object.keys(card)).not.toContain('authorName');
  });

  it('rangerer samme by og holder navn skjult til begge har godtatt', () => {
    const mine = { city: 'bergen', adultBand: '30-44' as const, childBands: ['4-6' as const], tags: ['fjelltur'] };
    const close = { city: 'Bergen', adultBand: '30-44' as const, childBands: ['4-6' as const], tags: ['fjelltur', 'kaffe'] };
    const far = { city: 'Oslo', adultBand: '30-44' as const, childBands: ['4-6' as const], tags: ['fjelltur'] };
    expect(scoreMatch(mine, far)).toBe(0);
    expect(scoreMatch(mine, close)).toBe(3 + 4 + 2);

    const ranked = rankPosts(mine, [
      { id: 'a', card: far },
      { id: 'b', card: close },
    ]);
    expect(ranked.map(row => row.id)).toEqual(['b', 'a']);

    const hidden = post();
    const pending: CompanionInterest = {
      id: 'int-1',
      postId: hidden.id,
      fromUserId: 'gjest',
      fromName: 'Kari',
      status: 'pending',
      messages: [],
    };
    expect(canRevealNames(hidden, pending, 'gjest')).toBe(false);
    expect(publicAuthorLabel(hidden, pending, 'gjest')).toBe('Noen som vil ha følge');
    expect(publicAuthorLabel(hidden, { ...pending, status: 'accepted' }, 'gjest')).toBe('Alexander');
    expect(publicAuthorLabel(hidden, undefined, 'owner')).toBe('Alexander');
  });

  it('lar en tur være synlig i tre timer', () => {
    const start = new Date('2026-10-23T12:00:00.000Z');
    const expiresAt = trailExpiry(start);
    expect(new Date(expiresAt).getTime() - start.getTime()).toBe(3 * 60 * 60 * 1000);

    const live = post({ kind: 'trail', expiresAt, status: 'open' });
    expect(isTrailLive(live, new Date('2026-10-23T14:00:00.000Z'))).toBe(true);
    expect(isTrailLive(live, new Date('2026-10-23T16:00:00.000Z'))).toBe(false);
    expect(isTrailLive(post({ expiresAt }), new Date('2026-10-23T13:00:00.000Z'))).toBe(false);
  });
});
