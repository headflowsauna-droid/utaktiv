import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ActivityItem, ActivityAddOn } from '../engine/activities';
import { getStopsForRoute } from '../engine/businessTips';
import { SupportedLanguage } from '../engine/i18n';
import {
  X,
  MapPin,
  Navigation,
  Plus,
  Check,
  Heart,
  Ticket,
  UtensilsCrossed,
  Flame,
  Users,
  Gift,
  Cake,
  Footprints,
  Share2,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

export interface TurDetailModalProps {
  activity: ActivityItem | null;
  isOpen: boolean;
  onClose: () => void;
  isInTur: boolean;
  isSaved: boolean;
  isCompleted: boolean;
  onToggleSave: (id: string) => void;
  onAddToTur: (activity: ActivityItem) => void;
  onOpenCheckin: (activity: ActivityItem) => void;
  onOpenTicket: (activity: ActivityItem, addOns?: ActivityAddOn[]) => void;
  onOpenPartnerModal: (mode: 'sjel_og_gane' | 'heit_sauna') => void;
  onOpenFullMap?: (activity: ActivityItem) => void;
  onFindCompany?: (activity: ActivityItem, kind: 'plan' | 'trail') => void;
  onOpenPlanActivity?: (activity: ActivityItem) => void;
  onOpenGiftActivity?: (activity: ActivityItem) => void;
  onTipRouteBusiness?: (activity: ActivityItem) => void;
  lang?: SupportedLanguage;
}

export const TurDetailModal: React.FC<TurDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
  isInTur,
  isSaved,
  isCompleted,
  onToggleSave,
  onAddToTur,
  onOpenCheckin,
  onOpenTicket,
  onOpenPartnerModal,
  onOpenFullMap,
  onFindCompany,
  onOpenPlanActivity,
  onOpenGiftActivity,
  onTipRouteBusiness,
  lang: _lang = 'no',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Tilbakestill tilvalg når aktiviteten endres
  useEffect(() => {
    setSelectedAddOnIds([]);
    setCopiedLink(false);
  }, [activity?.id]);

  // Leaflet minikart med rute- og stoppmarkører
  useEffect(() => {
    if (!isOpen || !activity || !mapContainerRef.current) return;

    // Fjern gammelt kart hvis det finnes
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { lat, lng } = activity.coordinates;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Mørkt, elegant ESRI-kart
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16 }
    ).addTo(map);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16 }
    ).addTo(map);

    // Hovedmarkør for turen
    const mainIconHtml = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 9999px;
        background: #E8622C;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 16px rgba(232, 98, 44, 0.6), 0 4px 6px rgba(0,0,0,0.5);
      ">
        <span style="font-size: 16px;">📍</span>
      </div>
    `;

    const mainIcon = L.divIcon({
      className: 'tur-main-marker',
      html: mainIconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([lat, lng], { icon: mainIcon })
      .addTo(map)
      .bindPopup(`<strong style="color: #000;">${activity.title}</strong><br/><span style="color: #666;">${activity.locationName}</span>`);

    // Hent bekreftede stopp langs turen
    const { verifiedStops } = getStopsForRoute(activity.id, activity.title, activity.city);
    verifiedStops.forEach((stop, idx) => {
      // Offset litt hvis nøyaktige koordinater mangler så de vises rundt
      const offsetLat = lat + (idx + 1) * 0.0035 * (idx % 2 === 0 ? 1 : -1);
      const offsetLng = lng + (idx + 1) * 0.0045;

      const isBadstue = stop.id.includes('sauna') || stop.name.toLowerCase().includes('badstue');
      const isCafe = stop.id.includes('sjel-og-gane') || stop.name.toLowerCase().includes('gård');
      const iconEmoji = isBadstue ? '🔥' : isCafe ? '☕' : '🏡';

      const stopIconHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 9999px;
          background: #18181b;
          border: 2px solid #f97316;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        ">
          <span style="font-size: 13px;">${iconEmoji}</span>
        </div>
      `;

      const stopIcon = L.divIcon({
        className: 'tur-stop-marker',
        html: stopIconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([offsetLat, offsetLng], { icon: stopIcon })
        .addTo(map)
        .bindPopup(`<strong style="color:#000;">${stop.name}</strong><br/><span style="color:#666;">${stop.address}</span>`);
    });

    mapInstanceRef.current = map;

    // Fix leaflet rendering etter at modal er synlig
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, activity]);

  if (!isOpen || !activity) return null;

  const { verifiedStops } = getStopsForRoute(activity.id, activity.title, activity.city);

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const activeAddOns = (activity.addOns || []).filter(a => selectedAddOnIds.includes(a.id));
  const addOnsTotalNok = activeAddOns.reduce((sum, a) => sum + a.priceNok, 0);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: activity.title,
        text: `Bli med på tur: ${activity.title} i ${activity.city}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* TOPP-BAR: LUKK, LAGRE & DEL */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSave(activity.id)}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-rose-500 transition cursor-pointer shadow-md"
            title="Lagre turmål"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className={`p-2.5 rounded-full backdrop-blur-md transition cursor-pointer shadow-md ${
              copiedLink ? 'bg-emerald-500/80 text-white' : 'bg-black/60 text-white hover:text-orange-400'
            }`}
            title={copiedLink ? 'Kopiert til utklippstavle!' : 'Del turen'}
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition cursor-pointer shadow-md"
            title="Lukk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. KART & HERO HEADER (Split / Integrert kart) */}
        <div className="relative h-60 sm:h-72 w-full bg-zinc-950 shrink-0 overflow-hidden">
          {/* Interaktivt Leaflet Kart */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Gradient skygge i bunnen av kartet */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-[#121214] to-transparent pointer-events-none" />

          {/* Knapp for å åpne i fullskjerms bykart */}
          {onOpenFullMap && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullMap(activity);
              }}
              className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-lg transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
              <span>Åpne i stort kart</span>
            </button>
          )}

          {/* Løypestatus badge */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
            {activity.trail && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-md text-white ${
                activity.trail.difficulty === 'green'
                  ? 'bg-emerald-600/90'
                  : activity.trail.difficulty === 'blue'
                  ? 'bg-blue-600/90'
                  : 'bg-rose-600/90'
              }`}>
                {activity.trail.difficulty === 'green' && '🟢 Enkel tur'}
                {activity.trail.difficulty === 'blue' && '🔵 Middels tur'}
                {activity.trail.difficulty === 'red' && '🔴 Krevende tur'}
              </span>
            )}
            {isCompleted && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-black shadow-md flex items-center gap-1">
                ✓ Fullført
              </span>
            )}
          </div>
        </div>

        {/* 2. HOVEDINNHOLD (Scrollbart) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Tittel, sted og nøkkeltall */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-display text-zinc-950 dark:text-white leading-tight">
              {activity.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                <MapPin className="w-3.5 h-3.5 text-[#E8622C]" />
                {activity.locationName}, {activity.city}
              </span>
              {activity.trail && (
                <>
                  <span>•</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {activity.trail.distanceKm} km
                  </span>
                  <span>•</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    +{activity.trail.elevationMeters} høydemeter
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Beskrivelse */}
          <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
            {activity.description}
          </div>

          {/* Fasiliteter & Tilgjengelighet (Senior / Toalett / Parkering) */}
          {activity.seniorSafety && (
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tilgjengelighet & Fasiliteter langs løypen</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  {activity.seniorSafety.hasPublicRestroom ? '🚻 Toalett tilgjengelig' : '🚫 Ikke offentlig toalett'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  {activity.seniorSafety.surface === 'paved' ? '🛣️ Fast asfaltdekke' : '🌲 Skogssti / naturgrunn'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  🚗 Parkering: {activity.seniorSafety.parkingDistanceMeters}m unna
                </span>
              </div>
            </div>
          )}

          {/* Stopp & Lokale bedrifter langs ruten */}
          {verifiedStops.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>📍</span>
                  <span>Opplevelser & Stopp langs ruten</span>
                </h4>
                {onTipRouteBusiness && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTipRouteBusiness(activity);
                    }}
                    className="text-[11px] font-bold text-[#E8622C] hover:underline"
                  >
                    + Tips om stopp
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {verifiedStops.map(stop => (
                  <div
                    key={stop.id}
                    className="p-3 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-white">
                          {stop.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {stop.address}
                        </div>
                      </div>
                      {stop.isFreeOrDropIn && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                          Åpent for alle
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-snug">
                      {stop.summary}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-orange-200/50 dark:border-orange-900/30">
                      <span className="text-[10px] text-zinc-500 font-medium">
                        🕒 {stop.whenOpen}
                      </span>
                      {stop.id === 'route-stop-sjel-og-gane-eidfjord' && (
                        <button
                          type="button"
                          onClick={() => onOpenPartnerModal('sjel_og_gane')}
                          className="px-3 py-1 rounded-xl bg-[#E8622C] hover:bg-[#d65521] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <UtensilsCrossed className="w-3 h-3" />
                          <span>Se meny & bestill</span>
                        </button>
                      )}
                      {stop.id === 'route-stop-gratis-fjordbadstue-eidfjord' && (
                        <button
                          type="button"
                          onClick={() => onOpenPartnerModal('heit_sauna')}
                          className="px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Flame className="w-3 h-3" />
                          <span>Bestill badstue</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tilvalg / Dagspakke (+Add-ons) */}
          {activity.addOns && activity.addOns.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <span>☀️</span>
                  <span>Gjør turen til en hel dag</span>
                </span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                  Valgfritt tilvalg
                </span>
              </div>

              <div className="space-y-1.5">
                {activity.addOns.map(addon => {
                  const isChecked = selectedAddOnIds.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddOn(addon.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between text-xs cursor-pointer ${
                        isChecked
                          ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 text-zinc-950 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{addon.badgeEmoji}</span>
                        <div>
                          <div className="font-bold text-[11px]">{addon.title}</div>
                          <div className="text-[10px] text-zinc-500">{addon.partnerName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xs text-amber-600 dark:text-amber-400">
                          +{addon.priceNok} kr
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {isChecked ? 'Valgt ✓' : '+ Legg til'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* FELLESKAP / DELING (Slår sammen de 4 sosiale valgene på ett ryddig sted) */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Gå sammen eller del opplevelsen</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {onFindCompany && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFindCompany(activity, 'plan');
                  }}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition flex flex-col items-center gap-1 text-center cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-[11px]">Finn følge</span>
                </button>
              )}

              {onFindCompany && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFindCompany(activity, 'trail');
                  }}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition flex flex-col items-center gap-1 text-center cursor-pointer"
                >
                  <Footprints className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px]">Synlig 3 timer</span>
                </button>
              )}

              {onOpenPlanActivity && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPlanActivity(activity);
                  }}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition flex flex-col items-center gap-1 text-center cursor-pointer"
                >
                  <Cake className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px]">Planlegg bursdag</span>
                </button>
              )}

              {onOpenGiftActivity && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGiftActivity(activity);
                  }}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition flex flex-col items-center gap-1 text-center cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-rose-500" />
                  <span className="text-[11px]">Gi som gave</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. FAST BUNNLINJE: DE TO HOVEDHANDLINGENE */}
        <div className="p-4 bg-zinc-50 dark:bg-[#18181b] border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 shrink-0">
          {/* Hovedknapp 1: Kjøp billett / Dagspakke HVIS aktuelt, ellers GPS Sjekk-inn */}
          {activity.ticket || activeAddOns.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTicket(activity, activeAddOns);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E8622C] to-amber-500 hover:from-[#d65521] hover:to-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>
                {activity.ticket
                  ? `Kjøp billett (${activity.ticket.priceNok + addOnsTotalNok} kr)`
                  : `Bestill dagspakke (${addOnsTotalNok} kr)`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCheckin(activity);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#E8622C] hover:bg-[#d65521] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>{isCompleted ? 'Fullfør på nytt (GPS)' : 'Start tur & GPS Sjekk-inn'}</span>
            </button>
          )}

          {/* Knapp 2: Legg til i turbygger */}
          <button
            type="button"
            onClick={() => onAddToTur(activity)}
            className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer border ${
              isInTur
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white hover:border-[#E8622C]'
            }`}
          >
            {isInTur ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>I turen ✓</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Legg til i tur</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
