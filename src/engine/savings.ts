/**
 * Reisesparing & Sol-Spleis motor for Utaktiv
 * 
 * Lar familier og vennegjenger planlegge fremtidige reiser, opprette dedikerte
 * reisesparekontoer, sette inn Luks-poeng eller penger, og invitere familie,
 * besteforeldre og venner til å spleise på turen via delingslenker.
 */

import { commitSpend } from './cloudSync';
import { POINTS_PER_NOK, appendWalletTransaction } from './wallet';
import { getUserPointsBalance } from './gamification';

export interface SavingContributor {
  id: string;
  name: string;
  role: string; // f.eks. "Mamma", "Bestefar", "Tante Gro"
  pointsContributed: number;
  nokValue: number;
  message?: string;
  contributedAt: string;
  avatarEmoji: string;
}

export interface TravelSavingGoal {
  id: string;
  title: string;
  destination: string;
  category: 'mountain' | 'coastal' | 'family_park' | 'camping' | 'festival' | 'swim_resort';
  targetAmountNok: number;
  targetPoints: number;
  currentAmountNok: number;
  currentPoints: number;
  targetDate: string; // YYYY-MM-DD
  imageUrl: string;
  description: string;
  creatorName: string;
  contributors: SavingContributor[];
  shareCode: string; // f.eks. "SOL-TUR-LOFOTEN-2027"
  isCompleted: boolean;
  createdAt: string;
}

const SAVINGS_STORAGE_KEY = 'sol_uteliv_travel_savings_v1';

export const INITIAL_SAVINGS_GOALS: TravelSavingGoal[] = [
  {
    id: 'save-lofoten-2027',
    title: 'Drømmetur til Lofoten & Reinebringen',
    destination: 'Lofoten, Nordland',
    category: 'mountain',
    targetAmountNok: 6000,
    targetPoints: 6000,
    currentAmountNok: 3750,
    currentPoints: 3750,
    targetDate: '2027-07-15',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    description: 'Fjelltur, midnattssol og teltliv i Reine og Henningsvær med hele familien.',
    creatorName: 'Alexander',
    contributors: [
      {
        id: 'c-1',
        name: 'Alexander',
        role: 'Far',
        pointsContributed: 2000,
        nokValue: 2000,
        message: 'Spart opp fra dagslyspoeng og månedlig avsetning!',
        contributedAt: '2026-10-12',
        avatarEmoji: '👨',
      },
      {
        id: 'c-2',
        name: 'Bestemor Torill',
        role: 'Besteforelder',
        pointsContributed: 1000,
        nokValue: 1000,
        message: 'Bursdagspenger til reisekassa! Gleder meg til å se bilder ❤️',
        contributedAt: '2026-10-15',
        avatarEmoji: '👵',
      },
      {
        id: 'c-3',
        name: 'Oliver & Milla',
        role: 'Barna',
        pointsContributed: 750,
        nokValue: 750,
        message: 'Fra Sol Junior nabolagsoppgaver og hundelufting!',
        contributedAt: '2026-10-18',
        avatarEmoji: '👦',
      },
    ],
    shareCode: 'SOL-TUR-LOFOTEN-77',
    isCompleted: false,
    createdAt: '2026-10-01',
  },
  {
    id: 'save-finse-dnt',
    title: 'Høstferie på Finsehytta (DNT) & Rallarvegen',
    destination: 'Finse / Hardangervidda',
    category: 'camping',
    targetAmountNok: 3500,
    targetPoints: 3500,
    currentAmountNok: 2100,
    currentPoints: 2100,
    targetDate: '2027-09-25',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    description: 'Togtur til Finse, sykling langs Rallarvegen og overnatting med tradisjonsmat på DNT-hytta.',
    creatorName: 'Alexander',
    contributors: [
      {
        id: 'c-finse-1',
        name: 'Alexander',
        role: 'Far',
        pointsContributed: 1500,
        nokValue: 1500,
        message: 'Felles familiestart!',
        contributedAt: '2026-10-05',
        avatarEmoji: '👨',
      },
      {
        id: 'c-finse-2',
        name: 'Onkel Lars',
        role: 'Sponsor & Onkel',
        pointsContributed: 600,
        nokValue: 600,
        message: 'Klart barna skal få oppleve Finse!',
        contributedAt: '2026-10-14',
        avatarEmoji: '🧔',
      },
    ],
    shareCode: 'SOL-TUR-FINSE-44',
    isCompleted: false,
    createdAt: '2026-10-05',
  },
];

