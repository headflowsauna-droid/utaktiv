import React, { useState, useEffect, useRef } from 'react';
import { SolarStatus } from '../engine/solar';
import { calculateLuxPoints } from '../engine/gamification';
import { grantEarned } from '../engine/cloudSync';
import { Sun, Zap, Play, Pause, ShoppingBag, HeartHandshake } from 'lucide-react';

interface DaylightSensorWidgetProps {
  solar: SolarStatus;
  onOpenStore: () => void;
  onOpenJunior: () => void;
  onOpenWallet?: () => void;
  userPoints?: number;
  onPointsUpdated: (newBalance: number) => void;
}

export const DaylightSensorWidget: React.FC<DaylightSensorWidgetProps> = ({
  solar,
  onOpenStore,
  onOpenJunior,
  onOpenWallet: _onOpenWallet,
  userPoints: _userPoints,
  onPointsUpdated,
}) => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [sessionPointsEarned, setSessionPointsEarned] = useState<number>(0);
  const [liveLux, setLiveLux] = useState<number>(solar.actualEstimatedLux);
  const [hasAmbientSensor, setHasAmbientSensor] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Synkroniser liveLux med meteorologisk estimat
  useEffect(() => {
    setLiveLux(solar.actualEstimatedLux);
  }, [solar.actualEstimatedLux]);

  // Sjekk om enheten har Web Ambient Light Sensor API (f.eks. Android Chrome)
  useEffect(() => {
    if ('AmbientLightSensor' in window) {
      try {
        // @ts-ignore - AmbientLightSensor er delvis eksperimentell
        const sensor = new window.AmbientLightSensor();
        sensor.onreading = () => {
          if (sensor.illuminance && sensor.illuminance > 0) {
            setLiveLux(Math.round(sensor.illuminance));
            setHasAmbientSensor(true);
          }
        };
        sensor.onerror = (event: any) => {
          console.warn('AmbientLightSensor feilet:', event.error);
        };
        sensor.start();
        return () => {
          try { sensor.stop(); } catch (_) {}
        };
      } catch (e) {
        console.warn('Kunne ikke starte AmbientLightSensor:', e);
      }
    }
  }, []);

  // Håndter aktiv dagslysøkt
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setSessionSeconds(prev => {
          const nextSec = prev + 1;
          // Hvert 10. sekund krediteres dagslyspoeng basert på sunt dagslys (uavhengig av UV)
          if (nextSec % 10 === 0) {
            const added = calculateLuxPoints(Math.max(5000, liveLux), 1 / 6, 0);
            if (added > 0) {
              const key = `daylight-${new Date().toISOString().slice(0, 13)}-${nextSec}`;
              void grantEarned({ points: added, reason: 'daylight', idempotencyKey: key }).then(result => {
                if (result.applied > 0) {
                  setSessionPointsEarned(current => current + result.applied);
                  onPointsUpdated(result.balance);
                }
              });
            }
          }
          return nextSec;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, liveLux, solar.uvIndex]);

  const toggleSession = () => {
    setIsSessionActive(!isSessionActive);
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Dagslysmål: f.eks. 45 minutter anbefalt
  const dailyTargetMinutes = 45;
  const currentMinutes = Math.min(dailyTargetMinutes, Math.floor(sessionSeconds / 60) + 18); // 18m baseline i dag
  const targetPercent = Math.min(100, Math.round((currentMinutes / dailyTargetMinutes) * 100));

  // Kalkuler posisjon på solbuen (0-100%)
  const altitudeClamped = Math.max(0, Math.min(60, solar.solarAltitudeDegrees));
  const sunProgressNorm = solar.solarAltitudeDegrees > 0 ? (altitudeClamped / 60) : 0;
  // Buevei: start x=20, y=55; apex x=100, y=15; end x=180, y=55
  // Parametrisk approksimasjon av solposisjon på buen
  const sunX = Math.round(20 + sunProgressNorm * 160);
  const sunY = Math.round(55 - Math.sin(sunProgressNorm * Math.PI) * 40);

  return (
    <div className="bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/90 rounded-2xl p-5 shadow-sm dark:shadow-2xl relative overflow-hidden backdrop-blur-md transition-colors">
      {/* Subtil solglød i bakgrunnen */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center relative z-10">
        {/* Kolonne 1: Sirkadisk Solbue & Status (5 cols) */}
        <div className="lg:col-span-5 flex items-center gap-4">
          {/* SVG Solbue */}
          <div className="relative w-32 h-20 shrink-0">
            <svg viewBox="0 0 200 90" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="solarArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#f97316" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Horisontlinje */}
              <line x1="10" y1="65" x2="190" y2="65" stroke="currentColor" className="text-zinc-300 dark:text-zinc-800" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Solbane-bue */}
              <path
                d="M 20 65 Q 100 5 180 65"
                fill="none"
                stroke="url(#solarArcGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Solposisjons-indikator */}
              <circle
                cx={sunX}
                cy={sunY}
                r="7"
                fill="#fbbf24"
                className="drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
              />
              <circle
                cx={sunX}
                cy={sunY}
                r="3"
                fill="#ffffff"
              />
            </svg>
            <div className="absolute bottom-0 inset-x-0 flex justify-between text-[9px] font-mono text-zinc-400 dark:text-zinc-500 px-1">
              <span>Morgen</span>
              <span>Zenit</span>
              <span>Kveld</span>
            </div>
          </div>

          {/* Dagslysmåler & luks */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 dark:text-orange-400 font-mono">
                Sirkadisk Solhvelv
              </span>
              {hasAmbientSensor && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono">
                  Sensor
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono tracking-tight">
                {liveLux.toLocaleString('no-NO')}
              </span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">LUKS</span>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Solhøyde: <strong className="text-zinc-800 dark:text-zinc-200">{solar.solarAltitudeDegrees > 0 ? `+${solar.solarAltitudeDegrees}` : solar.solarAltitudeDegrees}°</strong> • {solar.cloudCoverPercent}% skydekke
            </p>
          </div>
        </div>

        {/* Kolonne 2: Dagslysmål for helse & døgnrytme (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 transition-colors">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Dagslysmål i dag
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
              {currentMinutes} / {dailyTargetMinutes} min
            </span>
          </div>

          {/* Fremgangsbar */}
          <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${targetPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>{targetPercent}% oppnådd</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              Sunt dagslys (helt uten UV)
            </span>
          </div>
        </div>

        {/* Kolonne 3: Handling & Timer CTA (3 cols) */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-stretch gap-2 justify-center">
          <button
            onClick={toggleSession}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
              isSessionActive
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse shadow-amber-500/20'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 hover:scale-[1.02]'
            }`}
          >
            {isSessionActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Økt aktiv ({formatTimer(sessionSeconds)}) • +{sessionPointsEarned}p</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Dagslysøkt</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
            <button
              onClick={onOpenJunior}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center gap-1"
            >
              <HeartHandshake className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              <span>Sol Junior</span>
            </button>
            <button
              onClick={onOpenStore}
              className="hover:text-orange-600 dark:hover:text-orange-400 transition flex items-center gap-1"
            >
              <ShoppingBag className="w-3 h-3 text-orange-500 dark:text-orange-400" />
              <span>Sol-Børsen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
