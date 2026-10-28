import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getVippsConfig, 
  isVippsConfigured, 
  getVippsLoginAuthUrl, 
  completeVippsLogin,
  initiateVippsPayment,
  testVippsConnection 
} from '../engine/vipps';

describe('Vipps MobilePay Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('gir riktig default konfigurasjon', () => {
    const config = getVippsConfig();
    expect(config.env).toBe('test');
    expect(config.clientId).toBe('2763d6db-021e-4aaa-9302-20ab29f472b8');
    expect(config.msn).toBe('690031');
    expect(isVippsConfigured()).toBe(true);
  });

  it('genererer gyldig OIDC autorisasjons-URL i henhold til Vipps API v2.0', () => {
    const url = getVippsLoginAuthUrl('https://utaktiv.no/auth/callback');
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin).toBe('https://apitest.vipps.no');
    expect(parsed.pathname).toBe('/access-management-1.0/access/oauth2/auth');
    expect(parsed.searchParams.get('client_id')).toBe('2763d6db-021e-4aaa-9302-20ab29f472b8');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('scope')).toContain('openid');
    expect(parsed.searchParams.get('market')).toBe('NO');
    expect(parsed.searchParams.get('redirect_uri')).toBe('https://utaktiv.no/auth/callback');
    expect(parsed.searchParams.get('state')?.length).toBeGreaterThanOrEqual(8);
  });

  it('avviser completeVippsLogin ved state mismatch (CSRF beskyttelse)', async () => {
    const mockSessionStorage = {
      getItem: vi.fn().mockReturnValue('correct_state_12345'),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    };
    vi.stubGlobal('sessionStorage', mockSessionStorage);

    const res = await completeVippsLogin('auth_code_123', 'wrong_state_67890', 'https://utaktiv.no');
    expect(res.success).toBe(false);
    expect(res.error).toContain('state mismatch');
  });

  it('fullfører innlogging via PHP-proxy når server returnerer brukerprofil', async () => {
    const mockSessionStorage = {
      getItem: vi.fn().mockReturnValue('my_secret_state'),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    };
    vi.stubGlobal('sessionStorage', mockSessionStorage);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          sub: 'vipps_sub_999',
          name: 'Alexander Robertsen',
          phone: '+4741119608',
          email: 'alexander@utaktiv.no',
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await completeVippsLogin('valid_code_123', 'my_secret_state', 'https://utaktiv.no');
    expect(res.success).toBe(true);
    expect(res.user?.name).toBe('Alexander Robertsen');
    expect(res.user?.email).toBe('alexander@utaktiv.no');
  });

  it('håndterer simulert betaling grasiøst når backend ikke er aktiv', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Backend offline'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await initiateVippsPayment({
      amountNok: 499,
      orderId: 'test-order-123',
      description: 'Test Julegavekort',
      customerPhone: '98765432',
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBe('test-order-123');
    expect(result.isSimulated).toBe(true);
  });

  it('håndterer vellykket betaling via PHP-proxy når server svarer', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        orderId: 'order-vipps-live-1',
        redirectUrl: 'https://apitest.vipps.no/checkout?token=xyz123',
        isTest: true,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await initiateVippsPayment({
      amountNok: 500,
      orderId: 'order-vipps-live-1',
      description: 'Aktiv Barndom Gavekort',
      customerPhone: '41119608',
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBe('order-vipps-live-1');
    expect(result.redirectUrl).toBe('https://apitest.vipps.no/checkout?token=xyz123');
    expect(result.isSimulated).toBe(false);
  });

  it('kan teste tilkobling via testVippsConnection', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        env: 'test',
        token_length: 128,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await testVippsConnection();
    expect(res.success).toBe(true);
    expect(res.env).toBe('test');
  });
});
