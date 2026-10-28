/**
 * Luks-lommebok (Luks Wallet) & Poengøkonomi-motor
 * 
 * Håndterer kjøp av poeng, P2P overføringer til familie og naboer,
 * betaling for aktiviteter og full transaksjonshistorikk (Ledger).
 * 
 * Verdinøkkel: 1 Luks-poeng = 1 NOK ved innløsning i billetter og opplevelser.
 */

import { commitSpend } from './cloudSync';
import { getUserPointsBalance } from './gamification';

export interface TopupPackage {
  id: string;
  name: string;
  priceNok: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  badge?: string;
  description: string;
  popular?: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'send' | 'receive' | 'activity_payment' | 'daylight_reward' | 'junior_reward' | 'gps_reward';
  points: number; // Positiv for inn, negativ for ut
  nokValue: number;
  title: string;
  description: string;
  recipientOrSender?: string;
  createdAt: string;
  referenceId?: string;
}

export interface QuickContact {
  id: string;
  name: string;
  role: string;
  avatarEmoji: string;
  phone: string;
}

export const POINTS_PER_NOK = 1;

export const TOPUP_PACKAGES: TopupPackage[] = [
  {
    id: 'topup-starter',
    name: 'Nabolags-Spire',
    priceNok: 100,
    basePoints: 100,
    bonusPoints: 0,
    totalPoints: 100,
    badge: '1:1 Krone',
    description: '100 poeng (verdi 100 kr). Perfekt for en nabotjeneste eller bolle og kaffe på tur.',
  },
  {
    id: 'topup-family',
    name: 'Aktiv Familiehelg',
    priceNok: 250,
    basePoints: 250,
    bonusPoints: 10,
    totalPoints: 260,
    badge: '+10 BONUS',
    popular: true,
    description: 'Gir 260 poeng (verdi 260 kr). Flott til fjordbadstue eller oppdrag til barna.',
  },
  {
    id: 'topup-sponsor',
    name: 'Storsponsor / Familiepakke',
    priceNok: 500,
    basePoints: 500,
    bonusPoints: 20,
    totalPoints: 520,
    badge: '+20 BONUS',
    description: '520 poeng (verdi 520 kr). Populær gave til klatrepark, teater og helgeturer.',
  },
  {
    id: 'topup-season',
    name: 'Besteforeldre & Sesongpott',
    priceNok: 1000,
    basePoints: 1000,
    bonusPoints: 50,
    totalPoints: 1050,
    badge: '1 050 POENG',
    description: 'Kjøp for 1 000 kr og få 1 050 poeng (verdi 1 050 kr, 1 poeng = 1 kr). Dekker store familiepass!',
  },
];

export const QUICK_CONTACTS: QuickContact[] = [
  {
    id: 'cont-oliver',
    name: 'Oliver (9 år)',
    role: 'Sønn / Sol Junior',
    avatarEmoji: '👦',
    phone: '+47 912 34 567',
  },
  {
    id: 'cont-milla',
    name: 'Milla (6 år)',
    role: 'Datter / Sol Junior',
    avatarEmoji: '👧',
    phone: '+47 923 45 678',
  },
  {
    id: 'cont-kari',
    name: 'Nabo Kari (Minde)',
    role: 'Nabo & Hageeier',
    avatarEmoji: '🏡',
    phone: '+47 934 56 789',
  },
  {
    id: 'cont-bestemor',
    name: 'Bestemor Torill',
    role: 'Sponsor & Familie',
    avatarEmoji: '👵',
    phone: '+47 945 67 890',
  },
  {
    id: 'cont-klasse2b',
    name: 'Klassekasse 2B Nordnes',
    role: 'Skole & Klassekontakt',
    avatarEmoji: '🎒',
    phone: '+47 956 78 901',
  },
];

const STORAGE_KEY_LEDGER = 'sol_uteliv_wallet_ledger_v1';

export const INITIAL_LEDGER: WalletTransaction[] = [
  {
    id: 'tx-welcome-001',
    type: 'topup',
    points: 100,
    nokValue: 100,
    title: 'Velkomstbonus til familien',
    description: 'Oppstartsgave fra Utaktiv for opprettelse av familieprofil (1 poeng = 1 kr).',
    createdAt: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString(),
  },
  {
    id: 'tx-daylight-002',
    type: 'daylight_reward',
    points: 20,
    nokValue: 20,
    title: 'Dagslystur i Nordnesparken (med turpost)',
    description: 'Sensor registrerte 45 min med 42 000 luks + delt turpost fra turfølget.',
    createdAt: new Date(Date.now() - 3600 * 24 * 1 * 1000).toISOString(),
  },
];

