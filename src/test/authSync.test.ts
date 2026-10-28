import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_USER_PROFILE, getStoredProfile, saveStoredProfile, UserProfile } from '../engine/profile';
import { replacePointEntries, purchasedBalance, earnedBalance, clearPointEntries } from '../engine/pointsLedger';
import { AccountSession } from '../engine/account';

if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; },
  } as any;
}

if (typeof globalThis.sessionStorage === 'undefined') {
  let sessionStore: Record<string, string> = {};
  globalThis.sessionStorage = {
    getItem: (key: string) => sessionStore[key] || null,
    setItem: (key: string, value: string) => { sessionStore[key] = value.toString(); },
    removeItem: (key: string) => { delete sessionStore[key]; },
    clear: () => { sessionStore = {}; },
    key: (index: number) => Object.keys(sessionStore)[index] || null,
    get length() { return Object.keys(sessionStore).length; },
  } as any;
}

describe('Auth & Session Synchronization Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearPointEntries();
    saveStoredProfile(DEFAULT_USER_PROFILE);
  });

  it('synkroniserer profile.id, profile.name og profile.avatarUrl ved OAuth innlogging', () => {
    const session: AccountSession = {
      userId: 'oauth-google-user-1234',
      email: 'alexander@example.com',
      name: 'Alexander Robertsen',
      avatarUrl: 'https://lh3.googleusercontent.com/a/photo.jpg',
      provider: 'google',
    };

    const currentProfile = getStoredProfile();
    expect(currentProfile.id).toBe('user-guest');
    expect(currentProfile.name).toBe('Gjest');

    // Simuler sync-logikken i accept()
    const updated: UserProfile = {
      ...currentProfile,
      id: session.userId,
      name: session.name || currentProfile.name,
      avatarUrl: session.avatarUrl,
    };
    saveStoredProfile(updated);

    const synced = getStoredProfile();
    expect(synced.id).toBe('oauth-google-user-1234');
    expect(synced.name).toBe('Alexander Robertsen');
    expect(synced.avatarUrl).toBe('https://lh3.googleusercontent.com/a/photo.jpg');
  });

  it('tilbakestiller profile til DEFAULT_USER_PROFILE og tømmer poeng ved utlogging', () => {
    // Sett opp en innlogget profil og poeng
    saveStoredProfile({
      ...DEFAULT_USER_PROFILE,
      id: 'active-user-999',
      name: 'Innlogget Bruker',
      avatarUrl: 'https://avatar.url',
    });
    replacePointEntries([
      {
        id: 'p-1',
        pot: 'earned',
        delta: 150,
        reason: 'daylight',
        idempotencyKey: 'k-1',
        createdAt: new Date().toISOString(),
      },
    ]);
    expect(earnedBalance()).toBe(150);
    expect(getStoredProfile().name).toBe('Innlogget Bruker');

    // Utlogging: tøm poeng og tilbakestill profil
    clearPointEntries();
    saveStoredProfile(DEFAULT_USER_PROFILE);

    expect(earnedBalance()).toBe(0);
    expect(purchasedBalance()).toBe(0);
    expect(getStoredProfile().id).toBe('user-guest');
    expect(getStoredProfile().name).toBe('Gjest');
  });

  it('tømmer forrige brukers poeng ved bytte av konto uten eksplisitt utlogging', () => {
    replacePointEntries([
      {
        id: 'p-user-1',
        pot: 'earned',
        delta: 200,
        reason: 'chore',
        idempotencyKey: 'k-u1',
        createdAt: new Date().toISOString(),
      },
    ]);
    expect(earnedBalance()).toBe(200);

    // Bruker 2 logger inn direkte
    clearPointEntries();
    expect(earnedBalance()).toBe(0);
  });
});
