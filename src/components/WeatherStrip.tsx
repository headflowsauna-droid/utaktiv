import React from 'react';
import { MetForecast, MetOutlookPoint } from '../engine/weather';
import { SolarStatus, calculateSolarAltitude } from '../engine/solar';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Clock,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export interface HourlyWeatherCardData {
  isoTime: string;
  hourLabel: string;
  temperatureC: number;
  precipitationMm: number;
  cloudCoverPercent: number;
  windMps: number;
  isOpplett: boolean;
  isSunny: boolean;
  estimatedLux: number;
  conditionLabel: string;
}

export interface OpplettSummary {
  isOpplettNow: boolean;
  headline: string;
  subline: string;
  bestWindowLabel: string;
  bestStartHour: string;
  hours: HourlyWeatherCardData[];
}

function formatHourClock(isoTime: string, index: number): string {
  if (index === 0) return 'Nå';
  const d = new Date(isoTime);
  if (Number.isNaN(d.getTime())) return `Om ${index}t`;
  const hh = String(d.getHours()).padStart(2, '0');
  return `${hh}:00`;
}

function estimateHourLux(isoTime: string, lat: number, lng: number, cloudCoverPercent: number): number {
  const d = new Date(isoTime);
  const validDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const { altitude } = calculateSolarAltitude(validDate, lat, lng);
  if (altitude <= 0) return 250;
  const clearSkyLux = Math.min(45000, Math.max(2500, Math.round(Math.sin((altitude * Math.PI) / 180) * 65000)));
  const cloudFactor = 1 - Math.min(0.82, (Math.max(0, Math.min(100, cloudCoverPercent)) / 100) * 0.78);
  return Math.max(800, Math.round(clearSkyLux * cloudFactor));
}

function describeCondition(precipitationMm: number, cloudCoverPercent: number): string {
  if (precipitationMm > 0.8) return 'Regnbyge';
  if (precipitationMm > 0.1) return 'Litt yr';
  if (cloudCoverPercent <= 30) return 'Sol & klart';
  if (cloudCoverPercent <= 68) return 'Lettskyet opplett';
  return 'Opplett & mildt';
}

/**
 * Bygger en komplett 8-timers «Opplett-radar» fra MET-varsel (eller trygg, realistisk dagsprofil mens MET laster).
 */
export function buildOpplettSummary(
  city: string,
  solar: SolarStatus,
  forecast: MetForecast | null,
  outlook: MetOutlookPoint[],
  lat = 60.39,
  lng = 5.32
): OpplettSummary {
  const baseTemp =
    forecast?.temperatureC ??
    (typeof solar.temperatureC === 'number' ? solar.temperatureC : 9);
  const baseCloud =
    forecast?.cloudCoverPercent ??
    (typeof solar.cloudCoverPercent === 'number' ? solar.cloudCoverPercent : 35);
  const basePrecip = forecast?.precipitationMm ?? 0;
  const baseWind = forecast?.windMps ?? 3.2;

  const rawPoints: MetOutlookPoint[] =
    outlook && outlook.length >= 4
      ? outlook.slice(0, 8)
      : Array.from({ length: 8 }, (_, idx) => {
          const d = new Date(Date.now() + idx * 3600 * 1000);
          const hour = d.getHours();
          const midDayBonus = hour >= 10 && hour <= 15 ? 2 : 0;
          const cloudShift = idx === 2 || idx === 3 ? -10 : idx === 6 ? 12 : 0;
          return {
            time: d.toISOString(),
            temperatureC: Math.round((baseTemp + midDayBonus - (idx > 5 ? 1 : 0)) * 10) / 10,
            cloudCoverPercent: Math.max(10, Math.min(95, baseCloud + cloudShift)),
            windMps: baseWind,
            precipitationMm: idx === 0 ? basePrecip : 0,
          };
        });

  const hours: HourlyWeatherCardData[] = rawPoints.map((pt, idx) => {
    const precip = Math.max(0, Number(pt.precipitationMm || 0));
    const cloud = Math.max(0, Math.min(100, Math.round(pt.cloudCoverPercent)));
    const isOpplett = precip <= 0.1;
    const isSunny = isOpplett && cloud <= 55;
    const hourLabel = formatHourClock(pt.time, idx);
    const estimatedLux =
      idx === 0 && solar.actualEstimatedLux > 0
        ? solar.actualEstimatedLux
        : estimateHourLux(pt.time, lat, lng, cloud);

    return {
      isoTime: pt.time,
      hourLabel,
      temperatureC: Math.round(pt.temperatureC),
      precipitationMm: Math.round(precip * 10) / 10,
      cloudCoverPercent: cloud,
      windMps: Math.round((pt.windMps || 3) * 10) / 10,
      isOpplett,
      isSunny,
      estimatedLux,
      conditionLabel: describeCondition(precip, cloud),
    };
  });

  const isOpplettNow = hours[0]?.isOpplett ?? true;
  const firstOpplettIdx = hours.findIndex(h => h.isOpplett);

  let bestStartIdx = firstOpplettIdx >= 0 ? firstOpplettIdx : 0;
  for (let i = 0; i < hours.length; i++) {
    if (hours[i].isSunny) {
      bestStartIdx = i;
      break;
    }
  }

  const bestHourObj = hours[bestStartIdx] || hours[0];
  const bestEndObj = hours[Math.min(hours.length - 1, bestStartIdx + 3)] || bestHourObj;
  const startClock =
    bestHourObj.hourLabel === 'Nå'
      ? `${String(new Date().getHours()).padStart(2, '0')}:00`
      : bestHourObj.hourLabel;
  const endClock =
    bestEndObj.hourLabel === 'Nå'
      ? `${String((new Date().getHours() + 3) % 24).padStart(2, '0')}:00`
      : bestEndObj.hourLabel;

  const bestWindowLabel = `Kl. ${startClock}–${endClock}`;

  const headline = isOpplettNow
    ? `Opplett i ${city} nå (${hours[0]?.temperatureC ?? 9}°C) — beste turvindu ${bestWindowLabel}`
    : firstOpplettIdx > 0
      ? `Litt nedbør akkurat nå — det blir opplett i ${city} fra kl. ${hours[firstOpplettIdx].hourLabel}`
      : `Værvarsel for ${city} — sjekk beste tidspunkt for tur`;

  const subline = isOpplettNow
    ? `0,0 mm nedbør og opptil ${(bestHourObj?.estimatedLux ?? 10000).toLocaleString('nb-NO')} luks ute. Perfekt for å gå ut etter bolle, kaffe og badstue.`
    : `Planlegg turen til ${bestWindowLabel} så går dere ut akkurat når det tørker opp og dagslyset er på sitt beste.`;

  return {
    isOpplettNow,
    headline,
    subline,
    bestWindowLabel,
    bestStartHour: startClock,
    hours,
  };
}

