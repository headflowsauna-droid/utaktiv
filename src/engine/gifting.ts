/**
 * Utaktiv — Gavemotor for Poeng & Aktiviteter (Gifting Engine)
 * 
 * Gjør det mulig å gi opplevelsespoeng og spesifikke aktiviteter i gave
 * med personlig hilsen, gavekort-tema, deling på SMS/Vipps og innløsning.
 */

import { commitSpend } from './cloudSync';
import { getUserPointsBalance } from './gamification';
import { appendWalletTransaction, POINTS_PER_NOK } from './wallet';

export type GiftTheme = 'birthday' | 'nature' | 'family' | 'thankyou' | 'concert' | 'christmas';

export interface GiftCard {
  id: string;
  code: string; // e.g. SOL-GAVE-JASON-4821
  type: 'points' | 'activity';
  pointsAmount?: number;
  nokValue: number;
  activityId?: string;
  activityTitle?: string;
  senderName: string;
  recipientName: string;
  recipientContact: string; // Tlf eller e-post
  message: string;
  theme: GiftTheme;
  paymentMethod: 'vipps' | 'card' | 'points';
  createdAt: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  redeemedBy?: string;
}

const STORAGE_KEY_GIFTS = 'sol_uteliv_gifts_v1';

export const GIFT_THEMES: Record<GiftTheme, { name: string; emoji: string; gradient: string; textColor: string }> = {
  birthday: {
    name: 'Bursdag & Feiring',
    emoji: '🎂',
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    textColor: 'text-amber-300',
  },
  nature: {
    name: 'Fjell & Friluft',
    emoji: '🏔️',
    gradient: 'from-emerald-600 via-teal-700 to-zinc-900',
    textColor: 'text-emerald-300',
  },
  family: {
    name: 'Familietid & Kos',
    emoji: '🌲',
    gradient: 'from-orange-600 via-amber-700 to-stone-900',
    textColor: 'text-orange-300',
  },
  thankyou: {
    name: 'Tusen Takk & Nabohjelp',
    emoji: '💛',
    gradient: 'from-yellow-500 via-amber-600 to-zinc-900',
    textColor: 'text-yellow-300',
  },
  concert: {
    name: 'Musikk & Festival',
    emoji: '🎸',
    gradient: 'from-purple-600 via-indigo-700 to-zinc-950',
    textColor: 'text-purple-300',
  },
  christmas: {
    name: 'Julegave & Dagslysminner',
    emoji: '🎄',
    gradient: 'from-[#c2410c] via-[#E8622C] to-[#141311]',
    textColor: 'text-amber-200',
  },
};

export const INITIAL_GIFTS: GiftCard[] = [
  {
    id: 'gift-sample-001',
    code: 'SOL-GAVE-KLATRE-8821',
    type: 'activity',
    nokValue: 350,
    activityId: 'act-hoytoglavt',
    activityTitle: 'Familiedag i Høyt & Lavt Klatrepark Nesttun',
    senderName: 'Bestemor Torill',
    recipientName: 'Oliver & Milla Robertsen',
    recipientContact: '+47 912 34 567',
    message: 'Gleder meg til å se dere klatre i tretoppene! Glad i dere! Hilsen Bestemor ❤️',
    theme: 'family',
    paymentMethod: 'vipps',
    createdAt: new Date(Date.now() - 3600 * 24 * 2 * 1000).toISOString(),
    isRedeemed: false,
  },
];

let _memoryGifts: GiftCard[] = [...INITIAL_GIFTS];

/**
 * Henter alle lagrede gavekort
 */
export function getGiftCards(): GiftCard[] {
  if (typeof window === 'undefined') return _memoryGifts;
  const val = localStorage.getItem(STORAGE_KEY_GIFTS);
  if (!val) {
    localStorage.setItem(STORAGE_KEY_GIFTS, JSON.stringify(INITIAL_GIFTS));
    return INITIAL_GIFTS;
  }
  try {
    return JSON.parse(val);
  } catch {
    return INITIAL_GIFTS;
  }
}

/**
 * Lagrer et nytt gavekort og trekker eventuelt poeng fra lommeboka
 */
