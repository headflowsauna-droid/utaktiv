import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { signInWithVipps, signInWithSocialProvider, readSession, signOutAccount, watchSession } from '../engine/account';
import * as supabaseClientModule from '../lib/supabaseClient';
import { getStoredProfile } from '../engine/profile';

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

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe('Vipps & Account Engine', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await signOutAccount();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger inn med Vipps 1-klikk uten feil eller ugyldig Supabase OAuth-redirect', async () => {
    const res = await signInWithVipps();
    expect(res.ok).toBe(true);
    expect(res.session).toBeDefined();
    expect(res.session?.provider).toBe('vipps');
    expect(res.session?.phone).toBe('+4790000000');
    expect(res.session?.email).toContain('@vipps.utaktiv.no');

    const stored = await readSession();
    expect(stored).toBeDefined();
    expect(stored?.userId).toBe(res.session?.userId);
  });

  it('logger inn med spesifisert mobilnummer og formaterer landskode', async () => {
    const res = await signInWithVipps('987 65 432');
    expect(res.ok).toBe(true);
    expect(res.session?.phone).toBe('+4798765432');
    expect(res.session?.email).toBe('4798765432@vipps.utaktiv.no');
  });

  it('signOutAccount fjerner den lokale Vipps-sesjonen fullstendig', async () => {
    await signInWithVipps('91234567');
    let session = await readSession();
    expect(session).not.toBeNull();

    await signOutAccount();
    session = await readSession();
    expect(session).toBeNull();
  });

  it('logger inn med Google, Apple og Facebook (1-klikk fallback / direkte)', async () => {
    for (const provider of ['google', 'apple', 'facebook'] as const) {
      const res = await signInWithSocialProvider(provider, 'Kari Nordmann');
      expect(res.ok).toBe(true);
      expect(res.session?.provider).toBe(provider);
      expect(res.session?.name).toBe('Kari Nordmann');

      const stored = await readSession();
      expect(stored?.provider).toBe(provider);
      await signOutAccount();
    }
  });

  it('starter ekte Supabase OAuth for Google når nettleser og Supabase er aktive', async () => {
    const signInWithOAuthMock = vi.fn().mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/v2/auth?test=1' },
      error: null,
    });

    const mockSupabase = {
      auth: {
        signInWithOAuth: signInWithOAuthMock,
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signOut: vi.fn().mockResolvedValue({}),
      },
    } as any;

    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(mockSupabase);

    // Simuler nettleser med DOM og location
    const origDoc = (globalThis as any).document;
    const origWin = (globalThis as any).window;
    (globalThis as any).document = {};
    (globalThis as any).window = {
      ...origWin,
      location: {
        origin: 'https://utaktiv.no',
        pathname: '/app',
        href: 'https://utaktiv.no/app',
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    try {
      const res = await signInWithSocialProvider('google', 'Alexander R');
      expect(res.ok).toBe(true);
      expect(res.redirected).toBe(true);
      expect(signInWithOAuthMock).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://utaktiv.no/app',
          skipBrowserRedirect: false,
        },
      });

      // Sjekk at pending display name og oauth state ble lagret
      expect(sessionStorage.getItem('utaktiv_pending_display_name')).toBe('Alexander R');
      expect(sessionStorage.getItem('utaktiv_oauth_in_progress')).toBe('google');
      expect(getStoredProfile().name).toBe('Alexander R');
      expect((globalThis as any).window.location.href).toBe('https://accounts.google.com/o/oauth2/v2/auth?test=1');
    } finally {
      (globalThis as any).document = origDoc;
      (globalThis as any).window = origWin;
    }
  });

  it('starter ekte Supabase OAuth for Facebook når brukeren klikker Facebook', async () => {
    const signInWithOAuthMock = vi.fn().mockResolvedValue({
      data: { provider: 'facebook', url: 'https://www.facebook.com/v19.0/dialog/oauth?test=fb' },
      error: null,
    });

    const mockSupabase = {
      auth: {
        signInWithOAuth: signInWithOAuthMock,
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signOut: vi.fn().mockResolvedValue({}),
      },
    } as any;

    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(mockSupabase);

    const origDoc = (globalThis as any).document;
    const origWin = (globalThis as any).window;
    (globalThis as any).document = {};
    (globalThis as any).window = {
      ...origWin,
      location: {
        origin: 'https://utaktiv.no',
        pathname: '/',
        href: 'https://utaktiv.no/',
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    try {
      const res = await signInWithSocialProvider('facebook');
      expect(res.ok).toBe(true);
      expect(res.redirected).toBe(true);
      expect(signInWithOAuthMock).toHaveBeenCalledWith({
        provider: 'facebook',
        options: {
          redirectTo: 'https://utaktiv.no/',
          skipBrowserRedirect: false,
        },
      });
      expect(sessionStorage.getItem('utaktiv_oauth_in_progress')).toBe('facebook');
      expect((globalThis as any).window.location.href).toBe('https://www.facebook.com/v19.0/dialog/oauth?test=fb');
    } finally {
      (globalThis as any).document = origDoc;
      (globalThis as any).window = origWin;
    }
  });

  it('håndterer feil fra Supabase OAuth grasiøst og rydder opp midlertidig state', async () => {
    const signInWithOAuthMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Provider google is disabled in Supabase' },
    });

    const mockSupabase = {
      auth: {
        signInWithOAuth: signInWithOAuthMock,
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    } as any;

    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(mockSupabase);

    const origDoc = (globalThis as any).document;
    const origWin = (globalThis as any).window;
    (globalThis as any).document = {};
    (globalThis as any).window = {
      ...origWin,
      location: {
        origin: 'https://utaktiv.no',
        pathname: '/',
        href: 'https://utaktiv.no/',
      },
      dispatchEvent: vi.fn(),
    };

    try {
      const res = await signInWithSocialProvider('google');
      expect(res.ok).toBe(false);
      expect(res.error).toContain('ikke aktivert i Supabase ennå');
      expect(sessionStorage.getItem('utaktiv_oauth_in_progress')).toBeNull();
    } finally {
      (globalThis as any).document = origDoc;
      (globalThis as any).window = origWin;
    }
  });

  it('readSession henter ekte Supabase OAuth-bruker med navn og avatarUrl', async () => {
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'supabase-user-uuid-1234',
                email: 'alexander@gmail.com',
                phone: undefined,
                app_metadata: { provider: 'google' },
                user_metadata: {
                  full_name: 'Alexander Robertsen',
                  avatar_url: 'https://lh3.googleusercontent.com/a/photo.jpg',
                },
              },
            },
          },
        }),
      },
    } as any;

    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(mockSupabase);

    const session = await readSession();
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('supabase-user-uuid-1234');
    expect(session?.email).toBe('alexander@gmail.com');
    expect(session?.name).toBe('Alexander Robertsen');
    expect(session?.avatarUrl).toBe('https://lh3.googleusercontent.com/a/photo.jpg');
    expect(session?.provider).toBe('google');
  });

  it('watchSession varsler lyttere om ekte Supabase OAuth-innlogging med profilinfo', async () => {
    let authListener: ((event: string, session: any) => void) | null = null;
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockImplementation((cb) => {
          authListener = cb;
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
      },
    } as any;

    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(mockSupabase);

    let receivedSession: any = null;
    const unsubscribe = watchSession((s) => {
      receivedSession = s;
    });

    expect(authListener).not.toBeNull();

    // Utløs SIGNED_IN event fra Supabase
    authListener!('SIGNED_IN', {
      user: {
        id: 'fb-user-999',
        email: 'alexander@facebook.com',
        app_metadata: { provider: 'facebook' },
        user_metadata: {
          name: 'Alexander på Fjesboka',
          picture: 'https://graph.facebook.com/picture.jpg',
        },
      },
    });

    expect(receivedSession).not.toBeNull();
    expect(receivedSession?.userId).toBe('fb-user-999');
    expect(receivedSession?.name).toBe('Alexander på Fjesboka');
    expect(receivedSession?.avatarUrl).toBe('https://graph.facebook.com/picture.jpg');
    expect(receivedSession?.provider).toBe('facebook');

    unsubscribe();
  });

  it('håndterer Facebook OAuth med nøstet picture.data.url objekt korrekt som string avatarUrl', async () => {
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'fb-graph-user-456',
                email: 'kari.fb@example.com',
                app_metadata: {},
                identities: [{ provider: 'facebook' }],
                user_metadata: {
                  first_name: 'Kari',
                  last_name: 'Nordmann',
                  picture: {
                    data: {
                      height: 50,
                      is_silhouette: false,
                      url: 'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=456&height=50&width=50&ext=123',
                      width: 50,
                    },
                  },
                },
              },
            },
          },
        }),
      },
    } as any;

    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(mockSupabase);

    const session = await readSession();
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('fb-graph-user-456');
    expect(session?.name).toBe('Kari Nordmann');
    expect(session?.avatarUrl).toBe('https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=456&height=50&width=50&ext=123');
    expect(session?.provider).toBe('facebook');
    expect(typeof session?.avatarUrl).toBe('string');
  });
});


