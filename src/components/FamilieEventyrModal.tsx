import React, { useState, useEffect } from 'react';
import {
  SOLJAKTEN_EVENTYR,
  getAdventureProgress,
  saveAdventureProgress,
  resetAdventure,
  MissionOption,
  TOUCH_FUSION_DURATION_MS
} from '../engine/familieEventyr';
import {
  ASKELADD_ITEMS,
  FAIRY_TALES_12_MONTHS,
  TALKING_ANIMALS,
  TalkingAnimal,
  AskeladdItem,
  getAskeladdInventory,
  collectAskeladdItem,
  getActiveMonthAdventure,
  getFamilyPotSummary,
  addTrailCoin,
  claimAdventureBonus
} from '../engine/askeladden';
import { X, RotateCcw, CheckCircle2, Volume2, Coins, Backpack, Calendar } from 'lucide-react';

interface FamilieEventyrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardPoints?: (points: number) => void;
  lang?: 'no' | 'en';
}

type TabType = 'eventyr' | 'askeladd' | 'dyr' | 'kalender';

export const FamilieEventyrModal: React.FC<FamilieEventyrModalProps> = ({
  isOpen,
  onClose,
  onAwardPoints,
}) => {
  const adventure = SOLJAKTEN_EVENTYR;
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [childSecret, setChildSecret] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Nye faner: Eventyr, Askeladd-sekk, 10 Dyr, 12 Måneder
  const [activeTab, setActiveTab] = useState<TabType>('eventyr');
  const [inventory, setInventory] = useState<string[]>([]);
  const [activeAnimal, setActiveAnimal] = useState<TalkingAnimal | null>(null);
  const [animalMessage, setAnimalMessage] = useState<string | null>(null);
  const [familyPot, setFamilyPot] = useState(getFamilyPotSummary());
  const activeMonth = getActiveMonthAdventure();

  // Felles-hold timer og multitouch for steg 3 (Nøyaktig 3,0 sekunder berøringsfusjon)
  const FUSION_HOLD_DURATION_MS = TOUCH_FUSION_DURATION_MS; // 3000 ms
  const FUSION_TICK_INTERVAL_MS = 50;

  const [fusionHoldProgress, setFusionHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [touchCount, setTouchCount] = useState<number>(0);
  const lastTouchTimestampRef = React.useRef<number>(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  // Last inn lagret fremgang
  useEffect(() => {
    if (isOpen) {
      const prog = getAdventureProgress(adventure.id);
      setCurrentStep(prog.currentStep);
      setChildSecret(prog.childSecretFound || null);
      setIsCompleted(prog.isCompleted);
      setFeedbackMsg(null);
      setFusionHoldProgress(0);
      setTouchCount(0);
      setInventory(getAskeladdInventory());
      setFamilyPot(getFamilyPotSummary());
    }
  }, [isOpen, adventure.id]);

  // Håndter nøyaktig 3,0-sekunders hold for Steg 3 (Sol-Fusjonen)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isHolding && currentStep === 3 && !isCompleted) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / FUSION_HOLD_DURATION_MS) * 100);
        if (progress >= 100) {
          if (interval) clearInterval(interval);
          setFusionHoldProgress(100);
          handleCompleteAdventure();
        } else {
          setFusionHoldProgress(progress);
        }
      }, FUSION_TICK_INTERVAL_MS);
    } else {
      setFusionHoldProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHolding, currentStep, isCompleted]);


  // Gjenbrukbar AudioContext som vekkes ved brukerinteraksjon
  const ensureAudioContext = (): AudioContext | null => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === 'suspended') {
        void audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch {
      return null;
    }
  };

  // Web Audio lydeffekter
  const playSound = (type: 'child_success' | 'adult_success' | 'victory' | 'error') => {
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'child_success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'adult_success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.00, now); // G4
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.2); // C5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'victory') {
        // Triumferende treklang
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.2, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.6);
        });
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
      if (navigator.vibrate) {
        navigator.vibrate(type === 'victory' ? [100, 50, 150] : 40);
      }
    } catch {
      // Audio fallback
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchTimestampRef.current = Date.now();
    ensureAudioContext();
    const count = e.touches.length;
    setTouchCount(count);
    if (count >= 2) {
      setIsHolding(true);
    } else {
      setIsHolding(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    lastTouchTimestampRef.current = Date.now();
    const count = e.touches.length;
    setTouchCount(count);
    if (count >= 2) {
      setIsHolding(true);
    } else {
      setIsHolding(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    lastTouchTimestampRef.current = Date.now();
    const count = e.touches.length;
    setTouchCount(count);
    if (count < 2) {
      setIsHolding(false);
    }
  };

  const handleTouchCancel = () => {
    lastTouchTimestampRef.current = Date.now();
    setTouchCount(0);
    setIsHolding(false);
  };

  const handleMouseDown = () => {
    if (Date.now() - lastTouchTimestampRef.current < 750) return;
    ensureAudioContext();
    setIsHolding(true);
  };

  const handleMouseUp = () => {
    if (Date.now() - lastTouchTimestampRef.current < 750) return;
    setIsHolding(false);
  };

  const handleMouseLeave = () => {
    setIsHolding(false);
  };

  const handleChildOptionSelect = (option: MissionOption) => {
    if (option.isCorrect) {
      playSound('child_success');
      setChildSecret(option.id);
      setFeedbackMsg({
        text: `🌟 HURRA! Lys-speideren fant det! Husk: Eikebladet har 3 spisser. Ikke si det til pappa før han spør!`
      });
      saveAdventureProgress({
        adventureId: adventure.id,
        currentStep: 2,
        childSecretFound: option.id,
        isCompleted: false
      });
      setTimeout(() => {
        setCurrentStep(2);
        setFeedbackMsg(null);
      }, 2200);
    } else {
      playSound('error');
      setFeedbackMsg({
        text: `Prøv igjen! Se etter noe i naturen som har akkurat tre spisser.`,
        isError: true
      });
    }
  };

  const handleAdultOptionSelect = (option: MissionOption) => {
    if (option.isCorrect) {
      playSound('adult_success');
      setFeedbackMsg({
        text: `🎯 RIKTIG NØKKEL! Barnets observasjon stemte på en prikk. Nå må dere vekke krystallen sammen!`
      });
      saveAdventureProgress({
        adventureId: adventure.id,
        currentStep: 3,
        childSecretFound: childSecret || undefined,
        adultLogicSolved: true,
        isCompleted: false
      });
      setTimeout(() => {
        setCurrentStep(3);
        setFeedbackMsg(null);
      }, 2000);
    } else {
      playSound('error');
      setFeedbackMsg({
        text: `Bom! Husk å spørre Lys-speideren din om hvilken form dere trenger!`,
        isError: true
      });
    }
  };

  const handleCompleteAdventure = () => {
    // Spill først barnets suksesslyd for å hedre Lys-speideren, og deretter familiens seiersfanfare
    playSound('child_success');
    setTimeout(() => {
      playSound('victory');
    }, 350);

    setIsCompleted(true);
    saveAdventureProgress({
      adventureId: adventure.id,
      currentStep: 3,
      childSecretFound: childSecret || undefined,
      adultLogicSolved: true,
      isCompleted: true,
      completedAt: new Date().toISOString()
    });
    if (onAwardPoints) {
      onAwardPoints(adventure.reward.points);
    }
    // Tildel 30 kr fullføringsbonus til Familiepotten
    claimAdventureBonus(adventure.id);
    setFamilyPot(getFamilyPotSummary());
  };

  const playTone = (frequency: number) => {
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio fallback
    }
  };


  const handleCollectItem = (item: AskeladdItem) => {
    const res = collectAskeladdItem(item.id);
    if (res.success) {
      playSound('child_success');
      setInventory(getAskeladdInventory());
      setFamilyPot(getFamilyPotSummary());
      setFeedbackMsg({ text: res.message });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setFeedbackMsg({ text: res.message, isError: true });
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const handleAnimalSelect = (animal: TalkingAnimal) => {
    setActiveAnimal(animal);
    playTone(animal.audioToneHz);
    setAnimalMessage(animal.greeting);
  };

  const handleGiveItemToAnimal = (animal: TalkingAnimal) => {
    if (!animal.requiredItem) return;
    if (inventory.includes(animal.requiredItem)) {
      playSound('child_success');
      const coinRes = addTrailCoin(2);
      setFamilyPot(getFamilyPotSummary());
      setAnimalMessage(`🎉 Hurra! ${animal.name} fikk det han trengte! ${animal.rewardHint} (+${coinRes.added} mynter til familiepotten!)`);
    } else {
      playSound('error');
      const needed = ASKELADD_ITEMS.find(i => i.id === animal.requiredItem);
      setAnimalMessage(`«Oi! Jeg trenger ${needed?.name || 'en dings'}! Sjekk Askeladd-sekken eller let langs stien!»`);
    }
  };

  const handleFindCoin = () => {
    const res = addTrailCoin(1);
    playSound('child_success');
    setFamilyPot(getFamilyPotSummary());
    if (res.maxReached) {
      setFeedbackMsg({ text: `🌟 Maksgrensen på 15 mynter per tur er nådd! Flott turinnsats!` });
    } else {
      setFeedbackMsg({ text: `🪙 Fant en Sol-mynt! Nå har familien ${res.current} av 15 mynter på denne turen.` });
    }
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleRestart = () => {
    resetAdventure(adventure.id);
    setCurrentStep(1);
    setChildSecret(null);
    setIsCompleted(false);
    setFeedbackMsg(null);
    setFusionHoldProgress(0);
    setTouchCount(0);
    setIsHolding(false);
  };

  if (!isOpen) return null;

  const mission = adventure.missions[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* 1. Header: Tittel, Rolle & Avslutt */}
        <div className="bg-slate-950/90 px-4 py-3 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="text-white font-extrabold text-sm sm:text-base leading-tight">
                {adventure.title}
              </h3>
              <p className="text-[11px] text-amber-400 font-medium">
                {adventure.tagline}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Familiepotten statuslinje */}
        <div className="bg-amber-950/40 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Mynter på stien: <strong>{familyPot.trailCoins}/{familyPot.maxTrailCoins}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Familiepott: <strong>{familyPot.totalHikeNok} kr</strong> (maks 45 kr)</span>
            <button
              onClick={handleFindCoin}
              title="Finn en mynt langs stien"
              className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer"
            >
              +1 Mynt
            </button>
          </div>
        </div>

        {/* Faner */}
        <div className="flex border-b border-white/10 bg-slate-950 text-xs font-bold">
          <button
            onClick={() => setActiveTab('eventyr')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'eventyr'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-white/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📖 Eventyret</span>
          </button>
          <button
            onClick={() => setActiveTab('askeladd')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'askeladd'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-white/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Backpack className="w-3.5 h-3.5" />
            <span>Sekken ({inventory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('dyr')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'dyr'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-white/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🦊 10 Dyr</span>
          </button>
          <button
            onClick={() => setActiveTab('kalender')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'kalender'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-white/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>12 Mnd</span>
          </button>
        </div>

        {/* 2. Steg-indikator (kun i Eventyr-fanen) */}
        {activeTab === 'eventyr' && (
          <div className="bg-slate-900/60 px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 sm:gap-3 w-full">
              {[1, 2, 3].map((s) => {
                const active = currentStep === s;
                const done = currentStep > s || isCompleted;
                return (
                  <div
                    key={s}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-xl border text-[11px] font-bold transition ${
                      active
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                        : done
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                    <span>Steg {s}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Innhold */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'eventyr' && (!isCompleted ? (
            <>
              {/* Rolle-banner */}
              <div
                className={`p-3 rounded-2xl border flex items-center gap-3 ${
                  mission.roleResponsible === 'child'
                    ? 'bg-amber-950/40 border-amber-400/40 text-amber-200'
                    : mission.roleResponsible === 'adult'
                    ? 'bg-indigo-950/40 border-indigo-400/40 text-indigo-200'
                    : 'bg-purple-950/40 border-purple-400/40 text-purple-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  {mission.roleResponsible === 'child' ? '👶' : mission.roleResponsible === 'adult' ? '🧔' : '👨‍👩‍👦'}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider opacity-80">
                    Aktiv rolle:
                  </div>
                  <div className="text-sm font-black text-white">
                    {mission.roleName}
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">
                    {mission.tagline}
                  </div>
                </div>
              </div>

              {/* Oppgave-tekst */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <h4 className="text-white font-bold text-sm sm:text-base mb-1">
                  {mission.title}
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {mission.instruction}
                </p>
                <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-amber-300/80 italic">
                  💡 Samarbeidstips: {mission.pedagogicalNote}
                </div>
              </div>

              {/* Tilbakemeldings-toast */}
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-2xl border text-xs sm:text-sm font-bold text-center animate-fadeIn ${
                    feedbackMsg.isError
                      ? 'bg-red-950/60 border-red-500 text-red-200'
                      : 'bg-emerald-950/60 border-emerald-400 text-emerald-200'
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              {/* Alternativer: Steg 1 & 2 */}
              {currentStep < 3 && mission.options && (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {mission.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() =>
                        currentStep === 1
                          ? handleChildOptionSelect(opt)
                          : handleAdultOptionSelect(opt)
                      }
                      className="p-3 sm:p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-white/10 hover:border-amber-400 text-left transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex flex-col items-center justify-center text-center group cursor-pointer"
                    >
                      <span className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition">
                        {opt.icon}
                      </span>
                      <span className="text-white text-xs font-bold leading-snug">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Steg 3: Hold nede sammen (Fusjonen) */}
              {currentStep === 3 && (
                <div className="flex flex-col items-center justify-center text-center py-4 space-y-4">
                  {/* Statusindikator for multitouch */}
                  <div className="flex items-center justify-center gap-3 text-xs font-bold">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition ${
                        touchCount >= 1 || (isHolding && touchCount === 0)
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-500'
                      }`}
                    >
                      <span>👶</span>
                      <span>Lys-speideren {touchCount >= 1 || (isHolding && touchCount === 0) ? '✓' : '...'}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition ${
                        touchCount >= 2 || (isHolding && touchCount === 0)
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-500'
                      }`}
                    >
                      <span>🧔</span>
                      <span>Kart-leseren {touchCount >= 2 || (isHolding && touchCount === 0) ? '✓' : '...'}</span>
                    </div>
                  </div>

                  <div
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                    className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 transition"
                  >
                    <span className="text-5xl animate-pulse">✨</span>
                    <span className="text-[10px] font-black uppercase text-slate-950 mt-1">
                      {isHolding
                        ? `${Math.round(fusionHoldProgress)}%`
                        : touchCount === 1
                        ? '1 finger til!'
                        : 'Hold inne!'}
                    </span>

                    {/* Progress ring */}
                    {isHolding && (
                      <div
                        style={{ opacity: fusionHoldProgress / 100 }}
                        className="absolute inset-0 rounded-full border-4 border-white shadow-[0_0_30px_#f59e0b] animate-ping pointer-events-none"
                      ></div>
                    )}
                  </div>

                  <div className="w-full max-w-xs bg-slate-800 rounded-full h-3 overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${fusionHoldProgress}%` }}
                      className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-75 ease-linear"
                    ></div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-slate-300 text-xs font-medium">
                      {touchCount === 1 ? (
                        <span className="text-amber-300 font-bold">
                          ☝️ 1 finger registrert! Barnet og den voksne må holde samtidig.
                        </span>
                      ) : isHolding ? (
                        <span className="text-amber-200 font-bold">
                          ⚡ Berøringsfusjon pågår! Hold stødig i 3 sekunder...
                        </span>
                      ) : (
                        'Hold to fingre på skjermen samtidig (én fra barnet og én fra den voksne)!'
                      )}
                    </p>
                    {touchCount === 0 && (
                      <p className="text-[10px] text-slate-500">
                        💻 Skrivebordsmodus: Hold nede musetasten for å teste fusjonen
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 4. Feiring & Seier */
            <div className="text-center py-4 space-y-4 animate-scaleUp">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mx-auto shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                🏆
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {adventure.reward.familyCertificateTitle}
                </span>
                <h3 className="text-white text-xl sm:text-2xl font-black mt-1">
                  Solkrystallen er vekket til live!
                </h3>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                {adventure.storyOutro}
              </p>

              {/* Belønningsboks */}
              <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-400/40 rounded-2xl p-4 flex items-center justify-between text-left max-w-sm mx-auto">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{adventure.reward.fragmentIcon}</span>
                  <div>
                    <div className="text-amber-300 font-extrabold text-sm">
                      {adventure.reward.fragmentName}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Samlet i familiens trofélommebok
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-amber-400">
                    +{adventure.reward.points} Luks-poeng
                  </div>
                  <div className="text-[10px] text-slate-400">1:1 NOK verdi</div>
                </div>
              </div>

              {/* Knapper */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg"
                >
                  Fortsett turen ute 🌲
                </button>
                <button
                  onClick={handleRestart}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Spill på nytt</span>
                </button>
              </div>
            </div>
          ))}

          {/* Fane 2: Askeladd-sekken */}
          {activeTab === 'askeladd' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 text-center">
                <span className="text-2xl">🎒</span>
                <h4 className="text-white font-bold text-sm mt-1">Barnets Askeladd-sekk</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  «Jeg fant, jeg fant!» — Plukk opp rare dingser på stien som familien kan få bruk for senere!
                </p>
                <div className="mt-2 text-[11px] text-amber-300 font-semibold">
                  Samlet i sekken: {inventory.length} av {ASKELADD_ITEMS.length} dingser
                </div>
              </div>

              {/* Dingser i sekken */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ASKELADD_ITEMS.map((item) => {
                  const isCollected = inventory.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition flex flex-col justify-between ${
                        isCollected
                          ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-400/50 shadow-md'
                          : 'bg-slate-900/40 border-white/5 opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-3xl shrink-0 p-1 bg-white/5 rounded-xl">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-white font-bold text-xs">{item.name}</h5>
                            {isCollected && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full font-bold">I sekken</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug">{item.practicalUse}</p>
                          <p className="text-[10px] text-amber-300/80 italic mt-1">{item.askeladdCatchphrase}</p>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">📍 {item.foundLocation}</span>
                        {!isCollected && (
                          <button
                            onClick={() => handleCollectItem(item)}
                            className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer transition shadow"
                          >
                            «Jeg fant, jeg fant!» ✨
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fane 3: 10 Snakkende Dyr */}
          {activeTab === 'dyr' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 text-center">
                <span className="text-2xl">🦊🦉🐿️</span>
                <h4 className="text-white font-bold text-sm mt-1">10 Snakkende Skogsdyr</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Trykk på et dyr for å høre deres unike fabel-stemme og løse oppdrag for ledetråder!
                </p>
              </div>

              {/* Aktivt dyr dialog */}
              {activeAnimal && (
                <div className="bg-slate-900 border-2 border-amber-400/60 rounded-2xl p-4 space-y-2 shadow-xl animate-scaleUp">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{activeAnimal.icon}</span>
                      <div>
                        <h4 className="text-white font-black text-sm">{activeAnimal.name} ({activeAnimal.species})</h4>
                        <p className="text-[10px] text-amber-300">{activeAnimal.locationHint}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => playTone(activeAnimal.audioToneHz)}
                      className="p-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer transition"
                      title="Hør dyrets tone"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-black/40 rounded-xl p-3 border border-white/5 text-xs text-amber-100 italic leading-relaxed">
                    {animalMessage || activeAnimal.greeting}
                  </div>

                  <div className="text-[11px] text-slate-300 bg-white/5 p-2.5 rounded-xl">
                    <strong>Gåte:</strong> {activeAnimal.riddlePrompt}
                  </div>

                  {activeAnimal.requiredItem && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        Trenger: {ASKELADD_ITEMS.find(i => i.id === activeAnimal.requiredItem)?.name || activeAnimal.requiredItem}
                      </span>
                      <button
                        onClick={() => handleGiveItemToAnimal(activeAnimal)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs cursor-pointer shadow transition"
                      >
                        Gi dings fra sekken 🎒
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Grid over dyrene */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TALKING_ANIMALS.map((animal) => {
                  const isSelected = activeAnimal?.id === animal.id;
                  const hasNeeded = animal.requiredItem ? inventory.includes(animal.requiredItem) : false;
                  return (
                    <button
                      key={animal.id}
                      onClick={() => handleAnimalSelect(animal)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 shadow-md'
                          : 'bg-slate-900/60 hover:bg-slate-800 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">{animal.icon}</span>
                        {hasNeeded && (
                          <span className="text-[8px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">Klar!</span>
                        )}
                      </div>
                      <div className="text-white font-bold text-xs truncate">{animal.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{animal.species}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fane 4: 12 Måneder & Tinydome */}
          {activeTab === 'kalender' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-3.5 text-center">
                <span className="text-2xl">🛸✨</span>
                <h4 className="text-white font-bold text-sm mt-1">12 Måneder med Asbjørnsen & Moe</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Hver måned har sitt eget klassiske eventyr. Fullfør turen for å vinne månedspremier frem mot den store sommerfinalen!
                </p>
                <div className="mt-2 text-[11px] text-amber-300 font-bold">
                  Hovedpremie Sommer 2027: 1/12 Eierandel i Tinydome Spacecapsule (verdi 95 000 kr)
                </div>
              </div>

              {/* Månedsliste */}
              <div className="space-y-2">
                {FAIRY_TALES_12_MONTHS.map((m) => {
                  const isCurrent = m.monthIndex === activeMonth.monthIndex;
                  return (
                    <div
                      key={m.monthIndex}
                      className={`p-3 rounded-2xl border transition ${
                        m.isGrandFinale
                          ? 'bg-gradient-to-r from-purple-950/60 via-amber-950/40 to-purple-950/60 border-amber-400/80 shadow-lg'
                          : isCurrent
                          ? 'bg-amber-950/30 border-amber-500/50 shadow-md'
                          : 'bg-slate-900/40 border-white/5 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-amber-400">
                            {m.monthName}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
                              AKTIV NÅ
                            </span>
                          )}
                          {m.isGrandFinale && (
                            <span className="text-[9px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-black">
                              HOVEDFINALE 🛸
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{m.locationSuggestion}</span>
                      </div>
                      <h5 className="text-white font-bold text-sm">{m.fairyTaleTitle}</h5>
                      <p className="text-xs text-slate-300 mt-0.5 leading-snug">{m.themeDescription}</p>
                      <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Månedspremie:</span>
                        <span className="text-amber-300 font-bold">{m.monthlyPrize}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
