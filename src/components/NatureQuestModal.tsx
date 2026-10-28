import React, { useState, useRef } from 'react';
import {
  NatureQuestState,
  loadQuestState,
  saveQuestState,
  evaluateSolkastet,
  answerFriendshipRiddle,
  recordAskeladdDiscovery,
  unlockSecretChest,
} from '../engine/natureQuest';
import {
  X,
  Sparkles,
  Shield,
  Pause,
  Play,
  Backpack,
  Compass,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';

interface NatureQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCoinsToWallet?: (amount: number) => void;
}

export const NatureQuestModal: React.FC<NatureQuestModalProps> = ({
  isOpen,
  onClose,
  onAddCoinsToWallet,
}) => {
  const [state, setState] = useState<NatureQuestState>(loadQuestState);
  const [activeTab, setActiveTab] = useState<'animals' | 'knapsack' | 'chest'>('animals');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('rev-mikkel');

  // Solkastet-tilstand (trygt virtuelt kast med fingeren)
  const [isPulling, setIsPulling] = useState(false);
  const [throwFeedback, setThrowFeedback] = useState<string | null>(null);
  const [throwHint, setThrowHint] = useState<string | null>(null);
  const [basketSizeBonus, setBasketSizeBonus] = useState(0);

  // Sikkerhets-pause
  const [isPaused, setIsPaused] = useState(false);

  // Gåte-tilbakemelding
  const [riddleFeedback, setRiddleFeedback] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const currentAnimal = state.animals.find(a => a.id === selectedAnimalId) || state.animals[0];
  const foundToolsCount = state.knapsack.filter(k => k.isFound).length;
  const befriendedCount = state.animals.filter(a => a.isBefriended).length;

  const handleTouchStart = () => {
    setIsPulling(true);
    setThrowFeedback(null);
    setThrowHint(null);
  };

  const handleTouchMove = () => {
    if (!isPulling) return;
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    setIsPulling(false);

    // Beregn trekkstyrke og vinkel
    // Simulerer et trygt kast basert på finger-drag
    const randomAim = Math.floor(Math.random() * 30) - 15;
    const simulatedPower = 65; // Stabil god verdi i prototypen

    const result = evaluateSolkastet(randomAim, simulatedPower);
    setThrowFeedback(result.message);

    if (result.isHit) {
      // Mikkel Rev blir venn og gir Solsteinspeilet
      const updatedAnimals = state.animals.map(a =>
        a.id === 'rev-mikkel' ? { ...a, isBefriended: true } : a
      );
      const updatedKnapsack = state.knapsack.map(t =>
        t.id === 'tool-solsteinspeil' ? { ...t, isFound: true } : t
      );
      const nextState: NatureQuestState = {
        ...state,
        animals: updatedAnimals,
        knapsack: updatedKnapsack,
        coinsThisHike: Math.min(state.maxCoinsPerHike, state.coinsThisHike + 5),
      };
      setState(nextState);
      saveQuestState(nextState);
      onAddCoinsToWallet?.(5);
    } else {
      setThrowHint(result.hint || 'Kurven er nå større! Prøv ett rolig kast til.');
      setBasketSizeBonus(prev => prev + 10);
    }
  };

  const handleAnswerRiddle = (animalId: string, optionIndex: number) => {
    const res = answerFriendshipRiddle(state, animalId, optionIndex);
    setRiddleFeedback(res.feedback);
    if (res.success) {
      setState(res.state);
      onAddCoinsToWallet?.(5);
    }
  };

  const handleAskeladdFound = (toolId: string) => {
    const { state: nextState, item } = recordAskeladdDiscovery(state, toolId);
    setState(nextState);
    saveQuestState(nextState);
    onAddCoinsToWallet?.(5);
    setThrowFeedback(`«Jeg fant, jeg fant!» Familien fant ${item?.name} og la den trygt i sekken!`);
  };

  const handleUnlockChest = () => {
    const res = unlockSecretChest(state);
    if (res.success) {
      setState(res.state);
      saveQuestState(res.state);
      onAddCoinsToWallet?.(10);
    }
    setThrowFeedback(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#151413] border border-orange-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* SIKKERHETSPÅMINNELSE & TOPPHEADER */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-emerald-500/10 border-b border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 font-serif-display">
                Eventyrstien: Naturvokterne
              </h2>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Oppdag • Gjør noe i naturen • Bli venn • Bruk funnet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                isPaused
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Fortsett' : 'Pause'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TRYGGHETS-BANNER (STÅ I RO PÅ STI) */}
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">
              Stopp på et trygt sted ved stien før dere tar frem skjermen. Hold telefonen i ro med begge hender!
            </span>
          </div>

          <div className="shrink-0 font-mono font-bold text-xs bg-amber-500/20 px-2.5 py-0.5 rounded-full">
            🪙 {state.coinsThisHike} / {state.maxCoinsPerHike} Solmynter
          </div>
        </div>

        {/* PAUSE-SKJERM NÅR FAMILIEN GÅR */}
        {isPaused ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Compass className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif-display">
              Turpause aktivert — Nyt naturen!
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Legg mobilen i lomma mens dere går. Lytt etter fuglene, kjenn på trestammer eller se etter spennende steiner.
              Trykk på «Fortsett» når dere stopper ved neste rasteplass!
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition"
            >
              Vi har stoppet trygt — Fortsett eventyret
            </button>
          </div>
        ) : (
          <>
            {/* FANER */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-4 pt-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('animals')}
                className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
                  activeTab === 'animals'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <span>🐾 Møt Dyrene ({befriendedCount}/3)</span>
              </button>

              <button
                onClick={() => setActiveTab('knapsack')}
                className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
                  activeTab === 'knapsack'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Backpack className="w-4 h-4" />
                <span>Askeladdens Sekk ({foundToolsCount}/6)</span>
              </button>

              <button
                onClick={() => setActiveTab('chest')}
                className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
                  activeTab === 'chest'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Skattekisten {state.chestUnlocked && '✓'}</span>
              </button>
            </div>

            {/* HOVEDINNHOLD */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* FANE 1: MØT DYRENE */}
              {activeTab === 'animals' && (
                <div className="space-y-4">
                  {/* Dyr-velger */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {state.animals.map(animal => (
                      <button
                        key={animal.id}
                        onClick={() => {
                          setSelectedAnimalId(animal.id);
                          setThrowFeedback(null);
                          setThrowHint(null);
                          setRiddleFeedback(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          selectedAnimalId === animal.id
                            ? 'bg-orange-500/10 border-orange-500 shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{animal.avatarEmoji}</span>
                          {animal.isBefriended ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded-full">
                              Venn ✓
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400">Venter</span>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="font-bold text-xs text-zinc-900 dark:text-white">
                            {animal.name}
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                            {animal.title}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Detaljert visning for valgt dyr */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-4xl p-2 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                        {currentAnimal.avatarEmoji}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                            {currentAnimal.name}
                          </h4>
                          {currentAnimal.isBefriended && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              Er blitt familiens venn!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 italic">
                          {currentAnimal.greetingText}
                        </p>
                      </div>
                    </div>

                    {/* INTERAKSJON 1: MIKKEL REV -> SOLKASTET */}
                    {currentAnimal.species === 'rev' && (
                      <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-orange-500/20 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            Solkastet ✨ (Trygg finger-sikte)
                          </span>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            Hold mobilen i ro med begge hender
                          </span>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-300">
                          Hjelp reven! Dra den glødende solballen forsiktig bakover med fingeren, sikt mot kurven og slipp.
                        </p>

                        {/* Kaste-arena (Trygt virtuell mini-interaksjon) */}
                        <div
                          ref={containerRef}
                          onMouseDown={handleTouchStart}
                          onMouseMove={handleTouchMove}
                          onMouseUp={handleTouchEnd}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          className="relative h-44 rounded-xl bg-gradient-to-b from-sky-950 via-zinc-900 to-amber-950/40 border border-orange-500/30 overflow-hidden flex flex-col justify-between p-3 select-none cursor-pointer"
                        >
                          {/* Kurven i toppen */}
                          <div className="flex flex-col items-center justify-center">
                            <div
                              style={{ width: `${60 + basketSizeBonus}px` }}
                              className="h-10 rounded-full border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse transition-all"
                            >
                              <span className="text-xs font-black text-amber-200">🧺 Kurv</span>
                            </div>
                            <span className="text-[9px] text-amber-300/80 mt-0.5">Sikt hit</span>
                          </div>

                          {/* Sikteguide */}
                          {isPulling && (
                            <div className="absolute inset-x-0 bottom-16 flex flex-col items-center pointer-events-none">
                              <div className="w-0.5 h-16 border-l-2 border-dashed border-amber-400/60" />
                              <span className="text-[10px] text-amber-300 font-mono mt-1">
                                Sikt rett • Slipp for å kaste
                              </span>
                            </div>
                          )}

                          {/* Solballen i bunn */}
                          <div className="flex justify-center items-center pb-2">
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white text-lg font-bold shadow-xl shadow-orange-500/50 transition-transform ${
                                isPulling ? 'scale-110 translate-y-2 ring-4 ring-amber-300' : 'animate-bounce'
                              }`}
                            >
                              ☀️
                            </div>
                          </div>
                        </div>

                        {throwFeedback && (
                          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-950 dark:text-orange-200 font-medium">
                            {throwFeedback}
                            {throwHint && <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{throwHint}</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* INTERAKSJON 2: HUBROEN UGLE -> VENNSKAPSPRØVEN (GÅTE) */}
                    {currentAnimal.species === 'ugle' && (
                      <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                        <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <span>🦉 Hubroens Dagslysgåte:</span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                          {currentAnimal.riddleQuestion}
                        </p>

                        <div className="space-y-2">
                          {currentAnimal.riddleOptions?.map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAnswerRiddle('ugle-hubro', idx)}
                              className="w-full text-left p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 hover:bg-orange-500/5 text-xs text-zinc-800 dark:text-zinc-200 transition flex items-center justify-between"
                            >
                              <span>{opt}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            </button>
                          ))}
                        </div>

                        {riddleFeedback && (
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200">
                            {riddleFeedback}
                          </div>
                        )}
                      </div>
                    )}

                    {/* INTERAKSJON 3: NØTTELITEN EKORN -> ASKELADDENS FUNN */}
                    {currentAnimal.species === 'ekorn' && (
                      <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                        <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <span>🐿️ Naturoppdrag: Finn noe rundt i skogbunnen!</span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Se dere rundt på stien sammen. Finn en kongle, en rund glatt stein eller en eikenøtt. Vis den fram til hverandre!
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => handleAskeladdFound('tool-furukongle')}
                            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>🌰 Vi fant en kongle!</span>
                          </button>
                          <button
                            onClick={() => handleAskeladdFound('tool-gullnokkel')}
                            className="px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-800 dark:text-orange-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>🗝️ Vi fant en gjemt nøkkelbit!</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FANE 2: ASKELADDENS TURSEKK */}
              {activeTab === 'knapsack' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-serif-display">
                      Tursekken: Verktøy familien har samlet
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      I Utaktiv er ikke gjenstander bare pynt – de brukes aktivt til å løse gåter og åpne hemmelige stier!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.knapsack.map(item => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                          item.isFound
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-sm'
                            : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-60'
                        }`}
                      >
                        <span className="text-3xl p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                          {item.emoji}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                              {item.name}
                            </h4>
                            {item.isFound ? (
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded-full">
                                I sekken ✓
                              </span>
                            ) : (
                              <span className="text-[9px] text-zinc-400">Må finnes</span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                            {item.description}
                          </p>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 italic">
                            {item.lore}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FANE 3: SKATTEKISTEN */}
              {activeTab === 'chest' && (
                <div className="space-y-4 text-center">
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 to-orange-500/20 border border-orange-500/30 space-y-3">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-4xl shadow-inner">
                      {state.chestUnlocked ? '🔓' : '🔒'}
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 dark:text-white font-serif-display">
                      {state.chestUnlocked ? 'Skattekisten er Åpnet!' : 'Den Glemte Skattekisten på Fløyen'}
                    </h3>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
                      {state.chestUnlocked
                        ? 'Familien har kombinert Solsteinspeilet og Gullnøkkel-biten! Dere har låst opp kapittelet som leder familien mot fellesfinalen i Eidfjord sommeren 2027.'
                        : 'For å åpne kisten må familien kombinere to verktøy fra sekken: Solsteinspeilet (for å fange sollyset på låsen) og Gullnøkkel-biten (for å vri om).'}
                    </p>

                    {/* Verktøy-krav status */}
                    <div className="flex justify-center gap-3 pt-2">
                      <div
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                          state.knapsack.find(k => k.id === 'tool-solsteinspeil')?.isFound
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span>🪞 Solsteinspeilet</span>
                        {state.knapsack.find(k => k.id === 'tool-solsteinspeil')?.isFound ? '✓' : '✗'}
                      </div>

                      <div
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                          state.knapsack.find(k => k.id === 'tool-gullnokkel')?.isFound
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <span>🗝️ Gullnøkkel-biten</span>
                        {state.knapsack.find(k => k.id === 'tool-gullnokkel')?.isFound ? '✓' : '✗'}
                      </div>
                    </div>

                    {!state.chestUnlocked ? (
                      <button
                        onClick={handleUnlockChest}
                        className="mt-3 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                      >
                        Prøv å låse opp kisten sammen
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                        ✨ Fullført eventyr! Belønning kreditert til familiens Sol-lommebok (+15 mynter).
                      </div>
                    )}
                  </div>

                  <div className="text-left p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>{state.currentStoryTitle}</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {state.currentStoryChapter}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
