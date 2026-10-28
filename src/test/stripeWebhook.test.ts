import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyStripeSignature } from '../engine/stripeSignature';

function headerFor(body: string, secret: string, timestamp: number): string {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

describe('Stripe-signatur', () => {
  const secret = 'whsec_test';
  const body = '{"type":"checkout.session.completed"}';
  const now = 1_700_000_000;

  it('godtar gyldig signatur', () => {
    expect(verifyStripeSignature(body, headerFor(body, secret, now), secret, now)).toBe(true);
  });

  it('avviser feil secret', () => {
    expect(verifyStripeSignature(body, headerFor(body, 'annen', now), secret, now)).toBe(false);
  });

  it('avviser for gammel timestamp', () => {
    expect(verifyStripeSignature(body, headerFor(body, secret, now - 600), secret, now)).toBe(false);
  });
});
