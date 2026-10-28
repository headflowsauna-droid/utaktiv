import { describe, expect, it } from 'vitest';
import {
  resolveImage,
  getActivityHeroUrl,
  getActivityThumbUrl,
  getActivityAltText,
} from '../engine/imageResolver';
import { PLACE_IMAGES } from '../data/placeImages';
import { TRANSLATIONS, t } from '../engine/i18n';
import { getStripeLinkForPackage, DEFAULT_API_KEYS } from '../engine/tickets';
import { createGiftCard, redeemGiftCard, GIFT_THEMES } from '../engine/gifting';
import {
  TurKurv,
  encodeTurSharePayload,
  decodeTurSharePayload,
  buildTurShareUrl,
  isTurKurv,
} from '../hooks/useTurKurv';
import { buildCommitmentQuote } from '../engine/plakatRenderer';
import { pushTurKurv, pullTurKurv } from '../engine/cloudSync';

describe('Editorial Image Resolver & Place Images', () => {
  it('har kuraterte høykvalitetsbilder for alle 6 norske regionbyer', () => {
    const cities = new Set(PLACE_IMAGES.map(p => p.city));
    expect(cities.has('bergen')).toBe(true);
    expect(cities.has('oslo')).toBe(true);
    expect(cities.has('stavanger')).toBe(true);
    expect(cities.has('trondheim')).toBe(true);
    expect(cities.has('bodo')).toBe(true);
    expect(cities.has('kristiansand')).toBe(true);

    for (const img of PLACE_IMAGES) {
      expect(img.heroUrl.startsWith('https://')).toBe(true);
      expect(img.thumbUrl.startsWith('https://')).toBe(true);
      expect(img.altText.length).toBeGreaterThan(10);
    }
  });

  it('matcher eksakt og delvis stedsnavn samt by-fallback i imageResolver', () => {
    const floyen = resolveImage('Fløyen', 'Bergen');
    expect(floyen?.placeId).toBe('floyen-bergen');

    const partial = resolveImage('Skomakerdiket på Fløyen', 'Bergen');
    expect(partial?.placeId).toBe('floyen-bergen');

    const cityOnly = resolveImage('Ukjent Sted', 'Stavanger');
    expect(cityOnly?.city).toBe('stavanger');

    const explicitHero = getActivityHeroUrl('Fløyen', 'Bergen', 'https://example.com/custom.jpg');
    expect(explicitHero).toBe('https://example.com/custom.jpg');

    const resolvedThumb = getActivityThumbUrl('Frognerseteren', 'Oslo');
    expect(resolvedThumb).toContain('unsplash.com');

    const alt = getActivityAltText('Preikestolen', 'Stavanger');
    expect(alt).toContain('Preikestolen');
  });
});

describe('Språkkonsistens (Bokmål & Engelsk) og Stripe/Julegave-flyt', () => {
  it('har 100 % paritet mellom norske og engelske nøkler og rent bokmål', () => {
    const noKeys = Object.keys(TRANSLATIONS.no);
    const enKeys = Object.keys(TRANSLATIONS.en);
    expect(noKeys).toEqual(enKeys);
    expect(t('exploreNorwayTitle', 'no')).toBe('Norge fra topp til bunn');
  });

  it('returnerer gyldige Stripe-lenker for alle poengpakker og gavekort', () => {
    expect(getStripeLinkForPackage('topup-starter')).toBe(DEFAULT_API_KEYS.stripeProductLinks.package50Url);
    expect(getStripeLinkForPackage('topup-family')).toBe(DEFAULT_API_KEYS.stripeProductLinks.package100Url);
    expect(getStripeLinkForPackage('topup-sponsor')).toBe(DEFAULT_API_KEYS.stripeProductLinks.package250Url);
    expect(getStripeLinkForPackage('topup-season')).toBe(DEFAULT_API_KEYS.stripeProductLinks.package500Url);
    expect(getStripeLinkForPackage('custom-gift')).toBe(DEFAULT_API_KEYS.stripeProductLinks.giftCardCustomUrl);
  });

  it('oppretter og løser inn julegavekort fra Besteforeldre-oppropet 2026', async () => {
    expect(GIFT_THEMES.christmas).toBeDefined();
    expect(GIFT_THEMES.christmas.emoji).toBe('🎄');

    const created = await createGiftCard({
      type: 'activity',
      pointsAmount: 5500,
      nokValue: 500,
      activityId: 'christmas-aktiv',
      activityTitle: 'Aktiv Barndom (5 500 Luks-poeng Julegavekort)',
      senderName: 'Bestemor og Bestefar',
      recipientName: 'Oliver og Milla',
      recipientContact: 'Storgaten 1, 5003 Bergen',
      message: 'God jul!',
      theme: 'christmas',
      paymentMethod: 'vipps',
    });

    expect(created.success).toBe(true);
    expect(created.gift?.theme).toBe('christmas');

    const redeemed = redeemGiftCard(created.gift!.code, 'Oliver');
    expect(redeemed.success).toBe(true);
    expect(redeemed.gift?.isRedeemed).toBe(true);
  });
});

describe('Tur-kurv Deling, URL-koding, Sky-synk & Plakat-sitat', () => {
  const sampleKurv: TurKurv = {
    city: 'Bergen',
    createdAt: '2026-10-26T09:00:00.000Z',
    stops: [
      {
        activityId: 'act-floyen-hike',
        title: 'Soloppgang og utsikt på Fløyen',
        locationName: 'Fløistuen på Fløyen',
        scheduledTime: '14:30',
        preBooked: true,
        preBookingNote: '2x Skillingsbolle & kaffe',
      },
      {
        activityId: 'act-nordnes',
        title: 'Kveldsbad og fjordbadstue',
        locationName: 'Nordnes Sjøbad',
        scheduledTime: '17:00',
        preBooked: false,
      },
    ],
  };

  it('koder og dekoder en hel TurKurv med norske tegn (æøå) tapsfritt via URL', () => {
    const encoded = encodeTurSharePayload(sampleKurv, 'Emma Sørensen');
    expect(encoded.length).toBeGreaterThan(20);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');

    const decoded = decodeTurSharePayload(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.friendName).toBe('Emma Sørensen');
    expect(decoded?.kurv.city).toBe('Bergen');
    expect(decoded?.kurv.stops.length).toBe(2);
    expect(decoded?.kurv.stops[0].locationName).toBe('Fløistuen på Fløyen');
    expect(decoded?.kurv.stops[0].preBookingNote).toBe('2x Skillingsbolle & kaffe');
    expect(decoded?.kurv.stops[0].preBooked).toBe(true);
    expect(isTurKurv(decoded?.kurv)).toBe(true);
  });

  it('bygger fullstendig delbar URL og genererer engasjerende forpliktelses-sitat', () => {
    const url = buildTurShareUrl(sampleKurv, 'Emma', 'https://utaktiv.no');
    expect(url.startsWith('https://utaktiv.no/?tur=')).toBe(true);

    const quote = buildCommitmentQuote(sampleKurv);
    expect(quote).toContain('2x Skillingsbolle & kaffe');
    expect(quote).toContain('Fløistuen på Fløyen');
    expect(quote).toContain('kl. 14:30');
  });

  it('håndterer utlogget/offline sky-synk for TurKurv uten å kaste feil', async () => {
    const pushRes = await pushTurKurv(sampleKurv, 'tur-test-1', 'Emma');
    expect(pushRes.ok).toBe(false);

    const pullRes = await pullTurKurv();
    expect(pullRes.ok).toBe(false);
  });
});
