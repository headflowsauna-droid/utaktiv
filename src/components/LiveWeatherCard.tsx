import React from 'react';
import { SolarStatus } from '../engine/solar';
import { MetForecast } from '../engine/weather';
import {
  Sun,
  Sparkles,
  MessageSquare,
  Thermometer,
  Shield,
  Flame,
} from 'lucide-react';

interface LiveWeatherCardProps {
  city: string;
  solar: SolarStatus;
  forecast?: MetForecast | null;
  onOpenChat?: () => void;
  onOpenRadar?: () => void;
}

export const LiveWeatherCard: React.FC<LiveWeatherCardProps> = ({
  city,
  solar,
  forecast,
  onOpenChat,
  onOpenRadar: _onOpenRadar,
}) => {
  const precip = forecast?.precipitationMm ?? 0;
  const isRaining = precip > 0.2;
  const temp = forecast?.temperatureC ?? (typeof solar.temperatureC === 'number' ? solar.temperatureC : 9);
  const cloud = forecast?.cloudCoverPercent ?? solar.cloudCoverPercent;
  const wind = forecast?.windMps ?? 3.2;
  const lux = solar.actualEstimatedLux > 0 ? solar.actualEstimatedLux : 5000;
  const isSunny = !isRaining && cloud <= 45 && (solar.solarAltitudeDegrees > 0 || lux >= 10000);

  // Dynamisk tittel og veiledningstekst
  let statusBadge = '☁️ Opplett & mildt';
  let badgeColor = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
  let adviceHeadline = `Opplett i ${city} nå (${temp}°C)`;
  let adviceDescription = `Vi har ca. ${lux.toLocaleString('no-NO')} luks ute. Sol- og utsiktsruter som Fløyen og Tippetue er prioritert øverst.`;

  if (isRaining) {
    statusBadge = `🌧️ Nedbør nå (${precip > 0 ? `${precip} mm/t` : 'regn'})`;
    badgeColor = 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';
    adviceHeadline = `Bergensregn akkurat nå (${temp}°C)`;
    adviceDescription = `Utaktiv har automatisk prioritert varme fjordbadstuer, lune skogsstier under trekronene og kaféer med peis og varm kakao øverst i listen!`;
  } else if (isSunny) {
    statusBadge = '☀️ Sol & klart dagslysvindu';
    badgeColor = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    adviceHeadline = `Nydelig dagslysvindu i ${city}!`;
    adviceDescription = `Maksimalt dagslys (~${lux.toLocaleString('no-NO')} luks)! Toppturer, solvegger og vestvendt utsikt er løftet til topps.`;
  } else if (wind > 7.5) {
    statusBadge = `💨 Frisk vind (${wind} m/s)`;
    badgeColor = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
    adviceHeadline = `Frisk bris i ${city}`;
    adviceDescription = `Lune skogsløyper i le for vinden er prioritert for en mer behagelig turopplevelse.`;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent dark:from-amber-500/10 dark:via-orange-500/5 dark:to-zinc-900 border border-orange-500/20 dark:border-orange-500/30 p-4 sm:p-5 shadow-sm mb-6 transition-all">
      {/* Bakgrunnsglød */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Venstre: Status og Sanntidsanbefaling */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {statusBadge}
            </span>

            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1 bg-white/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
              <Thermometer className="w-3 h-3 text-orange-500" />
              {temp}°C
            </span>

            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1 bg-white/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
              <Sun className="w-3 h-3 text-amber-500" />
              ~{lux.toLocaleString('no-NO')} luks
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 pt-0.5">
            <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
            {adviceHeadline}
          </h3>

          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
            {adviceDescription}
          </p>

          {/* Hurtig-indikatorer for hva listen prioriterer */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="text-zinc-400 dark:text-zinc-500">Prioriteres nå:</span>
            {isRaining ? (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-200 font-medium">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Heit Fjordbadstue
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  ☕ Kaféer & varm drikke
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Skog i le for regn
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 font-medium">
                  <Sun className="w-3 h-3 text-amber-500" />
                  Fløyen & Tippetue
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  🌅 Vestvendt kveldssol
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  👶 Sol Junior & Trollskogen
                </span>
              </>
            )}
          </div>
        </div>

        {/* Høyre: Snarvei til Sol Concierge AI */}
        {onOpenChat && (
          <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-orange-500/20 pt-3 sm:pt-0 sm:pl-4">
            <button
              onClick={onOpenChat}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Spør Sol Concierge AI
            </button>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              Drevet av Gemini 3.8
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
