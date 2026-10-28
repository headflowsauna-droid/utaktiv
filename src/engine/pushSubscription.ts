/**
 * Lokal kopi av en Web Push-abonnement. Utsending krever VAPID og server.
 * Denne modulen leverer ikke push.
 */

export interface StoredPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const PUSH_SUBSCRIPTION_STORAGE_KEY = 'sol_uteliv_push_sub_v1';

let memorySub: StoredPushSubscription | null = null;

function isStoredPushSubscription(value: unknown): value is StoredPushSubscription {
  if (!value || typeof value !== 'object') return false;
  const sub = value as StoredPushSubscription;
  return (
    typeof sub.endpoint === 'string' &&
    sub.endpoint.length > 0 &&
    !!sub.keys &&
    typeof sub.keys.p256dh === 'string' &&
    sub.keys.p256dh.length > 0 &&
    typeof sub.keys.auth === 'string' &&
    sub.keys.auth.length > 0
  );
}

export function saveLocalPushSubscription(sub: StoredPushSubscription): void {
  memorySub = sub;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PUSH_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(sub));
    }
  } catch {
    // Minnet beholdes for denne økten.
  }
}

export function getLocalPushSubscription(): StoredPushSubscription | null {
  if (typeof localStorage === 'undefined') {
    return memorySub;
  }
  try {
    const raw = localStorage.getItem(PUSH_SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredPushSubscription(parsed) ? parsed : null;
  } catch {
    return memorySub;
  }
}
