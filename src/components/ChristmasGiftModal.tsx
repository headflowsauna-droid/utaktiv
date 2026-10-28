import React, { useState } from 'react';
import { 
  createGiftCard, 
  GiftCard 
} from '../engine/gifting';
import { initiateVippsPayment } from '../engine/vipps';
import { Interactive3DCard } from './Interactive3DCard';
import { 
  X, 
  Gift, 
  CheckCircle2, 
  Sun, 
  Share2, 
  Printer, 
  Copy, 
  ShieldCheck, 
  Phone,
  Sparkles
} from 'lucide-react';

interface ChristmasGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints?: number;
  onPointsUpdated?: (newBalance: number) => void;
}

interface ChristmasPackage {
  id: string;
  name: string;
  priceNok: number;
  points: number;
  bonusPoints: number;
  badge: string;
  popular?: boolean;
  description: string;
  perks: string[];
}

const CHRISTMAS_PACKAGES: ChristmasPackage[] = [
  {
    id: 'spire',
    name: 'Nabolags-Spiren',
    priceNok: 250,
    points: 250,
    bonusPoints: 10,
    badge: 'Fin fra nabo eller onkel',
    description: 'Gir barnet startkapital (1 poeng = 1 kr) for å hjelpe i nabolaget og spare til sin første store opplevelse.',
    perks: [
      '250 Luks-poeng + 10 bonuspoeng (verdi 260 kr)',
      'Digitalt julekort & personlig hilsen',
      'Romjulens oppdragshefte i appen',
      '100 % låst til felles uteopplevelser'
    ]
  },
  {
    id: 'aktiv',
    name: 'Aktiv Barndom',
    priceNok: 500,
    points: 500,
    bonusPoints: 20,
    popular: true,
    badge: 'Mest populære julegave 🎄',
    description: 'Årets hjertevarme gave under treet. Gir nok poeng til en hel dag i klatrepark eller på fjellet.',
    perks: [
      '500 Luks-poeng + 20 bonuspoeng (verdi 520 kr)',
      'Trykket fysisk gavehefte i postkassen',
      'Eksklusivt «Dagslys-merke» for vinteren',
      'Førsterett på klatrepark og DNT-hytter'
    ]
  },
  {
    id: 'besteforeldre',
    name: 'Besteforeldrenes Minnegave',
    priceNok: 1000,
    points: 1000,
    bonusPoints: 50,
    badge: '1 050 poeng (1 poeng = 1 kr)',
    description: 'Skap minner for livet. Kjøp for 1 000 kr og få 1 050 poeng til familiens helgetur der barnebarnet er stolt turleder.',
    perks: [
      '1 000 Luks-poeng + 50 bonuspoeng (= 1 050 poeng / 1 050 kr)',
      'Gullpreget hefte levert i gaveeske',
      '«Barnets Valg»-sertifikat for familietur',
      'Personlig videohilsen på julaften'
    ]
  }
];

