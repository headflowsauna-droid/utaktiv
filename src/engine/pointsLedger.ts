/**
 * To potter. Kjøpte poeng øker bare når en Stripe-rad kommer fra serveren.
 * Opptjente poeng har tak per hendelse og per dag, og kan ikke veksles til kroner.
 */

export type PointPot = 'purchased' | 'earned';
export type EarnedReason = 'daylight' | 'checkin' | 'chore';
export type PointReason = 'stripe_topup' | EarnedReason | 'spend';

export interface PointEntry {
  id: string;
  pot: PointPot;
  delta: number;
  reason: PointReason;
  idempotencyKey: string;
  createdAt: string;
}

export const EARNED_DAILY_CAP = 300;

export const EARNED_EVENT_CAP: Record<EarnedReason, number> = {
  daylight: 40,
  checkin: 50,
  chore: 80,
};

const STORAGE_KEY = 'sol_uteliv_point_entries_v1';

let memory: PointEntry[] | null = null;

function load(): PointEntry[] {
  if (memory) return memory;
  if (typeof localStorage === 'undefined') {
    memory = [];
    return memory;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as unknown : [];
    memory = Array.isArray(parsed) ? parsed.filter(isPointEntry) : [];
  } catch {
    memory = [];
  }
  return memory;
}

function isPointEntry(value: unknown): value is PointEntry {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<PointEntry>;
  return typeof row.id === 'string'
    && (row.pot === 'purchased' || row.pot === 'earned')
    && typeof row.delta === 'number'
    && typeof row.reason === 'string'
    && typeof row.idempotencyKey === 'string'
    && typeof row.createdAt === 'string';
}

function save(entries: PointEntry[]): void {
  memory = entries;
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function listPointEntries(): PointEntry[] {
  return [...load()];
}

export function replacePointEntries(entries: PointEntry[]): void {
  save(entries.filter(isPointEntry));
}

export function sumPot(entries: PointEntry[], pot: PointPot): number {
  return entries.reduce((total, entry) => entry.pot === pot ? total + entry.delta : total, 0);
}

export function purchasedBalance(): number {
  return sumPot(load(), 'purchased');
}

export function earnedBalance(): number {
  return sumPot(load(), 'earned');
}

function osloDayKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export function earnedGrantedToday(entries: PointEntry[], now: Date): number {
  const day = osloDayKey(now.toISOString());
  return entries.reduce((total, entry) => {
    if (entry.pot !== 'earned' || entry.delta <= 0) return total;
    return osloDayKey(entry.createdAt) === day ? total + entry.delta : total;
  }, 0);
}

/** Lokal speiling av opptjente poeng. Kjøpte poeng røres ikke. */
export function creditEarnedLocal(input: {
  points: number;
  reason: EarnedReason;
  idempotencyKey: string;
  now?: Date;
}): { applied: number; balance: number } {
  const entries = load();
  if (entries.some(entry => entry.idempotencyKey === input.idempotencyKey)) {
    return { applied: 0, balance: sumPot(entries, 'earned') };
  }

  const now = input.now ?? new Date();
  const eventCap = EARNED_EVENT_CAP[input.reason];
  const requested = Math.min(eventCap, Math.max(0, Math.floor(input.points)));
  const room = Math.max(0, EARNED_DAILY_CAP - earnedGrantedToday(entries, now));
  const applied = Math.min(requested, room);
  if (applied <= 0) return { applied: 0, balance: sumPot(entries, 'earned') };

  const next: PointEntry = {
    id: `earned-${input.idempotencyKey}`,
    pot: 'earned',
    delta: applied,
    reason: input.reason,
    idempotencyKey: input.idempotencyKey,
    createdAt: now.toISOString(),
  };
  save([next, ...entries]);
  return { applied, balance: sumPot(load(), 'earned') };
}

/** Trekker bare kjøpte poeng. Opptjente poeng kan ikke betale en regning. */
export function spendPurchasedLocal(points: number, idempotencyKey: string): {
  ok: boolean;
  balance: number;
  error?: string;
} {
  const amount = Math.floor(points);
  const entries = load();
  const balance = sumPot(entries, 'purchased');
  if (amount <= 0) return { ok: true, balance };
  if (entries.some(entry => entry.idempotencyKey === idempotencyKey)) {
    return { ok: true, balance };
  }
  if (balance < amount) {
    return { ok: false, balance, error: `Du har ${balance} kjøpte poeng.` };
  }

  const next: PointEntry = {
    id: `spend-${idempotencyKey}`,
    pot: 'purchased',
    delta: -amount,
    reason: 'spend',
    idempotencyKey,
    createdAt: new Date().toISOString(),
  };
  save([next, ...entries]);
  return { ok: true, balance: sumPot(load(), 'purchased') };
}

export function clearPointEntries(): void {
  save([]);
}

export function resetPointEntriesForTests(): void {
  save([]);
}

/** Bare tester og et server-svar får skrive kjøpte poeng inn i speilet. */
export function seedPurchasedForTests(points: number): number {
  const amount = Math.floor(points);
  const entry: PointEntry = {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    pot: 'purchased',
    delta: amount,
    reason: 'stripe_topup',
    idempotencyKey: `test-stripe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  save([entry, ...load()]);
  return purchasedBalance();
}