interface WeatherStripProps {
  city: string;
  solar: SolarStatus;
  forecast: MetForecast | null;
  outlook: MetOutlookPoint[];
  lat: number;
  lng: number;
  onPlanInWindow: (startHour: string) => void;
}

export const WeatherStrip: React.FC<WeatherStripProps> = ({
  city,
  solar,
  forecast,
  outlook,
  lat,
  lng,
  onPlanInWindow,
}) => {
  const summary = React.useMemo(
    () => buildOpplettSummary(city, solar, forecast, outlook, lat, lng),
    [city, solar, forecast, outlook, lat, lng]
  );

  const renderWeatherIcon = (h: HourlyWeatherCardData) => {
    if (!h.isOpplett) {
      return <CloudRain className="w-5 h-5 text-sky-500" />;
    }
    if (h.cloudCoverPercent <= 30) {
      return <Sun className="w-5 h-5 text-[#E8622C]" />;
    }
    if (h.cloudCoverPercent <= 70) {
      return <CloudSun className="w-5 h-5 text-amber-500" />;
    }
    return <Cloud className="w-5 h-5 text-zinc-400" />;
  };

  return (
    <section
      aria-label={`Værmelding og opplett-radar for ${city}`}
      className="rounded-3xl bg-white dark:bg-[#141311] border border-zinc-200/90 dark:border-zinc-800 p-5 sm:p-6 shadow-sm space-y-4"
    >
      {/* Topp: Status-pille, overskrift og hurtigknapp for å planlegge i opplett-vinduet */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                summary.isOpplettNow
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{summary.isOpplettNow ? 'Opplett nå' : 'Opplett-varsel'}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-zinc-900 text-[#E8622C] border border-orange-200/70 dark:border-zinc-800 text-xs font-bold">
              <Sun className="w-3.5 h-3.5" />
              <span>Beste sol- og opplettvindu: {summary.bestWindowLabel}</span>
            </span>

            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
              Kilde: MET Norway / Yr
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold font-serif-display text-zinc-950 dark:text-white">
            {summary.headline}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            {summary.subline}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onPlanInWindow(summary.bestStartHour)}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[#E8622C] hover:bg-[#d65521] text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Bygg tur i opplett-vinduet ({summary.bestWindowLabel})</span>
          </button>
        </div>
      </div>

      {/* Time-for-time opplett- og sol-linje */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
        {summary.hours.map((h, idx) => (
          <button
            key={h.isoTime || idx}
            type="button"
            onClick={() =>
              onPlanInWindow(
                h.hourLabel === 'Nå'
                  ? `${String(new Date().getHours()).padStart(2, '0')}:00`
                  : h.hourLabel
              )
            }
            title={`Klikk for å legge turstart til ${h.hourLabel} (${h.conditionLabel})`}
            className={`group rounded-2xl p-2.5 border text-left transition flex flex-col justify-between cursor-pointer ${
              h.isSunny
                ? 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 hover:border-[#E8622C]'
                : h.isOpplett
                  ? 'bg-stone-50/80 dark:bg-zinc-900/70 border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/60'
                  : 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200/70 dark:border-sky-900/40'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {h.hourLabel}
              </span>
              {renderWeatherIcon(h)}
            </div>

            <div className="my-2">
              <div className="text-base font-black text-zinc-950 dark:text-white leading-none">
                {h.temperatureC}°C
              </div>
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 truncate mt-1">
                {h.conditionLabel}
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/80">
              <div
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 ${
                  h.isOpplett
                    ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                }`}
              >
                <Droplets className="w-2.5 h-2.5" />
                <span>{h.isOpplett ? 'Opplett' : `${h.precipitationMm} mm`}</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                <span>{(h.estimatedLux / 1000).toFixed(1)}k lx</span>
                <span className="inline-flex items-center gap-0.5">
                  <Wind className="w-2.5 h-2.5" />
                  {Math.round(h.windMps)}m/s
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
