import React from 'react';
import { SolarStatus } from '../engine/solar';
import { ActivityItem } from '../engine/activities';
import { SupportedLanguage, t } from '../engine/i18n';
import { getActivityHeroUrl } from '../engine/imageResolver';
import {
  Compass,
  Gift,
  Bell,
  MapPin,
  Award,
  Flame,
  ChevronRight,
  Navigation,
} from 'lucide-react';

interface HeroBannerProps {
  city: string;
  solar: SolarStatus;
  solAlarmText: string | null;
  onTriggerSolAlarm: () => void;
  featuredActivity?: ActivityItem;
  onSelectActivity: (activity: ActivityItem) => void;
  onAddToTur?: (activity: ActivityItem) => void;
  onOpenGift: () => void;
  onOpenChristmasGift?: () => void;
  onOpenOnboarding: () => void;
  onOpenStore: () => void;
  onToggleRadar: () => void;
  showRadar: boolean;
  usingGps?: boolean;
  onOpenLocationPrompt?: () => void;
  lang?: SupportedLanguage;
}

const CITY_PARTNER_EXAMPLES: Record<
  string,
  { pitchPartners: string; stepPartners: string }
> = {
  bergen: {
    pitchPartners: 'ferske skillingsboller på Fløistuen, vedfyrt fjordbadstue hos Heit eller konsertbilletter',
    stepPartners: 'Fløistuen, Heit Sauna, Nordnes Sjøbad, Bergenfest m.fl.',
  },
  bodo: {
    pitchPartners: 'nystekte vafler på Turisthytta, fjordbadstue hos Pust i Bodø havn eller Parken-opplevelser',
    stepPartners: 'Turisthytta, Pust Badstue Bodø, Parkenfestivalen m.fl.',
  },
  trondheim: {
    pitchPartners: 'varme kanelsnurrer på Skistua, fjordbadstue på Havet Arena eller billetter til Pstereo',
    stepPartners: 'Skistua Bymarka, Havet Badstue, Vassfjellet, Pstereo m.fl.',
  },
  stavanger: {
    pitchPartners: 'fersk bakst på Preikestolen Fjellstue, fjordbadstue hos Damp eller Gladmat-opplevelser',
    stepPartners: 'Preikestolen Fjellstue, Damp Sauna, Sirdal, Gladmat m.fl.',
  },
  kristiansand: {
    pitchPartners: 'vafler og is ved 3. Stampe i Baneheia, badstue på Bystranda eller Palmesus-opplevelser',
    stepPartners: 'Baneheia Kafe, Bystranda Badstue, Odderøya, Palmesus m.fl.',
  },
  oslo: {
    pitchPartners: 'legendarisk eplekake på Frognerseteren, fjordbadstue på Sørenga eller Øya-opplevelser',
    stepPartners: 'Frognerseteren, KOK Sørenga, Tryvann, Øyafestivalen m.fl.',
  },
};

