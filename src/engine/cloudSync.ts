/**
 * Best-effort skysynk. localStorage-motorene virker videre når Supabase er av.
 */

import { getSupabase } from '../lib/supabaseClient';
import {
  EarnedReason,
  PointEntry,
  PointReason,
  creditEarnedLocal,
  earnedBalance,
  purchasedBalance,
  replacePointEntries,
  spendPurchasedLocal,
} from './pointsLedger';

export function isCloudEnabled(): boolean {
  return getSupabase() !== null;
}

async function requireUserId(): Promise<{ ok: true; userId: string } | { ok: false; reason: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: 'disabled' };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { ok: false, reason: 'signed-out' };
  return { ok: true, userId: data.user.id };
}

export async function pushProfile(profile: unknown): Promise<{ ok: boolean; reason?: string }> {
  const supabase = getSupabase();
  const user = await requireUserId();
  if (!user.ok || !supabase) return { ok: false, reason: user.ok ? 'disabled' : user.reason };

  const city = profile && typeof profile === 'object' && 'city' in profile
    ? String((profile as { city?: unknown }).city ?? '')
    : '';
  const displayName = profile && typeof profile === 'object' && 'name' in profile
    ? String((profile as { name?: unknown }).name ?? '')
    : '';

  const { error } = await supabase.from('profiles').upsert({
    id: user.userId,
    display_name: displayName,
    city,
    profile,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function pullProfile(): Promise<{ ok: boolean; profile?: unknown; reason?: string }> {
  const supabase = getSupabase();
  const user = await requireUserId();
  if (!user.ok || !supabase) return { ok: false, reason: user.ok ? 'disabled' : user.reason };

  const { data, error } = await supabase
    .from('profiles')
    .select('profile')
    .eq('id', user.userId)
    .maybeSingle();

  if (error) return { ok: false, reason: error.message };
  if (!data?.profile) return { ok: true };
  return { ok: true, profile: data.profile };
}

export async function pushSocialState(state: unknown): Promise<{ ok: boolean; reason?: string }> {
  const supabase = getSupabase();
  const user = await requireUserId();
  if (!user.ok || !supabase) return { ok: false, reason: user.ok ? 'disabled' : user.reason };

  const { error } = await supabase.from('social_state').upsert({
    user_id: user.userId,
    state,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function pullSocialState(): Promise<{ ok: boolean; state?: unknown; reason?: string }> {
  const supabase = getSupabase();
  const user = await requireUserId();
  if (!user.ok || !supabase) return { ok: false, reason: user.ok ? 'disabled' : user.reason };

  const { data, error } = await supabase
    .from('social_state')
    .select('state')
    .eq('user_id', user.userId)
    .maybeSingle();

  if (error) return { ok: false, reason: error.message };
  if (!data?.state) return { ok: true };
  return { ok: true, state: data.state };
}

export async function pushSavingGoals(goals: unknown[]): Promise<{ ok: boolean; reason?: string }> {
  const supabase = getSupabase();
  const user = await requireUserId();
  if (!user.ok || !supabase) return { ok: false, reason: user.ok ? 'disabled' : user.reason };
  if (goals.length === 0) return { ok: true };

  const rows = goals.map(goal => {
    const id = goal && typeof goal === 'object' && 'id' in goal && (goal as { id?: unknown }).id
      ? String((goal as { id: unknown }).id)
      : crypto.randomUUID();
    return {
      id,
      user_id: user.userId,
      goal,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('saving_goals').upsert(rows);
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/**
 * En returadresse eller session-id i nettleseren er bare en kvittering.
 * Kjøpte poeng skrives av Stripe-webhooken inn i point_entries.
 */
export function recordStripeCreditLocal(_sessionId: string, _packageId: string): { applied: boolean } {
  return { applied: false };
}

const POINT_REASONS: PointReason[] = ['stripe_topup', 'daylight', 'checkin', 'chore', 'spend'];

export async function pullPointEntries(): Promise<{ ok: boolean }> {
  const supabase = getSupabase();
  const user = await requireUserId();
  if (!supabase || !user.ok) return { ok: false };

  const { data, error } = await supabase
    .from('point_entries')
    .select('id, pot, delta, reason, idempotency_key, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error || !data) return { ok: false };

  const entries: PointEntry[] = [];
  for (const row of data) {
    const pot = row.pot === 'earned' ? 'earned' : row.pot === 'purchased' ? 'purchased' : null;
    const reason = POINT_REASONS.find(item => item === row.reason);
    if (!pot || !reason || typeof row.delta !== 'number') continue;
    entries.push({
      id: String(row.id),
      pot,
      delta: row.delta,
      reason,
      idempotencyKey: String(row.idempotency_key),
      createdAt: String(row.created_at),
    });
  }
  replacePointEntries(entries);
  return { ok: true };
}

/** Opptjente poeng. Logger inn: bare serveren. Ellers lokalt tak. */
export async function grantEarned(input: {
  points: number;
  reason: EarnedReason;
  idempotencyKey: string;
}): Promise<{ applied: number; balance: number }> {
  const supabase = getSupabase();
  const user = await requireUserId();
  if (!supabase || !user.ok) return creditEarnedLocal(input);

  const { data, error } = await supabase.rpc('credit_earned', {
    p_reason: input.reason,
    p_points: Math.floor(input.points),
    p_key: input.idempotencyKey,
  });
  if (error) return { applied: 0, balance: earnedBalance() };
  await pullPointEntries();
  return { applied: typeof data === 'number' ? data : 0, balance: earnedBalance() };
}

/** Trekker kjøpte poeng. Logger inn: serveren. Ellers det lokale speilet. */
export async function commitSpend(points: number, idempotencyKey: string): Promise<{
  ok: boolean;
  balance: number;
  error?: string;
}> {
  const amount = Math.floor(points);
  if (amount <= 0) return { ok: true, balance: purchasedBalance() };

  const supabase = getSupabase();
  const user = await requireUserId();
  if (!supabase || !user.ok) return spendPurchasedLocal(amount, idempotencyKey);

  const { error } = await supabase.rpc('spend_purchased', {
    p_points: amount,
    p_key: idempotencyKey,
  });
  if (error) {
    return { ok: false, balance: purchasedBalance(), error: 'Kjøpte poeng ble ikke trukket.' };
  }
  await pullPointEntries();
  return { ok: true, balance: purchasedBalance() };
}

/**
 * Sky-synkronisering og deling av Tur-kurv (shared_trips)
 */
export async function pushTurKurv(kurv: unknown, shareId?: string, friendName?: string): Promise<{ ok: boolean; id?: string; reason?: string }> {
  const supabase = getSupabase();
  const user = await requireUserId();
  if (!user.ok || !supabase) return { ok: false, reason: user.ok ? 'disabled' : user.reason };

  const tripId = shareId || `tur-${user.userId}`;
  const city = kurv && typeof kurv === 'object' && 'city' in kurv
    ? String((kurv as { city?: unknown }).city ?? 'Bergen')
    : 'Bergen';

  const { error } = await supabase.from('shared_trips').upsert({
    id: tripId,
    user_id: user.userId,
    city,
    friend_name: friendName ?? null,
    kurv,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, reason: error.message };
  return { ok: true, id: tripId };
}

export async function pullTurKurv(shareId?: string): Promise<{ ok: boolean; kurv?: unknown; friendName?: string; reason?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: 'disabled' };

  let targetId = shareId;
  if (!targetId) {
    const user = await requireUserId();
    if (!user.ok) return { ok: false, reason: user.reason };
    targetId = `tur-${user.userId}`;
  }

  const { data, error } = await supabase
    .from('shared_trips')
    .select('kurv, friend_name')
    .eq('id', targetId)
    .maybeSingle();

  if (error) return { ok: false, reason: error.message };
  if (!data?.kurv) return { ok: true };
  return {
    ok: true,
    kurv: data.kurv,
    friendName: data.friend_name ? String(data.friend_name) : undefined,
  };
}
