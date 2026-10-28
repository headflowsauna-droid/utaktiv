import React, { useState } from 'react';
import { 
  X, 
  Plane, 
  PlusCircle, 
  Share2, 
  Check, 
  Calendar, 
  MapPin, 
  Users, 
  TrendingUp, 
  Wallet,
  Compass,
  CreditCard,
  Heart
} from 'lucide-react';
import { 
  TravelSavingGoal, 
  getSavingGoals, 
  createSavingGoal, 
  contributeToGoal, 
  generateSpleisShareText 
} from '../engine/savings';
import { POINTS_PER_NOK } from '../engine/wallet';
import { getStoredApiKeys } from '../engine/tickets';

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints: number;
  onPointsUpdated: (newBalance: number) => void;
}

export const SavingsModal: React.FC<SavingsModalProps> = ({
  isOpen,
  onClose,
  userPoints,
  onPointsUpdated,
}) => {
  const [goals, setGoals] = useState<TravelSavingGoal[]>(getSavingGoals());
  const [activeTab, setActiveTab] = useState<'goals' | 'create'>('goals');
  const [selectedGoal, setSelectedGoal] = useState<TravelSavingGoal | null>(null);

  // Nytt sparemål felter
  const [newTitle, setNewTitle] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newCategory, setNewCategory] = useState<TravelSavingGoal['category']>('mountain');
  const [newTargetNok, setNewTargetNok] = useState<number>(5000);
  const [newTargetDate, setNewTargetDate] = useState('2027-07-01');
  const [newDescription, setNewDescription] = useState('');
  const [newInitialPoints, setNewInitialPoints] = useState<number>(0);

  // Innskudd-felter
  const [depositPoints, setDepositPoints] = useState<number>(500);
  const [contributorName, setContributorName] = useState('');
  const [contributorRole, setContributorRole] = useState('Turvenn');
  const [depositMessage, setDepositMessage] = useState('');

  // Tilstandsbeskjeder
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  if (!isOpen) return null;

  const apiKeys = getStoredApiKeys();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = await createSavingGoal({
      title: newTitle,
      destination: newDestination,
      category: newCategory,
      targetAmountNok: newTargetNok,
      targetDate: newTargetDate,
      description: newDescription,
      creatorName: contributorName.trim() || 'Turvenn',
      initialDepositPoints: newInitialPoints,
    });

    if (res.success && res.goal) {
      setGoals(getSavingGoals());
      if (newInitialPoints > 0) {
        onPointsUpdated(userPoints - newInitialPoints);
      }
      setStatusMessage({
        type: 'success',
        text: `Reisesparekonto for ${res.goal.title} ble opprettet!`,
      });
      // Nullstill
      setNewTitle('');
      setNewDestination('');
      setNewDescription('');
      setNewInitialPoints(0);
      setActiveTab('goals');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Kunne ikke opprette sparekonto.' });
    }
  };

  const handleDeposit = async (goalId: string) => {
    setStatusMessage(null);
    const res = await contributeToGoal(
      goalId,
      contributorName,
      contributorRole,
      depositPoints,
      depositMessage
    );

    if (res.success && res.goal) {
      setGoals(getSavingGoals());
      if (res.newBalance !== undefined) {
        onPointsUpdated(res.newBalance);
      }
      setSelectedGoal(res.goal);
      setIsDepositOpen(false);
      setDepositMessage('');
      setStatusMessage({
        type: 'success',
        text: `Takk! Ditt innskudd på ${Math.round(depositPoints / POINTS_PER_NOK)} kr ble satt inn i reisekassa!`,
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Kunne ikke gjennomføre innskudd.' });
    }
  };

  const handleShare = (goal: TravelSavingGoal) => {
    const text = generateSpleisShareText(goal);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-wide">Sol Spleis & Reise-Sparekonto</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-400 font-semibold">
                  FELLESKONTO
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Planlegg reiser, spar sammen med barna og inviter familie og venner til å spleise
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
        <div className="shrink-0 flex border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 px-6 gap-2 py-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('goals'); setStatusMessage(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'goals'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Aktive Reise-Sparekontoer ({goals.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('create'); setStatusMessage(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Planlegg Ny Reise</span>
          </button>
        </div>

        {/* Varsel */}
        {statusMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Innhold */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* FANE 1: LISTE OVER REISESPAREKONTOER */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {goals.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                    <Plane className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Ingen aktive reisesparekontoer ennå</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    Planlegg en tur til Lofoten, Preikestolen, Finse eller en familiepark, og inviter familie og besteforeldre til å spare sammen!
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                  >
                    Opprett første reise
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {goals.map(goal => {
                    const percent = Math.min(100, Math.round((goal.currentPoints / goal.targetPoints) * 100));
                    const remainingNok = Math.max(0, goal.targetAmountNok - goal.currentAmountNok);
                    const isSelected = selectedGoal?.id === goal.id;

                    return (
                      <div
                        key={goal.id}
                        className="bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition hover:border-blue-500/40"
                      >
                        {/* Hero-bilde */}
                        <div className="relative h-44 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                          <img
                            src={goal.imageUrl}
                            alt={goal.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                          {/* Floating badges */}
                          <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600/95 text-white backdrop-blur-md shadow-md flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {goal.destination}
                            </span>

                            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30">
                              Mål: {goal.targetAmountNok.toLocaleString('no-NO')} kr
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-4 right-4">
                            <h3 className="text-lg font-bold text-white drop-shadow-md">
                              {goal.title}
                            </h3>
                            <p className="text-xs text-zinc-200 drop-shadow line-clamp-1">
                              {goal.description}
                            </p>
                          </div>
                        </div>

                        {/* Sparekonto-status & Fremgang */}
                        <div className="p-5 space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Oppspart i reisekassa:</span>
                                <strong className="text-zinc-900 dark:text-white font-mono text-sm">
                                  {goal.currentAmountNok.toLocaleString('no-NO')} kr
                                </strong>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                                  ({goal.currentPoints.toLocaleString('no-NO')} p)
                                </span>
                              </span>

                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {percent}% NÅDD
                              </span>
                            </div>

                            {/* Stor fremgangsbar */}
                            <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-inner">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-700"
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-orange-500" />
                                Avreisedato: <strong className="text-zinc-800 dark:text-zinc-200">{goal.targetDate}</strong>
                              </span>
                              <span>
                                Gjenstår: <strong className="text-amber-600 dark:text-amber-400 font-mono">{remainingNok.toLocaleString('no-NO')} kr</strong>
                              </span>
                            </div>
                          </div>

                          {/* Handlingsknapper: Sett inn bidrag & Del spleis */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                            <button
                              onClick={() => {
                                setSelectedGoal(goal);
                                setIsDepositOpen(!isDepositOpen || selectedGoal?.id !== goal.id);
                              }}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>Sett inn i reisekassa</span>
                            </button>

                            <button
                              onClick={() => handleShare(goal)}
                              className="py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                              title="Kopier spleis-invitasjon til SMS, WhatsApp eller Spond"
                            >
                              {copiedCode ? (
                                <>
                                  <Check className="w-4 h-4 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-300">Kopiert!</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-4 h-4 text-blue-500" />
                                  <span>Del Spleis</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Ekspanderbart innskuddsfelt */}
                          {isDepositOpen && isSelected && (
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-blue-500/30 space-y-3 shadow-sm animate-in fade-in">
                              <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Wallet className="w-3.5 h-3.5 text-blue-500" />
                                  Gjør et innskudd til {goal.title}
                                </span>
                                <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                                  Lommebok: {userPoints.toLocaleString('no-NO')} p
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Ditt navn:</label>
                                  <input
                                    type="text"
                                    value={contributorName}
                                    onChange={e => setContributorName(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Rolle (f.eks. Bestefar, Mamma, Fadder):</label>
                                  <input
                                    type="text"
                                    value={contributorRole}
                                    onChange={e => setContributorRole(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">
                                  Innskuddsbeløp i Luks-poeng (1 poeng = 1 kr):
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="100"
                                    step="100"
                                    value={depositPoints}
                                    onChange={e => setDepositPoints(parseInt(e.target.value) || 0)}
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white font-mono font-bold"
                                  />
                                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-mono">
                                    = {Math.round(depositPoints / POINTS_PER_NOK)} NOK
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Personlig hilsen (valgfritt):</label>
                                <input
                                  type="text"
                                  value={depositMessage}
                                  onChange={e => setDepositMessage(e.target.value)}
                                  placeholder="F.eks. Bursdagsgave til turen fra bestemor ❤️"
                                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white"
                                />
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleDeposit(goal.id)}
                                  disabled={depositPoints <= 0 || depositPoints > userPoints}
                                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Bekreft innskudd ({Math.round(depositPoints / POINTS_PER_NOK)} kr)</span>
                                </button>
                                <button
                                  onClick={() => setIsDepositOpen(false)}
                                  className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-medium"
                                >
                                  Avbryt
                                </button>
                              </div>

                              {apiKeys.stripeProductLinks?.package100Url && (
                                <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/20 text-[11px] text-orange-900 dark:text-orange-200 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-orange-500" />
                                    <span>Betale med Vipps eller Stripe?</span>
                                  </span>
                                  <a
                                    href={apiKeys.stripeProductLinks.package100Url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
                                  >
                                    Åpne Stripe betaling →
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bidragsytere & Hilsener */}
                          {goal.contributors.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
                              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-blue-500" />
                                  Bidragsytere ({goal.contributors.length})
                                </span>
                                <span className="text-zinc-400 font-mono">Spleiskode: {goal.shareCode}</span>
                              </div>

                              <div className="space-y-1.5">
                                {goal.contributors.map(c => (
                                  <div
                                    key={c.id}
                                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-xs shadow-sm"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-base">{c.avatarEmoji}</span>
                                      <div>
                                        <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                          <span>{c.name}</span>
                                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">({c.role})</span>
                                        </div>
                                        {c.message && (
                                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                                            "{c.message}"
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        +{c.nokValue} NOK
                                      </div>
                                      <div className="text-[10px] font-mono text-zinc-400">
                                        {c.pointsContributed.toLocaleString('no-NO')} p
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FANE 2: OPPRETT NY REISESPAREKONTO */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4 max-w-xl mx-auto">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Plane className="w-4 h-4 text-blue-500" />
                  Opprett ny reisesparekonto
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Velg destinasjon, sett et målbeløp og inviter familien til å bidra med dagslyspoeng og penger.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Reisetittel:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="F.eks. Sommerferie i Lofoten 2027"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Destinasjon / Reisemål:</label>
                  <input
                    type="text"
                    required
                    value={newDestination}
                    onChange={e => setNewDestination(e.target.value)}
                    placeholder="F.eks. Reine, Lofoten"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Reisekategori:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="mountain">Fjelltur & Topptur</option>
                    <option value="coastal">Kyst & Skjærgård</option>
                    <option value="camping">Camping & Telttur</option>
                    <option value="resort">Opplevelsespark & Resort</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Målbeløp (NOK):</label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    required
                    value={newTargetNok}
                    onChange={e => setNewTargetNok(parseInt(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 block">
                    = {(newTargetNok * POINTS_PER_NOK).toLocaleString('no-NO')} Luks-poeng
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Planlagt avreisedato:</label>
                  <input
                    type="date"
                    required
                    value={newTargetDate}
                    onChange={e => setNewTargetDate(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Beskrivelse / Reiseplan:</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="F.eks. Midnattssol, telting under Reinebringen og fisketur for hele storfamilien."
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Startinnskudd fra din Sol-lommebok (Valgfritt):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={userPoints}
                    step="100"
                    value={newInitialPoints}
                    onChange={e => setNewInitialPoints(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white font-mono font-bold"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    = {Math.round(newInitialPoints / POINTS_PER_NOK)} kr
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Opprett Reisesparekonto & Få Spleiskode</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Felles familieøkonomi for ekte opplevelser</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition"
          >
            Lukk
          </button>
        </div>

      </div>
    </div>
  );
};
