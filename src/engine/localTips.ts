/**
 * Tips om bedrifter langs veien, nye lokale turer og ønsker som venter på at et menneske leser siden.
 * De legges ikke som bekreftede kartmerker eller besøkstall før siden er sjekket,
 * men vises i den lokale køen og under «Tipsede stopp langs veien» på ruten i denne nettleseren.
 */

export type TipKind = 'place' | 'trail' | 'wish';

export interface LocalTip {
  id: string;
  createdAt: string;
  city: string;
  trail: string;
  placeName: string;
  offer: string;
  link: string;
  kind: TipKind;
  status: 'pending';
}

const STORAGE_KEY = 'utaktiv_tips_pending';
const MAX_STORED_TIPS = 100;

const memoryTipsStore: LocalTip[] = [];

function cleanText(input: string, maxLen = 160): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLen);
}

function readAll(): LocalTip[] {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...memoryTipsStore];
      const parsed = JSON.parse(raw) as LocalTip[];
      if (!Array.isArray(parsed)) return [...memoryTipsStore];
      return parsed
        .filter(tip => tip && tip.status === 'pending' && typeof tip.placeName === 'string')
        .slice(0, MAX_STORED_TIPS);
    }
  } catch {
    // Fallback til minne
  }
  return [...memoryTipsStore];
}

function writeAll(tips: LocalTip[]): void {
  const capped = tips.slice(0, MAX_STORED_TIPS);
  memoryTipsStore.length = 0;
  memoryTipsStore.push(...capped);
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    }
  } catch {
    // Nettleseren kan nekte lagring. Skjemaet sier ifra.
  }
}

export function loadPendingTips(): LocalTip[] {
  return readAll();
}

export function savePendingTip(input: Omit<LocalTip, 'id' | 'createdAt' | 'status'>): LocalTip {
  const tip: LocalTip = {
    city: cleanText(input.city || 'Ukjent', 40) || 'Ukjent',
    trail: cleanText(input.trail, 120),
    placeName: cleanText(input.placeName, 100),
    offer: cleanText(input.offer, 160),
    link: cleanText(input.link, 200),
    kind: input.kind === 'wish' || input.kind === 'trail' ? input.kind : 'place',
    id: `tip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  const next = [tip, ...readAll()];
  writeAll(next);
  return tip;
}

export function clearPendingTipsForTests(): void {
  memoryTipsStore.length = 0;
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignorer
  }
}