let _memoryLedger: WalletTransaction[] = [...INITIAL_LEDGER];

/**
 * Henter alle transaksjoner i lommeboka
 */
export function getWalletLedger(): WalletTransaction[] {
  if (typeof window === 'undefined') return _memoryLedger;
  const val = localStorage.getItem(STORAGE_KEY_LEDGER);
  if (!val) {
    localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(INITIAL_LEDGER));
    return INITIAL_LEDGER;
  }
  try {
    return JSON.parse(val);
  } catch {
    return INITIAL_LEDGER;
  }
}

/**
 * Lagrer en ny transaksjon i ledger
 */
export function appendWalletTransaction(tx: WalletTransaction): WalletTransaction[] {
  const current = getWalletLedger();
  const updated = [tx, ...current];
  _memoryLedger = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(updated));
  }
  return updated;
}

/**
 * Kjøp en poengpakke med Vipps eller Kort
 */
export function topupWallet(
  packageId: string,
  _paymentMethod: 'vipps' | 'card'
): { success: boolean; packageItem?: TopupPackage; newBalance: number; error?: string } {
  const pkg = TOPUP_PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    return { success: false, newBalance: getUserPointsBalance(), error: 'Ugyldig pakke valgt.' };
  }

  return {
    success: false,
    packageItem: pkg,
    newBalance: getUserPointsBalance(),
    error: 'Kjøpte poeng kommer bare fra en bekreftet Stripe-betaling.',
  };
}

/**
 * P2P overføring av poeng til en annen person/konto
 */
export function transferPoints(
  _recipientName: string,
  _recipientPhone: string,
  points: number,
  _note?: string
): { success: boolean; newBalance: number; error?: string } {
  if (points <= 0) {
    return { success: false, newBalance: getUserPointsBalance(), error: 'Poengsum må være større enn 0.' };
  }

  return {
    success: false,
    newBalance: getUserPointsBalance(),
    error: 'Poeng kan ikke sendes mellom personer.',
  };
}

/**
 * Betaling for en aktivitet/billett med Luks-poeng
 */
export async function payWithPoints(
  activityTitle: string,
  pointsToUse: number,
  totalPriceNok: number,
  activityId?: string
): Promise<{
  success: boolean;
  pointsUsed: number;
  discountNok: number;
  remainingNok: number;
  newBalance: number;
  error?: string;
}> {
  const currentBalance = getUserPointsBalance();
  if (pointsToUse <= 0) {
    return {
      success: true,
      pointsUsed: 0,
      discountNok: 0,
      remainingNok: totalPriceNok,
      newBalance: currentBalance,
    };
  }

  const discountNok = Math.min(totalPriceNok, Math.floor(pointsToUse / POINTS_PER_NOK));
  const actualPointsUsed = discountNok * POINTS_PER_NOK;
  const remainingNok = Math.max(0, totalPriceNok - discountNok);

  if (actualPointsUsed <= 0) {
    return {
      success: true,
      pointsUsed: 0,
      discountNok: 0,
      remainingNok: totalPriceNok,
      newBalance: currentBalance,
    };
  }

  const spent = await commitSpend(
    actualPointsUsed,
    `pay-${activityId ?? 'aktivitet'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  if (!spent.ok) {
    return {
      success: false,
      pointsUsed: 0,
      discountNok: 0,
      remainingNok: totalPriceNok,
      newBalance: spent.balance,
      error: spent.error || `Du har ${spent.balance} kjøpte poeng.`,
    };
  }
  const newBalance = spent.balance;

  // Logg transaksjon
  const tx: WalletTransaction = {
    id: `tx-pay-${Date.now()}`,
    type: 'activity_payment',
    points: -actualPointsUsed,
    nokValue: discountNok,
    title: `Billettkjøp: ${activityTitle}`,
    description: `Brukt ${actualPointsUsed} poeng for ${discountNok} kr avslag. Resterende å betale: ${remainingNok} NOK.`,
    referenceId: activityId,
    createdAt: new Date().toISOString(),
  };
  appendWalletTransaction(tx);

  return {
    success: true,
    pointsUsed: actualPointsUsed,
    discountNok,
    remainingNok,
    newBalance,
  };
}
