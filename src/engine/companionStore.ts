/**
 * Turfølge på denne enheten, og på kontoen når brukeren er logget inn.
 * Barnas navn skrives ikke til innlegget.
 */

import { getSupabase } from '../lib/supabaseClient';
import { UserProfile } from './profile';
import {
  AdultAgeBand,
  CompanionInterest,
  CompanionKind,
  CompanionMessage,
  CompanionPost,
  InterestStatus,
  PublicMatchCard,
  bandsForChildren,
  cardFromPost,
  partyLabelFor,
  trailExpiry,
} from './companions';

const POSTS_KEY = 'sol_uteliv_companion_posts_v1';
const INTERESTS_KEY = 'sol_uteliv_companion_interests_v1';
const BAND_KEY = 'sol_uteliv_adult_band_v1';

const ADULT_BANDS: AdultAgeBand[] = ['18-29', '30-44', '45-59', '60+', 'uoppgitt'];

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function readAdultBand(): AdultAgeBand {
  const value = readJson<string>(BAND_KEY, 'uoppgitt');
  return ADULT_BANDS.includes(value as AdultAgeBand) ? value as AdultAgeBand : 'uoppgitt';
}

export function saveAdultBand(band: AdultAgeBand): void {
  writeJson(BAND_KEY, band);
}

export function cardFromProfile(profile: UserProfile, adultBand: AdultAgeBand): PublicMatchCard {
  return {
    city: profile.city,
    adultBand,
    childBands: bandsForChildren(profile.children),
    tags: profile.activityPreferences.slice(0, 8),
  };
}

