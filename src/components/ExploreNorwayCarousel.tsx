import React from 'react';
import { SupportedLanguage, t } from '../engine/i18n';
import { Compass, MapPin, Sun } from 'lucide-react';

export interface NorwayRegion {
  id: string;
  cityName: string;
  titleKey: 'regionVestland' | 'regionHardanger' | 'regionRogaland' | 'regionNordland' | 'regionTrondelag' | 'regionAgder' | 'regionOstland';
  tagKey: 'regionVestlandTag' | 'regionHardangerTag' | 'regionRogalandTag' | 'regionNordlandTag' | 'regionTrondelagTag' | 'regionAgderTag' | 'regionOstlandTag';
  highlight: string;
  highlightEn: string;
  imageUrl: string;
  badge: string;
  badgeEn: string;
}

export const NORWAY_REGIONS: NorwayRegion[] = [
  {
    id: 'vestland',
    cityName: 'Bergen',
    titleKey: 'regionVestland',
    tagKey: 'regionVestlandTag',
    highlight: 'Åsane (Vikinghytten, Postveien, Sætregården) & 7 Fjell',
    highlightEn: 'Åsane Trails, Sætregården Farm, Vidden & 7 Mountains',
    imageUrl: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1200&q=80',
    badge: 'Bergen & Åsane',
    badgeEn: 'Fjord Gateway',
  },
  {
    id: 'hardanger',
    cityName: 'Eidfjord',
    titleKey: 'regionHardanger',
    tagKey: 'regionHardangerTag',
    highlight: 'Kjeåsen, Vøringsfossen, Sjel & Gane & Gratis Fjordbadstue',
    highlightEn: 'Kjeåsen, Vøringsfossen, Sjel & Gane & Free Fjord Sauna',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    badge: 'Hardangerperle',
    badgeEn: 'Hardanger Gem',
  },
  {
    id: 'rogaland',
    cityName: 'Stavanger',
    titleKey: 'regionRogaland',
    tagKey: 'regionRogalandTag',
    highlight: 'Preikestolen, Lysefjorden & Jæren',
    highlightEn: 'Pulpit Rock, Lysefjord & Surfing Dunes',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    badge: 'Preikestolen',
    badgeEn: 'Pulpit Rock',
  },
  {
    id: 'nordland',
    cityName: 'Bodø',
    titleKey: 'regionNordland',
    tagKey: 'regionNordlandTag',
    highlight: 'Keiservarden, Midnattssol & Nordlys',
    highlightEn: 'Midnight Sun, Aurora & Arctic Peaks',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80',
    badge: 'Arktisk Sol',
    badgeEn: 'Arctic Magic',
  },
  {
    id: 'trondelag',
    cityName: 'Trondheim',
    titleKey: 'regionTrondelag',
    tagKey: 'regionTrondelagTag',
    highlight: 'Bakklandet, Bymarka & Nidelva',
    highlightEn: 'Historic Wharves, Cathedral & Pine Trails',
    imageUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80',
    badge: 'Kultur & Marka',
    badgeEn: 'Heritage & Forests',
  },
  {
    id: 'agder',
    cityName: 'Kristiansand',
    titleKey: 'regionAgder',
    tagKey: 'regionAgderTag',
    highlight: 'Skjærgård, Baneheia & Svaberg',
    highlightEn: 'Summer Islands, Lighthouses & Sea Salt',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    badge: 'Sørlandssol',
    badgeEn: 'Coastal Sun',
  },
  {
    id: 'ostland',
    cityName: 'Oslo',
    titleKey: 'regionOstland',
    tagKey: 'regionOstlandTag',
    highlight: 'Nordmarka, Holmenkollen & Havnepromenaden',
    highlightEn: 'Oslo Fjord, Opera & Endless Pine Forests',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    badge: 'Hovedstaden & Skogen',
    badgeEn: 'Capital & Fjord',
  },
];

interface ExploreNorwayCarouselProps {
  selectedCity: string;
  onSelectCity: (cityName: string) => void;
  lang: SupportedLanguage;
}

export const ExploreNorwayCarousel: React.FC<ExploreNorwayCarouselProps> = ({
  selectedCity,
  onSelectCity,
  lang,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 dark:bg-orange-500/25 flex items-center justify-center text-[#E8622C]">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>{t('exploreNorwayTitle', lang)}</span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              {t('exploreNorwaySubtitle', lang)}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-500/30">
          {NORWAY_REGIONS.length} {lang === 'no' ? 'regioner' : 'regions'}
        </span>
      </div>

      {/* Rullbar opplevelseskarusell med levende, ekte bilder av Norge */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth snap-x">
        {NORWAY_REGIONS.map((region) => {
          const isSelected = selectedCity.toLowerCase() === region.cityName.toLowerCase();

          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onSelectCity(region.cityName)}
              className={`group relative shrink-0 w-64 sm:w-72 h-44 rounded-2xl overflow-hidden snap-start text-left transition-all duration-300 shadow-md cursor-pointer ${
                isSelected
                  ? 'ring-3 ring-orange-500 shadow-orange-500/20 scale-[1.02]'
                  : 'hover:scale-[1.01] hover:shadow-xl opacity-90 hover:opacity-100'
              }`}
            >
              {/* Bakgrunnsbilde fra Norge */}
              <img
                src={region.imageUrl}
                alt={t(region.titleKey, lang)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.82] contrast-[1.05]"
                loading="lazy"
              />

              {/* Mørk kontrast-gradient for sylskarp lesbarhet */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Topp-tagger */}
              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 z-10">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                  {lang === 'no' ? region.badge : region.badgeEn}
                </span>

                {isSelected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white flex items-center gap-1 shadow-md animate-pulse">
                    <Sun className="w-3 h-3" />
                    {lang === 'no' ? 'Reiser her nå' : 'Exploring now'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 backdrop-blur-md text-white/90 group-hover:bg-white/30 transition">
                    {lang === 'no' ? 'Reis hit' : 'Explore'} →
                  </span>
                )}
              </div>

              {/* Tekst og tittel nederst */}
              <div className="absolute bottom-2.5 inset-x-3 z-10 space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] font-medium text-amber-300">
                  <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                  <span>{region.cityName}</span>
                </div>

                <h4 className="text-sm font-black text-white tracking-tight drop-shadow-sm leading-snug">
                  {t(region.titleKey, lang)}
                </h4>

                <p className="text-[11px] text-zinc-200 line-clamp-1 drop-shadow-sm">
                  {lang === 'no' ? region.highlight : region.highlightEn}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