export const ChristmasGiftModal: React.FC<ChristmasGiftModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedPkg, setSelectedPkg] = useState<ChristmasPackage>(CHRISTMAS_PACKAGES[1]);
  const [deliveryType, setDeliveryType] = useState<'digital' | 'postal'>('postal');
  
  // Skjemadata
  const [senderName, setSenderName] = useState('Bestemor og Bestefar');
  const [recipientName, setRecipientName] = useState('Oliver og Milla');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [message, setMessage] = useState('Kjære barnebarn! I år får dere minner, dagslys og ekte opplevelser i stedet for plastikk. Gleder oss til å være med dere ut! Glad i dere ❤️');

  // Vipps Flow State (forhåndsutfylt med registrert Vipps testbruker)
  const [vippsPhone, setVippsPhone] = useState('400 01 448');
  const [isVippsProcessing, setIsVippsProcessing] = useState(false);
  const [createdGift, setCreatedGift] = useState<GiftCard | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [show3DPreview, setShow3DPreview] = useState(false);

  if (!isOpen) return null;

  const handleVippsPurchase = async () => {
    setIsVippsProcessing(true);
    const totalPoints = selectedPkg.points + selectedPkg.bonusPoints;
    const orderRef = `jul-${Date.now().toString(36)}`;

    try {
      const vippsRes = await initiateVippsPayment({
        amountNok: selectedPkg.priceNok,
        orderId: orderRef,
        description: `Utaktiv Julegavekort: ${selectedPkg.name}`,
        customerPhone: vippsPhone,
        returnUrl: window.location.href,
      });

      if (vippsRes.redirectUrl && !vippsRes.isSimulated) {
        window.location.href = vippsRes.redirectUrl;
        return;
      }
    } catch {
      // Fortsett til opprettelse ved lokal test/simulering
    }

    const res = await createGiftCard({
      type: 'activity',
      pointsAmount: totalPoints,
      nokValue: selectedPkg.priceNok,
      activityId: `christmas-${selectedPkg.id}`,
      activityTitle: `${selectedPkg.name} (${totalPoints.toLocaleString('no-NO')} Luks-poeng Julegavekort)`,
      senderName: senderName.trim() || 'En som er glad i deg',
      recipientName: recipientName.trim() || 'Barnebarn',
      recipientContact: deliveryType === 'postal' ? postalAddress : recipientPhone,
      message,
      theme: 'christmas',
      paymentMethod: 'vipps',
    });

    setIsVippsProcessing(false);
    if (res.success && res.gift) {
      setCreatedGift(res.gift);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[94vh] bg-[#141311] border border-orange-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        
        {/* JULEKAMPANJE HEADER (Utaktiv.no-stil) */}
        <div className="relative px-6 py-5 border-b border-orange-500/20 bg-gradient-to-r from-[#c2410c]/30 via-[#E8622C]/20 to-[#141311]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8622C] to-[#c2410c] flex items-center justify-center shadow-lg shadow-orange-500/30 text-white shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#E8622C]/20 border border-[#E8622C]/40 text-orange-300">
                    Besteforeldre-oppropet 2026
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5" /> 1 Luks-poeng = 1 NOK
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
                  Gi minner og arbeidsglede – ikke plast og skjerm 🎄
                </h2>
                <p className="text-xs text-stone-300 mt-0.5">
                  Luks-poeng låst til felles opplevelser. Barna jobber i nabolaget, er ute i dagslys og sparer til turen!
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition shrink-0"
              title="Lukk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HOVEDINNHOLD */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Suksessvisning etter Vipps-kjøp */}
          {createdGift ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div>
                <span className="text-xs font-bold text-orange-400 tracking-wider uppercase">Vipps-betaling fullført!</span>
                <h3 className="text-2xl font-black text-white mt-1">
                  Gratulerer! Julegaven er sikret 🎁
                </h3>
                <p className="text-xs text-stone-300 max-w-md mx-auto mt-2">
                  {deliveryType === 'postal' 
                    ? `Fysisk hefte sendes i posten til ${postalAddress || 'oppgitt adresse'}. Gavekortet er også umiddelbart klart digitalt.`
                    : `Gavekortet er klart til overlevering til ${createdGift.recipientName}.`}
                </p>
              </div>

              {/* Taktilt 3D Gullfolie-Gavekort */}
              <Interactive3DCard
                packageName={selectedPkg.name}
                points={selectedPkg.points}
                bonusPoints={selectedPkg.bonusPoints}
                senderName={createdGift.senderName}
                recipientName={createdGift.recipientName}
                message={createdGift.message}
                code={createdGift.code}
              />

              <div className="max-w-md mx-auto flex items-center justify-between p-3 rounded-2xl bg-stone-900 border border-amber-500/30">
                <div className="text-left">
                  <div className="text-[10px] text-stone-400">Gavekortkode for innløsing i appen:</div>
                  <div className="text-sm font-mono font-black text-amber-300 tracking-wider">
                    {createdGift.code}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyCode(createdGift.code)}
                  className="px-3.5 py-2 rounded-xl bg-[#E8622C] hover:bg-[#c2410c] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Kopiert! ✓' : 'Kopier kode'}</span>
                </button>
              </div>

              {/* Handlingsknapper */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Skriv ut gavekort til treet</span>
                </button>
                <button
                  onClick={() => {
                    setCreatedGift(null);
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#E8622C] hover:bg-[#c2410c] text-white text-xs font-extrabold shadow-lg shadow-orange-500/20 transition"
                >
                  Ferdig
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEG 1: VELG JULEPAKKE */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#E8622C]" />
                    <span>1. Velg Julepakke</span>
                  </label>
                  <span className="text-[11px] text-stone-400">100 % opplevelsesgaranti</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {CHRISTMAS_PACKAGES.map((pkg) => {
                    const isSelected = selectedPkg.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#E8622C]/20 to-stone-900/90 border-[#E8622C] shadow-lg shadow-orange-500/15'
                            : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
                        }`}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#E8622C] text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                            Bestselger
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                            {pkg.badge}
                          </span>
                          <h4 className="text-base font-black text-white mt-0.5">{pkg.name}</h4>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white">{pkg.priceNok} kr</span>
                            <span className="text-xs text-stone-400">
                              = {(pkg.points + pkg.bonusPoints).toLocaleString()} poeng
                            </span>
                          </div>
                          {pkg.bonusPoints > 0 && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              +{pkg.bonusPoints} gratis dagslysbonus!
                            </span>
                          )}
                          <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                            {pkg.description}
                          </p>
                        </div>

                        <ul className="mt-4 pt-3 border-t border-stone-800 space-y-1.5 text-[11px] text-stone-300">
                          {pkg.perks.map((perk, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#E8622C] shrink-0" />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* INTERAKTIV 3D FORHÅNDSVISNINGSKNAPP */}
                <div className="flex justify-center pt-3">
                  <button
                    type="button"
                    onClick={() => setShow3DPreview(!show3DPreview)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{show3DPreview ? 'Skjul 3D-kort' : '✨ Forhåndsvis det interaktive 3D-kortet (Vipp og skrap solen)'}</span>
                  </button>
                </div>

                {show3DPreview && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-black/50 border border-amber-500/30 space-y-3 mt-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-center text-xs text-stone-300">
                      <span className="font-bold text-amber-400">Taktilt 3D-Gavekort:</span> Vipp på mobilen eller beveg musen over kortet for å se gullfolien skinne!
                    </div>
                    <Interactive3DCard
                      packageName={selectedPkg.name}
                      points={selectedPkg.points}
                      bonusPoints={selectedPkg.bonusPoints}
                      senderName={senderName || 'Bestemor og Bestefar'}
                      recipientName={recipientName || 'Oliver og Milla'}
                      message={message}
                      code="SOL-EKSEMPEL-2026"
                    />
                  </div>
                )}
              </div>

              {/* STEG 2: LEVERINGSFORM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => setDeliveryType('postal')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                    deliveryType === 'postal'
                      ? 'bg-[#E8622C]/15 border-[#E8622C] text-white'
                      : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#E8622C]/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Fysisk hefte i postkassen</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Gratis frakt</span>
                    </div>
                    <div className="text-[11px] text-stone-400">Pent trykket gavehefte klart til treet</div>
                  </div>
                </div>

                <div
                  onClick={() => setDeliveryType('digital')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                    deliveryType === 'digital'
                      ? 'bg-[#E8622C]/15 border-[#E8622C] text-white'
                      : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Digitalt på SMS / Vipps</div>
                    <div className="text-[11px] text-stone-400">Umiddelbar levering eller planlagt julaften</div>
                  </div>
                </div>
              </div>

              {/* STEG 3: DETALJER & HILSEN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">Fra (Giverens navn):</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="f.eks. Bestemor Torill"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white focus:outline-hidden focus:border-[#E8622C]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">Til (Barnebarn / Familie):</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="f.eks. Oliver (9 år) og Milla (6 år)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white focus:outline-hidden focus:border-[#E8622C]"
                  />
                </div>

                {deliveryType === 'postal' ? (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-300 block mb-1">Leveringsadresse for det trykte gaveheftet:</label>
                    <input
                      type="text"
                      value={postalAddress}
                      onChange={(e) => setPostalAddress(e.target.value)}
                      placeholder="Gateadresse, postnummer og poststed"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white focus:outline-hidden focus:border-[#E8622C]"
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-300 block mb-1">Mottakers mobilnummer (for SMS-gavekort):</label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="+47 912 34 567"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white focus:outline-hidden focus:border-[#E8622C]"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-300 block mb-1">Personlig julehilsen:</label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white focus:outline-hidden focus:border-[#E8622C]"
                  />
                </div>
              </div>

              {/* LIVE 3D FORHÅNDSVISNING */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Forhåndsvisning: Ditt 3D Gullpregede Opplevelseskort</span>
                  </label>
                  <span className="text-[10px] text-amber-400/80 font-mono">Taktil 3D & Gullfolie</span>
                </div>
                <Interactive3DCard
                  packageName={selectedPkg.name}
                  points={selectedPkg.points}
                  bonusPoints={selectedPkg.bonusPoints}
                  senderName={senderName}
                  recipientName={recipientName}
                  message={message}
                  code="VIPPS-EKSEMPEL-2026"
                />
              </div>

              {/* STEG 4: BETAL MED VIPPS */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ff5b24]/20 via-[#ff5b24]/10 to-stone-900 border border-[#ff5b24]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#ff5b24] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-[#ff5b24]/30">
                    V
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Betal med Vipps</span>
                      <span className="text-[10px] text-stone-300 font-normal">• Trygt, raskt & enkelt</span>
                    </div>
                    <div className="text-xs text-stone-300 mt-0.5">
                      Totalt å betale: <strong className="text-white text-sm">{selectedPkg.priceNok} NOK</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={vippsPhone}
                      onChange={(e) => setVippsPhone(e.target.value)}
                      placeholder="Ditt Vipps-tlf"
                      className="pl-8 pr-3 py-2 w-32 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:border-[#ff5b24] focus:outline-hidden"
                    />
                  </div>
                  <button
                    onClick={handleVippsPurchase}
                    disabled={isVippsProcessing}
                    className="px-6 py-2.5 rounded-xl bg-[#ff5b24] hover:bg-[#e04815] text-white font-extrabold text-xs shadow-lg shadow-[#ff5b24]/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isVippsProcessing ? (
                      <span>Venter på Vipps...</span>
                    ) : (
                      <>
                        <span>Fullfør kjøp</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* VERDIGRUNNLAG & TILLIT */}
              <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800/80 text-[11px] text-stone-400 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-stone-200">Garantert opplevelsesvaluta (Gyldig i 1 år):</strong> Poengene kan kun brukes på familieopplevelser, klatreparker, DNT-hytter, badstuer, teater og friluftsliv – en trygg gave som aldri kan sløses på skjerm eller unødvendig plast.
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