function getCityPartners(city: string) {
  const key = city
    .trim()
    .toLowerCase()
    .replace('ø', 'o')
    .replace('å', 'a');
  return CITY_PARTNER_EXAMPLES[key] || CITY_PARTNER_EXAMPLES.bergen;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  city,
  solar,
  solAlarmText,
  onTriggerSolAlarm,
  featuredActivity,
  onSelectActivity,
  onAddToTur,
  onOpenGift,
  onOpenChristmasGift,
  onOpenOnboarding,
  onOpenStore,
  onToggleRadar,
  showRadar,
  usingGps = false,
  onOpenLocationPrompt,
  lang = 'no',
}) => {
  const partners = getCityPartners(city);
  const cityBackdropUrl = getActivityHeroUrl(featuredActivity?.locationName, city);
  const featuredImgUrl = featuredActivity
    ? getActivityHeroUrl(featuredActivity.locationName, city, featuredActivity.imageUrl)
    : cityBackdropUrl;

  const scrollToFeed = () => {
    const el = document.getElementById('utaktiv-feed-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative rounded-3xl overflow-hidden shadow-xl shadow-zinc-900/15 text-white transition-colors border border-zinc-800/40">
      {/* Dynamisk naturbilde-bakgrunn basert på valgt by */}
      <img
        src={cityBackdropUrl}
        alt={`Natur og utsikt i ${city}`}
        className="absolute inset-0 w-full h-full object-cover scale-105"
        aria-hidden="true"
      />
      {/* Dyp, redaksjonell gradient-overlay for sylskarp lesbarhet (WCAG AAA på overskrift) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#141311]/95 via-[#141311]/80 to-[#141311]/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141311]/95 via-transparent to-black/35" />

      <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-7">
        {/* Topp-rad: Kontrastrik sort/hvit kategori-pille + Sanntids vær- og posisjonspille */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Kullsort ankerpille (Airbnb/AllTrails-mønster: sort brukes som skarp kontrast på hvit bunn) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#E8622C] animate-pulse" />
              <span className="text-[11px] font-extrabold tracking-wider uppercase">
                {t('heroWinterBadge', lang)}
              </span>
            </div>

            {onOpenLocationPrompt && (
              <button
                type="button"
                onClick={onOpenLocationPrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 transition cursor-pointer"
                title="Endre posisjon eller by"
              >
                <Navigation className="w-3.5 h-3.5 text-[#E8622C]" />
                <span>
                  {city} · {usingGps ? t('nearYou', lang) : t('selectedCity', lang)}
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleRadar}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer shadow-sm ${
              showRadar
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 border-amber-300 font-extrabold ring-2 ring-amber-500/20'
                : 'bg-amber-50/90 hover:bg-amber-100/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-amber-200/80 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <Compass className="w-4 h-4 text-[#E8622C]" />
            <span>
              {city}:{' '}
              <strong className="font-extrabold">
                {typeof solar.temperatureC === 'number'
                  ? `${Math.round(solar.temperatureC)}°C`
                  : 'Live'}
              </strong>{' '}
              •{' '}
              {solar.actualEstimatedLux > 0
                ? t('goodDaylight', lang)
                : t('eveningCozy', lang)}
            </span>
            <span className="text-[11px] font-bold underline ml-1">
              {showRadar ? 'Lukk Sol-Astrolabium' : '☀️ Åpne Sol-Astrolabium'}
            </span>
          </button>
        </div>

        {/* Hovedgrid: Todelt oppsett på hvit bunn (Venstre: sylskarp sort tekst på hvitt | Høyre: lyst dagslyskort) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.12] text-white drop-shadow-md">
              {t('heroHeadingPrefix', lang)} {city}.{' '}
              <span className="text-[#E8622C]">
                {t('heroHeadingHighlight', lang)}
              </span>{' '}
              {t('heroHeadingSuffix', lang)}
            </h1>

            <p className="text-base sm:text-[17px] text-white/90 leading-relaxed max-w-2xl font-normal drop-shadow-sm">
              <strong className="font-extrabold text-white">
                {t('heroDescriptionIntro', lang)}
              </strong>{' '}
              {t('heroDescriptionBody', lang)}
            </p>

            {/* Sol-alarm varsel hvis vi venter på neste sol-luke */}
            {solAlarmText && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300/80 dark:border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-900 dark:text-amber-100 font-semibold">
                  <Bell className="w-4 h-4 text-[#E8622C] shrink-0" />
                  <span>{solAlarmText}</span>
                </div>
                <button
                  type="button"
                  onClick={onTriggerSolAlarm}
                  className="shrink-0 px-4 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-amber-400 dark:text-zinc-950 text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                >
                  Varsle meg når solen kommer
                </button>
              </div>
            )}

            {/* CTA-knapper: Varm sol-oransje hovedknapp + kullsort og hvit sekundærknapp */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={scrollToFeed}
                className="px-6 py-3.5 rounded-2xl bg-[#E8622C] hover:bg-[#d55521] text-white font-extrabold text-sm shadow-md shadow-orange-500/20 hover:scale-[1.01] transition flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Utforsk turer & opplevelser i {city}</span>
              </button>

              <button
                type="button"
                onClick={onOpenChristmasGift || onOpenGift}
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#c2410c] to-[#E8622C] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 hover:scale-[1.01] transition flex items-center gap-2 cursor-pointer"
              >
                <Gift className="w-4 h-4 text-amber-200" />
                <span>🎄 Julegavekort: Besteforeldre-oppropet</span>
              </button>

              <button
                type="button"
                onClick={onOpenGift}
                className="px-5 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Gift className="w-4 h-4 text-orange-400 dark:text-[#E8622C]" />
                <span>Gi opplevelses-gavekort</span>
              </button>

              <button
                type="button"
                onClick={onOpenOnboarding}
                className="px-4 py-3.5 rounded-2xl bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-[#E8622C]" />
                <span>Tilpass mine interesser</span>
              </button>
            </div>
          </div>

          {/* Høyre kolonne: Lyst, innbydende dagslyskort (Airbnb/AllTrails-stil med ekte farger uten mørkt slør) */}
          <div className="lg:col-span-5">
            {featuredActivity ? (
              <div className="rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg shadow-zinc-900/5">
                {/* Lyst, ufiltrert dagslysbilde øverst i kortet */}
                <div className="relative h-44 overflow-hidden bg-zinc-100">
                  <img
                    src={featuredImgUrl}
                    alt={featuredActivity.title}
                    {...({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
                    width={640}
                    height={320}
                    className="w-full h-full object-cover"
                  />
                  {/* Hvit og kullsort pille øverst for krystallklar kontrast */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-zinc-950 text-[11px] font-extrabold tracking-wide shadow-md flex items-center gap-1.5">
                    <span>☀️</span>
                    <span>Anbefalt dagstur i {city}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-zinc-950/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
                    <MapPin className="w-3 h-3 text-[#E8622C]" />
                    <span>{featuredActivity.locationName}</span>
                  </div>
                </div>

                {/* Tekst og tilvalg på ren hvit flate under bildet */}
                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-950 dark:text-white leading-snug">
                      {featuredActivity.title}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Gjør turen i {city} til en hel dag:
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
                      <span className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                        <span>🏔️</span>
                        <span>Gå turen & sjekk inn med GPS</span>
                      </span>
                      <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                        +{Math.round((featuredActivity.checkinTarget?.solarBonusLux || 35000) / 100)} p
                      </span>
                    </div>

                    {featuredActivity.addOns &&
                      featuredActivity.addOns.slice(0, 2).map(addon => (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800"
                        >
                          <span className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200 truncate pr-2">
                            <span>{addon.badgeEmoji}</span>
                            <span className="truncate">{addon.title}</span>
                          </span>
                          <span className="font-mono font-extrabold text-zinc-950 dark:text-amber-300 shrink-0">
                            +{addon.priceNok} kr
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Kullsort handlingsknapp i kortet */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddToTur) {
                        onAddToTur(featuredActivity);
                      } else {
                        onSelectActivity(featuredActivity);
                        scrollToFeed();
                      }
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Se turen i {city} og legg til stopp</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Nederste forklaringsstripe: 1 - 2 - 3 Slik fungerer Utaktiv (Harmoniske glass-kort) */}
        <div className="pt-5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md border border-white/20 dark:border-zinc-800 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black text-xs shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-extrabold text-zinc-950 dark:text-white">
                Finn solen & turen i {city}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug mt-0.5">
                Velg blant DNT-fjellstier, skiløyper (Sporet), sjøbad og festivaler nær deg.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md border border-white/20 dark:border-zinc-800 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black text-xs shrink-0">
              2
            </div>
            <div>
              <div className="text-xs font-extrabold text-zinc-950 dark:text-white flex items-center gap-1.5">
                <span>Sjekk inn med GPS ute</span>
                <Award className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug mt-0.5">
                Hver tur og hvert solminutt gir deg Luks-poeng i lommeboken (1 p = 1 kr).
              </p>
            </div>
          </div>

          <div
            onClick={onOpenStore}
            className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/95 hover:bg-amber-50/95 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90 backdrop-blur-md border border-white/20 dark:border-zinc-800 transition cursor-pointer shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-[#E8622C] text-white flex items-center justify-center font-black text-xs shrink-0">
              3
            </div>
            <div>
              <div className="text-xs font-extrabold text-zinc-950 dark:text-white flex items-center gap-1.5">
                <span>Bytt i bakst, sauna & billetter</span>
                <Flame className="w-3.5 h-3.5 text-[#E8622C]" />
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug mt-0.5">
                Betal med poeng eller Vipps hos {partners.stepPartners}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
