import React, { useState } from 'react';
import { 
  STORE_VOUCHERS, 
  StoreVoucher, 
  redeemStoreVoucher, 
  getRedeemedVouchers, 
  RedeemedVoucher 
} from '../engine/gamification';
import { 
  X, 
  ShoppingBag, 
  Check, 
  Copy, 
  AlertCircle, 
  ArrowRight, 
  Ticket
} from 'lucide-react';

interface SolStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
  onPointsUpdated: (newBalance: number) => void;
  onSelectActivityTicket?: (activityId: string) => void;
}

export const SolStoreModal: React.FC<SolStoreModalProps> = ({
  isOpen,
  onClose,
  userPoints,
  onPointsUpdated,
  onSelectActivityTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my_vouchers'>('browse');
  const [redeemedList, setRedeemedList] = useState<RedeemedVoucher[]>(getRedeemedVouchers());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRedeem = async (voucher: StoreVoucher) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const res = await redeemStoreVoucher(voucher);
    if (!res.success) {
      setErrorMessage(res.error || 'Kunne ikke løse inn kupong.');
      return;
    }

    const updated = getRedeemedVouchers();
    setRedeemedList(updated);
    onPointsUpdated(userPoints - voucher.costPoints);
    setSuccessMessage(`Gratulerer! Du har løst inn ${voucher.title}. Rabattkode: ${res.voucher?.code}`);
    setActiveTab('my_vouchers');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Sol-Børsen & Belønninger
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  EKTE RABATT
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Løs inn opptjent dagslys i ekte kroner og øre på konserter og opplevelser.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saldo-stripe */}
        <div className="px-6 py-3.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span>Din opptjente saldo:</span>
            <span className="text-sm font-bold text-orange-400 font-mono">
              {userPoints.toLocaleString('no-NO')} Sol-Kreditt
            </span>
            <span className="text-zinc-500 font-medium">
              (= {userPoints.toLocaleString('no-NO')} NOK)
            </span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'browse'
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Tilgjengelige Kuponger ({STORE_VOUCHERS.length})
            </button>
            <button
              onClick={() => setActiveTab('my_vouchers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'my_vouchers'
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              Mine Kuponger ({redeemedList.length})
            </button>
          </div>
        </div>

        {/* Tilbakemeldinger */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Innhold / Liste */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'browse' ? (
            <div className="space-y-3">
              {STORE_VOUCHERS.map(vouch => {
                const canAfford = userPoints >= vouch.costPoints;

                return (
                  <div
                    key={vouch.id}
                    className="p-4 bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shrink-0">
                        {vouch.badgeEmoji}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{vouch.title}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Spar {vouch.discountNok} kr
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{vouch.description}</p>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-2 pt-0.5">
                          <span>Partner: {vouch.partnerName}</span>
                          <span>•</span>
                          <span>{vouch.expiresText}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto shrink-0">
                      <div className="text-xs font-mono font-bold text-orange-400">
                        {vouch.costPoints} Luks-poeng
                      </div>
                      <button
                        onClick={() => handleRedeem(vouch)}
                        disabled={!canAfford}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                        }`}
                      >
                        <span>{canAfford ? 'Løs inn nå' : 'Trenger mer dagslys'}</span>
                        {canAfford && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {redeemedList.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl space-y-2">
                  <Ticket className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-400 font-medium">Ingen innløste kuponger ennå.</p>
                  <p className="text-xs text-zinc-500">
                    Gå til «Tilgjengelige Kuponger» og bruk Luks-poengene dine til å spare penger!
                  </p>
                </div>
              ) : (
                redeemedList.map(red => (
                  <div
                    key={red.id}
                    className="p-4 bg-zinc-950 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{red.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-zinc-950">
                          {red.discountNok} kr rabatt
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Innløst: {new Date(red.redeemedAt).toLocaleDateString('no-NO')} • Partner: {red.partnerName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-sm font-bold text-orange-400 tracking-wider">
                        {red.code}
                      </div>

                      <button
                        onClick={() => handleCopyCode(red.code)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                        title="Kopier rabattkode"
                      >
                        {copiedCode === red.code ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>

                      {onSelectActivityTicket && (
                        <button
                          onClick={() => {
                            onClose();
                            // Finne tilhørende aktivitet om mulig
                            const found = STORE_VOUCHERS.find(v => v.id === red.voucherId);
                            if (found?.activityId) {
                              onSelectActivityTicket(found.activityId);
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                        >
                          Bruk nå
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-center text-xs text-zinc-500">
          Utaktiv – Ekte opplevelser, dagslys og aktivitet ute i naturen.
        </div>
      </div>
    </div>
  );
};
