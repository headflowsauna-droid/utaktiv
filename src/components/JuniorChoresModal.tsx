import React, { useState } from 'react';
import { 
  getJuniorChores, 
  JuniorChore, 
  completeJuniorChore, 
  calculateLuxPoints,
  DEFAULT_FAMILY_GOAL,
  getEarnedPointsBalance
} from '../engine/gamification';
import { grantEarned } from '../engine/cloudSync';
import { SolarStatus } from '../engine/solar';
import { 
  X, 
  HeartHandshake, 
  Check, 
  Sun, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Camera, 
  Trophy,
  Users
} from 'lucide-react';

interface JuniorChoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  solar: SolarStatus;
  onPointsUpdated: (newBalance: number) => void;
}

export const JuniorChoresModal: React.FC<JuniorChoresModalProps> = ({
  isOpen,
  onClose,
  solar,
  onPointsUpdated,
}) => {
  const [chores, setChores] = useState<JuniorChore[]>(getJuniorChores());
  const [activeChore, setActiveChore] = useState<JuniorChore | null>(null);
  const [celebration, setCelebration] = useState<{ choreTitle: string; points: number } | null>(null);

  if (!isOpen) return null;

  const currentBalance = getEarnedPointsBalance();
  const goal = DEFAULT_FAMILY_GOAL;
  const progressPercent = Math.min(100, Math.round((currentBalance / goal.targetPoints) * 100));
  const pointsRemaining = Math.max(0, goal.targetPoints - currentBalance);

  const handleStartChore = (chore: JuniorChore) => {
    setActiveChore(chore);
  };

  const handleCompleteChore = async (chore: JuniorChore) => {
    const luxBonus = calculateLuxPoints(
      Math.max(10000, solar.actualEstimatedLux),
      chore.estimatedMinutes,
      solar.uvIndex
    );

    const res = completeJuniorChore(chore.id, luxBonus);
    if (!res.success) return;
    const granted = await grantEarned({
      points: luxBonus,
      reason: 'chore',
      idempotencyKey: `chore-${chore.id}`,
    });
    setChores(res.updatedChores);
    onPointsUpdated(granted.balance);
    setActiveChore(null);
    setCelebration({
      choreTitle: chore.title,
      points: granted.applied,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Sol Junior — Nabohjelp & Opplevelsespoeng
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FAMILIEPOTT
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Familieoppgaver på denne kontoen gir opptjente poeng med dags tak. De kan ikke betale billetter.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Familiens Felles Opplevelsesmål (Progress Bar) */}
        <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-orange-950/30 border-b border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="text-base">{goal.emoji}</span>
              <span>Familiemål: {goal.title}</span>
            </div>
            <span className="font-mono font-bold text-emerald-400">
              {currentBalance.toLocaleString('no-NO')} / {goal.targetPoints.toLocaleString('no-NO')} poeng ({progressPercent}%)
            </span>
          </div>

          {/* Fremdriftslinje */}
          <div className="w-full h-3 bg-zinc-800/80 rounded-full overflow-hidden p-0.5 border border-zinc-700/60">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Milla og Oliver samler aktivitetspoeng sammen</span>
            <span className="text-amber-300 font-semibold font-mono">
              {pointsRemaining > 0 
                ? `Kun ${pointsRemaining.toLocaleString('no-NO')} poeng igjen til familieturen!` 
                : 'Målet er nådd! Løs inn familiepasset i Sol-Børsen 🎉'}
            </span>
          </div>
        </div>

        {/* Sikkerhets- og UV-banner */}
        <div className="px-6 py-2.5 bg-zinc-950 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>BankID-verifiserte naboer innen 300m • Foreldregodkjenning</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-300 font-mono font-semibold">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>UV-multiplikator akkurat nå: {(1 + Math.max(0, solar.uvIndex) * 0.25).toFixed(1)}x solbonus</span>
          </div>
        </div>

        {/* Feiring / Gratulasjon etter fullført oppdrag */}
        {celebration && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                Oppdrag Godkjent! Opplevelsespoeng overført! 🎉
              </h4>
              <button 
                onClick={() => setCelebration(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Lukk
              </button>
            </div>
            <p className="text-xs text-zinc-300">
              Du fullførte <strong>{celebration.choreTitle}</strong>. 
              Naboens sponsede opplevelsespoeng og dagslyssensorens solbonus er lagt til i <strong>Familiens Felles Opplevelsespott</strong>!
            </p>
            <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>+{celebration.points.toLocaleString('no-NO')} Opplevelsespoeng lagt til familiepotten!</span>
            </div>
          </div>
        )}

        {/* Oppdragsliste */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {chores.map(chore => {
            const isCompleted = chore.isCompleted;
            const estimatedLuxBonus = calculateLuxPoints(
              Math.max(10000, solar.actualEstimatedLux),
              chore.estimatedMinutes,
              solar.uvIndex
            );
            const totalChorePoints = (chore.activityPoints || 1000) + estimatedLuxBonus;

            return (
              <div
                key={chore.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 opacity-75'
                    : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{chore.title}</h4>
                    {isCompleted ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-zinc-950 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Fullført & Poeng lagt til
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-400" />
                        +{totalChorePoints.toLocaleString('no-NO')} poeng til familiepotten
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{chore.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 pt-1">
                    <span className="flex items-center gap-1 text-zinc-300 font-medium">
                      <MapPin className="w-3 h-3 text-orange-400" />
                      {chore.neighborName} ({chore.distanceMeters}m unna)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      ~{chore.estimatedMinutes} min
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <span>Nabo sponser {chore.activityPoints}p</span>
                      <span>+</span>
                      <span className="text-amber-400">{estimatedLuxBonus}p solbonus</span>
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
                  {isCompleted ? (
                    <span className="text-xs font-mono text-emerald-400 font-semibold px-3 py-2 bg-zinc-900 rounded-xl">
                      I familiepotten ✓
                    </span>
                  ) : activeChore?.id === chore.id ? (
                    <button
                      onClick={() => handleCompleteChore(chore)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 animate-pulse"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Godkjenn & Hent poeng</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartChore(chore)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Start i dagslys</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
          <Users className="w-3.5 h-3.5 text-orange-400" />
          <span>Barna samler opplevelsespoeng for fellesskapet • Naboene sponser barnas fysiske utetid</span>
        </div>
      </div>
    </div>
  );
};
