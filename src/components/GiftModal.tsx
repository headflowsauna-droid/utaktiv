import React, { useState } from 'react';
import { 
  createGiftCard, 
  redeemGiftCard, 
  getGiftCards, 
  GIFT_THEMES, 
  GiftTheme, 
  GiftCard 
} from '../engine/gifting';
import { ActivityItem } from '../engine/activities';
import { POINTS_PER_NOK } from '../engine/wallet';
import { 
  X, 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Wallet, 
  PartyPopper,
  Ticket
} from 'lucide-react';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityItem[];
  userPoints: number;
  onPointsUpdated: (newBalance: number) => void;
  initialActivity?: ActivityItem | null;
  onOpenChristmasGift?: () => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  onClose,
  activities,
  userPoints,
  onPointsUpdated,
  initialActivity = null,
  onOpenChristmasGift,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'my_gifts' | 'redeem'>('create');
  const [giftType, setGiftType] = useState<'points' | 'activity'>('activity');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem>(initialActivity || activities[0]);
  const [selectedTheme, setSelectedTheme] = useState<GiftTheme>('birthday');
  
  // Skjemafelter
  const [pointsAmount, setPointsAmount] = useState<number>(250);
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [message, setMessage] = useState('Gratulerer så mye med dagen! Gleder meg til vi skal ut på tur sammen! 🎉');
  const [paymentMethod, setPaymentMethod] = useState<'vipps' | 'card' | 'points'>('card');

  // Innløsning
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemerName, setRedeemerName] = useState('');

  // Status
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdGift, setCreatedGift] = useState<GiftCard | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const gifts = getGiftCards();
  const themeConfig = GIFT_THEMES[selectedTheme];

  // Kostnad (1 poeng = 1 kr, men 1 000 kr gir 1 050 poeng, 500 kr gir 520 poeng, 250 kr gir 260 poeng)
  const nokCost = giftType === 'points' 
    ? Math.round(pointsAmount / POINTS_PER_NOK) 
    : (selectedActivity.ticket?.priceNok || 150);
  const giftedPointsTotal = giftType === 'points'
    ? (pointsAmount === 1000 ? 1050 : pointsAmount === 500 ? 520 : pointsAmount === 250 ? 260 : pointsAmount)
    : undefined;
  const pointsCost = giftType === 'points' ? pointsAmount : nokCost * POINTS_PER_NOK;

  const handleCreateGift = async () => {
    setStatusMessage(null);
    const res = await createGiftCard({
      type: giftType,
      pointsAmount: giftedPointsTotal,
      nokValue: nokCost,
      activityId: giftType === 'activity' ? selectedActivity.id : undefined,
      activityTitle: giftType === 'activity' ? selectedActivity.title : undefined,
      senderName,
      recipientName,
      recipientContact,
      message,
      theme: selectedTheme,
      paymentMethod,
    });

    if (res.success && res.gift) {
      setCreatedGift(res.gift);
      if (paymentMethod === 'points') {
        onPointsUpdated(userPoints - pointsCost);
      }
      setStatusMessage({
        type: 'success',
        text: `Gavekortet ble opprettet! Kode: ${res.gift.code}`,
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Feil ved opprettelse av gavekort.' });
    }
  };

  const handleRedeem = () => {
    setStatusMessage(null);
    if (!redeemCode.trim()) {
      setStatusMessage({ type: 'error', text: 'Vennligst skriv inn gavekortkoden.' });
      return;
    }

    const res = redeemGiftCard(redeemCode, redeemerName);
    if (res.success && res.gift) {
      if (res.pointsCredited) {
        onPointsUpdated(userPoints + res.pointsCredited);
      }
      setStatusMessage({
        type: 'success',
        text: res.pointsCredited
          ? `Gavekortet fra ${res.gift.senderName} er innløst.`
          : `Gavekortet fra ${res.gift.senderName} er innløst. Aktivitetsgaven gir ikke nye poeng.`,
      });
      setRedeemCode('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Kunne ikke innløse gavekort.' });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Gi i Gave</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold">
                  OPPLEVELSER & POENG
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gi bursdagsgaver, klatreparkbilletter eller Luks-poeng til familie og venner
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Faner */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-900/20 px-6 gap-2 overflow-x-auto py-2">
          <button
            onClick={() => { setActiveTab('create'); setStatusMessage(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'create'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Lag Gavekort</span>
          </button>

          <button
            onClick={() => { setActiveTab('my_gifts'); setStatusMessage(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'my_gifts'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Mine Gavekort ({gifts.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('redeem'); setStatusMessage(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'redeem'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Løs inn Gavekort</span>
          </button>
        </div>

        {/* Statusmelding */}
        {statusMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Innhold */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* FANE 1: LAG GAVEKORT */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* Julekampanje banner */}
              {onOpenChristmasGift && (
                <div 
                  onClick={() => {
                    onClose();
                    onOpenChristmasGift();
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-[#c2410c] to-[#E8622C] text-white flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 transition shadow-lg shadow-orange-500/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🎄</span>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-amber-200">
                        Julekampanje: Besteforeldre-oppropet
                      </div>
                      <div className="text-[11px] text-stone-100">
                        Gi fysisk oppdragshefte & Luks-poeng til treet (1 poeng = 1 kr • 1 050p for 1 000 kr)
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white/20 text-[10px] font-bold text-white shrink-0">
                    Se julepakkene →
                  </span>
                </div>
              )}

              {/* Type gavekort-velger */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGiftType('points')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                    giftType === 'points'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Gi Luks-poeng i gave</div>
                    <div className="text-[11px] text-zinc-400">Mottaker velger aktivitet selv</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGiftType('activity')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                    giftType === 'activity'
                      ? 'bg-rose-500/15 border-rose-500 text-white shadow-md shadow-rose-500/10'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <PartyPopper className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Gi en konkret opplevelse</div>
                    <div className="text-[11px] text-zinc-400">Klatrepark, konsert eller tur</div>
                  </div>
                </button>
              </div>

              {/* Tema-velger */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-400">Velg gavekort-tema:</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(Object.keys(GIFT_THEMES) as GiftTheme[]).map(themeKey => {
                    const theme = GIFT_THEMES[themeKey];
                    const isSelected = selectedTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setSelectedTheme(themeKey)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-zinc-800 border-white text-white shadow-md'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-xl">{theme.emoji}</span>
                        <span className="text-[11px] font-medium truncate w-full">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visuell forhåndsvisning av gavekortet */}
              <div className={`p-5 rounded-3xl bg-gradient-to-br ${themeConfig.gradient} border border-white/20 shadow-2xl text-white relative overflow-hidden space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{themeConfig.emoji}</span>
                    <span className="text-xs uppercase font-mono tracking-widest text-white/80 font-bold">SOL UTELIV GAVEKORT</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/30 border border-white/20 text-white">
                    DIGITALT GAVEBEVIS
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-white/80">
                    Til: <strong className="text-white text-sm">{recipientName || 'Mottaker'}</strong>
                  </div>
                  <div className="text-2xl font-black tracking-tight">
                    {giftType === 'points' 
                      ? `${(giftedPointsTotal ?? pointsAmount).toLocaleString('no-NO')} Luks-poeng` 
                      : selectedActivity.title}
                  </div>
                  <div className="text-xs font-mono text-white/90">
                    Verdi: {nokCost} NOK • Giver: {senderName || 'Anonym'}
                  </div>
                </div>

                <div className="p-3 bg-black/30 rounded-xl border border-white/10 text-xs italic text-white/95">
                  «{message}»
                </div>
              </div>

              {/* Skjema */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                {giftType === 'points' ? (
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">
                      Velg gavekortbeløp (1 poeng = 1 kr • 1 000 kr gir 1 050 poeng!)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={100}
                        max={2000}
                        step={50}
                        value={pointsAmount}
                        onChange={e => setPointsAmount(Number(e.target.value))}
                        className="w-full accent-rose-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                      <span className="w-24 text-center font-mono font-bold text-sm text-white">
                        {pointsAmount === 1000 ? 1050 : pointsAmount === 500 ? 520 : pointsAmount === 250 ? 260 : pointsAmount} p
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        { nok: 100, pts: 100 },
                        { nok: 250, pts: 260 },
                        { nok: 500, pts: 520 },
                        { nok: 1000, pts: 1050 },
                      ].map(pkg => (
                        <button
                          key={pkg.nok}
                          type="button"
                          onClick={() => setPointsAmount(pkg.nok)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition ${
                            pointsAmount === pkg.nok
                              ? 'bg-rose-500 text-white border-rose-400'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                          }`}
                        >
                          {pkg.pts} p ({pkg.nok} kr)
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Velg aktivitet å gi bort</label>
                    <select
                      value={selectedActivity.id}
                      onChange={e => {
                        const found = activities.find(a => a.id === e.target.value);
                        if (found) setSelectedActivity(found);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                    >
                      {activities.map(act => (
                        <option key={act.id} value={act.id}>
                          {act.title} — {act.ticket ? `${act.ticket.priceNok} NOK` : 'Aktivitetsbevis'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Mottakers navn</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="F.eks. Oliver (Bursdagsbarnet)"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Mottakers mobil/e-post</label>
                    <input
                      type="text"
                      value={recipientContact}
                      onChange={e => setRecipientContact(e.target.value)}
                      placeholder="+47 9xx xx xxx"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Fra (Avsenders navn)</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={e => setSenderName(e.target.value)}
                      placeholder="F.eks. Bestemor Torill eller Pappa"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Betalingsmetode</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('points')}
                        className={`py-2 px-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          paymentMethod === 'points'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Wallet className="w-3 h-3 text-amber-400" />
                        <span>Poeng</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('vipps')}
                        className={`py-2 px-1.5 rounded-lg border text-[11px] font-bold transition ${
                          paymentMethod === 'vipps'
                            ? 'bg-[#ff5b24] border-[#ff5b24] text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        Vipps
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`py-2 px-1.5 rounded-lg border text-[11px] font-bold transition ${
                          paymentMethod === 'card'
                            ? 'bg-zinc-800 border-white text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        Kort
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Personlig hilsen på gavekortet</label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Opprett og betal */}
              <button
                type="button"
                onClick={handleCreateGift}
                disabled={!recipientName.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-rose-500/25"
              >
                <Gift className="w-4 h-4" />
                <span>
                  Opprett & Gi Gavekort ({nokCost} NOK / {pointsCost} Luks-poeng via {paymentMethod.toUpperCase()})
                </span>
              </button>

              {/* Vist når gavekort er opprettet */}
              {createdGift && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">Gavekortet er klart til sending!</span>
                    <button
                      onClick={() => handleCopyCode(createdGift.code)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCode ? 'Kopiert!' : 'Kopier kode'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between font-mono text-sm font-bold text-white">
                    <span>{createdGift.code}</span>
                    <span className="text-xs font-sans text-zinc-400">Verdi: {createdGift.nokValue} NOK</span>
                  </div>

                  <div className="text-xs text-zinc-300 leading-relaxed">
                    Mottaker kan løse inn koden i sin egen Utaktiv-app under <strong>«Løs inn Gavekort»</strong> for å få poengene eller billetten rett inn i lommeboka.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FANE 2: MINE GAVEKORT */}
          {activeTab === 'my_gifts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Gift className="w-4 h-4 text-rose-400" />
                    Oversikt over Gavekort
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Gavekort du har opprettet eller mottatt i familien
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-500">{gifts.length} gavekort</span>
              </div>

              <div className="space-y-3">
                {gifts.map(g => {
                  const theme = GIFT_THEMES[g.theme];
                  return (
                    <div
                      key={g.id}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{theme.emoji}</span>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {g.type === 'points' ? `${g.pointsAmount} Luks-poeng` : g.activityTitle}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              Til: <strong>{g.recipientName}</strong> • Fra: <strong>{g.senderName}</strong>
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          g.isRedeemed 
                            ? 'bg-zinc-800 text-zinc-400' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {g.isRedeemed ? 'INNLØST' : 'AKTIV'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-orange-400 font-bold">{g.code}</span>
                        <button
                          onClick={() => handleCopyCode(g.code)}
                          className="text-zinc-400 hover:text-white flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Kopier</span>
                        </button>
                      </div>

                      <div className="text-xs text-zinc-300 italic">
                        «{g.message}»
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FANE 3: LØS INN GAVEKORT */}
          {activeTab === 'redeem' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-emerald-400" />
                  Løs inn et Gavekort
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Har du mottatt en gavekortkode på SMS, bursdagskort eller e-post? Tast den inn her for å overføre verdien til din Sol-Lommebok!
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Gavekortkode (f.eks. SOL-GAVE-XXXX-####)</label>
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                    placeholder="SOL-GAVE-..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Ditt navn</label>
                  <input
                    type="text"
                    value={redeemerName}
                    onChange={e => setRedeemerName(e.target.value)}
                    placeholder="Ditt navn"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={!redeemCode.trim()}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Løs inn gavekort nå</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
