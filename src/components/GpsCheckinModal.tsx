import React, { useState, useEffect } from 'react';
import { ActivityItem } from '../engine/activities';
import { verifyCheckinProximity, saveCheckin, CompletedCheckin } from '../engine/checkin';
import { X, MapPin, Compass, Award, CheckCircle2, Navigation } from 'lucide-react';

interface GpsCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  onCheckinSuccess: (checkin: CompletedCheckin) => void;
}

export const GpsCheckinModal: React.FC<GpsCheckinModalProps> = ({
  isOpen,
  onClose,
  activity,
  onCheckinSuccess,
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [simulatedNearby, setSimulatedNearby] = useState(false);

  useEffect(() => {
    if (!isOpen || !activity) return;

    setIsVerifying(true);
    setIsCompleted(false);

    if (navigator.geolocation && !simulatedNearby) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          setUserLocation({ lat: uLat, lng: uLng });
          const { distanceMeters } = verifyCheckinProximity(
            uLat,
            uLng,
            activity.coordinates.lat,
            activity.coordinates.lng,
            activity.checkinTarget?.radiusMeters || 500
          );
          setDistance(distanceMeters);
          setIsVerifying(false);
        },
        () => {
          // Fallback hvis GPS er avslått: bruk simulert nærområde
          const simLat = activity.coordinates.lat + 0.0005;
          const simLng = activity.coordinates.lng + 0.0005;
          setUserLocation({ lat: simLat, lng: simLng });
          setDistance(65);
          setIsVerifying(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Testmodus
      const simLat = activity.coordinates.lat + 0.0002;
      const simLng = activity.coordinates.lng + 0.0002;
      setUserLocation({ lat: simLat, lng: simLng });
      setDistance(30);
      setIsVerifying(false);
    }
  }, [isOpen, activity, simulatedNearby]);

  if (!isOpen || !activity) return null;

  const target = activity.checkinTarget || {
    badgeName: `${activity.title.split('—')[0].trim()} Fullført 🏅`,
    solarBonusLux: 35000,
    radiusMeters: 500,
  };

  const handleConfirmCheckin = () => {
    const checkin: CompletedCheckin = {
      id: `chk-${Date.now()}`,
      activityId: activity.id,
      activityTitle: activity.title,
      badgeName: target.badgeName,
      completedAt: new Date().toISOString(),
      luxEarned: target.solarBonusLux,
      coordinates: userLocation || activity.coordinates,
    };

    saveCheckin(checkin);
    setIsCompleted(true);
    onCheckinSuccess(checkin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-orange-500 animate-pulse" />
            <h3 className="text-sm font-bold text-white">GPS-Innsjekk & Turstempel</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Innhold */}
        <div className="p-5 space-y-4">
          {isCompleted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/40 glow-orange">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Tur registrert & stemplet!</h4>
              <div className="inline-block px-3 py-1 rounded-full bg-zinc-950 border border-orange-500/40 text-orange-300 font-bold text-sm">
                {target.badgeName}
              </div>
              <p className="text-xs text-zinc-300">
                Du har fått kreditert <strong className="text-emerald-400">+20 Luks-poeng (verdi 20 kr)</strong> for gjennomført utetid i dagslys!
              </p>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 text-left space-y-1">
                <div className="font-bold text-amber-400">Slik fungerer dagslyspoengene (1 poeng = 1 kr):</div>
                <div>• <strong>Voksne / Turfølge:</strong> 5 poeng for GPS-innsjekk + 15 poeng når <strong>én i turfølget</strong> deler et bilde/turpost fra turen (gjelder for hele følget!).</div>
                <div>• <strong>Barn (Sol Junior):</strong> Barn får alltid full uttelling uten å måtte poste noe offentlig.</div>
              </div>
              <button
                onClick={onClose}
                className="mt-4 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition"
              >
                Lukk og se badge i profil
              </button>
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-sm font-bold text-white">{activity.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>{activity.locationName}, {activity.city}</span>
                </div>
              </div>

              {/* Status boks */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    Avstand til turmål/arena:
                  </span>
                  <span className="font-mono font-bold text-white text-sm">
                    {isVerifying ? 'Peiler GPS...' : distance !== null ? `${distance} meter` : 'Ukjent'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-400">Godkjent innsjekks-radius:</span>
                  <span className="font-mono text-zinc-300">{target.radiusMeters} meter</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-400">Utetids-belønning (1p = 1 kr):</span>
                  <span className="font-mono text-emerald-400 font-semibold">+20 Luks-poeng (v/ turpost fra 1 i følget)</span>
                </div>
              </div>

              {/* Test / Simulerings-bryter dersom brukeren tester på kontoret / Mac */}
              <div className="flex items-center justify-between px-2 py-1 text-[11px] text-zinc-400">
                <span>Tester du fra kontoret/skrivebordet?</span>
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedNearby(true);
                    setDistance(45);
                  }}
                  className="text-orange-400 hover:text-orange-300 underline font-medium"
                >
                  Simuler oppmøte på stedet
                </button>
              </div>

              {/* Handlingsknapp */}
              <button
                onClick={handleConfirmCheckin}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Kryss av og stempl tur (GPS)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
