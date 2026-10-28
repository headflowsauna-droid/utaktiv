/**
 * Billett-, provisjons- og API-nøkkelmotor for Utaktiv
 * Håndterer inntektsmodeller, affiliate-sporing og kommersiell integrasjon.
 */

export interface TicketConfig {
  isTicketed: boolean;
  priceNok: number;
  provider: 'Ticketmaster' | 'TicketCo' | 'DNT' | 'Høyt & Lavt' | 'EqTiming' | 'Direct' | 'AdO Arena';
  affiliateCommissionPercent: number; // F.eks. 5%
  bookingUrl: string;
  directSaleAvailable: boolean; // Kan selges rett i appen med Stripe
}

export interface StripeProductLinks {
  package50Url?: string; // 50 NOK (50 poeng)
  package100Url?: string; // 100 NOK (100 poeng)
  package250Url?: string; // 250 NOK (250 poeng)
  package500Url?: string; // 500 NOK (500 poeng)
  giftCardCustomUrl?: string; // Valgfritt gavekort
}

export interface ApiKeysConfig {
  ticketmasterApiKey: string;
  ticketmasterAffiliateId: string;
  ticketCoApiKey?: string;
  ticketCoPartnerId?: string;
  stripePublishableKey: string;
  stripeProductLinks: StripeProductLinks;
  openWeatherApiKey: string;
  geminiApiKey: string;
  solCommercialLicenseKey: string; // Nøkkel for å videreselge appen som en hvit-merket SaaS
}

export const DEFAULT_API_KEYS: ApiKeysConfig = {
  ticketmasterApiKey: 'TM_DEMO_PARTNER_KEY_2027',
  ticketmasterAffiliateId: 'sol_alexander_partner_no',
  ticketCoApiKey: 'TC_PARTNER_KEY_NORWAY_2027',
  ticketCoPartnerId: 'sol_uteliv_bergen',
  stripePublishableKey: 'pk_live_sol_uteliv_production',
  stripeProductLinks: {
    package50Url: 'https://buy.stripe.com/28E9AMdSX5JX12Xav25wI0k',
    package100Url: 'https://buy.stripe.com/bJefZa5mr1tH9zt6eM5wI0l',
    package250Url: 'https://buy.stripe.com/14AfZag153BPaDx1Yw5wI0m',
    package500Url: 'https://buy.stripe.com/eVqaEQeX1dcpeTN1Yw5wI0n',
    giftCardCustomUrl: 'https://buy.stripe.com/aFa9AM7uz1tH9zt46E5wI0o',
  },
  openWeatherApiKey: '',
  geminiApiKey: '',
  solCommercialLicenseKey: 'SOL-PRO-ENTERPRISE-UNLIMITED-2027',
};

const API_KEYS_STORAGE_KEY = 'sol_uteliv_api_keys_v1';

export function getStoredApiKeys(): ApiKeysConfig {
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (!raw) return DEFAULT_API_KEYS;
    const parsed = JSON.parse(raw);
    const parsedLinks = parsed.stripeProductLinks || {};
    return {
      ...DEFAULT_API_KEYS,
      ...parsed,
      stripeProductLinks: {
        package50Url: parsedLinks.package50Url || DEFAULT_API_KEYS.stripeProductLinks.package50Url,
        package100Url: parsedLinks.package100Url || DEFAULT_API_KEYS.stripeProductLinks.package100Url,
        package250Url: parsedLinks.package250Url || DEFAULT_API_KEYS.stripeProductLinks.package250Url,
        package500Url: parsedLinks.package500Url || DEFAULT_API_KEYS.stripeProductLinks.package500Url,
        giftCardCustomUrl: parsedLinks.giftCardCustomUrl || DEFAULT_API_KEYS.stripeProductLinks.giftCardCustomUrl,
      },
    };
  } catch {
    return DEFAULT_API_KEYS;
  }
}

export function saveStoredApiKeys(keys: ApiKeysConfig): void {
  try {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

/**
 * Henter Stripe-produktlenke for en bestemt pakke
 */
export function getStripeLinkForPackage(packageId: string): string | null {
  const keys = getStoredApiKeys();
  const links = keys.stripeProductLinks;
  if (!links) return null;

  switch (packageId) {
    case 'topup-starter':
      return links.package50Url?.trim() || null;
    case 'topup-family':
      return links.package100Url?.trim() || null;
    case 'topup-sponsor':
      return links.package250Url?.trim() || null;
    case 'topup-season':
      return links.package500Url?.trim() || null;
    default:
      return links.giftCardCustomUrl?.trim() || null;
  }
}

/**
 * Beregner forventet provisjon per salg
 */
export function calculateCommissionNok(priceNok: number, commissionPercent: number): number {
  return Math.round((priceNok * commissionPercent) / 100);
}

/**
 * Bygger affiliate-lenke med partner-ID
 */
export function buildAffiliateUrl(baseUrl: string, partnerId: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}ref=sol_app&aff_id=${encodeURIComponent(partnerId)}`;
}
