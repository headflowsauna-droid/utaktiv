// Supabase Edge Function for Vipps MobilePay (ePayment API v1)
// Sikker server-side håndtering av client_secret og subscription_key.

interface VippsTokenResponse {
  token_type: string;
  expires_in: string | number;
  access_token: string;
}

interface PaymentRequestBody {
  action: 'create_payment' | 'capture' | 'status';
  amountNok: number;
  orderId: string;
  description: string;
  customerPhone?: string;
  returnUrl: string;
  metadata?: Record<string, unknown>;
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

// Vipps Endepunkter
function getBaseUrl(env: string): string {
  return env === 'prod' ? 'https://api.vipps.no' : 'https://apitest.vipps.no';
}

async function getVippsAccessToken(
  baseUrl: string,
  clientId: string,
  clientSecret: string,
  subscriptionKey: string
): Promise<string> {
  const tokenUrl = `${baseUrl}/accesstoken/get`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      client_id: clientId,
      client_secret: clientSecret,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vipps auth failed: ${response.status} - ${errorText}`);
  }

  const data: VippsTokenResponse = await response.json();
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  // CORS Preflight
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
  const subscriptionKey = Deno.env.get('VIPPS_SUBSCRIPTION_KEY') || '';
  const msn = Deno.env.get('VIPPS_MSN') || '';
  const vippsEnv = Deno.env.get('VIPPS_ENV') || 'test';

  if (!clientId || !clientSecret || !subscriptionKey || !msn) {
    return jsonResponse({
      error: 'Vipps er ikke konfigurert i miljøvariabler (mangler client_id, client_secret, subscription_key eller MSN)',
      simulated: true,
    }, 400);
  }

  const baseUrl = getBaseUrl(vippsEnv);

  try {
    const body: PaymentRequestBody = await req.json();

    if (body.action === 'create_payment') {
      const accessToken = await getVippsAccessToken(baseUrl, clientId, clientSecret, subscriptionKey);

      // Beløp i øre (Vipps krever heltall i minste valutaenhet)
      const amountInOre = Math.round(body.amountNok * 100);

      const vippsPayload: Record<string, unknown> = {
        amount: {
          value: amountInOre,
          currency: 'NOK',
        },
        paymentMethod: {
          type: 'WALLET',
        },
        reference: body.orderId,
        userFlow: 'WEB_REDIRECT',
        returnUrl: body.returnUrl,
        paymentDescription: body.description || 'Utaktiv opplevelse',
      };

      if (body.customerPhone) {
        vippsPayload.customer = {
          phoneNumber: body.customerPhone,
        };
      }

      const paymentResponse = await fetch(`${baseUrl}/epayment/v1/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Merchant-Serial-Number': msn,
          'Content-Type': 'application/json',
          'Idempotency-Key': `utaktiv-${body.orderId}-${Date.now()}`,
        },
        body: JSON.stringify(vippsPayload),
      });

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        return jsonResponse({
          error: `Feil ved opprettelse av Vipps-betaling: ${paymentResponse.status}`,
          details: errorText,
        }, 502);
      }

      const paymentData = await paymentResponse.json();
      return jsonResponse({
        success: true,
        reference: paymentData.reference,
        redirectUrl: paymentData.redirectUrl,
      }, 200);
    }

    return jsonResponse({ error: `Ukjent handling: ${body.action}` }, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Uventet serverfeil', details: message }, 500);
  }
});
