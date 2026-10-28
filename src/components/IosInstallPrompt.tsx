import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export const IosInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Sjekk om enheten er iOS (iPhone / iPad)
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    
    // Sjekk om appen allerede kjører i standalone fullskjerm-modus
    const isInStandaloneMode = 
      ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Sjekk om brukeren tidligere har lukket varselet
    const hasDismissed = localStorage.getItem('utaktiv_ios_prompt_dismissed');

    if (isIos && !isInStandaloneMode && !hasDismissed) {
      // Vis prompten etter et lite sekund for god opplevelse
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('utaktiv_ios_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 max-w-md mx-auto animate-in fade-in slide-in-from-bottom duration-300">
      <div className="p-4 rounded-2xl bg-zinc-900/95 border border-amber-500/40 text-white shadow-2xl backdrop-blur-md relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Lukk"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-xl shrink-0 shadow-md">
            ☀️
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Installer Utaktiv på din iPhone</span>
            </h4>
            <p className="text-[11px] text-zinc-300 mt-1 leading-snug">
              Få appen i ekte fullskjerm på hjemskjermen din med to enkle trykk:
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-around text-[11px] text-zinc-300">
          <div className="flex items-center gap-1.5 font-semibold text-orange-400">
            <span>1. Trykk Del</span>
            <Share className="w-3.5 h-3.5" />
          </div>
          <span className="text-zinc-600">→</span>
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <span>2. «Legg til på Hjem-skjerm»</span>
            <PlusSquare className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
