import React, { useState } from 'react';
import { TurKurv, TurStop } from '../hooks/useTurKurv';
import { TurPlakat } from './TurPlakat';
import { getActivityHeroUrl } from '../engine/imageResolver';
import { ActivityItem } from '../engine/activities';
import {
  buildTripItinerary,
  getRouteAddonCardsForCity,
  RouteAddonOption,
} from '../engine/plakatRenderer';
import {
  X,
  Trash2,
  Clock,
  Coffee,
  MapPin,
  Check,
  Compass,
  Share2,
  Flame,
  ArrowLeft,
  ArrowRight,
  Plus,
  Coins,
  Sun,
  Layers,
} from 'lucide-react';

interface TurBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  kurv: TurKurv;
  onUpdateStop: (id: string, updates: Partial<TurStop>) => void;
  onRemoveStop: (id: string) => void;
  onMoveStop?: (id: string, direction: 'left' | 'right') => void;
  onAddStop?: (activity: ActivityItem) => void;
  availableActivities?: ActivityItem[];
  onClearKurv: () => void;
  onOpenStore?: () => void;
}

export function parseBookingNoteParts(note?: string): string[] {
  if (!note) return [];
  return note
    .split(/\s*\+\s*/)
    .map(part => part.trim())
    .filter(Boolean);
}

export function isPresetInBookingNote(note: string | undefined, preset: string): boolean {
  const parts = parseBookingNoteParts(note);
  return parts.some(p => p.toLowerCase() === preset.toLowerCase());
}

export function togglePresetInBookingNote(note: string | undefined, preset: string): string {
  const parts = parseBookingNoteParts(note);
  const exists = parts.some(p => p.toLowerCase() === preset.toLowerCase());
  const nextParts = exists
    ? parts.filter(p => p.toLowerCase() !== preset.toLowerCase())
    : [...parts, preset];
  return nextParts.join(' + ');
}

