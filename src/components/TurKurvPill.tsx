/**
 * TurKurvPill — Floating pill-knapp som vises i bunn-midten av skjermen
 * når tur-kurven har ≥1 stopp. Klikk åpner TurBuilderModal.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface TurKurvPillProps {
  count: number;
  onOpen: () => void;
}

export const TurKurvPill: React.FC<TurKurvPillProps> = ({ count, onOpen }) => {
  if (count < 1) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-full px-5 py-3 shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
      aria-label={`Din tur har ${count} stopp. Trykk for å åpne tur-byggeren.`}
    >
      {/* Antall-sirkel */}
      <span className="w-6 h-6 rounded-full bg-[#E8622C] flex items-center justify-center text-white text-xs font-black shrink-0">
        {count}
      </span>

      {/* Tekst */}
      <span className="font-bold text-sm whitespace-nowrap">
        Din tur · {count} {count === 1 ? 'stopp' : 'stopp'}
      </span>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
    </button>
  );
};
