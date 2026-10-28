import { getSupabase } from '../lib/supabaseClient';
import { getStoredProfile, saveStoredProfile } from './profile';
import { getVippsConfig, getVippsLoginAuthUrl, VippsLoginUser } from './vipps';

export type SocialAuthProvider = 'google' | 'apple' | 'facebook';

export interface AccountSession {
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  phone?: string;
  provider?: 'vipps' | 'google' | 'apple' | 'facebook' | 'email' | 'local';
}

const LOCAL_SESSION_KEY = 'utaktiv_account_session';

function getLocalSession(): AccountSession | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(LOCAL_SESSION_KEY);
    if (stored) {
      return JSON.parse(stored) as AccountSession;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

export function extractUserSession(user: any): AccountSession {
  const metadata = (user?.user_metadata || {}) as Record<string, any>;
  const fullName =
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    (metadata.first_name ? `${metadata.first_name} ${metadata.last_name || ''}`.trim() : undefined) ||
    undefined;

  let avatarUrl: string | undefined = undefined;
  if (typeof metadata.avatar_url === 'string' && metadata.avatar_url.trim()) {
    avatarUrl = metadata.avatar_url.trim();
  } else if (typeof metadata.picture === 'string' && metadata.picture.trim()) {
    avatarUrl = metadata.picture.trim();
  } else if (metadata.picture && typeof metadata.picture === 'object' && typeof metadata.picture.data?.url === 'string') {
    avatarUrl = metadata.picture.data.url.trim();
  } else if (typeof metadata.avatar === 'string' && metadata.avatar.trim()) {
    avatarUrl = metadata.avatar.trim();
  }

  let provider = (user?.app_metadata?.provider || user?.identities?.[0]?.provider) as any;
  if (!provider && typeof sessionStorage !== 'undefined') {
    try {
      const pendingProvider = sessionStorage.getItem('utaktiv_oauth_in_progress');
      if (pendingProvider) provider = pendingProvider;
    } catch {
      // Ignore
    }
  }
  if (!provider) {
    provider = user?.phone ? 'vipps' : 'email';
  }

  return {
    userId: user?.id ?? '',
    email: user?.email ?? '',
    name: fullName,
    avatarUrl,
    phone: user?.phone,
    provider,
  };
}

export function formatOAuthError(errorMsg?: string, provider?: string): string {
  if (!errorMsg) return 'Kunne ikke koble til innloggingstjenesten.';
  const lower = errorMsg.toLowerCase();
  const providerLabel =
    provider === 'google'
      ? 'Google'
      : provider === 'facebook'
      ? 'Facebook'
      : provider === 'apple'
      ? 'Apple'
      : 'innloggingstjenesten';
  if (lower.includes('disabled') || lower.includes('not enabled') || lower.includes('unsupported provider')) {
    return `Innlogging med ${providerLabel} er ikke aktivert i Supabase ennå. Vennligst aktiver ${providerLabel} i Supabase Dashboard under Authentication -> Providers.`;
  }
  return errorMsg;
}

export async function readSession(): Promise<AccountSession | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        return extractUserSession(user);
      }
    } catch {
      // Ignore
    }
  }

  // Fallback til lokal lagret sesjon (f.eks. Vipps hurtiginnlogging)
  return getLocalSession();
}

export function watchSession(onChange: (session: AccountSession | null) => void): () => void {
  const supabase = getSupabase();

  const notify = async () => {
    const session = await readSession();
    onChange(session);
  };

  const handleStorage = () => {
    void notify();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  let unsubscribeSupabase = () => {};
  if (supabase) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        onChange(extractUserSession(session.user));
      } else {
        // Hvis ingen Supabase-bruker, sjekk om vi har en gyldig lokal sesjon (f.eks. Vipps)
        const local = getLocalSession();
        onChange(local);
      }
    });
    unsubscribeSupabase = () => data.subscription.unsubscribe();
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
    unsubscribeSupabase();
  };
}

/**
 * Logg inn med Vipps (1-klikk, ingen passord, ingen BankID)
 * Hvis Vipps er satt i ekte produksjon ('prod'), omdirigeres brukeren til Vipps OIDC innlogging.
 * Inntil produksjonsavtalen er ferdig ('test'), brukes en rask simulert lokal sesjon.
 */
