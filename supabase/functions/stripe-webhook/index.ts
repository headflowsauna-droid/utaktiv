// hold i synk med src/engine/stripeSignature.ts
// Krediterer stripe_credits og point_entries etter checkout.session.completed.
// Pakke-id og poeng matcher src/engine/wallet.ts TOPUP_PACKAGES.
// Klienten kan ikke skrive point_entries. Service role er eneste kjøp.

const PACKAGES: Record<string, number> = {
  'topup-starter': 500,
  'topup-family': 1200,
  'topup-sponsor': 3000,
  'topup-season': 6500,
};

const TOLERANCE_SECONDS = 300;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return [...new Uint8Array(mac)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds: number
): Promise<boolean> {
  if (!header || !secret) return false;

  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (key === 't') {
      const parsed = Number(value);
      timestamp = Number.isFinite(parsed) ? parsed : null;
    } else if (key === 'v1' && value) {
      signatures.push(value);
    }
  }

  if (timestamp === null || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > TOLERANCE_SECONDS) return false;

  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`);
  return signatures.some(signature => safeEqual(signature, expected));
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);

  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!secret || !supabaseUrl || !serviceKey) return json({ error: 'config' }, 500);

  const rawBody = await request.text();
  const header = request.headers.get('Stripe-Signature');
  const valid = await verifyStripeSignature(rawBody, header, secret, Math.floor(Date.now() / 1000));
  if (!valid) return json({ error: 'signature' }, 401);

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: 'json' }, 400);
  }

  if (event.type !== 'checkout.session.completed') return json({ ignored: true }, 200);

  const session = event.data?.object ?? {};
  const metadata = (session.metadata ?? {}) as Record<string, unknown>;
  const packageId = typeof metadata.package_id === 'string' ? metadata.package_id : '';
  const userId = typeof metadata.user_id === 'string' ? metadata.user_id : '';
  const sessionId = typeof session.id === 'string' ? session.id : '';
  const points = PACKAGES[packageId];

  if (!packageId || !userId || !sessionId || points === undefined) return json({ ignored: true }, 200);

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation,resolution=ignore-duplicates',
  };

  const creditResponse = await fetch(`${supabaseUrl}/rest/v1/stripe_credits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: sessionId,
      user_id: userId,
      package_id: packageId,
      points,
      session_id: sessionId,
    }),
  });

  if (!creditResponse.ok) return json({ error: 'credit' }, 500);
  const inserted = await creditResponse.json();
  const freshCredit = Array.isArray(inserted) && inserted.length > 0;

  const entryResponse = await fetch(`${supabaseUrl}/rest/v1/point_entries`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: userId,
      pot: 'purchased',
      delta: points,
      reason: 'stripe_topup',
      idempotency_key: `stripe-${sessionId}`,
    }),
  });

  if (!entryResponse.ok) return json({ error: 'ledger' }, 500);
  const entryInserted = await entryResponse.json();
  const freshEntry = Array.isArray(entryInserted) && entryInserted.length > 0;
  if (!freshCredit && !freshEntry) return json({ duplicate: true }, 200);
  return json({ credited: freshEntry, points }, 200);
});
