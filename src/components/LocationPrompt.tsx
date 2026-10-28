import React, { useState } from 'react';
import { MapPin, Navigation, X, Clock, Footprints, AlertCircle, Check } from 'lucide-react';

export interface LocationPromptProps {
  isOpen: boolean;
  selectedCity: string;
  cities: { id: string; name: string }[];
  onUseGps: () => void;
  onSelectCityManual: (cityName: string) => void;
  onDismiss: () => void;
  isRequestingGps?: boolean;
  gpsError?: string | null;
}

export const LocationPrompt: React.FC<LocationPromptProps> = ({
  isOpen,
  selectedCity,
  cities,
  onUseGps,
  onSelectCityManual,
  onDismiss,
  isRequestingGps = false,
  gpsError = null,
}) => {
  const [cityPickerHighlighted, setCityPickerHighlighted] = useState(false);

  if (!isOpen) return null;

  const fallbackCities =
    cities && cities.length > 0
      ? cities
      : [
          { id: 'bergen', name: 'Bergen' },
          { id: 'oslo', name: 'Oslo' },
          { id: 'stavanger', name: 'Stavanger' },
          { id: 'kristiansand', name: 'Kristiansand' },
          { id: 'trondheim', name: 'Trondheim' },
          { id: 'bodo', name: 'Bodø' },
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-prompt-title"
    >
      <div className="relative w-full max-w-md bg-white text-zinc-950 border border-zinc-200 rounded-3xl shadow-xl p-6 space-y-5">
        {/* Topp-rad */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 id="location-prompt-title" className="text-base font-bold text-zinc-950 tracking-tight">
                Finn opplevelser nær deg
              </h2>
              <p className="text-xs text-zinc-600">
                Lokale turer, solforhold og åpne steder
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition"
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Eksakt personvernforklaring fra Spec seksjon 1 */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-950 leading-relaxed">
          Vi bruker posisjonen bare på telefonen din for å finne ting i nærheten. Den lagres ikke hos oss.
        </div>

        {gpsError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Hovedhandlinger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onUseGps}
            disabled={isRequestingGps}
            className="w-full min-h-11 px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Navigation className="w-4 h-4 text-orange-400" />
            <span>{isRequestingGps ? 'Henter posisjon…' : 'Bruk posisjon'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCityPickerHighlighted(true)}
            className="w-full min-h-11 px-4 py-2.5 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-950 border border-zinc-200 hover:border-zinc-950 text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            <MapPin className="w-4 h-4 text-orange-600" />
            <span>Velg by selv</span>
          </button>
        </div>

        {/* Byvelger (de seks lanseringsbyene) */}
        <div
          className={`pt-3 border-t border-zinc-200 space-y-2.5 transition ${
            cityPickerHighlighted || gpsError ? 'ring-2 ring-orange-500/30 rounded-2xl p-3 bg-orange-50/30' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Eller velg by direkte
            </span>
            <span className="text-xs text-zinc-500">Nå: {selectedCity}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fallbackCities.map(city => {
              const isSelected = city.name.toLowerCase() === selectedCity.toLowerCase();
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => onSelectCityManual(city.name)}
                  className={`min-h-10 px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-between gap-1.5 transition ${
                    isSelected
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                      : 'bg-white text-zinc-950 border-zinc-200 hover:border-orange-500 hover:bg-orange-50/40'
                  }`}
                >
                  <span className="truncate">{city.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface LocationStatusProps {
  city: string;
  usingGps: boolean;
  onOpenPrompt: () => void;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  city,
  usingGps,
  onOpenPrompt,
}) => {
  const label = usingGps ? `${city} · i nærheten` : `${city} · valgt by`;

  return (
    <button
      type="button"
      onClick={onOpenPrompt}
      className="inline-flex items-center gap-1.5 min-h-9 px-3 py-1 rounded-full bg-white text-zinc-950 border border-zinc-200 hover:border-zinc-950 text-xs font-bold transition shadow-sm"
      title="Endre posisjon eller velg by"
    >
      {usingGps ? (
        <Navigation className="w-3.5 h-3.5 text-orange-600 shrink-0" />
      ) : (
        <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
};

export interface DistanceBadgeProps {
  distanceKm?: number;
  travelMinWalk?: number;
}

export const DistanceBadge: React.FC<DistanceBadgeProps> = ({
  distanceKm,
  travelMinWalk,
}) => {
  if (distanceKm === undefined || distanceKm === null || Number.isNaN(distanceKm)) {
    return null;
  }

  let distanceText: string;
  if (distanceKm < 1) {
    const metersRounded = Math.round((distanceKm * 1000) / 50) * 50;
    distanceText = `${metersRounded} m`;
  } else {
    distanceText = `${distanceKm.toFixed(1).replace('.', ',')} km`;
  }

  const showWalk = distanceKm <= 4;
  const walkMinutes =
    travelMinWalk !== undefined
      ? Math.round(travelMinWalk)
      : Math.max(1, Math.round(((distanceKm * 1.3) / 4.5) * 60));

  const fullText = showWalk
    ? `${distanceText} · ${walkMinutes} min gange`
    : distanceText;

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-zinc-950 border border-zinc-200 text-xs font-semibold">
      <Footprints className="w-3 h-3 text-orange-600 shrink-0" />
      <span>{fullText}</span>
    </span>
  );
};

export interface OpenNowBadgeProps {
  openNow?: boolean | null;
  closeTime?: string;
}

export const OpenNowBadge: React.FC<OpenNowBadgeProps> = ({
  openNow,
  closeTime,
}) => {
  if (openNow === null || openNow === undefined) {
    return null;
  }

  if (openNow) {
    const label = closeTime ? `Åpen til ${closeTime}` : 'Åpen nå';
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-950 border border-emerald-200 text-xs font-semibold">
        <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-950 border border-rose-200 text-xs font-semibold">
      <Clock className="w-3 h-3 text-rose-600 shrink-0" />
      <span>Stengt nå</span>
    </span>
  );
};

export interface DealBadgeProps {
  deal?: {
    title: string;
    priceNok: number;
    originalPriceNok?: number;
  };
}

export const DealBadge: React.FC<DealBadgeProps> = ({ deal }) => {
  if (!deal) return null;

  return (
    <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-2xl bg-orange-50 text-zinc-950 border border-orange-200 text-xs">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-950 text-white font-bold text-[11px]">
        <span>Partnertilbud</span>
      </span>
      <span className="font-semibold text-zinc-950">{deal.title}</span>
      <span className="font-mono font-bold text-orange-700">
        {deal.priceNok} kr
      </span>
      {deal.originalPriceNok !== undefined && deal.originalPriceNok > deal.priceNok && (
        <span className="font-mono text-zinc-500 line-through">
          {deal.originalPriceNok} kr
        </span>
      )}
    </div>
  );
};
