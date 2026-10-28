import React, { useRef } from 'react';
import { ActivityItem } from '../engine/activities';
import { getActivityHeroUrl } from '../engine/imageResolver';
import { getStopsForRoute } from '../engine/businessTips';
import { DistanceBadge, OpenNowBadge, DealBadge } from './LocationPrompt';
import {
  MapPin,
  Heart,
  Plus,
  Check,
  Mountain,
  Flame,
  Coffee,
  Award,
  ChevronRight,
  Compass,
} from 'lucide-react';

interface SpatialActivityCardProps {
  activity: ActivityItem;
  score: number;
  isSaved: boolean;
  isInTur: boolean;
  isCompleted: boolean;
  distanceKm?: number;
  travelMinWalk?: number;
  openNow?: boolean | null;
  deal?: any;
  lang?: string;
  matchReasons?: string[];
  onSelect: (activity: ActivityItem) => void;
  onToggleSave: (id: string) => void;
  onAddToTur: (activity: ActivityItem) => void;
}

export const SpatialActivityCard: React.FC<SpatialActivityCardProps> = ({
  activity,
  score,
  isSaved,
  isInTur,
  isCompleted,
  distanceKm,
  travelMinWalk,
  openNow,
  deal,
  lang = 'no',
  matchReasons = [],
  onSelect,
  onToggleSave,
  onAddToTur,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Finn eventuell sanntids-værbegrunnelse
  const weatherReason = matchReasons.find(
    r => r.includes('🌧️') || r.includes('☀️') || r.includes('☕') || r.includes('🌲') || r.includes('Værfavoritt')
  );

  // 1. Spatial Spotlight: Beregn musepekerens relative posisjon i sanntid
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const heroImageUrl = getActivityHeroUrl(activity.locationName, activity.city, activity.imageUrl);
  const { verifiedStops } = getStopsForRoute(activity.id, activity.title, activity.city);

  const hasCafe = verifiedStops.some(s => s.id.includes('sjel-og-gane') || s.name.toLowerCase().includes('gård') || s.name.toLowerCase().includes('kafé'));
  const hasSauna = activity.city.toLowerCase() === 'eidfjord' || verifiedStops.some(s => s.id.includes('sauna') || s.name.toLowerCase().includes('badstue'));

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={() => onSelect(activity)}
      style={{
        transition: 'transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.28s ease',
      }}
      className="group relative rounded-3xl bg-white dark:bg-[#141311] border border-zinc-200/90 dark:border-white/[0.08] hover:border-orange-500/50 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1.5 active:scale-[0.985] flex flex-col justify-between overflow-hidden cursor-pointer select-none"
    >
      {/* SPATIAL SPOTLIGHT OVERLAY (Følger musepekeren med lun solglød) */}
      <div
        style={{
          background: 'radial-gradient(420px circle at var(--mouse-x, -200px) var(--mouse-y, -200px), rgba(232, 98, 44, 0.12), transparent 75%)',
        }}
        className="absolute inset-0 pointer-events-none rounded-3xl z-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
      />

      <div>
        {/* HERO-BILDE MED FORTRYLLENDE 16:10 FORMAT */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-zinc-900">
          <img
            src={heroImageUrl}
            alt={activity.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Dyp filmisk kontrast-gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

          {/* Topp-bar på bildet: Match % og Hjerte */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-[#E8622C] text-white shadow-md">
                {score}% solmatch
              </span>

              {activity.trail?.type === 'mountain_hike' && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-200 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                  <Mountain className="w-3 h-3" />
                  Fjelltur
                </span>
              )}

              {activity.trail?.type === 'cross_country_ski' && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-950/80 text-sky-200 border border-sky-500/30 backdrop-blur-md flex items-center gap-1">
                  <span>⛷️</span>
                  Skiløype
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(activity.id);
              }}
              className="pointer-events-auto p-2.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white hover:text-rose-500 transition cursor-pointer shadow-md"
              title="Lagre turmål"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Bunn-info på bildet: Løypeinfo & vanskelighet */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] z-20 pointer-events-none">
            {activity.trail ? (
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] backdrop-blur-md shadow-md text-white ${
                  activity.trail.difficulty === 'green'
                    ? 'bg-emerald-600/90'
                    : activity.trail.difficulty === 'blue'
                    ? 'bg-blue-600/90'
                    : 'bg-rose-600/90'
                }`}>
                  {activity.trail.difficulty === 'green' && '🟢 Enkel'}
                  {activity.trail.difficulty === 'blue' && '🔵 Middels'}
                  {activity.trail.difficulty === 'red' && '🔴 Krevende'}
                </span>

                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-zinc-100 text-[10px] font-mono">
                  {activity.trail.distanceKm} km • +{activity.trail.elevationMeters} hm
                </span>
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1 text-[10px]">
                ☀️ +{activity.checkinTarget?.solarBonusLux || 250} Luks-poeng
              </span>
            )}

            {isCompleted && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-zinc-950 flex items-center gap-1 shadow-md">
                <Award className="w-3 h-3" />
                Fullført ✓
              </span>
            )}
          </div>
        </div>

        {/* KORT-KROPP: TITTEL, STED OG LUFTIG OPPSUMMERING */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold font-serif-display text-zinc-950 dark:text-white group-hover:text-[#E8622C] transition-colors leading-snug">
              {(lang === 'en' && activity.titleEn) ? activity.titleEn : activity.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-[#E8622C] shrink-0" />
              {activity.locationName}, {activity.city}
            </span>
            <DistanceBadge distanceKm={distanceKm} travelMinWalk={travelMinWalk} />
            <OpenNowBadge openNow={openNow} />
          </div>

          {deal && (
            <div className="mt-2">
              <DealBadge deal={deal} />
            </div>
          )}

          {weatherReason && (
            <div className="mt-2 text-[11px] font-medium text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span>{weatherReason}</span>
            </div>
          )}

          {/* FASILITET-CHIPS (Kompakt oversikt over opplevelser underveis) */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/[0.06]">
            {hasCafe && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 text-[10px] font-semibold flex items-center gap-1">
                <Coffee className="w-3 h-3 text-amber-600" />
                Kafé / Gård
              </span>
            )}

            {hasSauna && (
              <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-[#E8622C] border border-orange-200/60 dark:border-orange-900/40 text-[10px] font-semibold flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#E8622C]" />
                Fjordbadstue
              </span>
            )}

            {activity.seniorSafety?.hasPublicRestroom && (
              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium">
                🚻 Toalett
              </span>
            )}

            {activity.seniorSafety?.surface === 'paved' && (
              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium">
                🛣️ Fast asfalt
              </span>
            )}
          </div>

          {/* 1-2 linjer dagslystekst / ingress */}
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {activity.description}
          </p>
        </div>
      </div>

      {/* RENGJORT BUNNLINJE: KUN TO KLARE HANDLINGER */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(activity);
          }}
          className="flex-1 min-h-11 py-2.5 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-[#E8622C] hover:text-white dark:hover:bg-[#E8622C] dark:hover:text-white text-zinc-900 dark:text-zinc-100 font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Compass className="w-4 h-4 text-[#E8622C] group-hover:text-white transition-colors" />
          <span>Se rute & kart</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60 ml-0.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToTur(activity);
          }}
          className={`min-h-11 py-2.5 px-3.5 rounded-2xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border ${
            isInTur
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-orange-500'
          }`}
          title={isInTur ? 'Lagt til i turen' : 'Legg til i tur'}
        >
          {isInTur ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span>I tur ✓</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-[#E8622C]" />
              <span>+ Tur</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
