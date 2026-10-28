import React, { useState } from 'react';
import { ActivityItem } from '../engine/activities';
import { getActivityHeroUrl } from '../engine/imageResolver';
import { SolarStatus } from '../engine/solar';
import { SupportedLanguage } from '../engine/i18n';
import {
  Sun,
  MapPin,
  Heart,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Flame,
  Info,
  Clock,
  Navigation,
} from 'lucide-react';

export interface VisualActivityCardProps {
  activity: ActivityItem;
  solar: SolarStatus;
  isInTur: boolean;
  isSaved: boolean;
  onAddToTur: (activity: ActivityItem) => void;
  onToggleSave: (activityId: string) => void;
  onOpenCheckin?: (activity: ActivityItem) => void;
  onOpenPartnerModal?: (mode: 'sjel_og_gane' | 'heit_sauna') => void;
  lang?: SupportedLanguage;
}

export function resolveGalleryImages(activity: ActivityItem): Array<{ url: string; caption: string }> {
  const images: Array<{ url: string; caption: string }> = [];

  // 1. Hero natur-/stibilde
  const hero = getActivityHeroUrl(activity.locationName, activity.city, activity.imageUrl);
  images.push({
    url: hero,
    caption: `${activity.title} (${activity.locationName})`,
  });

  // 2. Kafé / bolle / kaffepause-bilde
  const isEidfjord = activity.city.toLowerCase() === 'eidfjord' || activity.id.includes('eidfjord');
  const isBergen = activity.city.toLowerCase() === 'bergen';

  if (isEidfjord) {
    images.push({
      url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      caption: 'Sjel og Gane — 300 år gammelt gjestgiveri og lokal mat',
    });
    images.push({
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      caption: 'Vedfyrt fjordbadstue i Eidfjord sentrum',
    });
  } else if (isBergen) {
    images.push({
      url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
      caption: 'Varme, ferske skillingsboller & kaffe',
    });
    images.push({
      url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
      caption: 'Heit Fjordbadstue ved vannkanten',
    });
  } else {
    images.push({
      url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
      caption: 'Kafé, nystekte vafler og kaffe underveis',
    });
    images.push({
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      caption: 'Fjordbadstue & frisk luft etter turen',
    });
  }

  return images;
}

export const VisualActivityCard: React.FC<VisualActivityCardProps> = ({
  activity,
  solar,
  isInTur,
  isSaved,
  onAddToTur,
  onToggleSave,
  onOpenCheckin,
  onOpenPartnerModal,
  lang = 'no',
}) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const gallery = React.useMemo(() => resolveGalleryImages(activity), [activity]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx(prev => (prev + 1) % gallery.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx(prev => (prev - 1 + gallery.length) % gallery.length);
  };

  // Værberegning for kortet: Opplett og dagslysvindu
  const weatherBadge = React.useMemo(() => {
    const temp = typeof solar.temperatureC === 'number' ? `${Math.round(solar.temperatureC)}°C` : 'Mildt';
    return {
      label: `Opplett & dagslys nå (${temp})`,
      recommendedTime: 'Beste tid: Kl. 11:30–14:30',
    };
  }, [solar.temperatureC]);

  return (
    <article 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-3xl bg-white dark:bg-[#141311] border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Spatial Spotlight Glow (Linear / Apple style) */}
      {mousePos && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-100 z-10"
          style={{
            background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(232, 98, 44, 0.12), transparent 50%)`,
          }}
        />
      )}
      {/* 1. STOR BILDE-KARUSELL MED SVEIP/PILER */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-zinc-900 overflow-hidden">
        <img
          src={gallery[currentImgIdx].url}
          alt={gallery[currentImgIdx].caption}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Mørk kontrastgradient for sylskarp tekst */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35 pointer-events-none" />

        {/* Topp-bar på bildet: Vær-badge og hjerte */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/15 text-xs font-bold shadow-md">
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{weatherBadge.label}</span>
          </div>

          <button
            type="button"
            onClick={() => onToggleSave(activity.id)}
            className="pointer-events-auto p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:text-rose-500 hover:bg-black/70 transition cursor-pointer shadow-md"
            title="Lagre turmål"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Bilde-piler for å bla i opplevelsene */}
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
              aria-label="Forrige bilde"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
              aria-label="Neste bilde"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Bilde-prikker og bildetekst nederst på bildet */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
          <span className="text-[11px] font-bold text-white/90 drop-shadow-md truncate max-w-[75%]">
            📷 {gallery[currentImgIdx].caption}
          </span>

          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
            {gallery.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentImgIdx ? 'bg-white w-3' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. KORT-KROPP: REN, INSPIRERENDE INFORMASJON */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold font-serif-display text-zinc-950 dark:text-white leading-tight">
              {activity.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-[#E8622C]" />
              {activity.locationName}, {activity.city}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
              <Clock className="w-3 h-3" />
              {weatherBadge.recommendedTime}
            </span>
          </div>

          {/* Korte, lekne bilde-chips for opplevelser langs ruten */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <div
              onClick={() => {
                if (activity.id === 'act-sjel-og-gane-eidfjord' || activity.city === 'Eidfjord') {
                  onOpenPartnerModal?.('sjel_og_gane');
                }
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
                  {lang === 'en' ? 'Fresh bakery & coffee' : 'Fersk bakst & kaffe'}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {activity.city === 'Eidfjord' ? 'Sjel & Gane i Eidfjord' : 'Varmestue langs stien'}
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                if (activity.city === 'Eidfjord') {
                  onOpenPartnerModal?.('heit_sauna');
                }
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-[#E8622C] shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
                  {lang === 'en' ? 'Warm fjord sauna' : 'Varm fjordbadstue'}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {activity.city === 'Eidfjord' ? 'Heit Eidfjord Sauna' : 'Etter fotturen'}
                </div>
              </div>
            </div>
          </div>

          {/* Skjulbar/utfoldbar detaljskuff for senior/toalett/tilgjengelighet for å unngå tekststøy */}
          {showDetails && (
            <div className="mt-3 p-3 rounded-2xl bg-stone-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2 animate-fade-in">
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {activity.description}
              </p>
              {activity.seniorSafety && (
                <div className="flex flex-wrap gap-1.5 text-[10px] pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border text-zinc-700 dark:text-zinc-300 font-medium">
                    {activity.seniorSafety.hasPublicRestroom ? '🚻 Toalett tilgjengelig' : '🚫 Ikke toalett'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border text-zinc-700 dark:text-zinc-300 font-medium">
                    {activity.seniorSafety.surface === 'paved' ? '🛣️ Asfalt/fast' : '🌲 Skogssti'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border text-zinc-700 dark:text-zinc-300 font-medium">
                    🚗 Parkering: {activity.seniorSafety.parkingDistanceMeters}m
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. HANDLINGSKNAPPER: ÉN STOR «LEGG TIL I TUR» + DISKRET MER INFO */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddToTur(activity)}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer ${
              isInTur
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-[#E8622C] hover:bg-[#d65521] text-white shadow-orange-500/20'
            }`}
          >
            {isInTur ? (
              <>
                <Check className="w-4 h-4" />
                <span>I turen · Åpne turbygger</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Legg til i tur</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
            title={showDetails ? 'Skjul detaljer' : 'Vis detaljer & toalettinfo'}
          >
            <Info className="w-4 h-4" />
          </button>

          {onOpenCheckin && (
            <button
              type="button"
              onClick={() => onOpenCheckin(activity)}
              className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-orange-600 dark:text-orange-400 transition cursor-pointer"
              title="GPS Sjekk-inn"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