export const TurBuilderModal: React.FC<TurBuilderModalProps> = ({
  isOpen,
  onClose,
  kurv,
  onUpdateStop,
  onRemoveStop,
  onMoveStop,
  onAddStop,
  availableActivities,
  onClearKurv,
  onOpenStore,
}) => {
  const [showPlakat, setShowPlakat] = useState(false);
  const [friendNameInput, setFriendNameInput] = useState('Emma');
  const [activeTab, setActiveTab] = useState<'line' | 'map'>('line');
  const [showAddPicker, setShowAddPicker] = useState(false);

  if (!isOpen) return null;

  if (showPlakat) {
    return (
      <TurPlakat
        kurv={kurv}
        friendName={friendNameInput}
        onClose={() => setShowPlakat(false)}
      />
    );
  }

  const itinerary = buildTripItinerary(kurv);
  const activeStop = kurv.stops[0] || null;

  const handleToggleAddon = (card: RouteAddonOption) => {
    if (!activeStop) return;
    const nextNote = togglePresetInBookingNote(activeStop.preBookingNote, card.label);
    onUpdateStop(activeStop.activityId, {
      preBookingNote: nextNote,
      preBooked: Boolean(nextNote.trim()),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#141311] text-zinc-900 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Header med Levende Totalpris (kr / Luks-poeng 1:1) */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3 bg-stone-50/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#E8622C] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              {kurv.stops.length}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-serif-display leading-tight truncate">
                  Fysisk Turbygger: {kurv.city}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#E8622C] border border-orange-200 dark:border-orange-800">
                  {itinerary.sunWindowSummary}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                Flytt kort opp på linjen for å bygge ruten og se sanntids pris & tider
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sanntids Totalbeløp-pill */}
            <div className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Totalbeløp</span>
              <span className="text-xs font-black text-[#E8622C] flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {itinerary.totalPriceNok} kr / {itinerary.totalPriceNok} poeng
              </span>
            </div>

            {kurv.stops.length > 0 && (
              <button
                type="button"
                onClick={onClearKurv}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Tøm hele turen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visningsvalg: «Kort-linje» vs «Rute på Kartet» */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2 bg-white dark:bg-[#141311]">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('line')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'line'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tur-linje & Kort ({itinerary.steps.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Rute på Kartet</span>
            </button>
          </div>

          <div className="sm:hidden text-xs font-extrabold text-[#E8622C]">
            {itinerary.totalPriceNok} kr ({itinerary.totalPriceNok} p)
          </div>
        </div>

        {/* Hoveddel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {kurv.stops.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 dark:bg-orange-950/40 text-[#E8622C] flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Turen din er tom ennå</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                Gå til feeden og trykk <strong>«+ Legg til i tur»</strong> for å flytte aktiviteter opp på linjen.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-sm"
              >
                Finn opplevelser i {kurv.city}
              </button>
            </div>
          ) : (
            <>
              {/* KORT-STOKKEN LANGS RUTEN: Legg til eller fjern bolle, badstue, vaffel */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Kortstokk: Legg til opplevelser langs ruten
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    Trykk for å legge til eller fjerne fra tur-linjen
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {getRouteAddonCardsForCity(kurv.city).map(card => {
                    const isSelected = activeStop
                      ? isPresetInBookingNote(activeStop.preBookingNote, card.label)
                      : false;

                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleToggleAddon(card)}
                        className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer group ${
                          isSelected
                            ? 'bg-[#E8622C] text-white border-[#E8622C] shadow-md shadow-orange-500/20'
                            : 'bg-stone-50/80 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 hover:border-orange-400 text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          {card.kind === 'food' ? (
                            <Coffee className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                          ) : (
                            <Flame className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#E8622C]'}`} />
                          )}
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {card.priceNok === 0 ? '0 kr' : `+${card.priceNok} kr`}
                          </span>
                        </div>

                        <div>
                          <div className="font-extrabold text-xs leading-tight line-clamp-2">
                            {card.label}
                          </div>
                          <div
                            className={`text-[10px] font-semibold mt-1 truncate ${
                              isSelected ? 'text-orange-100' : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            {card.badgeText}
                          </div>
                        </div>

                        <div className="mt-2.5 pt-1.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] font-extrabold">
                          <span>{isSelected ? 'Lagt til på linjen' : '+ Legg til'}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DEN FYSISKE TUR-LINJEN ELLER KARTET */}
              {activeTab === 'line' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#E8622C]" />
                      Den fysiske Tur-linjen (Kort-rekke)
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-400">
                      Sorter med pilene eller endre starttid
                    </span>
                  </div>

                  {/* Horisontal / sekvensiell kort-rekke */}
                  <div className="space-y-2.5">
                    {itinerary.steps.map((step, sIdx) => {
                      const isFood = step.kind === 'food';
                      const isSauna = step.kind === 'sauna';
                      const isStart = step.kind === 'start';

                      return (
                        <div
                          key={step.id}
                          className={`rounded-2xl border p-3.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isFood
                              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                              : isSauna
                                ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40'
                                : 'bg-stone-50/90 dark:bg-zinc-900/80 border-zinc-200/90 dark:border-zinc-800'
                          }`}
                        >
                          {/* Venstre: Stopp-nummer, ikon og Tidsrom */}
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                                isFood
                                  ? 'bg-amber-500 text-white'
                                  : isSauna
                                    ? 'bg-[#E8622C] text-white'
                                    : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                              }`}
                            >
                              {sIdx + 1}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-black text-[#E8622C] bg-white dark:bg-zinc-950 px-2 py-0.5 rounded-md border border-orange-200/70 dark:border-zinc-800">
                                  {step.timeWindow}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/70 dark:bg-zinc-950/80 text-zinc-600 dark:text-zinc-300">
                                  {isFood
                                    ? 'Hente bolle & kaffe'
                                    : isSauna
                                      ? 'Møte på sauna'
                                      : 'Start på tur'}
                                </span>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                  {step.sunWindow}
                                </span>
                              </div>

                              <div className="font-bold text-sm text-zinc-950 dark:text-white mt-1 truncate">
                                {step.headline}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                                <span className="truncate">{step.where}</span>
                              </div>
                            </div>
                          </div>

                          {/* Høyre: Pris og flytte-piler */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5 shrink-0">
                            <span className="text-xs font-black text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                              {step.priceNok === 0 ? 'Gratis' : `${step.priceNok} kr`}
                            </span>

                            {isStart && (
                              <button
                                type="button"
                                onClick={() => onRemoveStop(step.id.replace('-start', ''))}
                                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-500 cursor-pointer"
                                title="Fjern dette stoppet fra turen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isStart && (
                              <div className="flex items-center gap-1">
                                {kurv.stops.length > 1 && onMoveStop && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onMoveStop(step.id.replace('-start', ''), 'left')}
                                      disabled={sIdx === 0}
                                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 disabled:opacity-30 cursor-pointer"
                                      title="Flytt tidligere på turen"
                                    >
                                      <ArrowLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onMoveStop(step.id.replace('-start', ''), 'right')}
                                      disabled={sIdx === itinerary.steps.length - 1}
                                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 disabled:opacity-30 cursor-pointer"
                                      title="Flytt senere på turen"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onRemoveStop(step.id.replace('-start', ''))}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                  title="Fjern stopp"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mulighet til å legge til flere aktiviteter / turmål direkte inne i turbyggeren */}
                  {onAddStop && availableActivities && availableActivities.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddPicker(!showAddPicker)}
                        className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-900/60 bg-orange-50/50 dark:bg-orange-950/20 text-[#E8622C] font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-orange-100/60 dark:hover:bg-orange-900/30 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Legg til et ekstra turmål / aktivitet i {kurv.city}</span>
                      </button>

                      {showAddPicker && (
                        <div className="mt-2 p-3 rounded-2xl bg-stone-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 max-h-56 overflow-y-auto animate-fade-in shadow-inner">
                          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-1 pb-1">
                            Klikk for å legge til på tur-linjen:
                          </div>
                          {availableActivities
                            .filter(a => !kurv.stops.some(s => s.activityId === a.id))
                            .slice(0, 12)
                            .map(act => (
                              <button
                                key={act.id}
                                type="button"
                                onClick={() => {
                                  onAddStop(act);
                                  setShowAddPicker(false);
                                }}
                                className="w-full p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-[#E8622C] text-left transition flex items-center justify-between gap-2 cursor-pointer group"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                    {act.title}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                    {act.locationName}
                                  </div>
                                </div>
                                <span className="text-[10px] font-black text-[#E8622C] shrink-0 group-hover:scale-105 transition">
                                  + Legg til
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fortelling */}
                  <div className="rounded-2xl border border-orange-200 dark:border-zinc-800 bg-orange-50/50 dark:bg-zinc-900/60 p-4 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E8622C]">
                      Fullstendig rutebeskrivelse
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {itinerary.narrative}
                    </p>
                  </div>
                </div>
              ) : (
                /* KART-VISNING MED RUTEN OG TIDSROMMER */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      Rute tegnet på kartet i {kurv.city}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {itinerary.steps.length} etapper forbundet
                    </span>
                  </div>

                  {/* Interaktivt stilisert Topo-kart over ruten med pins og tidsrom */}
                  <div className="relative w-full h-80 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-stone-900 shadow-inner">
                    <img
                      src={getActivityHeroUrl(activeStop?.locationName, kurv.city, activeStop?.imageUrl)}
                      alt={`Kart over ruten i ${kurv.city}`}
                      className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-75 contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/70" />

                    {/* SVG polyline som forbinder alle etappene */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      <polyline
                        points={itinerary.steps
                          .map(s => `${s.mapXPercent}%,${s.mapYPercent}%`)
                          .join(' ')}
                        fill="none"
                        stroke="#E8622C"
                        strokeWidth="3.5"
                        strokeDasharray="6,4"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Stopp-pins på kartet med tider */}
                    {itinerary.steps.map((step, pIdx) => {
                      const isFood = step.kind === 'food';
                      const isSauna = step.kind === 'sauna';

                      return (
                        <div
                          key={step.id}
                          style={{
                            left: `${step.mapXPercent}%`,
                            top: `${step.mapYPercent}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className="absolute z-10 flex flex-col items-center group cursor-pointer"
                        >
                          <div
                            className={`w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-black text-xs ${
                              isFood
                                ? 'bg-amber-500 text-white'
                                : isSauna
                                  ? 'bg-[#E8622C] text-white'
                                  : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {pIdx + 1}
                          </div>

                          {/* Flagg / Infokort på kartet med tidsrom */}
                          <div className="mt-1 px-2.5 py-1 rounded-xl bg-black/90 text-white border border-white/20 text-[10px] font-bold shadow-lg whitespace-nowrap">
                            <div className="text-[#E8622C] font-mono leading-none">{step.timeWindow}</div>
                            <div className="text-[9px] text-zinc-300 mt-0.5">{step.headline.split(':')[0]}</div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        {itinerary.sunWindowSummary}
                      </span>
                      <span className="font-black text-[#E8622C]">
                        Totalt {itinerary.totalPriceNok} kr ({itinerary.totalPriceNok} p)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer med totalbeløp og deling */}
        {kurv.stops.length > 0 && (
          <div className="p-4 sm:p-5 bg-stone-50/90 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Vennens navn:
                </label>
                <input
                  type="text"
                  value={friendNameInput}
                  onChange={e => setFriendNameInput(e.target.value)}
                  placeholder="f.eks. Emma"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold w-36"
                />
              </div>

              <div className="flex items-center gap-2">
                {onOpenStore && (
                  <button
                    type="button"
                    onClick={onOpenStore}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:border-orange-400 transition inline-flex items-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kjøp gavekort</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowPlakat(true)}
                  className="flex-1 sm:flex-initial py-2.5 px-5 rounded-2xl bg-[#E8622C] hover:bg-[#d45522] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/20 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Se og del Turplakat ({itinerary.totalPriceNok} kr)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
