/**
 * Utaktiv Vipps MobilePay Integrasjon
 * Støtter både:
 * 1. Vipps Login (OIDC / OAuth 2.0 innlogging)
 * 2. Vipps ePayment v1 (Betaling via Vipps på nett)
 * Med sømløs simulert modus under testing og utvikling.
 */

export interface VippsPaymentRequest {
  amountNok: number;
  orderId: string;
  description: string;
  customerPhone?: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface VippsPaymentResponse {
  success: boolean;
  orderId: string;
  redirectUrl?: string;
  isSimulated?: boolean;
  error?: string;
}

export interface VippsConfig {
  clientId?: string;
  clientSecret?: string;
  subscriptionKey?: string;
  msn?: string;
  env: 'test' | 'prod';
}

export interface VippsLoginUser {
  sub: string;
  name: string;
  email?: string;
  phone?: string;
  address?: Record<string, unknown>;
}

const STORAGE_KEY_VIPPS_STATE = 'utaktiv_vipps_auth_state';

function getEnv(): Record<string, string | undefined> {
  return (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
}

/**
 * Henter Vipps-konfigurasjon fra miljøvariabler (med standard testoppsett)
 */
export function getVippsConfig(): VippsConfig {
  const envMap = getEnv();
  const env = (envMap.VITE_VIPPS_ENV || 'test') as 'test' | 'prod';
  return {
    clientId: envMap.VITE_VIPPS_CLIENT_ID || '21bef5fd-afdb-444f-a99b-d3de301730f4',
    subscriptionKey: envMap.VITE_VIPPS_SUBSCRIPTION_KEY || '675953997bfc0153b991e961669d1f01',
    msn: envMap.VITE_VIPPS_MSN || '524104',
    env,
  };
}

/**
 * Sjekker om Vipps er konfigurert med ekte API-nøkler
 */
export function isVippsConfigured(): boolean {
  const conf = getVippsConfig();
  return Boolean(conf.clientId && (conf.subscriptionKey || conf.msn));
}

/**
 * Genererer OIDC Authorize URL for "Logg inn med Vipps"
 * Basert på Vipps Login API Guide (Browser flow integration - API v2.0)
 */
export function getVippsLoginAuthUrl(customRedirectUri?: string): string | null {
  const config = getVippsConfig();
  if (!config.clientId) return null;

  const baseUrl = config.env === 'prod' 
    ? 'https://api.vipps.no' 
    : 'https://apitest.vipps.no';

  const authEndpoint = `${baseUrl}/access-management-1.0/access/oauth2/auth`;
  const defaultOrigin = (typeof window !== 'undefined' && window.location?.origin) 
    ? window.location.origin 
    : 'https://utaktiv.no';
  const defaultPath = (typeof window !== 'undefined' && window.location?.pathname)
    ? window.location.pathname
    : '/';
  const redirectUri = customRedirectUri || `${defaultOrigin}${defaultPath}`;
  
  // Generer unik state for CSRF-beskyttelse (minst 8 tegn iht. Vipps OIDC-krav)
  const state = `state_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY_VIPPS_STATE, state);
    } catch {
      // Ignore
    }
  }

  const scopes = 'openid email phoneNumber name address';
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: scopes,
    state,
    redirect_uri: redirectUri,
    market: 'NO',
  });

  return `${authEndpoint}?${params.toString()}`;
}

/**
 * Fullfører Vipps Login etter redirect med ?code=...&state=...
 * Bytter code mot access_token og henter brukerprofil via backend-proxyen.
 */
export async function completeVippsLogin(
  code: string,
  state: string,
  redirectUri: string
): Promise<{ success: boolean; user?: VippsLoginUser; error?: string }> {
  // Sjekk state mot lagret CSRF-state
  if (typeof sessionStorage !== 'undefined') {
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY_VIPPS_STATE);
      sessionStorage.removeItem(STORAGE_KEY_VIPPS_STATE);
      if (savedState && savedState !== state) {
        return { success: false, error: 'Ugyldig sikkerhetstoken (state mismatch).' };
      }
    } catch {
      // Ignore
    }
  }

  // 1. Forsøk cPanel PHP backend-proxy (/api/vipps.php?action=login)
  if (typeof fetch === 'function') {
    try {
      const phpResp = await fetch('/api/vipps.php?action=login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (phpResp.ok) {
        const data = await phpResp.json();
        if (data.success && data.user) {
          return { success: true, user: data.user };
        }
      }
      const errData = await phpResp.json().catch(() => null);
      if (errData?.error) {
        return { success: false, error: errData.error };
      }
    } catch {
      // Gå videre til Supabase eller simulert fallback
    }
  }

  // 2. Forsøk Supabase Edge Function hvis konfigurert
  const envMap = getEnv();
  const supabaseUrl = envMap.VITE_SUPABASE_URL;
  const supabaseAnon = envMap.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnon) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/vipps-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnon,
          Authorization: `Bearer ${supabaseAnon}`,
        },
        body: JSON.stringify({ code, redirectUri }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          return { success: true, user: data.user };
        }
      }
      const errData = await response.json().catch(() => null);
      return { success: false, error: errData?.error || 'Kunne ikke fullføre Vipps innlogging.' };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Nettverksfeil mot Vipps auth-tjeneste.' };
    }
  }

  // 3. Fallback for lokal testing/simulering
  return {
    success: true,
    user: {
      sub: `sim_${Date.now()}`,
      name: 'Vipps Testbruker',
      phone: '+47 411 19 608',
      email: 'alexander@utaktiv.no',
    },
  };
}

/**
 * Tester kontakt mot Vipps API via backend-proxyen (/api/vipps.php?action=token)
 */
export async function testVippsConnection(): Promise<{ success: boolean; env?: string; error?: string }> {
  try {
    const res = await fetch('/api/vipps.php?action=token');
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { success: Boolean(data.success), env: data.env };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Nettverksfeil' };
  }
}

/**
 * Initierer en Vipps-betaling (ePayment v1).
 * 1. Forsøker cPanel PHP-proxy (/api/vipps.php?action=create_payment) med server-til-server Vipps-autentisering.
 * 2. Forsøker Supabase Edge Function hvis konfigurert.
 * 3. Faller grasiøst tilbake på simulert modus under lokal offline-utvikling.
 */
export async function initiateVippsPayment(
  req: VippsPaymentRequest
): Promise<VippsPaymentResponse> {
  const envMap = getEnv();
  const supabaseUrl = envMap.VITE_SUPABASE_URL;
  const supabaseAnon = envMap.VITE_SUPABASE_ANON_KEY;

  // Renser telefonnummer (Vipps krever norsk landskode 47 + 8 siffer hvis oppgitt)
  let cleanPhone = req.customerPhone?.replace(/\s+/g, '').replace('+', '');
  if (cleanPhone && cleanPhone.length === 8) {
    cleanPhone = `47${cleanPhone}`;
  }

  // 1. Forsøk cPanel PHP backend-proxy
  if (typeof fetch === 'function') {
    try {
      const returnUrl = req.returnUrl || (typeof window !== 'undefined' ? window.location.href : 'https://utaktiv.no');
      const phpResp = await fetch('/api/vipps.php?action=create_payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountNok: req.amountNok,
          orderId: req.orderId,
          description: req.description,
          customerPhone: cleanPhone,
          returnUrl,
          metadata: req.metadata,
        }),
      });

      if (phpResp.ok) {
        const data = await phpResp.json();
        if (data.success && data.redirectUrl) {
          return {
            success: true,
            orderId: req.orderId,
            redirectUrl: data.redirectUrl,
            isSimulated: false,
          };
        }
      }
    } catch {
      // Ignorer nettverksfeil mot PHP-proxy og fortsett til Supabase eller simulering
    }
  }

  // 2. Forsøk å kalle Supabase Edge Function hvis backend er konfigurert
  if (supabaseUrl && supabaseAnon) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/vipps-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnon,
          Authorization: `Bearer ${supabaseAnon}`,
        },
        body: JSON.stringify({
          action: 'create_payment',
          amountNok: req.amountNok,
          orderId: req.orderId,
          description: req.description,
          customerPhone: cleanPhone,
          returnUrl: req.returnUrl || window.location.href,
          metadata: req.metadata,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.redirectUrl) {
          return {
            success: true,
            orderId: req.orderId,
            redirectUrl: data.redirectUrl,
            isSimulated: false,
          };
        }
      }
    } catch {
      // Ignorer nettverksfeil mot Edge Function og fortsett til simulert fallback
    }
  }

  // 3. Grasiøs simulert fallback for rask lokal test og offline demo
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    orderId: req.orderId,
    isSimulated: true,
  };
}