export async function createGiftCard(params: {
  type: 'points' | 'activity';
  pointsAmount?: number;
  nokValue: number;
  activityId?: string;
  activityTitle?: string;
  senderName: string;
  recipientName: string;
  recipientContact: string;
  message: string;
  theme: GiftTheme;
  paymentMethod: 'vipps' | 'card' | 'points';
}): Promise<{ success: boolean; gift?: GiftCard; error?: string }> {
  if (!params.senderName.trim()) return { success: false, error: 'Avsendernavn er påkrevd.' };
  if (!params.recipientName.trim()) return { success: false, error: 'Mottakernavn er påkrevd.' };
  if (params.nokValue <= 0) return { success: false, error: 'Gavebeløpet må være større enn 0.' };
  if (params.type === 'points' && params.paymentMethod === 'points') {
    return { success: false, error: 'Du kan ikke kjøpe et poeng-gavekort med poeng. Kjøpte poeng kan ikke gis bort. Betal med Vipps eller bankkort.' };
  }

  if (params.paymentMethod === 'points') {
    const pointsRequired = params.nokValue * POINTS_PER_NOK;
    const spent = await commitSpend(
      pointsRequired,
      `gift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    );
    if (!spent.ok) {
      return {
        success: false,
        error: spent.error || `Du har ${getUserPointsBalance()} kjøpte poeng, men gaven koster ${pointsRequired} poeng.`,
      };
    }

    // Før i ledger
    appendWalletTransaction({
      id: `tx-gift-${Date.now()}`,
      type: 'send',
      points: -pointsRequired,
      nokValue: params.nokValue,
      title: `Gavekort kjøpt: ${params.activityTitle || `${params.pointsAmount} Luks-poeng`}`,
      description: `Sendt til ${params.recipientName} (${params.recipientContact}). Personlig hilsen: "${params.message}"`,
      recipientOrSender: params.recipientName,
      createdAt: new Date().toISOString(),
    });
  }

  // Generer unik kode
  const prefix = params.type === 'activity' 
    ? (params.activityTitle ? params.activityTitle.substring(0, 5).toUpperCase().replace(/[^A-Z]/g, '') : 'AKT')
    : 'POENG';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const code = `SOL-GAVE-${prefix}-${randomSuffix}`;

  const newGift: GiftCard = {
    id: `gift-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    code,
    type: params.type,
    pointsAmount: params.pointsAmount,
    nokValue: params.nokValue,
    activityId: params.activityId,
    activityTitle: params.activityTitle,
    senderName: params.senderName,
    recipientName: params.recipientName,
    recipientContact: params.recipientContact,
    message: params.message,
    theme: params.theme,
    paymentMethod: params.paymentMethod,
    createdAt: new Date().toISOString(),
    isRedeemed: false,
  };

  const currentGifts = getGiftCards();
  const updated = [newGift, ...currentGifts];
  _memoryGifts = updated;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_GIFTS, JSON.stringify(updated));
  }

  return { success: true, gift: newGift };
}

/**
 * Løser inn et gavekort med kode
 */
export function redeemGiftCard(
  code: string,
  redeemedByName: string
): { success: boolean; gift?: GiftCard; pointsCredited?: number; error?: string } {
  const cleanCode = code.trim().toUpperCase();
  const gifts = getGiftCards();
  const giftIndex = gifts.findIndex(g => g.code.toUpperCase() === cleanCode);

  if (giftIndex === -1) {
    return { success: false, error: 'Ugyldig gavekortkode. Sjekk koden og prøv igjen.' };
  }

  const targetGift = gifts[giftIndex];
  if (targetGift.isRedeemed) {
    return { 
      success: false, 
      error: `Dette gavekortet ble allerede løst inn ${new Date(targetGift.redeemedAt || '').toLocaleDateString('no-NO')}.` 
    };
  }

  if (targetGift.type === 'points') {
    return { success: false, error: 'Poenggaver kan ikke løses inn som saldo.' };
  }

  const pointsCredited = 0;

  const updatedGift: GiftCard = {
    ...targetGift,
    isRedeemed: true,
    redeemedAt: new Date().toISOString(),
    redeemedBy: redeemedByName,
  };

  gifts[giftIndex] = updatedGift;
  _memoryGifts = [...gifts];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_GIFTS, JSON.stringify(gifts));
  }

  return { 
    success: true, 
    gift: updatedGift, 
    pointsCredited 
  };
}