let inMemorySavingsGoals: TravelSavingGoal[] = [...INITIAL_SAVINGS_GOALS];

export function getSavingGoals(): TravelSavingGoal[] {
  try {
    const raw = localStorage.getItem(SAVINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemorySavingsGoals = parsed;
        return inMemorySavingsGoals;
      }
    }
  } catch {
    // fallback
  }
  return inMemorySavingsGoals;
}

export function saveSavingGoals(goals: TravelSavingGoal[]): void {
  inMemorySavingsGoals = goals;
  try {
    localStorage.setItem(SAVINGS_STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // ignore
  }
}

export interface CreateGoalParams {
  title: string;
  destination: string;
  category: TravelSavingGoal['category'];
  targetAmountNok: number;
  targetDate: string;
  description: string;
  imageUrl?: string;
  creatorName: string;
  initialDepositPoints?: number;
}

export async function createSavingGoal(params: CreateGoalParams): Promise<{ success: boolean; goal?: TravelSavingGoal; error?: string }> {
  if (!params.title.trim()) return { success: false, error: 'Tittel på reisen er påkrevd.' };
  if (!params.destination.trim()) return { success: false, error: 'Reisemål/destinasjon er påkrevd.' };
  if (params.targetAmountNok <= 0) return { success: false, error: 'Målbeløp må være større enn 0 kr.' };

  const targetPoints = params.targetAmountNok * POINTS_PER_NOK;
  const initialPoints = Math.max(0, params.initialDepositPoints || 0);
  const initialNok = Math.floor(initialPoints / POINTS_PER_NOK);

  // Sjekk om brukeren har nok poeng til startinnskudd
  if (initialPoints > 0) {
    const spent = await commitSpend(
      initialPoints,
      `save-init-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    );
    if (!spent.ok) {
      return { success: false, error: `Du har kun ${getUserPointsBalance()} kjøpte poeng tilgjengelig for startinnskudd.` };
    }
    appendWalletTransaction({
      id: `tx-save-init-${Date.now()}`,
      type: 'send',
      points: -initialPoints,
      nokValue: initialNok,
      title: `Oppstart av reisesparekonto: ${params.title}`,
      description: `Innskudd til reise til ${params.destination}`,
      recipientOrSender: params.title,
      createdAt: new Date().toISOString(),
    });
  }

  const defaultImages: Record<TravelSavingGoal['category'], string> = {
    mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    coastal: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    family_park: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
    camping: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
    festival: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    swim_resort: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
  };

  const codeSlug = params.destination.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const shareCode = `SOL-SPLEIS-${codeSlug}-${Math.floor(100 + Math.random() * 900)}`;

  const newGoal: TravelSavingGoal = {
    id: `goal-${Date.now()}`,
    title: params.title.trim(),
    destination: params.destination.trim(),
    category: params.category,
    targetAmountNok: params.targetAmountNok,
    targetPoints,
    currentAmountNok: initialNok,
    currentPoints: initialPoints,
    targetDate: params.targetDate || '2027-08-01',
    imageUrl: params.imageUrl || defaultImages[params.category] || defaultImages.mountain,
    description: params.description.trim() || `Familietur og felles opplevelse til ${params.destination}.`,
    creatorName: params.creatorName || 'Alexander',
    contributors: initialPoints > 0 ? [
      {
        id: `c-init-${Date.now()}`,
        name: params.creatorName || 'Alexander',
        role: 'Oppretter & Familie',
        pointsContributed: initialPoints,
        nokValue: initialNok,
        message: 'Startinnskudd for reisen!',
        contributedAt: new Date().toISOString().split('T')[0],
        avatarEmoji: '🌟',
      }
    ] : [],
    shareCode,
    isCompleted: false,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const currentList = getSavingGoals();
  const updated = [newGoal, ...currentList];
  saveSavingGoals(updated);

  return { success: true, goal: newGoal };
}

/**
 * Legg til et innskudd (bidrag) til en reisesparekonto
 */
export async function contributeToGoal(
  goalId: string,
  contributorName: string,
  role: string,
  points: number,
  message?: string
): Promise<{ success: boolean; goal?: TravelSavingGoal; newBalance?: number; error?: string }> {
  if (points <= 0) return { success: false, error: 'Innskudd må være minst 1 Luks-poeng.' };
  
  const goals = getSavingGoals();
  const index = goals.findIndex(g => g.id === goalId);
  if (index === -1) return { success: false, error: 'Fant ikke reisesparekontoen.' };

  const spent = await commitSpend(
    points,
    `save-deposit-${goalId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  if (!spent.ok) {
    return { success: false, error: `Du har ${getUserPointsBalance()} kjøpte poeng tilgjengelig, men forsøkte å sette inn ${points} poeng.` };
  }

  const nokValue = Math.floor(points / POINTS_PER_NOK);
  const newBal = spent.balance;
  appendWalletTransaction({
    id: `tx-save-deposit-${Date.now()}`,
    type: 'send',
    points: -points,
    nokValue,
    title: `Innskudd på reisesparekonto: ${goals[index].title}`,
    description: message || `Bidrag fra ${contributorName} (${role})`,
    recipientOrSender: goals[index].title,
    createdAt: new Date().toISOString(),
  });

  const contributor: SavingContributor = {
    id: `c-${Date.now()}`,
    name: contributorName.trim() || 'Anonym støttespiller',
    role: role.trim() || 'Familie / Venn',
    pointsContributed: points,
    nokValue,
    message: message?.trim(),
    contributedAt: new Date().toISOString().split('T')[0],
    avatarEmoji: role.toLowerCase().includes('bestefar') || role.toLowerCase().includes('bestemor') ? '👵' : '🎁',
  };

  const updatedGoal: TravelSavingGoal = {
    ...goals[index],
    currentPoints: goals[index].currentPoints + points,
    currentAmountNok: goals[index].currentAmountNok + nokValue,
    contributors: [contributor, ...goals[index].contributors],
    isCompleted: (goals[index].currentPoints + points) >= goals[index].targetPoints,
  };

  goals[index] = updatedGoal;
  saveSavingGoals(goals);

  return { success: true, goal: updatedGoal, newBalance: newBal };
}

/**
 * Genererer en fiks ferdig delingstekst for SMS, Spond, WhatsApp eller familiechat
 */
export function generateSpleisShareText(goal: TravelSavingGoal): string {
  const percent = Math.min(100, Math.round((goal.currentPoints / goal.targetPoints) * 100));
  const remainingNok = Math.max(0, goal.targetAmountNok - goal.currentAmountNok);

  return `Hei! 🌲☀️ Vi sparer til familietur til ${goal.destination}!

🎯 Mål: ${goal.title} (${goal.targetAmountNok.toLocaleString('no-NO')} kr)
📊 Status: ${goal.currentAmountNok.toLocaleString('no-NO')} kr (${percent} % nådd - gjenstår ${remainingNok} kr)

Har du lyst til å bidra til reisekassa eller gi en bursdagsgave til opplevelsen?
Bruk Utaktiv eller spleiskoden: ${goal.shareCode}
Her kan du bidra med både Luks-poeng, Vipps eller kort:
https://utaktiv.no?spleis=${encodeURIComponent(goal.shareCode)}

Hilsen ${goal.creatorName} ❤️`;
}
