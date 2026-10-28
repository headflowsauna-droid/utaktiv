import { beforeEach, describe, expect, it } from 'vitest';
import { estimateLux } from '../engine/solar';
import { findSolWindow, formatSolAlarm } from '../engine/solAlarm';
import {
  getLocalPushSubscription,
  PUSH_SUBSCRIPTION_STORAGE_KEY,
  saveLocalPushSubscription,
} from '../engine/pushSubscription';

describe('Sol-alarm', () => {
  it('finner første tidspunkt som når luks-terskelen', () => {
    const dark = { time: '2026-06-21T03:00:00', cloudCoverPercent: 100, altitudeDegrees: -12 };
    const morning = { time: '2026-06-21T08:00:00', cloudCoverPercent: 40, altitudeDegrees: 25 };
    const noon = { time: '2026-06-21T12:00:00', cloudCoverPercent: 0, altitudeDegrees: 50 };

    const hit = findSolWindow([dark, morning, noon], 1000);
    expect(hit?.time).toBe(morning.time);
    expect(hit?.lux).toBe(estimateLux(25, 40));
    expect(hit!.lux).toBeGreaterThanOrEqual(1000);

    const exact = estimateLux(40, 0);
    expect(
      findSolWindow([{ time: '2026-06-21T11:00:00', cloudCoverPercent: 0, altitudeDegrees: 40 }], exact)
    ).toMatchObject({ lux: exact });
    expect(
      findSolWindow([{ time: '2026-06-21T11:00:00', cloudCoverPercent: 0, altitudeDegrees: 40 }], exact + 1)
    ).toBeNull();
    expect(findSolWindow([], 1000)).toBeNull();
  });

  it('formaterer norsk sol-alarm med klarvær, delvis sky eller overskyet', () => {
    const time = '2026-06-21T09:30:00';
    expect(formatSolAlarm('Bergen', { time, lux: 15000, cloudCoverPercent: 10 })).toBe(
      'Det meldes 15000 luks og klarvær i Bergen kl. 09:30 søndag.'
    );
    expect(formatSolAlarm('Bergen', { time, lux: 8000.4, cloudCoverPercent: 30 })).toContain(
      'delvis sky'
    );
    expect(formatSolAlarm('Bergen', { time, lux: 4000, cloudCoverPercent: 70 })).toContain(
      'overskyet'
    );
    expect(formatSolAlarm('Oslo', { time, lux: 4000, cloudCoverPercent: 69 })).toContain('delvis sky');
  });
});

describe('Lokal push-abonnement', () => {
  beforeEach(() => {
    if (typeof localStorage === 'undefined') {
      const store = new Map<string, string>();
      const memory = {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => {
          store.set(key, String(value));
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => store.clear(),
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        get length() {
          return store.size;
        },
      };
      Object.defineProperty(globalThis, 'localStorage', {
        value: memory,
        configurable: true,
      });
    }
    localStorage.removeItem(PUSH_SUBSCRIPTION_STORAGE_KEY);
  });

  it('lagrer og henter abonnementet fra localStorage', () => {
    expect(getLocalPushSubscription()).toBeNull();

    const sub = {
      endpoint: 'https://push.example/sol/abc',
      keys: { p256dh: 'p256dh-nokkel', auth: 'auth-nokkel' },
    };
    saveLocalPushSubscription(sub);

    expect(getLocalPushSubscription()).toEqual(sub);
    expect(JSON.parse(localStorage.getItem(PUSH_SUBSCRIPTION_STORAGE_KEY) || '{}')).toEqual(sub);

    const next = { ...sub, endpoint: 'https://push.example/sol/neste' };
    saveLocalPushSubscription(next);
    expect(getLocalPushSubscription()?.endpoint).toBe(next.endpoint);
  });
});
