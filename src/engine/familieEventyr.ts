/**
 * Utaktiv Familieeventyr Motor
 * Samarbeidsspill der barn (fra 5 år) og voksne må samarbeide for å løse mysterier.
 *
 * Pedagogisk kjerneprinsipp:
 * - Barnet har unik informasjon som den voksne mangler.
 * - Den voksne har logisk/tekstlig struktur, men kan ikke løse gåten alene.
 * - Familien vinner eller lærer sammen. Ingen konkurranse innad i familien.
 */

export interface MissionOption {
  id: string;
  label: string;
  icon: string;
  isCorrect: boolean;
}

export interface AdventureMission {
  step: 1 | 2 | 3;
  title: string;
  roleResponsible: 'child' | 'adult' | 'together';
  roleName: string;
  tagline: string;
  instruction: string;
  pedagogicalNote: string;
  options?: MissionOption[];
  requiresChildSecret?: boolean;
}

export interface FamilyAdventure {
  id: string;
  title: string;
  tagline: string;
  locationName: string;
  targetAge: string;
  estimatedMinutes: number;
  storyIntro: string;
  storyOutro: string;
  missions: AdventureMission[];
  reward: {
    points: number;
    fragmentName: string;
    fragmentIcon: string;
    familyCertificateTitle: string;
  };
}

export interface AdventureProgress {
  adventureId: string;
  currentStep: 1 | 2 | 3;
  childSecretFound?: string;
  adultLogicSolved?: boolean;
  isCompleted: boolean;
  completedAt?: string;
}

const STORAGE_KEY_PREFIX = 'utaktiv_familie_';

/**
 * Eventyr 1: «Soljakten: Familien som reddet lyset»
 * Optimalisert for Fløyen, Byfjellene, parker eller stue/hage.
 */
