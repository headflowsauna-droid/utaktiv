// Supabase Edge Function for Vipps Login (OIDC / OAuth 2.0)
// Håndterer exchange av authorization code -> access_token og henter brukerinfo fra Vipps.

interface VippsTokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface VippsUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  address?: {
    street_address?: string;
    postal_code?: string;
    region?: string;
    country?: string;
    formatted?: string;
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

function getBaseUrl(env: string): string {
  return env === 'prod' ? 'https://api.vipps.no' : 'https://apitest.vipps.no';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Kun POST er tillatt' }, 405);
  }

  const clientId = Deno.env.get('VIPPS_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('VIPPS_CLIENT_SECRET') || '';
  const vippsEnv = Deno.env.get('VIPPS_ENV') || 'test';

  if (!clientId || !clientSecret) {
    return jsonResponse({
      error: 'Vipps Login er ikke konfigurert i miljøvariabler (mangler VIPPS_CLIENT_ID eller VIPPS_CLIENT_SECRET)',
    }, 400);
  }

  const baseUrl = getBaseUrl(vippsEnv);

  try {
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      return jsonResponse({ error: 'Mangler code eller redirectUri' }, 400);
    }

    // 1. Bytt code mot token hos Vipps
    // Basic auth: base64(client_id:client_secret)
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const tokenUrl = `${baseUrl}/access-management-1.0/access/oauth2/token`;

    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', redirectUri);

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return jsonResponse({ error: 'Kunne ikke hente token fra Vipps', details: errText }, tokenRes.status);
    }

    const tokenData: VippsTokenResponse = await tokenRes.json();

    // 2. Hent brukerinfo fra Vipps UserInfo-endepunkt
    const userInfoUrl = `${baseUrl}/vipps-userinfo-api/userinfo`;
    const userRes = await fetch(userInfoUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      return jsonResponse({ error: 'Kunne ikke hente brukerinfo fra Vipps', details: errText }, userRes.status);
    }

    const userInfo: VippsUserInfo = await userRes.json();

    return jsonResponse({
      success: true,
      user: {
        sub: userInfo.sub,
        name: userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim(),
        email: userInfo.email,
        phone: userInfo.phone_number,
        address: userInfo.address,
      },
    }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Uventet serverfeil under Vipps login', details: message }, 500);
  }
});
