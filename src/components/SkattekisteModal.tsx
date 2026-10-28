import React, { useState } from 'react';
import {
  X,
  Compass,
  MapPin,
  Lock,
  Unlock,
  CheckCircle2,
  Award,
  Sparkles,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Gift,
  Camera,
} from 'lucide-react';

export interface MysteryStation {
  id: string;
  stepNumber: number;
  title: string;
  badge: string;
  clueText: string;
  targetAnswer: string;
  hint: string;
  unlockIndices: [number, number]; // F.eks. [0, 1] for siffer 1 og 2
  digitValues: [string, string];
}

export interface CityMystery {
  city: string;
  title: string;
  subtitle: string;
  locationName: string;
  distanceKm: string;
  correctCode: string; // 6 siffer: 1 000 000 kombinasjoner (umulig å gjette)
  sponsorName: string;
  sponsorReward: string;
  solverCount: number;
  stations: MysteryStation[];
}

const CITY_MYSTERIES: Record<string, CityMystery> = {
  Bergen: {
    city: 'Bergen',
    title: 'Mysteriet om Sandviksbatteriets Vaktpost',
    subtitle: 'Finn den glemte ammunisjonskisten gjemt under fjelloverhenget',
    locationName: 'Sandviksbatteriet & Skansen',
    distanceKm: '2,8 km tur-retur',
    correctCode: '428619',
    sponsorName: 'Sparebanken Vest & Sætregården',
    sponsorReward: 'Gratis ferske skillingsboller & varm kakao for hele familien',
    solverCount: 142,
    stations: [
      {
        id: 'b-1',
        stepNumber: 1,
        title: 'Foto-detektiven: Tretrappen fra 1918',
        badge: 'Post 1 av 3 • Gir siffer 1 og 2',
        clueText:
          'Still dere opp ved foten av tretrappen der bildet fra 1918 ble tatt. Hvor mange store bjørketrær vokser opp i utsikten mot Byfjorden i dag (4), og hvor mange trebenker står på platået bak dere (2)? Skriv inn koden (42).',
        targetAnswer: '42',
        hint: 'Kombiner tallet på bjørketrærne (4) og benkene (2): Svar 42.',
        unlockIndices: [0, 1],
        digitValues: ['4', '2'],
      },
      {
        id: 'b-2',
        stepNumber: 2,
        title: 'Årstallskoden i Fjellet',
        badge: 'Post 2 av 3 • Gir siffer 3 og 4',
        clueText:
          'Gå opp på kanonplatået. Bak den midterste benken finnes en gammel jernbolt forankret i berget. Hvilket tosifret tall er hugget inn i berget 10 cm til venstre for bolten?',
        targetAnswer: '86',
        hint: 'Se etter de innhuggede tallene i berget: 86.',
        unlockIndices: [2, 3],
        digitValues: ['8', '6'],
      },
      {
        id: 'b-3',
        stepNumber: 3,
        title: 'Sol-astrolabiumets Dagslysvinkel',
        badge: 'Post 3 av 3 • Gir siffer 5 og 6',
        clueText:
          'Sjekk Det Taktile Sol-astrolabiet i appen: Hva er solhøyden over Bergen i hele grader ved middagstid (kl. 12:45) i dag?',
        targetAnswer: '19',
        hint: 'Les av solhøyden i astrolabiet: 19 grader.',
        unlockIndices: [4, 5],
        digitValues: ['1', '9'],
      },
    ],
  },
  Trondheim: {
    city: 'Trondheim',
    title: 'Nidaros-ridderens Skjulte Kodeskrift',
    subtitle: 'Finn festningskisten gjemt i vollgravene ved Kristiansten',
    locationName: 'Kristiansten Festning',
    distanceKm: '2,1 km tur-retur',
    correctCode: '571982',
    sponsorName: 'SpareBank 1 SMN & Skistua',
    sponsorReward: 'Tursett med termos, sitteunderlag og 500 Luks-poeng',
    solverCount: 98,
    stations: [
      {
        id: 't-1',
        stepNumber: 1,
        title: 'Steinhuggerens Hemmelige Kryss',
        badge: 'Post 1 av 3 • Gir siffer 1 og 2',
        clueText:
          'Finn den eldste muren ved kanonporten med de tre innhuggede kryssene fra 1681. Hvor mange store jernbolter stikker ut av muren (5), og hvor mange kanoner står rettet mot fjorden (7)? Skriv 57.',
        targetAnswer: '57',
        hint: 'Kombiner jernboltene (5) og kanonene (7): 57.',
        unlockIndices: [0, 1],
        digitValues: ['5', '7'],
      },
      {
        id: 't-2',
        stepNumber: 2,
        title: 'Krutttårnets Vaktkode',
        badge: 'Post 2 av 3 • Gir siffer 3 og 4',
        clueText:
          'Still dere ved inngangen til det hvite tårnet. Hvor mange trappetrinn i rød granitt må dere gå opp for å nå porten?',
        targetAnswer: '19',
        hint: 'Tell alle granitt-trinnene fra gressbakken opp til portalen: 19.',
        unlockIndices: [2, 3],
        digitValues: ['1', '9'],
      },
      {
        id: 't-3',
        stepNumber: 3,
        title: 'Solbuen over Tyholttårnet',
        badge: 'Post 3 av 3 • Gir siffer 5 og 6',
        clueText:
          'Bruk Sol-astrolabiets kompass: Hva er retningsvinkelen i hele grader mot Tyholttårnets topp?',
        targetAnswer: '82',
        hint: 'Vinkelen mot Tyholttårnet er 82 grader.',
        unlockIndices: [4, 5],
        digitValues: ['8', '2'],
      },
    ],
  },
  Eidfjord: {
    city: 'Eidfjord',
    title: 'Hæreid-kongens Gravkammer-skatt',
    subtitle: 'Finn bronsekisten gjemt langs stien ved Heggjagarden',
    locationName: 'Hæreid & Eidfjordvatnet',
    distanceKm: '3,2 km rundtur',
    correctCode: '314590',
    sponsorName: 'Sjel og Gane & Heit Eidfjord Sauna',
    sponsorReward: 'Gratis familiebadstue og lokal eplesider-smaking',
    solverCount: 47,
    stations: [
      {
        id: 'e-1',
        stepNumber: 1,
        title: 'Vikinghaugens Vaktstein',
        badge: 'Post 1 av 3 • Gir siffer 1 og 2',
        clueText:
          'Gå opp på Hæreidsplatået til det store gravfeltet fra jernalderen. Hvor mange bautasteiner står oppreist ved den største kongehaugen (3), og hvor mange informasjonsskilt står ved stien (1)? Skriv 31.',
        targetAnswer: '31',
        hint: 'Kombiner bautasteinene (3) og skiltet (1): 31.',
        unlockIndices: [0, 1],
        digitValues: ['3', '1'],
      },
      {
        id: 'e-2',
        stepNumber: 2,
        title: '300-årsporten hos Arthur',
        badge: 'Post 2 av 3 • Gir siffer 3 og 4',
        clueText:
          'Gå ned til Sjel og Gane (Heggjagarden). Hvor mange tretrinn fører opp til Cognac-loftet i 3. etasje (eller sjekk skiltet for historisk årstall)?',
        targetAnswer: '45',
        hint: 'Tallet på skiltet ved inngangen: 45.',
        unlockIndices: [2, 3],
        digitValues: ['4', '5'],
      },
      {
        id: 'e-3',
        stepNumber: 3,
        title: 'Fjordbadstuens Solvinkel',
        badge: 'Post 3 av 3 • Gir siffer 5 og 6',
        clueText:
          'Nede ved Heit Fjordbadstue ved vannkanten: Hvilken kompassvinkel (rett øst) treffer morgensolen badstueveggen?',
        targetAnswer: '90',
        hint: 'Rett øst tilsvarer 90 grader.',
        unlockIndices: [4, 5],
        digitValues: ['9', '0'],
      },
    ],
  },
};