export const SOLJAKTEN_EVENTYR: FamilyAdventure = {
  id: 'soljakten_reddet_lyset',
  title: 'Soljakten: Familien som reddet lyset',
  tagline: 'Mysteriet der femåringen er familiens helt',
  locationName: 'Byfjellene, skogssti eller lokalpark',
  targetAge: 'Fra 4–8 år sammen med voksne',
  estimatedMinutes: 12,
  storyIntro:
    'Den urgamle Solkrystallen over fjellet har mistet gløden fordi menneskene har sittet for mye foran mørke skjermer. Solvokteren har delt nøkkelen i to hemmeligheter: Én som bare et skarpt barneøye kan oppdage, og én som bare den voksne kan tolke. Bare sammen kan dere vekke krystallen til live!',
  storyOutro:
    'Solkrystallen gløder med et blendende gulllys! Takket være Lys-speiderens skarpe blikk og Kart-leserens logikk er det første lysfragmentet berget. Dere har bevist at familien er sterkest når dere hjelper hverandre!',
  reward: {
    points: 15,
    fragmentName: 'Grynings-fragmentet',
    fragmentIcon: '✨',
    familyCertificateTitle: 'Mestere i Felles Dagslysmestring'
  },
  missions: [
    {
      step: 1,
      title: 'Oppdrag 1: Lys-speiderens hemmelighet',
      roleResponsible: 'child',
      roleName: 'Lys-speideren (Barnet)',
      tagline: 'Pappa må lukke øynene – nå er det barnet som må finne hemmeligheten!',
      instruction:
        'Se nøye rundt deg i terrenget eller på bildene under. Solvokteren har gjemt den første koden i et spesielt natursymbol. Hvilket symbol har nøyaktig 3 spisser og kaster gyllent solskinn?',
      pedagogicalNote:
        'Barnet trenes i formgjenkjenning og visuell observasjon. Barnet sitter her på hemmeligheten som den voksne vil trenge i neste steg.',
      options: [
        { id: 'eikeblad', label: 'Eikebladet med 3 spisser', icon: '🍃', isCorrect: true },
        { id: 'sopp', label: 'Den prikkete trollsoppen', icon: '🍄', isCorrect: false },
        { id: 'stein', label: 'Den glatte elvesteinen', icon: '🪨', isCorrect: false },
        { id: 'kongle', label: 'Den lukkede furukonglen', icon: '🌲', isCorrect: false }
      ]
    },
    {
      step: 2,
      title: 'Oppdrag 2: Kart-leserens gåte',
      roleResponsible: 'adult',
      roleName: 'Kart-leseren (Den voksne)',
      tagline: 'Pappa kan ikke løse dette alene – han MÅ spørre Lys-speideren!',
      instruction:
        'Vindporten har fire låser merket med naturkoder. Gåten sier: «Porten åpnes kun av nøkkelen som matcher formen Lys-speideren fant i skogen». Pappa, du vet ikke hvilket symbol barnet fant – spør barnet ditt nå!',
      pedagogicalNote:
        'Den voksne må be barnet om hjelp. Barnet inntar ekspertrollen og overfører kunnskapen sin for at teamet skal komme videre.',
      requiresChildSecret: true,
      options: [
        { id: 'nokkel_trekant', label: 'Nøkkel III: De 3 spissers løvport (Eikebladet)', icon: '🗝️', isCorrect: true },
        { id: 'nokkel_sirkel', label: 'Nøkkel I: Den runde bergtroll-ringen', icon: '🗝️', isCorrect: false },
        { id: 'nokkel_kryss', label: 'Nøkkel II: Furunålenes kryssmønster', icon: '🗝️', isCorrect: false },
        { id: 'nokkel_krone', label: 'Nøkkel IV: Sopphattenes tåkekrone', icon: '🗝️', isCorrect: false }
      ]
    },
    {
      step: 3,
      title: 'Oppdrag 3: Den Felles Sol-Fusjonen',
      roleResponsible: 'together',
      roleName: 'Hele Familien Sammen',
      tagline: 'Både barnet og den voksne må holde hånden på krystallen samtidig!',
      instruction:
        'For å vekke Solkrystallen må begge deltakere forene kreftene. Plasser to fingre på krystallen på skjermen samtidig, lukk øynene, pust inn den friske vestlandsluften og tell til tre sammen!',
      pedagogicalNote:
        'Fysisk synkronisering og samhold. Ingen vinner alene – seieren er 100 % delt.',
      options: [
        { id: 'fusjon_fullfort', label: 'Hold inne i 3 sekunder for å tenne Solkrystallen!', icon: '✨', isCorrect: true }
      ]
    }
  ]
};

/**
 * Henter lagret fremgang for et eventyr
 */
export function getAdventureProgress(adventureId: string): AdventureProgress {
  if (typeof localStorage === 'undefined') {
    return { adventureId, currentStep: 1, isCompleted: false };
  }
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${adventureId}`);
  if (!raw) {
    return { adventureId, currentStep: 1, isCompleted: false };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { adventureId, currentStep: 1, isCompleted: false };
  }
}

/**
 * Lagrer fremgang
 */
export function saveAdventureProgress(progress: AdventureProgress): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${progress.adventureId}`, JSON.stringify(progress));
}

/**
 * Tilbakestiller et eventyr for å spille på nytt
 */
export function resetAdventure(adventureId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${adventureId}`);
}

/**
 * Felles berøringsfusjon konfigurasjon (Krav R1)
 * Krever nøyaktig 3.0 sekunder (3000 ms) holdetid og minst 2 samtidige berøringspunkter (multitouch).
 */
export const TOUCH_FUSION_DURATION_MS = 3000;
export const TOUCH_FUSION_TICK_MS = 50;
export const TOUCH_FUSION_REQUIRED_TOUCHES = 2;

export function evaluateTouchFusion(
  elapsedMs: number,
  touchesCount: number = 2
): {
  isCompleted: boolean;
  progressPercent: number;
  hasMultiTouch: boolean;
} {
  const hasMultiTouch = touchesCount >= TOUCH_FUSION_REQUIRED_TOUCHES;
  const progressPercent = Math.min(100, (elapsedMs / TOUCH_FUSION_DURATION_MS) * 100);
  return {
    isCompleted: progressPercent >= 100 && hasMultiTouch,
    progressPercent: Math.round(progressPercent),
    hasMultiTouch,
  };
}

