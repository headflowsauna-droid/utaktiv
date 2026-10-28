import React, { useState } from 'react';
import { TurKurv, buildTurShareUrl } from '../hooks/useTurKurv';
import { getActivityHeroUrl } from '../engine/imageResolver';
import { buildCommitmentQuote, buildTripItinerary, downloadTurPlakatPng } from '../engine/plakatRenderer';
import { pushTurKurv } from '../engine/cloudSync';
import { X, Share2, Check, MapPin, Download, Link2, Coffee, Flame } from 'lucide-react';

interface TurPlakatProps {
  kurv: TurKurv;
  onClose: () => void;
  friendName?: string;
}

export const TurPlakat: React.FC<TurPlakatProps> = ({ kurv, onClose, friendName = 'Emma' }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [pngStatus, setPngStatus] = useState<string | null>(null);

  const firstStop = kurv.stops[0];
  const lastStop = kurv.stops.length > 1 ? kurv.stops[kurv.stops.length - 1] : null;

  const bgImage = getActivityHeroUrl(
    firstStop?.locationName,
    kurv.city,
    firstStop?.imageUrl
  );

  const commitmentHook = buildCommitmentQuote(kurv);
  const itinerary = buildTripItinerary(kurv);
  const shareUrl = buildTurShareUrl(kurv, friendName);

  const shareText = `Hei ${friendName}!\n\n${commitmentHook}\n\nSlik blir turen:\n${itinerary.narrative}\n\nTidspunkt steg for steg:\n${itinerary.steps.map(s => `• Kl. ${s.time} — ${s.headline} (${s.where})`).join('\n')}\n\nÅpne turen direkte i Utaktiv:\n${shareUrl}`;

  const handleShare = async () => {
    void pushTurKurv(kurv, undefined, friendName);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Turplan for ${kurv.city} · Utaktiv`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback til utklippstavle hvis deling avbrytes
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignorer
    }
  };

  const handleDownloadPng = async () => {
    setIsDownloadingPng(true);
    setPngStatus(null);
    const res = await downloadTurPlakatPng(kurv, friendName);
    setIsDownloadingPng(false);
    if (res.ok) {
      setPngStatus(
        res.sharedAsFile
          ? 'Plakat delt som høyoppløst bilde! ✓'
          : 'Plakat lastet ned som PNG (1080×1920 Story-format)! ✓'
      );
      setTimeout(() => setPngStatus(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-stone-900 text-white shadow-2xl border border-white/10 flex flex-col max-h-[92vh]">
        {/* Lukke-knapp */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 flex items-center justify-center text-white transition cursor-pointer"
          aria-label="Lukk plakat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Visuelt Plakat-kort (Screenshottable / Editorial Magazine Look) */}
        <div className="relative overflow-y-auto p-6 space-y-5 flex-1">
          {/* Hero Bilde-bakgrunn med editorial gradient */}
          <div className="relative -mx-6 -mt-6 h-60 overflow-hidden">
            <img
              src={bgImage}
              alt={firstStop ? firstStop.locationName : 'Norsk natur'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
            
            {/* Header i bildet */}
            <div className="absolute bottom-4 left-6 right-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8622C] text-white text-[11px] font-black tracking-widest uppercase mb-2 shadow-lg">
                Utaktiv Turplakat
              </div>
              <h2 className="text-2xl font-black font-serif-display leading-tight text-white drop-shadow-md">
                {firstStop?.locationName || kurv.city}
                {lastStop && ` → ${lastStop.locationName}`}
              </h2>
            </div>
          </div>

          {/* Den uimotståelige sosiale kontrakten (Commitment Hook) */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
            <p className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
              Forpliktelse & Kosegaranti · Til {friendName}
            </p>
            <p className="text-sm font-medium italic leading-relaxed text-white">
              "{commitmentHook}"
            </p>
          </div>

          {/* Slik blir turen – når og hvor vi spiser bolle og tar badstue */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Slik blir turen ({itinerary.steps.length} etapper)
            </p>
            <p className="text-xs text-stone-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
              {itinerary.narrative}
            </p>
            <div className="space-y-2">
              {itinerary.steps.map(step => (
                <div
                  key={step.id}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                >
                  <span className="font-mono font-bold text-[#E8622C] bg-[#E8622C]/20 border border-[#E8622C]/40 px-2 py-0.5 rounded-md shrink-0">
                    {step.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      {step.kind === 'food' && <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {step.kind === 'sauna' && <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                      {step.kind === 'start' && <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      <span>{step.headline}</span>
                    </p>
                    <p className="text-[11px] text-stone-300 mt-0.5">
                      Sted: {step.where}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delbar direktestopp-lenke */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-[11px] text-stone-300">
            <span className="flex items-center gap-1.5 truncate">
              <Link2 className="w-3.5 h-3.5 text-[#E8622C] shrink-0" />
              <span className="truncate">Direktelenke som åpner ruten hos {friendName}</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-400 shrink-0">Klar ✓</span>
          </div>

          {/* Footer info */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
            <span>By: <strong className="text-white capitalize">{kurv.city}</strong></span>
            <span>utaktiv.no</span>
          </div>
        </div>

        {/* Aksjonsknapper i bunn */}
        <div className="p-4 bg-stone-950 border-t border-white/10 space-y-2">
          {pngStatus && (
            <p className="text-center text-[11px] font-semibold text-emerald-400">
              {pngStatus}
            </p>
          )}

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="w-full py-3 px-4 rounded-2xl bg-[#E8622C] hover:bg-[#d45522] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Invitasjon + direktelenke kopiert!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Send invitasjon & ruterlenke til {friendName}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isDownloadingPng
                  ? 'Lager høyoppløst plakat...'
                  : 'Last ned Plakat som Bilde (PNG til Story/SMS)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
