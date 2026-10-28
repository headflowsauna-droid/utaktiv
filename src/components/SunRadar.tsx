import React from 'react';
import { SolarStatus } from '../engine/solar';
import { Sun, Cloud, Sunrise, Compass, Zap } from 'lucide-react';

interface SunRadarProps {
  solar: SolarStatus;
  city: string;
}

export const SunRadar: React.FC<SunRadarProps> = ({ solar, city }) => {
  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm dark:shadow-xl dark:glow-orange relative overflow-hidden transition-colors">
      {/* Bakgrunnsglød */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide uppercase">
              Sanntids Sol- & Dagslysradar
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Posisjon: <span className="text-zinc-800 dark:text-zinc-200 font-medium">{city}</span>
            {' • '}
            {solar.weatherSource === 'met-norway'
              ? 'Skydekke fra MET Norway'
              : 'Estimert skydekke (ingen MET-kontakt)'}
            {typeof solar.temperatureC === 'number' && (
              <>
                {' • '}
                {Math.round(solar.temperatureC)} °C
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-300 flex items-center gap-1.5 shadow-sm">
            <Sun className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
            ~{solar.actualEstimatedLux.toLocaleString('no-NO')} luks ute
          </span>
        </div>
      </div>

      {/* Grid med solmålinger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl transition-colors">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px] mb-1">
            <Compass className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
            Solhøyde
          </div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
            {solar.solarAltitudeDegrees > 0 ? `+${solar.solarAltitudeDegrees}°` : `${solar.solarAltitudeDegrees}°`}
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {solar.solarAltitudeDegrees > 0 ? 'Over horisonten' : 'Under horisonten (skumring)'}
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl transition-colors">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px] mb-1">
            <Cloud className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            {solar.weatherSource === 'met-norway' ? 'Skydekke (MET)' : 'Skydekke'}
          </div>
          <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono">
            {solar.cloudCoverPercent}%
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {solar.cloudCoverPercent > 70 ? 'Spredt dagslys' : 'Solfylt & klart'}
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl transition-colors">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px] mb-1">
            <Sunrise className="w-3.5 h-3.5 text-amber-500 dark:text-yellow-400" />
            Sirkadisk fase
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
            {solar.circadianWindow === 'morning' && 'Morgensol'}
            {solar.circadianWindow === 'midday' && 'Middagslys'}
            {solar.circadianWindow === 'evening' && 'Kveldsro'}
            {solar.circadianWindow === 'night' && 'Natt'}
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Døgnrytme-motor</p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl transition-colors">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px] mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            D-Vitamin-faktor
          </div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {solar.solarAltitudeDegrees > 25 ? 'Høy produksjon' : 'Moderat/Dagslys'}
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Optimal utetid</p>
        </div>
      </div>

      {/* Biologisk gevinst-varsel */}
      <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-orange-950/20 border border-amber-200 dark:border-orange-500/20 flex items-start gap-3 transition-colors">
        <Sun className="w-4 h-4 text-orange-500 dark:text-orange-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-orange-200/90 leading-relaxed">
          <strong className="text-zinc-900 dark:text-white">Biologisk effekt akkurat nå:</strong> {solar.melatoninImpact}
        </p>
      </div>
    </div>
  );
};
