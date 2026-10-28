import React, { useState } from 'react';
import { 
  TOPUP_PACKAGES, 
  QUICK_CONTACTS, 
  getWalletLedger, 
  topupWallet, 
  transferPoints, 
  TopupPackage,
  POINTS_PER_NOK 
} from '../engine/wallet';
import { getStripeLinkForPackage } from '../engine/tickets';
import { 
  X, 
  Wallet, 
  PlusCircle, 
  Send, 
  History, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
  Sun,
  Sparkles,
  Users
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
  onPointsUpdated: (newBalance: number) => void;
  onOpenStore?: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  userPoints,
  onPointsUpdated,
  onOpenStore
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'topup' | 'send' | 'history'>('overview');
  const [selectedPackage, setSelectedPackage] = useState<TopupPackage>(TOPUP_PACKAGES[1]); // Default 250 kr
  const [paymentMethod, setPaymentMethod] = useState<'vipps' | 'card'>('vipps');
  
  // P2P Send State
  const [recipientName, setRecipientName] = useState('');
  const [sendPoints, setSendPoints] = useState<number>(250);
  const [sendNote, setSendNote] = useState('');
  
  // Feedback States
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const nokValue = Math.round(userPoints / POINTS_PER_NOK);
  const ledger = getWalletLedger();

  const handleSelectQuickContact = (contact: typeof QUICK_CONTACTS[0]) => {
    setRecipientName(contact.name);
    if (!sendNote) {
      setSendNote(`Opplevelsesgave til ${contact.name}`);
    }
  };

  const handleTopup = () => {
    const stripeUrl = getStripeLinkForPackage(selectedPackage.id);
    if (stripeUrl) {
      window.open(stripeUrl, '_blank', 'noopener,noreferrer');
      setStatusMessage({
        type: 'success',
        text: `Åpnet Stripe for ${selectedPackage.name}. Når betalingen er fullført med Vipps/Kort, krediteres poengene automatisk!`
      });
      return;
    }
    setIsProcessing(true);
    setStatusMessage(null);
    setTimeout(() => {
      const res = topupWallet(selectedPackage.id, paymentMethod);
      setIsProcessing(false);
      if (res.success) {
        onPointsUpdated(res.newBalance);
        setStatusMessage({
          type: 'success',
          text: `Hurra! Du fylte på ${res.packageItem?.totalPoints.toLocaleString('no-NO')} poeng med ${paymentMethod === 'vipps' ? 'Vipps' : 'Bankkort'}.`
        });
        setActiveTab('overview');
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Feil ved påfylling.' });
      }
    }, 800);
  };

  const handleSend = () => {
    if (!recipientName.trim()) {
      setStatusMessage({ type: 'error', text: 'Vennligst oppgi navn på mottaker.' });
      return;
    }
    if (sendPoints <= 0) {
      setStatusMessage({ type: 'error', text: 'Du må sende minst 1 poeng.' });
      return;
    }
    if (sendPoints > userPoints) {
      setStatusMessage({ type: 'error', text: `Du har kun ${userPoints} poeng tilgjengelig.` });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    setTimeout(() => {
      const res = transferPoints(recipientName, '', sendPoints, sendNote);
      setIsProcessing(false);
      if (res.success) {
        onPointsUpdated(res.newBalance);
        setStatusMessage({
          type: 'success',
          text: `Overførte ${sendPoints.toLocaleString('no-NO')} poeng til ${recipientName}!`
        });
        setRecipientName('');
        setSendNote('');
        setActiveTab('overview');
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Feil ved overføring.' });
      }
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-wide">Sol Lommebok</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-semibold">
                  VALUTA & P2P
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kjøpte poeng kommer fra Stripe. Opptjente poeng kan ikke veksles eller sendes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Faner */}
        <div className="shrink-0 flex items-center border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 px-6 gap-2 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => { setActiveTab('overview'); setStatusMessage(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'overview'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Oversikt</span>
          </button>

          <button
            onClick={() => { setActiveTab('topup'); setStatusMessage(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'topup'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Fyll på (Kjøp)</span>
          </button>

          <button
            onClick={() => { setActiveTab('send'); setStatusMessage(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'send'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Overføring</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setStatusMessage(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'history'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historikk ({ledger.length})</span>
          </button>
        </div>

        {/* Varselmeldinger */}
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

        {/* Innhold / Faner */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* FANE 1: OVERSIKT */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Eksklusivt Lommebok-kort */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-orange-500/30 p-6 shadow-2xl shadow-orange-950/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-orange-400 animate-pulse" />
                    <span className="text-xs uppercase font-mono tracking-widest text-zinc-400">SOL AKTIVITETSKONTO</span>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                    1 poeng = 1 NOK
                  </span>
                </div>

                <div className="space-y-1 mb-6">
                  <div className="text-xs text-zinc-400 font-medium">Tilgjengelig saldo</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
                      {userPoints.toLocaleString('no-NO')}
                    </span>
                    <span className="text-xl font-bold text-orange-400">poeng</span>
                    <span className="text-sm font-medium text-zinc-400 font-mono">
                      (verdi: <strong className="text-zinc-200">{nokValue} kr</strong> i billetter)
                    </span>
                  </div>
                </div>

                {/* Handlingsknapper */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() => setActiveTab('topup')}
                    className="py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/20"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Fyll på med Vipps</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('send')}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-4 h-4 text-orange-400" />
                    <span>Kan ikke sendes</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenStore) {
                        onClose();
                        onOpenStore();
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition border border-zinc-800"
                  >
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>Løs inn i Sol-Børsen</span>
                  </button>
                </div>
              </div>

              {/* Slik tjener og bruker du poeng - Hurtigoversikt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                    <Sun className="w-4 h-4" />
                    <span>Slik tjener familien poeng</span>
                  </div>
                  <ul className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                    <li>☀️ <strong>Dagslys & Utetid:</strong> Fang dagens lyse timer ute – viktigere enn noen gang om høsten og vinteren (+40 p/økt).</li>
                    <li>🌱 <strong>Sol Junior:</strong> Naboer sponser oppgaver som plenklipping (+350 p) og hundelufting (+280 p).</li>
                    <li>🏔️ <strong>GPS-innsjekking:</strong> Fullfør Fløyen, 7-fjell eller Koengen for offisielle Sol-badges (+200-500 p).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Slik bruker du poeng som valuta</span>
                  </div>
                  <ul className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                    <li>🌲 <strong>Full- eller delbetaling:</strong> Trekk fra poeng rett i kassen for klatrepark, DNT og konserter.</li>
                    <li>🎁 <strong>Gave til barn/barnebarn:</strong> Besteforeldre kan sende poeng som garantert går til sunne opplevelser.</li>
                    <li>🤝 <strong>Nabolagsdeling:</strong> Gi poeng til nabogutten for god hjelp, helt uten kontanter.</li>
                  </ul>
                </div>
              </div>

              {/* Siste transaksjoner (snarvei) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Siste aktivitet i lommeboka</h4>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="text-xs text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <span>Se alle ({ledger.length})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {ledger.slice(0, 3).map(tx => (
                    <div 
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          tx.points > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400'
                        }`}>
                          {tx.points > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{tx.title}</div>
                          <div className="text-[11px] text-zinc-400">{tx.description}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xs font-bold font-mono ${
                          tx.points > 0 ? 'text-emerald-400' : 'text-zinc-200'
                        }`}>
                          {tx.points > 0 ? `+${tx.points}` : tx.points} p
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium">
                          {tx.points > 0 ? 'Mottatt' : 'Brukt'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FANE 2: FYLL PÅ (KJØP POENG) */}
          {activeTab === 'topup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-amber-500" />
                  Kjøp Luks-poengpakke
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Poengene brukes som 1:1 valuta på billetter, klatrepark, fjordbadstue og familieutflukter. Få opptil 50 gratis bonuspoeng!
                </p>
              </div>

              {/* Pakkevelger med varmt, innbydende fargekart */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {TOPUP_PACKAGES.map(pkg => {
                  const isSelected = selectedPackage.id === pkg.id;
                  
                  // Egendefinert varm palett for hver pakke
                  const theme = (() => {
                    switch (pkg.id) {
                      case 'topup-starter':
                        return {
                          icon: '🌱',
                          border: isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'border-zinc-200 dark:border-emerald-900/40 hover:border-emerald-400/60',
                          bg: isSelected 
                            ? 'bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-950' 
                            : 'bg-white dark:bg-zinc-900/60 hover:bg-emerald-50/30 dark:hover:bg-zinc-900',
                          badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
                          accent: 'text-emerald-600 dark:text-emerald-400',
                        };
                      case 'topup-family':
                        return {
                          icon: '☀️',
                          border: isSelected ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-500/15' : 'border-amber-200 dark:border-amber-900/50 hover:border-amber-400',
                          bg: isSelected 
                            ? 'bg-gradient-to-br from-amber-50 via-orange-50/40 to-white dark:from-amber-950/50 dark:via-zinc-900 dark:to-orange-950/30' 
                            : 'bg-white dark:bg-zinc-900/60 hover:bg-amber-50/30 dark:hover:bg-zinc-900',
                          badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold shadow-sm',
                          accent: 'text-amber-600 dark:text-amber-400',
                        };
                      case 'topup-sponsor':
                        return {
                          icon: '👑',
                          border: isSelected ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10' : 'border-zinc-200 dark:border-purple-950/60 hover:border-purple-400',
                          bg: isSelected 
                            ? 'bg-gradient-to-br from-purple-50 via-white to-amber-50/30 dark:from-purple-950/40 dark:via-zinc-900 dark:to-zinc-950' 
                            : 'bg-white dark:bg-zinc-900/60 hover:bg-purple-50/30 dark:hover:bg-zinc-900',
                          badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold',
                          accent: 'text-purple-600 dark:text-purple-400',
                        };
                      case 'topup-season':
                      default:
                        return {
                          icon: '🌟',
                          border: isSelected ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/20' : 'border-amber-300/60 dark:border-amber-800/60 hover:border-amber-400',
                          bg: isSelected 
                            ? 'bg-gradient-to-br from-amber-100/60 via-orange-50 to-white dark:from-amber-900/40 dark:via-zinc-900 dark:to-zinc-950' 
                            : 'bg-white dark:bg-zinc-900/60 hover:bg-amber-50/40 dark:hover:bg-zinc-900',
                          badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-black shadow-sm',
                          accent: 'text-amber-700 dark:text-amber-300',
                        };
                    }
                  })();

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${theme.border} ${theme.bg}`}
                    >
                      {/* Topp-linje med Ikon, Tittel og Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{theme.icon}</span>
                          <div>
                            <div className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{pkg.name}</div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">1 poeng = 1 NOK</div>
                          </div>
                        </div>

                        {pkg.badge && (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${theme.badge}`}>
                            {pkg.badge}
                          </span>
                        )}
                      </div>

                      {/* Poengsum */}
                      <div className="my-2.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-zinc-900 dark:text-amber-300 font-mono tracking-tight">
                            {pkg.totalPoints.toLocaleString('no-NO')}
                          </span>
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                            poeng
                          </span>
                        </div>

                        {pkg.bonusPoints > 0 && (
                          <div className="inline-flex items-center gap-1 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                            Inkluderer +{pkg.bonusPoints} gratis bonuspoeng!
                          </div>
                        )}
                      </div>

                      {/* Beskrivelse */}
                      <p className="text-xs text-zinc-600 dark:text-zinc-300/90 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 leading-relaxed">
                        {pkg.description}
                      </p>

                      {/* Prislinje */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400 font-medium">Pris å betale:</span>
                        <span className="text-sm font-extrabold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono">
                          {pkg.priceNok} NOK
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Betalingsmåte */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-zinc-900 dark:text-white">Velg betalingsmåte:</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('vipps')}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'vipps'
                        ? 'bg-[#ff5b24] text-white border-[#ff5b24] shadow-md shadow-orange-900/30'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Vipps (1-klikk)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'card'
                        ? 'bg-zinc-800 text-white border-orange-500 shadow-md'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                    <span>Bankkort / Stripe</span>
                  </button>
                </div>

                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Sikker betaling med 256-bit kryptering og umiddelbar kreditering i lommeboka.</span>
                </div>
              </div>

              {/* Fullfør kjøp-knapp */}
              <button
                onClick={handleTopup}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <span>Klargjør transaksjon...</span>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Kjøp {selectedPackage.totalPoints.toLocaleString('no-NO')} poeng for {selectedPackage.priceNok} NOK ({paymentMethod === 'vipps' ? 'Vipps' : 'Kort'})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* FANE 3: OVERFØRING & NABOLAGSOPPGAVER */}
          {activeTab === 'send' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-orange-500" />
                  Overfør Luks-poeng
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Overfør opplevelsespoeng til barna eller venner. Poengene kan brukes til billetter, kano, klatrepark og kaféstopp.
                </p>
              </div>

              {/* Nabolagsgrupper & Oppgaver boks */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-zinc-50 dark:to-zinc-900 border border-amber-300 dark:border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Nabolagsoppgaver for barna (f.eks. Korskirkeallmenningen)</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  I <strong>Venner & Nabolag</strong> kan naboer lage lokale grupper (som <em>Korskirkeallmenningen</em>) der man legger ut småjobber som hundelufting eller hagearbeid. Når barnet utfører oppgaven og utlyseren godkjenner den, overføres poengene trygt og direkte!
                </p>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-0.5">
                  ☀️ Familien sanker også gratis Luks-poeng fra appen ved å gå turer og fange dagslys sammen.
                </div>
              </div>

              {/* Hurtigvalg kontakter */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Hurtigvelger (Familie & Naboer):</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_CONTACTS.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectQuickContact(contact)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        recipientName === contact.name
                          ? 'bg-orange-500/20 border-orange-500 text-zinc-900 dark:text-white ring-1 ring-orange-500'
                          : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="text-xl">{contact.avatarEmoji}</span>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate">{contact.name}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{contact.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skjema */}
              <div className="space-y-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-400 font-medium block mb-1">
                    Mottakers navn (barn, familie eller nabo)
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="F.eks. Oliver Robertsen"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 shadow-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Antall poeng å sende</label>
                    <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                      {sendPoints} poeng
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={50}
                      max={Math.max(50, userPoints)}
                      step={50}
                      value={sendPoints}
                      onChange={e => setSendPoints(Number(e.target.value))}
                      className="w-full accent-orange-500 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      value={sendPoints}
                      onChange={e => setSendPoints(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-orange-500 shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    {[100, 250, 350, 500, 1000].filter(p => p <= userPoints).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSendPoints(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer ${
                          sendPoints === preset
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {preset} p
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-400 font-medium block mb-1">
                    Personlig hilsen / Formål (valgfritt)
                  </label>
                  <input
                    type="text"
                    value={sendNote}
                    onChange={e => setSendNote(e.target.value)}
                    placeholder="F.eks. Takk for god hjelp med hundeluftingen! 🐕"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Send-knapp */}
              <button
                type="button"
                onClick={handleSend}
                disabled={isProcessing || !recipientName.trim() || sendPoints > userPoints}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send {sendPoints} poeng til {recipientName || 'mottaker'}</span>
              </button>
            </div>
          )}

          {/* FANE 4: HISTORIKK (LEDGER) */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-orange-500" />
                    Transaksjonshistorikk
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Full oversikt over opptjente turpoeng, kjøp og innløste billetter.
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                  {ledger.length} oppføringer
                </span>
              </div>

              <div className="space-y-2.5">
                {ledger.map(tx => {
                  const isPositive = tx.points > 0;
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 flex items-center justify-between gap-4 transition shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isPositive 
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-orange-50 dark:bg-orange-500/15 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400'
                        }`}>
                          {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-900 dark:text-white">{tx.title}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-300 leading-snug">{tx.description}</div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('no-NO', { 
                              day: 'numeric', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-sm font-black font-mono ${
                          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'
                        }`}>
                          {isPositive ? `+${tx.points.toLocaleString('no-NO')}` : tx.points.toLocaleString('no-NO')} p
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {isPositive ? 'Mottatt' : 'Brukt'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
