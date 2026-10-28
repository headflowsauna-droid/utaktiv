import React, { useState } from 'react';
import { ActivityItem, ActivityAddOn } from '../engine/activities';
import { calculateCommissionNok, buildAffiliateUrl, getStoredApiKeys } from '../engine/tickets';
import { payWithPoints, POINTS_PER_NOK } from '../engine/wallet';
import { 
  X, 
  Ticket, 
  ExternalLink, 
  CheckCircle2, 
  CreditCard, 
} from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  selectedAddOns?: ActivityAddOn[];
  userPoints: number;
  onPointsUpdated: (newBalance: number) => void;
  onTicketPurchased: (activityId: string, quantity: number) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  activity,
  selectedAddOns = [],
  userPoints,
  onPointsUpdated,
  onTicketPurchased,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [usePoints, setUsePoints] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<{
    pointsUsed: number;
    discountNok: number;
    paidCashNok: number;
  } | null>(null);

  if (!isOpen || !activity) return null;
  const hasTicket = !!activity.ticket;
  const hasAddOns = selectedAddOns && selectedAddOns.length > 0;
  if (!hasTicket && !hasAddOns) return null;

  const ticketPrice = hasTicket ? activity.ticket!.priceNok : 0;
  const addOnsTotalPerUnit = selectedAddOns.reduce((sum, a) => sum + a.priceNok, 0);
  const addOnsCommissionPerUnit = selectedAddOns.reduce((sum, a) => sum + a.commissionNok, 0);
  
  const unitPrice = ticketPrice + addOnsTotalPerUnit;
  const totalPrice = unitPrice * quantity;

  const baseCommission = hasTicket 
    ? calculateCommissionNok(ticketPrice * quantity, activity.ticket!.affiliateCommissionPercent)
    : 0;
  const totalCommission = baseCommission + (addOnsCommissionPerUnit * quantity);

  const apiKeys = getStoredApiKeys();
  const affiliateUrl = hasTicket 
    ? buildAffiliateUrl(activity.ticket!.bookingUrl, apiKeys.ticketmasterAffiliateId)
    : '';

  // Poengberegning
  const maxPointsNeeded = totalPrice * POINTS_PER_NOK;
  const pointsAvailableToUse = Math.min(maxPointsNeeded, userPoints);
  const pointsToUse = usePoints ? pointsAvailableToUse : 0;
  const discountNok = Math.floor(pointsToUse / POINTS_PER_NOK);
  const remainingCashNok = Math.max(0, totalPrice - discountNok);

  const handleDirectBuy = () => {
    setIsProcessing(true);
    if (remainingCashNok > 0) {
      window.open('https://buy.stripe.com/5kQ3co6qvfkx8vp8mU5wI0p', '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => {
      void (async () => {
      if (pointsToUse > 0) {
        const payRes = await payWithPoints(activity.title, pointsToUse, totalPrice, activity.id);
        if (payRes.success) {
          onPointsUpdated(payRes.newBalance);
        }
      }

      setPaymentReceipt({
        pointsUsed: pointsToUse,
        discountNok: discountNok,
        paidCashNok: remainingCashNok,
      });

      setIsProcessing(false);
      setIsSuccess(true);
      onTicketPurchased(activity.id, quantity);
      })();
    }, 900);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setPaymentReceipt(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-white">
              {hasTicket && hasAddOns ? 'Billett & Dagsturpakke' : hasTicket ? 'Billettreservasjon' : 'Dagsturpakke & Bestilling'}
            </h3>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Innhold */}
        <div className="p-5 space-y-4">
          {isSuccess && paymentReceipt ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Bestillingen er bekreftet!</h4>
              <p className="text-xs text-zinc-300">
                {quantity}x bestilling til <strong className="text-orange-400">{activity.title}</strong> er reservert.
              </p>

              {hasAddOns && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-left text-xs space-y-1">
                  <div className="font-bold text-zinc-300">Inkluderte stopp og kuponger:</div>
                  {selectedAddOns.map(a => (
                    <div key={a.id} className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                      <span>{a.badgeEmoji}</span>
                      <span>{a.title} ({a.partnerName})</span>
                    </div>
                  ))}
                  <div className="text-[10px] text-emerald-400 mt-1 italic">
                    Vis denne bekreftelsen på disken ved ankomst.
                  </div>
                </div>
              )}

              {paymentReceipt.pointsUsed > 0 && (
                <div className="p-3 bg-orange-950/20 border border-orange-500/30 rounded-xl text-xs text-orange-200 text-left space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-orange-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Betalt med Luks-poeng:
                  </div>
                  <div>• {paymentReceipt.pointsUsed.toLocaleString('no-NO')} poeng innløst (-{paymentReceipt.discountNok} kr)</div>
                  {paymentReceipt.paidCashNok > 0 && (
                    <div>• Resterende {paymentReceipt.paidCashNok} kr betalt med Vipps / Kort</div>
                  )}
                </div>
              )}

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 font-mono">
                Transaksjons-ID: SOL-TX-{Date.now().toString().slice(-6)} • Partnerhonorar: {totalCommission} kr
              </div>
              <button
                onClick={handleResetAndClose}
                className="mt-3 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition"
              >
                Ferdig
              </button>
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-sm font-bold text-white">{activity.title}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{activity.locationName}, {activity.city}</p>
                {activity.date && (
                  <p className="text-xs text-orange-400 mt-1">Dato: {activity.date} {activity.time ? `kl. ${activity.time}` : ''}</p>
                )}
              </div>

              {/* Tillegg / Valgte Stopp */}
              {hasAddOns && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <span>☀️</span>
                    Valgte opplevelser i pakken:
                  </div>
                  <div className="space-y-1.5">
                    {hasTicket && (
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        <span>🎟️ {activity.title}</span>
                        <span className="font-mono text-zinc-400">{ticketPrice} kr</span>
                      </div>
                    )}
                    {selectedAddOns.map(a => (
                      <div key={a.id} className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="flex items-center gap-1">
                          <span>{a.badgeEmoji}</span>
                          <span>{a.title}</span>
                        </span>
                        <span className="font-mono text-amber-400">+{a.priceNok} kr</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Antall og pris */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Antall personer / billetter:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center justify-center font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-sm text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center justify-center font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Totalpris:</span>
                    <span className="text-lg font-black text-white font-mono">{totalPrice} kr</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>• Til arrangør / vert ({activity.ticket?.provider || 'Partner'}):</span>
                      <span className="font-mono font-bold text-emerald-400">{Math.max(0, totalPrice - totalCommission)} kr</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>• Utaktiv formidling & garanti:</span>
                      <span className="font-mono text-orange-400">{totalCommission} kr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Luks-poeng rabatt */}
              {userPoints > 0 && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Bruk dine Luks-poeng</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="rounded accent-orange-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Du har <strong className="text-amber-400 font-mono">{userPoints.toLocaleString('no-NO')}</strong> poeng.
                    Kan dekke inntil <strong className="text-amber-300">{discountNok} kr</strong> av denne bestillingen.
                  </p>
                </div>
              )}

              {/* Handlingsknapper */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleDirectBuy}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'Behandler med Vipps...'
                      : `Betal ${remainingCashNok} kr med Vipps`}
                  </span>
                </button>

                {hasTicket && affiliateUrl && (
                  <a
                    href={affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <span>Eller åpne offisiell arrangørside</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