interface SkattekisteModalProps {
  isOpen: boolean;
  onClose: () => void;
  city?: string;
  selectedCity?: string;
  lang?: string;
  onAwardPoints?: (points: number) => void;
  onOpenTurBuilderWithTrail?: (trailTitle: string) => void;
  onOpenFamilieEventyr?: () => void;
  onOpenAR?: () => void;
}

export const SkattekisteModal: React.FC<SkattekisteModalProps> = ({
  isOpen,
  onClose,
  city,
  selectedCity,
  lang: _lang = 'no',
  onAwardPoints,
  onOpenTurBuilderWithTrail,
  onOpenFamilieEventyr,
  onOpenAR,
}) => {
  const activeCity = city || selectedCity || 'Bergen';
  const currentCityKey = activeCity in CITY_MYSTERIES ? activeCity : 'Bergen';
  const mystery = CITY_MYSTERIES[currentCityKey];

  // Kodelås-hjul State (6 sifre — 1 000 000 kombinasjoner)
  const [digits, setDigits] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [revealedDigits, setRevealedDigits] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [hasSigned, setHasSigned] = useState(false);

  if (!isOpen) return null;

  // Håndter rulling av kodelås-hjul
  const adjustDigit = (index: number, delta: number) => {
    setDigits(prev => {
      const next = [...prev];
      next[index] = (next[index] + delta + 10) % 10;
      return next;
    });
  };

  const currentCodeString = digits.join('');

  // Sjekk svar på en av gåtene (låser opp et par med sifre)
  const handleVerifyAnswer = (station: MysteryStation) => {
    const input = (userAnswers[station.id] || '').trim().toLowerCase();
    const correct = station.targetAnswer.toLowerCase();

    if (input === correct || input.includes(correct)) {
      const [idxA, idxB] = station.unlockIndices;
      const numA = parseInt(mystery.correctCode[idxA], 10);
      const numB = parseInt(mystery.correctCode[idxB], 10);

      setDigits(prev => {
        const next = [...prev];
        next[idxA] = numA;
        next[idxB] = numB;
        return next;
      });

      setRevealedDigits(prev => {
        const next = [...prev];
        next[idxA] = true;
        next[idxB] = true;
        return next;
      });
    } else {
      alert(`Ikke helt riktig ennå! Hint: ${station.hint}`);
    }
  };

  // Åpne kisten når koden er tastet
  const handleTryUnlock = () => {
    if (currentCodeString === mystery.correctCode) {
      setIsUnlocked(true);
      onAwardPoints?.(500);
    } else {
      alert(
        'Kodelåsen rikker seg ikke! Med 6 sifre (1 000 000 muligheter) er det umulig å gjette. Løs de 3 postene langs stien for å finne hele koden.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-[#141311] border border-amber-500/40 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        
        {/* TOPP-HEADER MED GULLGLØD */}
        <div className="relative px-6 py-5 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/60 via-orange-950/40 to-[#141311]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#18181b] rounded-[14px] flex items-center justify-center">
                  <Compass className="w-6 h-6 text-amber-300 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    MÅNEDENS LEVENDE LOKALMYSTERIUM
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {mystery.city}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white font-serif-display tracking-tight mt-1">
                  {mystery.title}
                </h2>
                <p className="text-xs text-stone-300 mt-0.5">
                  {mystery.subtitle} • {mystery.distanceKm}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shadow-md"
              title="Lukk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HOVEDINNHOLD (Scrollbart) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* HVIS KISTEN ER LÅST OPP: SUKSESS & GULLBOKEN */}
          {isUnlocked ? (
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center shadow-xl shadow-amber-500/30">
                <Unlock className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <span className="text-xs font-black tracking-widest uppercase text-amber-400">
                  KLIKK! KODELÅSEN SPRATT OPP! 🎉
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-serif-display mt-1">
                  Gratulerer, Sjefsdetektiver!
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto mt-2 leading-relaxed">
                  Dere har funnet og åpnet den 6-sifrede skattekisten i {mystery.city}! Dere er nå offisielt kvalifisert til Månedens Vinnerfamilie og Den Store Sommerfinalen!
                </p>
              </div>

              {/* SPONSOR-PREMIE & DIPLOM */}
              <div className="max-w-md mx-auto p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-stone-900 to-black border border-amber-400/50 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-amber-300 flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" /> Månedens Sponsorpremie
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">+500 Luks-poeng</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {mystery.sponsorReward}
                </div>
                <div className="text-[11px] text-stone-400">
                  Gitt i samarbeid med <strong>{mystery.sponsorName}</strong>. Vis frem denne skjermen i kafeen for å hente ut premien!
                </div>
              </div>

              {/* GULLBOKEN: SKRIV FAMILIENS NAVN */}
              <div className="max-w-md mx-auto p-5 rounded-3xl bg-stone-900/90 border border-stone-800 text-left space-y-3">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>Skriv dere inn i Den Gyldne Turboken</span>
                </div>

                {hasSigned ? (
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Familiens navn er foreviget i turboken for {mystery.city}!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={signedName}
                      onChange={(e) => setSignedName(e.target.value)}
                      placeholder="f.eks. Familien Hansen (Emma 8 år & Pappa)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                    <button
                      onClick={() => {
                        if (signedName.trim()) setHasSigned(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs transition cursor-pointer shrink-0"
                    >
                      Signer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Eventyr- og AR-snarveier for familien */}
              {(onOpenFamilieEventyr || onOpenAR) && (
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  {onOpenFamilieEventyr && (
                    <button
                      type="button"
                      onClick={onOpenFamilieEventyr}
                      className="w-full sm:flex-1 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/30 hover:border-amber-400 text-left transition cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">Familieeventyret (Lys-speideren)</div>
                        <div className="text-[10px] text-stone-400">Askeladden & 10 Snakkende Dyr</div>
                      </div>
                    </button>
                  )}
                  {onOpenAR && (
                    <button
                      type="button"
                      onClick={onOpenAR}
                      className="w-full sm:flex-1 p-3 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/15 to-transparent border border-purple-500/30 hover:border-purple-400 text-left transition cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <Camera className="w-4 h-4 text-purple-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">AR Sol-kamera</div>
                        <div className="text-[10px] text-stone-400">Finn skjulte Sol-drops i 3D</div>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* 1. KODELÅS-HJULET MED 6 SIFRE (1 000 000 KOMBINASJONER) */}
              <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-stone-900 via-[#18181b] to-black border-2 border-amber-500/40 shadow-xl shadow-amber-950/30 text-center space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>6-sifret Kodelås (1 000 000 Muligheter)</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    {mystery.solverCount} familier har løst den
                  </span>
                </div>

                {/* DE 6 SIFRENE GRUPPERT I 3 PAR (2 siffer per post) */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                  {/* PAR 1 (Post 1) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/5">
                    {[0, 1].map((idx) => {
                      const isRevealed = revealedDigits[idx];
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => adjustDigit(idx, 1)}
                            className="p-0.5 rounded text-stone-400 hover:text-amber-300 transition cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <div
                            className={`w-9 h-13 sm:w-11 sm:h-16 rounded-xl flex items-center justify-center font-mono text-xl sm:text-2xl font-black shadow-inner transition-all ${
                              isRevealed
                                ? 'bg-gradient-to-b from-amber-500 to-yellow-600 text-stone-950 border-2 border-yellow-300 shadow-amber-500/30'
                                : 'bg-stone-950 border border-stone-800 text-amber-300'
                            }`}
                          >
                            {digits[idx]}
                          </div>
                          <button
                            type="button"
                            onClick={() => adjustDigit(idx, -1)}
                            className="p-0.5 rounded text-stone-400 hover:text-amber-300 transition cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <span className="text-amber-500/60 font-bold">•</span>

                  {/* PAR 2 (Post 2) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/5">
                    {[2, 3].map((idx) => {
                      const isRevealed = revealedDigits[idx];
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => adjustDigit(idx, 1)}
                            className="p-0.5 rounded text-stone-400 hover:text-amber-300 transition cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <div
                            className={`w-9 h-13 sm:w-11 sm:h-16 rounded-xl flex items-center justify-center font-mono text-xl sm:text-2xl font-black shadow-inner transition-all ${
                              isRevealed
                                ? 'bg-gradient-to-b from-amber-500 to-yellow-600 text-stone-950 border-2 border-yellow-300 shadow-amber-500/30'
                                : 'bg-stone-950 border border-stone-800 text-amber-300'
                            }`}
                          >
                            {digits[idx]}
                          </div>
                          <button
                            type="button"
                            onClick={() => adjustDigit(idx, -1)}
                            className="p-0.5 rounded text-stone-400 hover:text-amber-300 transition cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <span className="text-amber-500/60 font-bold">•</span>

                  {/* PAR 3 (Post 3) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/5">
                    {[4, 5].map((idx) => {
                      const isRevealed = revealedDigits[idx];
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => adjustDigit(idx, 1)}
                            className="p-0.5 rounded text-stone-400 hover:text-amber-300 transition cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <div
                            className={`w-9 h-13 sm:w-11 sm:h-16 rounded-xl flex items-center justify-center font-mono text-xl sm:text-2xl font-black shadow-inner transition-all ${
                              isRevealed
                                ? 'bg-gradient-to-b from-amber-500 to-yellow-600 text-stone-950 border-2 border-yellow-300 shadow-amber-500/30'
                                : 'bg-stone-950 border border-stone-800 text-amber-300'
                            }`}
                          >
                            {digits[idx]}
                          </div>
                          <button
                            type="button"
                            onClick={() => adjustDigit(idx, -1)}
                            className="p-0.5 rounded text-stone-400 hover:text-amber-300 transition cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTryUnlock}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-[#E8622C] to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Vri om 6-sifret kodelås & Åpne kisten!</span>
                  </button>
                </div>
              </div>

              {/* 2. DE TRE IKKE-GOOGLEBARE REBUSPOSTENE (Hver post gir 2 sifre) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#E8622C]" />
                    <span>Løs de 3 postene ute i naturen</span>
                  </h3>
                  <span className="text-[11px] text-amber-400">Krever fysisk oppmøte</span>
                </div>

                <div className="space-y-3">
                  {mystery.stations.map((st) => {
                    const isSolved =
                      revealedDigits[st.unlockIndices[0]] &&
                      revealedDigits[st.unlockIndices[1]];
                    return (
                      <div
                        key={st.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSolved
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-stone-900/70 border-stone-800 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                            {st.badge}
                          </span>
                          {isSolved && (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Løst! (Tall: {st.targetAnswer})
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                          <span>{st.title}</span>
                        </h4>

                        <p className="text-xs text-stone-300 leading-relaxed mb-3">
                          {st.clueText}
                        </p>

                        {!isSolved && (
                          <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
                            <input
                              type="text"
                              value={userAnswers[st.id] || ''}
                              onChange={(e) =>
                                setUserAnswers(prev => ({ ...prev, [st.id]: e.target.value }))
                              }
                              placeholder="Skriv inn tosifret svar (f.eks. 42)..."
                              className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-white focus:outline-hidden focus:border-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyAnswer(st)}
                              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs transition cursor-pointer shrink-0"
                            >
                              Lås opp 2 sifre
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. HVORDAN FINNE KISTEN & SPONSOR INFO */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex items-start gap-3 text-xs text-stone-300">
                <MapPin className="w-5 h-5 text-[#E8622C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white">Hvor er den fysiske kisten gjemt?</div>
                  <p className="text-[11px] leading-relaxed text-stone-400">
                    Kisten er en solid ammunisjonsboks i stål, diskret vaier-låst under fjelloverhenget ved {mystery.locationName}. Når den 6-sifrede koden er vridd inn på den fysiske hengelåsen, spretter lokket opp!
                  </p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* FAST BUNNLINJE */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Offisiell Utaktiv Geo-Rebus 2026/2027</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTurBuilderWithTrail && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTurBuilderWithTrail(mystery.title);
                }}
                className="px-4 py-2 rounded-xl bg-[#E8622C] hover:bg-[#c2410c] text-white font-bold text-xs transition cursor-pointer"
              >
                Gå ruten i Turbygger
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Lukk
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
