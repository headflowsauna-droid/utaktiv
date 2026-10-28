import React, { useState } from 'react';
import {
  X,
  Compass,
  Sparkles,
  Waves,
  EyeOff,
  Flame,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Coffee,
  LifeBuoy
} from 'lucide-react';
import {
  TINYDOME_LOCATIONS,
  ARCHITECTURAL_SPECS,
  generateCommunityBlueprint,
  calculateRentalYield,
  getTinydomeTicketCount,
  HOW_TO_EARN_TICKETS,
  GRAND_PRIZE_VALUE_NOK,
  WEEKS_PER_SHARE
} from '../engine/tinydome';
import { TINYDOME_COMMUNITY, getEarnedLuxPoints, LUX_REWARD_CATALOG } from '../engine/tinydomeCommunity';

interface TinydomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TinydomeModal: React.FC<TinydomeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'community' | 'model' | 'amenities' | 'tickets'>('community');
  const [selectedLocationId] = useState<string>('eidfjord-waterfront');
  const [unitCount, setUnitCount] = useState<number>(12);
  const [weeksToSublet, setWeeksToSublet] = useState<number>(4);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);

  if (!isOpen) return null;

  const activeLocation = TINYDOME_LOCATIONS.find(l => l.id === selectedLocationId) || TINYDOME_LOCATIONS[0];
  const units = generateCommunityBlueprint(selectedLocationId, unitCount);
  const yieldResult = calculateRentalYield({ weeksSublet: weeksToSublet });
  const userTickets = getTinydomeTicketCount();
  const userLuxPoints = getEarnedLuxPoints();
  const selectedUnit = units[selectedUnitIndex] || units[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col my-auto max-h-[92vh]">
        
        {/* 1. Header med Utaktiv-sol & Tinydome emblem */}
        <div className="relative z-10 px-6 py-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950/80 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-2xl">
              🛸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-serif-display text-white tracking-wide">
                  Tinydome Eco-Samfunn
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Vestlandet Pilot
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeLocation.name} • Sommereventyret 2027</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Navigasjonsfaner */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 overflow-x-auto gap-2 py-2">
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'community'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Resort & Blueprint ({unitCount} enheter)</span>
          </button>

          <button
            onClick={() => setActiveTab('amenities')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'amenities'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Waves className="w-4 h-4" />
            <span>Fellesskap, Badstue & Lekeplass</span>
          </button>

          <button
            onClick={() => setActiveTab('model')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'model'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1/12 Eierandel & Leieinntekt</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Mine Sommerlodd ({userTickets})</span>
          </button>
        </div>

        {/* 3. Innhold */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* FANE 1: RESORT & BLUEPRINT */}
          {activeTab === 'community' && (
            <div className="space-y-6">
              
              {/* Topp-banner: Vinklet utsikt uten innsyn */}
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl">
                <img
                  src="/tinydome_resort_view.jpg"
                  alt="Tinydome Eco-Samfunn Vestlandet"
                  className="w-full h-48 sm:h-60 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                        Offisiell Master-Visjon
                      </span>
                      <span className="text-xs text-amber-300 font-semibold">15 Kapsler • Sauna • Badestamp • Lekeplass</span>
                    </div>
                    <h3 className="text-white text-base sm:text-lg font-bold font-serif-display">
                      Fjordblikk Hardanger: Flytende Space Capsules & Glassdomer
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-sky-950/70 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 mt-1 sm:mt-0">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Privatlivsgarantien: 100% Utsikt — 0% Innsyn
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Alle boenheter er vinklet med omtanke langs trebryggene slik at alle nyter ubrutt fjord- og fjellpanorama, men ingen har innsyn til hverandre.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
                  <span className="text-slate-400">Skaler samfunn:</span>
                  <select
                    value={unitCount}
                    onChange={e => setUnitCount(parseInt(e.target.value, 10))}
                    className="bg-transparent font-bold text-amber-300 focus:outline-none cursor-pointer"
                  >
                    <option value={6} className="bg-slate-900">6 Kapsler</option>
                    <option value={8} className="bg-slate-900">8 Kapsler</option>
                    <option value={12} className="bg-slate-900">12 Kapsler (Anbefalt)</option>
                    <option value={15} className="bg-slate-900">15 Kapsler</option>
                    <option value={20} className="bg-slate-900">20 Kapsler (Maks)</option>
                  </select>
                </div>
              </div>

              {/* Interaktiv Blueprint Visning */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span>🛸</span>
                    <span>Interaktiv Sameie-Oversikt ({units.length} Space Capsules)</span>
                  </h4>
                  <span className="text-[11px] text-amber-300 font-medium">
                    Trykk på en enhet for spesifikasjoner
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {units.map((unit, idx) => {
                    const isSelected = selectedUnitIndex === idx;
                    const isPrize = unit.unitNumber === 1;

                    return (
                      <button
                        key={unit.id}
                        onClick={() => setSelectedUnitIndex(idx)}
                        className={`p-3 rounded-2xl border text-left transition relative cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-950/50 hover:bg-slate-800/40 border-slate-800'
                        }`}
                      >
                        {isPrize && (
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md">
                            Sommerpremien
                          </span>
                        )}
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-white">#{unit.unitNumber.toString().padStart(2, '0')}</span>
                          <span className="text-amber-300 text-[10px]">{unit.glassCoveragePercent}% glass</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 truncate">{unit.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <span>🧭</span>
                          <span className="truncate">{unit.viewDirection}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detaljkort for valgt enhet */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                      Valgt Boenhet #{selectedUnit.unitNumber}
                    </div>
                    <h3 className="text-lg font-bold text-white font-serif-display mt-0.5">
                      {selectedUnit.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-950 text-sky-300 border border-sky-800/50">
                      {selectedUnit.structureType}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                      {selectedUnit.capacityGuests} Sengeplasser
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Glass & Materiale:</span>
                    <p className="font-semibold text-slate-200">{selectedUnit.glassMaterial}</p>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Helårsisolert mot vestlandsvær. Ekte termo-panoramaglass med solavskjerming (ingen teltduk).
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Sengeoppsett & Utsikt:</span>
                    <p className="font-semibold text-slate-200">{selectedUnit.bedSetup}</p>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Utsiktsretning: <strong className="text-amber-300">{selectedUnit.viewDirection}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Kvalitetsgaranti mot telt */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ARCHITECTURAL_SPECS.slice(0, 3).map((spec, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                    <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{spec.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{spec.description}</p>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* FANE 2: FELLESSKAP, BADSTUE & LEKEPLASS */}
          {activeTab === 'amenities' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/20">
                <h3 className="text-sm font-bold text-white mb-1">
                  Et levende, inkluderende fellesskap ved sjøen
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tinydome handler ikke om isolasjon, men om å samle generasjoner. Her kan mor stupe fra bryggen og ta forfriskende svømmetak, barna leker trygt på naturlekeplassen, og kvelden avsluttes rundt den store felles bålpannen eller i den flytende badstuen.
                </p>
              </div>

              {/* Fellesfasiliteter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TINYDOME_COMMUNITY.amenities.map(amenity => (
                  <div
                    key={amenity.id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl">
                        {amenity.icon}
                      </div>
                      <h4 className="text-sm font-bold text-white">{amenity.name}</h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{amenity.description}</p>

                    {amenity.safetyNote && (
                      <div className="p-2.5 rounded-xl bg-orange-950/50 border border-orange-500/30 text-[11px] text-orange-200 flex items-center gap-2">
                        <LifeBuoy className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <span><strong>Sikkerhetsregel:</strong> {amenity.safetyNote}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sameie-appen: Styring & Tilleggstjenester */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Styrt gjennom Sameie-appen (Draft & Tjenester)</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Alle eiere tildeles 100 poeng årlig i et rettferdig digitalt rotasjonsutkast. De mest populære ukene koster mer, slik at alle får like sjanser over tid. I appen bestiller du også:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-lg block mb-1">🧹</span>
                    <span className="font-bold text-slate-200 block">Renhold & Utvask</span>
                    <span className="text-[10px] text-slate-400">Alltid strøkent</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-lg block mb-1">🥦</span>
                    <span className="font-bold text-slate-200 block">Lokalmatkasse</span>
                    <span className="text-[10px] text-slate-400">1 200 kr / uke</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-lg block mb-1">🔄</span>
                    <span className="font-bold text-slate-200 block">Ukesbytte-Børs</span>
                    <span className="text-[10px] text-slate-400">Bytt med naboer</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-lg block mb-1">📶</span>
                    <span className="font-bold text-slate-200 block">Starlink WiFi</span>
                    <span className="text-[10px] text-slate-400">Lynraskt nett</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FANE 3: 1/12 EIERANDEL & LEIEINNTEKTER */}
          {activeTab === 'model' && (
            <div className="space-y-6">
              
              {/* Topptall */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center">
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">Andelsverdi</span>
                  <span className="text-2xl font-black text-white font-mono mt-1 block">
                    {GRAND_PRIZE_VALUE_NOK.toLocaleString('no-NO')} kr
                  </span>
                  <span className="text-[11px] text-slate-400">1/12 eierandel i Space Capsule</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center">
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Disposisjonsrett</span>
                  <span className="text-2xl font-black text-white font-mono mt-1 block">
                    {WEEKS_PER_SHARE} uker årlig
                  </span>
                  <span className="text-[11px] text-slate-400">1 uke per årstid (vår, sommer, høst, vinter)</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-sky-500/30 text-center">
                  <span className="text-xs text-sky-400 font-bold uppercase tracking-wider block">Estimert Utleie</span>
                  <span className="text-2xl font-black text-sky-300 font-mono mt-1 block">
                    ~{yieldResult.netAnnualRentalIncomeNok.toLocaleString('no-NO')} kr/år
                  </span>
                  <span className="text-[11px] text-slate-400">Ved utleie av alle 4 ukene (23% ROI)</span>
                </div>
              </div>

              {/* Interaktiv Leiekalkulator */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>Interaktiv Avkastnings-Kalkulator</span>
                </h4>
                <p className="text-xs text-slate-300">
                  Du velger selv hvor mange av dine 4 uker du vil bruke til familieferie, og hvor mange du vil sende til utleiepoolen:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">Uker til utleiepool:</span>
                    <span className="text-amber-300 font-mono text-sm">{weeksToSublet} uker ({yieldResult.weeksKeptForSelf} til eget bruk)</span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={1}
                    value={weeksToSublet}
                    onChange={e => setWeeksToSublet(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0 uker (Kun ferie)</span>
                    <span>1 uke</span>
                    <span>2 uker</span>
                    <span>3 uker</span>
                    <span>4 uker (Maks avkastning)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Netter til leie:</span>
                    <span className="font-bold text-white">{yieldResult.estimatedOccupiedNights} netter</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Brutto leie:</span>
                    <span className="font-bold text-white">{yieldResult.grossRentalIncomeNok.toLocaleString('no-NO')} kr</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Netto inntekt:</span>
                    <span className="font-bold text-emerald-300 text-sm">{yieldResult.netAnnualRentalIncomeNok.toLocaleString('no-NO')} kr</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Årlig ROI:</span>
                    <span className="font-bold text-amber-300 text-sm">{yieldResult.annualRoiPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FANE 4: MINE LODD & 5000 LUKS-POENG */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              
              {/* Lodd & Poeng-status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/70 to-slate-900 border border-amber-500/40 text-center space-y-1">
                  <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">Dine Sommerlodd</span>
                  <div className="text-4xl font-black text-amber-400 font-mono py-1">{userTickets} stk</div>
                  <p className="text-xs text-slate-300">
                    Kvalifiserer deg direkte til sommerfinalen i Eidfjord (Juli 2027)!
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950/70 to-slate-900 border border-sky-500/40 text-center space-y-1">
                  <span className="text-xs text-sky-300 font-bold uppercase tracking-wider block">Dine Luks-Poeng (Dagslys)</span>
                  <div className="text-4xl font-black text-sky-400 font-mono py-1">{userLuxPoints.toLocaleString('no-NO')} p</div>
                  <p className="text-xs text-slate-300">
                    Fullfør hele turen i Bergen for å vinne 5 000 luks-poeng!
                  </p>
                </div>
              </div>

              {/* Hva luks-poengene kan brukes til */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Innløs 5 000 Luks-poeng i lokale opplevelser:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LUX_REWARD_CATALOG.map(reward => (
                    <div key={reward.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{reward.icon}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {reward.costLux.toLocaleString('no-NO')} p
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs">{reward.title}</div>
                      <p className="text-[11px] text-slate-400">{reward.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slik sanker du flere lodd */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Slik sanker du lodd til sommerfinalen:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HOW_TO_EARN_TICKETS.map((method, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <div className="font-bold text-white text-xs">{method.title}</div>
                        <div className="text-[10px] text-amber-400 font-semibold mb-1">{method.pointsDesc}</div>
                        <p className="text-[11px] text-slate-400">{method.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* 4. Footer med CTA */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Besøk <a href="https://tinydome.no" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">tinydome.no</a> for komplett prospekt og sameiemodell.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Start Turen & Sank Lodd ☀️
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
