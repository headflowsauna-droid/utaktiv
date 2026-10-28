import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const HERO_IMG = 'https://images.unsplash.com/photo-1531214159280-079b95d26139?w=1200&q=90';

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onFinish, 600); // Glir mykt ut
    }, 1400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Full-screen norsk natur-bakgrunn */}
      <img
        src={HERO_IMG}
        alt="Norsk natur"
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      />
      {/* Mørk gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />

      {/* Sentrert innhold */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="mb-5 relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-orange-500/30 blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-black/40 border border-white/20 backdrop-blur-sm flex items-center justify-center glow-orange overflow-hidden shadow-2xl">
            <img
              src="/utaktiv-logo.png"
              alt="Utaktiv Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="font-serif-display text-5xl font-black tracking-tight text-white drop-shadow-lg">
          Utaktiv
        </h1>
        <p className="text-sm text-white/70 mt-2 tracking-widest uppercase font-light">
          Utelivs &amp; Opplevelses-Concierge
        </p>

        <div className="mt-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          <span className="text-xs text-white/60 tracking-wider">Henter solbane og kulturdata...</span>
        </div>
      </div>
    </div>
  );
};