export async function signInWithVipps(
  phoneNumber?: string,
  forceDirect = false
): Promise<{ ok: boolean; session?: AccountSession; redirected?: boolean; error?: string }> {
  const config = getVippsConfig();

  // Hvis Vipps er godkjent for produksjon og ikke forceDirect, omdiriger til ekte Vipps OIDC
  if (config.env === 'prod' && !forceDirect && typeof window !== 'undefined' && window.location?.href && !phoneNumber) {
    const authUrl = getVippsLoginAuthUrl();
    if (authUrl) {
      window.location.href = authUrl;
      return { ok: true, redirected: true };
    }
  }

  const rawPhone = phoneNumber?.trim() || '+47 900 00 000';
  let cleanPhone = rawPhone.replace(/\s+/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.startsWith('47') ? `+${cleanPhone}` : `+47${cleanPhone}`;
  }

  const phoneDigits = cleanPhone.replace(/[^0-9]/g, '');
  const localSession: AccountSession = {
    userId: `vipps-${phoneDigits || Date.now()}`,
    email: `${phoneDigits || 'bruker'}@vipps.utaktiv.no`,
    phone: cleanPhone,
    provider: 'vipps',
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch {
    // Ignore
  }

  return { ok: true, session: localSession };
}

/**
 * Setter en verifisert sesjon mottatt fra Vipps OIDC
 */
export function setVippsSession(vippsUser: VippsLoginUser): AccountSession {
  const localSession: AccountSession = {
    userId: `vipps-${vippsUser.sub}`,
    name: vippsUser.name,
    email: vippsUser.email || `${vippsUser.sub}@vipps.utaktiv.no`,
    phone: vippsUser.phone,
    provider: 'vipps',
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch {
    // Ignore
  }

  return localSession;
}

/**
 * Registrer deg eller logg inn med Google, Apple eller Facebook (1-klikk).
 * Bruker ekte Supabase OAuth for Google og Facebook i nettleseren.
 * Ved testing, manglende nettleser-DOM eller options.forceLocal brukes en lokal sesjon.
 */
export async function signInWithSocialProvider(
  provider: SocialAuthProvider,
  displayName?: string,
  options?: { forceLocal?: boolean; skipBrowserRedirect?: boolean }
): Promise<{ ok: boolean; session?: AccountSession; redirected?: boolean; error?: string }> {
  const supabase = getSupabase();
  const cleanName = displayName?.trim();

  // Hvis brukeren oppga et navn i feltet, husk det slik at det beholdes etter OAuth-omdirigering
  if (cleanName) {
    if (typeof localStorage !== 'undefined') {
      try {
        const current = getStoredProfile();
        saveStoredProfile({ ...current, name: cleanName });
      } catch {
        // Ignore
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('utaktiv_pending_display_name', cleanName);
      } catch {
        // Ignore
      }
    }
  }

  // Ekte Supabase OAuth (Google, Facebook, Apple) i nettleseren
  if (!options?.forceLocal && supabase && typeof window !== 'undefined' && window.location?.origin && typeof document !== 'undefined') {
    try {
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem('utaktiv_oauth_in_progress', provider);
        } catch {
          // Ignore
        }
      }

      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: options?.skipBrowserRedirect ?? false,
        },
      });

      if (error) {
        if (typeof sessionStorage !== 'undefined') {
          try {
            sessionStorage.removeItem('utaktiv_oauth_in_progress');
          } catch {
            // Ignore
          }
        }
        return { ok: false, error: formatOAuthError(error.message, provider) };
      }

      if (data?.url) {
        if (!options?.skipBrowserRedirect && typeof window !== 'undefined' && window.location.href !== data.url) {
          window.location.href = data.url;
        }
        return { ok: true, redirected: true };
      }
    } catch (err: any) {
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.removeItem('utaktiv_oauth_in_progress');
        } catch {
          // Ignore
        }
      }
      return { ok: false, error: formatOAuthError(err?.message, provider) };
    }
  }

  // Fallback til lokal direkte sesjon (i testmiljøer uten DOM eller hvis sky ikke er tilkoblet)
  const slug = (cleanName || provider).toLowerCase().replace(/[^a-z0-9]/g, '') || provider;
  const localSession: AccountSession = {
    userId: `${provider}-${slug}-${Date.now()}`,
    email: `${slug}@${provider}.utaktiv.no`,
    name: cleanName || `${provider.charAt(0).toUpperCase() + provider.slice(1)}-bruker`,
    provider,
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch {
    // Ignore
  }

  return { ok: true, session: localSession };
}

export async function signInWithPassword(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: 'Feil e-post eller passord.' };
    return { ok: true };
  }

  // Lokal innlogging hvis sky ikke er tilkoblet ennå
  if (!email.includes('@')) return { ok: false, error: 'Vennligst oppgi en gyldig e-postadresse.' };
  const session: AccountSession = {
    userId: `local-${Date.now()}`,
    email: email.trim(),
    provider: 'local',
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('storage'));
  return { ok: true };
}

export async function signUpWithPassword(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (supabase) {
    if (password.length < 8) return { ok: false, error: 'Passordet må ha minst 8 tegn.' };
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return { ok: false, error: 'Kunne ikke opprette kontoen.' };
    return { ok: true };
  }

  // Lokal registrering hvis sky ikke er tilkoblet ennå
  if (!email.includes('@')) return { ok: false, error: 'Vennligst oppgi en gyldig e-postadresse.' };
  if (password.length < 6) return { ok: false, error: 'Passordet må ha minst 6 tegn.' };

  const session: AccountSession = {
    userId: `local-${Date.now()}`,
    email: email.trim(),
    provider: 'local',
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('storage'));
  return { ok: true };
}

export async function signOutAccount(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    window.dispatchEvent(new Event('storage'));
  } catch {
    // Ignore
  }
}