function localPosts(): CompanionPost[] {
  const rows = readJson<CompanionPost[]>(POSTS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function localInterests(): CompanionInterest[] {
  const rows = readJson<CompanionInterest[]>(INTERESTS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface PostRow {
  id: string;
  user_id: string;
  city: string;
  activity_id: string;
  activity_title: string;
  starts_at: string;
  party_label: CompanionPost['partyLabel'];
  adult_band: AdultAgeBand;
  child_bands: CompanionPost['childBands'];
  tags: string[];
  note: string;
  status: 'open' | 'closed';
  kind: CompanionKind;
  expires_at: string | null;
}

function postFromRow(row: PostRow): CompanionPost {
  return {
    id: row.id,
    authorId: row.user_id,
    authorName: '',
    city: row.city,
    activityId: row.activity_id,
    activityTitle: row.activity_title,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    kind: row.kind,
    partyLabel: row.party_label,
    adultBand: row.adult_band,
    childBands: row.child_bands ?? [],
    tags: row.tags ?? [],
    note: row.note ?? '',
    status: row.status,
  };
}

interface InterestRow {
  id: string;
  post_id: string;
  from_user_id: string;
  status: InterestStatus;
  messages: CompanionMessage[];
}

function interestFromRow(row: InterestRow): CompanionInterest {
  return {
    id: row.id,
    postId: row.post_id,
    fromUserId: row.from_user_id,
    fromName: '',
    status: row.status,
    messages: Array.isArray(row.messages) ? row.messages : [],
  };
}

async function signedIn(): Promise<{ userId: string } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { userId: data.user.id };
}

export async function loadCompanionBoard(city: string): Promise<{
  posts: CompanionPost[];
  interests: CompanionInterest[];
  remote: boolean;
}> {
  const user = await signedIn();
  const supabase = getSupabase();
  if (!user || !supabase) {
    const posts = localPosts().filter(post =>
      post.city.toLowerCase() === city.toLowerCase() || post.authorId === 'local'
    );
    return { posts, interests: localInterests(), remote: false };
  }

  const { data: postRows, error } = await supabase
    .from('companion_posts')
    .select('id, user_id, city, activity_id, activity_title, starts_at, party_label, adult_band, child_bands, tags, note, status, kind, expires_at')
    .eq('city', city)
    .order('starts_at', { ascending: true });

  if (error || !postRows) {
    return { posts: [], interests: [], remote: true };
  }

  const posts = (postRows as PostRow[]).map(postFromRow);
  const ids = posts.map(post => post.id);
  let interests: CompanionInterest[] = [];
  if (ids.length > 0) {
    const { data: interestRows } = await supabase
      .from('companion_interests')
      .select('id, post_id, from_user_id, status, messages')
      .in('post_id', ids);
    interests = ((interestRows ?? []) as InterestRow[]).map(interestFromRow);
  }

  for (const post of posts) {
    const mine = interests.find(item => item.postId === post.id && item.fromUserId === user.userId);
    const owns = post.authorId === user.userId;
    if (!owns && mine?.status !== 'accepted') continue;
    const { data: names } = await supabase.rpc('companion_names', { p_post_id: post.id });
    const rows = (names ?? []) as { user_id: string; display_name: string }[];
    if (owns) {
      for (const interest of interests) {
        if (interest.postId !== post.id || interest.status !== 'accepted') continue;
        const match = rows.find(row => row.user_id === interest.fromUserId);
        if (match?.display_name) interest.fromName = match.display_name;
      }
    } else {
      const owner = rows.find(row => row.user_id === post.authorId);
      if (owner?.display_name) post.authorName = owner.display_name;
    }
  }

  return { posts, interests, remote: true };
}

export async function publishMatchCard(card: PublicMatchCard, userId: string): Promise<void> {
  saveAdultBand(card.adultBand);
  const supabase = getSupabase();
  if (!supabase || userId === 'local') return;
  await supabase.from('match_cards').upsert({
    user_id: userId,
    city: card.city,
    adult_band: card.adultBand,
    child_bands: card.childBands,
    tags: card.tags,
    updated_at: new Date().toISOString(),
  });
}

export interface NewCompanionInput {
  profile: UserProfile;
  viewerId: string;
  activityId: string;
  activityTitle: string;
  note: string;
  kind: CompanionKind;
  startsAt?: string;
}

export async function createCompanionPost(input: NewCompanionInput): Promise<{ ok: boolean; error?: string }> {
  const adultBand = readAdultBand();
  const childBands = bandsForChildren(input.profile.children);
  const note = input.note.trim().slice(0, 280);
  const startsAt = input.startsAt ?? new Date().toISOString();
  const expiresAt = input.kind === 'trail' ? trailExpiry(new Date()) : null;
  const user = await signedIn();
  const supabase = getSupabase();

  if (user && supabase) {
    const { error } = await supabase.from('companion_posts').insert({
      user_id: user.userId,
      city: input.profile.city,
      activity_id: input.activityId,
      activity_title: input.activityTitle,
      starts_at: startsAt,
      party_label: partyLabelFor(childBands),
      adult_band: adultBand,
      child_bands: childBands,
      tags: input.profile.activityPreferences.slice(0, 8),
      note,
      status: 'open',
      kind: input.kind,
      expires_at: expiresAt,
    });
    if (error) return { ok: false, error: 'Innlegget ble ikke lagret på kontoen.' };
    await publishMatchCard(cardFromProfile(input.profile, adultBand), user.userId);
    return { ok: true };
  }

  const post: CompanionPost = {
    id: newId(),
    authorId: 'local',
    authorName: input.profile.name,
    city: input.profile.city,
    activityId: input.activityId,
    activityTitle: input.activityTitle,
    startsAt,
    expiresAt,
    kind: input.kind,
    partyLabel: partyLabelFor(childBands),
    adultBand,
    childBands,
    tags: input.profile.activityPreferences.slice(0, 8),
    note,
    status: 'open',
  };
  writeJson(POSTS_KEY, [post, ...localPosts()]);
  return { ok: true };
}

export async function expressInterest(post: CompanionPost, viewerId: string): Promise<{ ok: boolean; error?: string }> {
  if (post.authorId === viewerId || (viewerId === 'local' && post.authorId === 'local')) {
    return { ok: false, error: 'Dette er ditt eget innlegg.' };
  }
  const user = await signedIn();
  const supabase = getSupabase();
  if (user && supabase) {
    const { error } = await supabase.from('companion_interests').insert({
      post_id: post.id,
      from_user_id: user.userId,
      status: 'pending',
      messages: [],
    });
    if (error) return { ok: false, error: 'Forespørselen ble ikke sendt.' };
    return { ok: true };
  }

  const existing = localInterests();
  if (existing.some(item => item.postId === post.id && item.fromUserId === viewerId)) {
    return { ok: true };
  }
  const interest: CompanionInterest = {
    id: newId(),
    postId: post.id,
    fromUserId: viewerId,
    fromName: '',
    status: 'pending',
    messages: [],
  };
  writeJson(INTERESTS_KEY, [interest, ...existing]);
  return { ok: true };
}

export async function setInterestStatus(
  interest: CompanionInterest,
  status: 'accepted' | 'declined'
): Promise<{ ok: boolean; error?: string }> {
  const user = await signedIn();
  const supabase = getSupabase();
  if (user && supabase) {
    const { error } = await supabase
      .from('companion_interests')
      .update({ status })
      .eq('id', interest.id);
    if (error) return { ok: false, error: 'Svaret ble ikke lagret.' };
    return { ok: true };
  }

  const next = localInterests().map(item => item.id === interest.id ? { ...item, status } : item);
  writeJson(INTERESTS_KEY, next);
  return { ok: true };
}

export async function appendCompanionMessage(
  interest: CompanionInterest,
  fromUserId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const text = body.trim().slice(0, 500);
  if (!text) return { ok: false, error: 'Skriv en kort melding.' };
  if (interest.status !== 'accepted') {
    return { ok: false, error: 'Meldinger åpnes når begge har sagt ja.' };
  }
  const message: CompanionMessage = {
    id: newId(),
    fromUserId,
    body: text,
    at: new Date().toISOString(),
  };
  const messages = [...interest.messages, message].slice(-40);
  const user = await signedIn();
  const supabase = getSupabase();
  if (user && supabase) {
    const { error } = await supabase
      .from('companion_interests')
      .update({ messages })
      .eq('id', interest.id);
    if (error) return { ok: false, error: 'Meldingen ble ikke sendt.' };
    return { ok: true };
  }

  const next = localInterests().map(item => item.id === interest.id ? { ...item, messages } : item);
  writeJson(INTERESTS_KEY, next);
  return { ok: true };
}

export function scoreCard(post: CompanionPost): PublicMatchCard {
  return cardFromPost(post);
}
