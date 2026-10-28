import React, { useState, useEffect, useRef } from 'react';
import {
  ARDrop,
  BERGEN_AR_DROPS,
  DAILY_MAX_COIN_POINTS,
  collectARDrop,
  getDailyCoinPointsCollected,
  getTinydomeTicketCount,
  hasCollectedDropToday,
} from '../engine/arDrops';
import {
  loadQuestState,
  saveQuestState,
  recordAskeladdDiscovery,
} from '../engine/natureQuest';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ARWorldCanvas } from './ar/ARWorldCanvas';
import { arAudio } from './ar/arAudio';

interface SolCameraARProps {
  isOpen: boolean;
  onClose: () => void;
  userLat?: number;
  userLng?: number;
  onPointsUpdated?: () => void;
}

interface LootBannerData {
  title: string;
  message: string;
  badge: string;
  icon?: string;
}

export const SolCameraAR: React.FC<SolCameraARProps> = ({
  isOpen,
  onClose,
  userLat = 60.3948,
  userLng = 5.3289,
  onPointsUpdated,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Verktøy-modus: 'lasso' | 'boomerang' | 'solkast'
  const [activeTool, setActiveTool] = useState<'lasso' | 'boomerang' | 'solkast'>('lasso');
  const [isRadialWheelOpen, setIsRadialWheelOpen] = useState<boolean>(false);
  const [throwSignal, setThrowSignal] = useState<number>(0);

  // Gyroscope / visual position offsets
  const [orientationOffset, setOrientationOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeDropIndex, setActiveDropIndex] = useState<number>(0);

  // Discreet Loot Banner (erstatter fullskjerms blokkerende modaler)
  const [lootBanner, setLootBanner] = useState<LootBannerData | null>(null);
  const lootTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hilsen-toast (når man vinker til et dyr)
  const [waveFeedback, setWaveFeedback] = useState<string | null>(null);
  const waveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [dailyPoints, setDailyPoints] = useState<number>(0);
  const [tinydomeTickets, setTinydomeTickets] = useState<number>(0);

  // Synkroniser dagsfangst og billetter
  useEffect(() => {
    if (isOpen) {
      setDailyPoints(getDailyCoinPointsCollected());
      setTinydomeTickets(getTinydomeTicketCount());
    }
  }, [isOpen]);

  // Start kamerafeed
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        setOrientationOffset({
          x: Math.min(45, Math.max(-45, e.gamma * 1.2)),
          y: Math.min(45, Math.max(-45, (e.beta - 45) * 1.2)),
        });
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    return () => {
      stopCamera();
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      }
      if (lootTimerRef.current) clearTimeout(lootTimerRef.current);
      if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    };
  }, [isOpen]);

  // Koble video-stream til video-elementet og sikre avspilling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('muted', '');

    video.srcObject = stream;

    let isPlaying = false;
    const triggerPlay = () => {
      if (isPlaying) return;
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            isPlaying = true;
            setIsCameraActive(true);
          })
          .catch(e => {
            console.warn('Video play avvist/venter på gesture:', e);
          });
      }
    };

    video.onloadedmetadata = () => triggerPlay();
    video.oncanplay = () => triggerPlay();
    video.onplaying = () => {
      isPlaying = true;
      setIsCameraActive(true);
    };

    triggerPlay();

    return () => {
      if (video) {
        video.onloadedmetadata = null;
        video.oncanplay = null;
        video.onplaying = null;
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        let mediaStream: MediaStream;

        try {
          if (isMobile) {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          } else {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          }
        } catch (initialErr) {
          console.warn('Spesifikke kamerakrav feilet, forsøker generell video...', initialErr);
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        setStream(mediaStream);
        setIsCameraActive(true);
      } else {
        setCameraError('Kamera er ikke tilgjengelig i denne nettleseren. Viser simulert Byfjell-visir.');
        setIsCameraActive(false);
      }
    } catch (err: unknown) {
      console.warn('Kamerafeil:', err);
      const errorMsg = err instanceof Error ? err.name : 'Ukjent feil';
      if (errorMsg === 'NotAllowedError' || errorMsg === 'PermissionDeniedError') {
        setCameraError('Kameratilgang ble avvist. Tillat kamera i nettleserinnstillinger.');
      } else {
        setCameraError('Kunne ikke starte kameraet. Viser simulert Byfjell-visir.');
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const currentDrop = BERGEN_AR_DROPS[activeDropIndex];
  const isAlreadyCollected = currentDrop ? hasCollectedDropToday(currentDrop.id) : false;

  // Anbefalt verktøy basert på måltype (Lasso på bakke, Bumerang i trær)
  const recommendedTool = currentDrop?.recommendedTool || (currentDrop?.targetPlacement === 'high_tree' ? 'boomerang' : 'lasso');

  // Fangst-håndtering (Lasso, Bumerang, Solkast eller Opphenting fra bakken)
  const handleCollect = (
    drop: ARDrop,
    method: 'lasso' | 'boomerang' | 'solkast' | 'pickup'
  ) => {
    const result = collectARDrop(drop, userLat, userLng, true);

    if (result.success) {
      arAudio.playFanfareSound();
      setDailyPoints(getDailyCoinPointsCollected());
      setTinydomeTickets(getTinydomeTicketCount());
      if (onPointsUpdated) onPointsUpdated();

      // Synkroniser til natureQuest-motoren hvis det er et Askeladd-verktøy
      if (drop.toolId) {
        const qState = loadQuestState();
        const { state: nextState } = recordAskeladdDiscovery(qState, drop.toolId);
        saveQuestState(nextState);
      }

      let successMsg = result.message;
      if (method === 'lasso') {
        successMsg = `🪢 Lys-lassoen slynget seg perfekt rundt målet og trakk ${drop.title} rett i sekken!`;
      } else if (method === 'boomerang') {
        successMsg = `🪃 Bumerangen kappet tauet så ${drop.title} falt til bakken og ble plukket opp!`;
      } else if (method === 'solkast') {
        successMsg = `☀️ Solkastet speilet dagslyset og sikret vennskap med ${drop.title}!`;
      } else if (method === 'pickup') {
        successMsg = `✨ Askeladd-vottene plukket opp ${drop.title} fra bakken inn i ryggsekken!`;
      }

      setLootBanner({
        title: drop.title,
        message: successMsg,
        badge: drop.badgeText,
        icon: drop.icon,
      });

      if (lootTimerRef.current) clearTimeout(lootTimerRef.current);
      lootTimerRef.current = setTimeout(() => {
        setLootBanner(null);
      }, 4000);
    } else {
      setLootBanner({
        title: 'Allerede sanket i dag',
        message: result.message,
        badge: 'Info',
        icon: '✓',
      });

      if (lootTimerRef.current) clearTimeout(lootTimerRef.current);
      lootTimerRef.current = setTimeout(() => {
        setLootBanner(null);
      }, 3500);
    }
  };

  const handleWaveAnimal = (animalTitle: string) => {
    setWaveFeedback(`👋 Du hilste på ${animalTitle}! Logrer og hopper glad!`);
    if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    waveTimerRef.current = setTimeout(() => {
      setWaveFeedback(null);
    }, 2800);
  };

  const handleUserTapToResumeVideo = () => {
    if (videoRef.current && videoRef.current.paused && stream) {
      videoRef.current.play().then(() => setIsCameraActive(true)).catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleUserTapToResumeVideo}
      className="fixed inset-0 z-50 bg-black flex flex-col font-sans select-none overflow-hidden animate-fadeIn"
    >
      {/* 1. Kamera Video Bakgrunn */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onPlaying={() => setIsCameraActive(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {!isCameraActive && (
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900 via-emerald-950 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-4 animate-pulse">
              🌄
            </div>
            <h3 className="text-white text-xl font-bold mb-2 font-serif-display">Sol-Jakt AR Verden</h3>
            <p className="text-sky-200/80 text-sm max-w-sm mb-4">
              {cameraError || 'Aktiverer dagslyskameraet og 3D-visiret...'}
            </p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Tillat Kamera på nytt
            </button>
          </div>
        )}
      </div>

      {/* 2. Three.js 3D WebGL Layer (Førstepersons votter, dyr på bakken, hengende mål) */}
      {currentDrop && (
        <ARWorldCanvas
          activeDrop={currentDrop}
          activeTool={activeTool}
          isCollected={isAlreadyCollected}
          onCollect={handleCollect}
          gyroOffset={orientationOffset}
          onWaveAnimal={handleWaveAnimal}
          triggerThrowSignal={throwSignal}
        />
      )}

      {/* 3. Diskret Topp-linje: Dagsfangst, stedsnavn, navigering & lukk */}
      <div className="relative z-30 bg-slate-950/70 backdrop-blur-md px-3.5 py-2.5 border-b border-amber-500/20 flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/25 border border-amber-400/50 flex items-center justify-center text-base">
            🟡
          </div>
          <div>
            <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <span>{dailyPoints} / {DAILY_MAX_COIN_POINTS} p</span>
              {tinydomeTickets > 0 && (
                <span className="text-[10px] text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded-full border border-purple-500/40">
                  🛸 {tinydomeTickets} lodd
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-xs">Øvre Korskirkeallmenningen 8</span>
            </div>
          </div>
        </div>

        {/* Spor-veksler (Forrige / Neste) */}
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10 text-xs">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropIndex(prev => (prev > 0 ? prev - 1 : BERGEN_AR_DROPS.length - 1));
            }}
            className="p-1 hover:text-amber-400 transition cursor-pointer"
            title="Forrige spor"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-bold text-amber-200">
            {activeDropIndex + 1}/{BERGEN_AR_DROPS.length}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropIndex(prev => (prev < BERGEN_AR_DROPS.length - 1 ? prev + 1 : 0));
            }}
            className="p-1 hover:text-amber-400 transition cursor-pointer"
            title="Neste spor"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Lukk-knapp */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white font-bold text-sm transition cursor-pointer"
          title="Lukk kamera"
        >
          ✕
        </button>
      </div>

      {/* 4. Diskret Loot Banner (Erstatter fullskjerms blokkerende modaler) */}
      {lootBanner && (
        <div className="absolute top-16 left-3 right-3 z-40 flex justify-center pointer-events-auto animate-bounce">
          <div
            onClick={() => setLootBanner(null)}
            className="max-w-md w-full bg-slate-950/90 backdrop-blur-xl border-2 border-amber-400/90 rounded-2xl p-3 shadow-2xl shadow-amber-500/25 flex items-center justify-between gap-3 text-white cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-300 flex items-center justify-center text-2xl">
                {lootBanner.icon || '✨'}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                  <span>{lootBanner.badge}</span>
                  <span>• Fangst sikret</span>
                </div>
                <div className="text-sm font-extrabold text-white leading-tight">{lootBanner.title}</div>
                <div className="text-xs text-amber-100/90 line-clamp-1 mt-0.5">{lootBanner.message}</div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLootBanner(null);
              }}
              className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xs text-slate-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 5. Dyre-hilsen Feedback Toast */}
      {waveFeedback && (
        <div className="absolute top-16 left-4 right-4 z-40 flex justify-center pointer-events-none">
          <div className="px-4 py-2 bg-emerald-950/90 backdrop-blur-md border border-emerald-400/80 rounded-full text-emerald-200 text-xs font-bold shadow-xl flex items-center gap-2">
            <span>🦊</span>
            <span>{waveFeedback}</span>
          </div>
        </div>
      )}

      {/* 6. Diskret bunn-HUD: Hint og Zelda Radial Verktøy-ring */}
      <div className="mt-auto relative z-30 p-4 flex items-end justify-between pointer-events-none">
        {/* Venstre: Minimalt hint */}
        <div className="bg-slate-950/75 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-2 text-white/90 max-w-[220px] sm:max-w-xs shadow-lg">
          <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
            <span>{currentDrop?.icon}</span>
            <span>{currentDrop?.title}</span>
          </div>
          <div className="text-[10px] text-slate-300 mt-0.5">
            {currentDrop?.targetPlacement === 'high_tree'
              ? 'Henger i treet! Bruk 🪃 Bumerangen for å kappe tauet.'
              : currentDrop?.animalSpecies
              ? 'Trykk på dyret for å vinke 👋 | Sveip opp for å kaste!'
              : 'Står på bakken. Sveip opp for å kaste 🪢 Lassoen!'}
          </div>
        </div>

        {/* Høyre: Zelda-stil Radial Verktøy-hjul */}
        <div className="relative pointer-events-auto flex flex-col items-center">
          {/* Radial utfoldelse ved trykk */}
          {isRadialWheelOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2 mb-2 animate-fadeIn">
              {/* Bumerang */}
              <button
                onClick={() => {
                  setActiveTool('boomerang');
                  setIsRadialWheelOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-xl border transition shadow-xl cursor-pointer ${
                  activeTool === 'boomerang'
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-amber-500/40'
                    : 'bg-slate-900/90 text-white border-white/20 hover:bg-slate-800'
                } ${recommendedTool === 'boomerang' ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
              >
                {recommendedTool === 'boomerang' && (
                  <span className="text-[9px] uppercase font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full">
                    Anbefalt
                  </span>
                )}
                <span className="text-xs font-bold">Bumerang</span>
                <span className="text-xl">🪃</span>
              </button>

              {/* Lasso */}
              <button
                onClick={() => {
                  setActiveTool('lasso');
                  setIsRadialWheelOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-xl border transition shadow-xl cursor-pointer ${
                  activeTool === 'lasso'
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-amber-500/40'
                    : 'bg-slate-900/90 text-white border-white/20 hover:bg-slate-800'
                } ${recommendedTool === 'lasso' ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
              >
                {recommendedTool === 'lasso' && (
                  <span className="text-[9px] uppercase font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full">
                    Anbefalt
                  </span>
                )}
                <span className="text-xs font-bold">Lasso</span>
                <span className="text-xl">🪢</span>
              </button>

              {/* Solkast */}
              <button
                onClick={() => {
                  setActiveTool('solkast');
                  setIsRadialWheelOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-xl border transition shadow-xl cursor-pointer ${
                  activeTool === 'solkast'
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-amber-500/40'
                    : 'bg-slate-900/90 text-white border-white/20 hover:bg-slate-800'
                } ${recommendedTool === 'solkast' ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
              >
                {recommendedTool === 'solkast' && (
                  <span className="text-[9px] uppercase font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full">
                    Anbefalt
                  </span>
                )}
                <span className="text-xs font-bold">Solkast</span>
                <span className="text-xl">☀️</span>
              </button>
            </div>
          )}

          {/* Hoved-handlingsknapp (Radial Toggle & Kast) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRadialWheelOpen(prev => !prev)}
              className="w-14 h-14 rounded-full bg-slate-950/90 backdrop-blur-xl border-2 border-amber-400 text-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition cursor-pointer relative"
              title="Velg verktøy"
            >
              {activeTool === 'lasso' ? '🪢' : activeTool === 'boomerang' ? '🪃' : '☀️'}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-slate-950 font-black">
                ⚙️
              </div>
            </button>

            {/* Kast-knapp (for de som foretrekker å trykke fremfor å sveipe) */}
            <button
              onClick={() => setThrowSignal(prev => prev + 1)}
              className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-xs shadow-xl shadow-amber-500/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Kast {activeTool === 'lasso' ? 'Lasso' : activeTool === 'boomerang' ? 'Bumerang' : 'Solkast'}!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
