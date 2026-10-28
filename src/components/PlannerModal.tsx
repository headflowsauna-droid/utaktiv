import React, { useState, useMemo, useEffect } from 'react';
import { 
  getPlannedEvents, 
  createPlannedEvent, 
  updateInviteeStatus, 
  addInviteeToEvent, 
  payForEventWithPoints,
  generateInvitationShareText, 
  PlannedEvent, 
  EventCategory 
} from '../engine/planner';
import { ActivityItem, SUPPORTED_CITIES } from '../engine/activities';
import {
  OPPORTUNITY_CATEGORIES,
  OutdoorOpportunityCategory,
  AudienceSegment,
  getAggregatedDemandHotspots,
  submitOpportunityRequest,
  calculateDemandMarketValue,
} from '../engine/trailDemand';
import { POINTS_PER_NOK } from '../engine/wallet';
import { 
  X, 
  Calendar, 
  Cake, 
  Users, 
  MapPin, 
  Clock, 
  Share2, 
  PlusCircle, 
  CheckCircle2, 
  Wallet, 
  AlertCircle,
  Compass,
  Check,
  Gift,
  Search,
  TrendingUp,
  Flame
} from 'lucide-react';

export type PlannerTab = 'events' | 'new_birthday' | 'new_trip' | 'trail_demand';

interface PlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityItem[];
  userPoints: number;
  onPointsUpdated: (newBalance: number) => void;
  onOpenGifts?: () => void;
  initialTab?: PlannerTab;
  initialActivity?: ActivityItem | null;
  defaultCity?: string;
}

export const PlannerModal: React.FC<PlannerModalProps> = ({
  isOpen,
  onClose,
  activities,
  userPoints,
  onPointsUpdated,
  onOpenGifts,
  initialTab = 'events',
  initialActivity = null,
  defaultCity = 'Bergen',
}) => {
  const [activeTab, setActiveTab] = useState<PlannerTab>(initialTab);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // State for Søk & Ønsk langs turen («Gullkartet»)
  const [demandCityFilter, setDemandCityFilter] = useState<string>('all');
  const [demandCategoryFilter, setDemandCategoryFilter] = useState<OutdoorOpportunityCategory | 'all'>('all');
  const [demandSearchQuery, setDemandSearchQuery] = useState<string>('');
  const [reqCategory, setReqCategory] = useState<OutdoorOpportunityCategory>('sauna');
  const [reqCity, setReqCity] = useState<string>(defaultCity || 'Bergen');
  const [reqTrailName, setReqTrailName] = useState<string>('');
  const [reqAudience, setReqAudience] = useState<AudienceSegment>('family');
  const [reqPartySize, setReqPartySize] = useState<number>(4);
  const [reqNote, setReqNote] = useState<string>('');
  const [demandRefreshTrigger, setDemandRefreshTrigger] = useState<number>(0);

  const hotspots = useMemo(
    () =>
      getAggregatedDemandHotspots({
        city: demandCityFilter,
        category: demandCategoryFilter,
        searchQuery: demandSearchQuery,
      }),
    [demandCityFilter, demandCategoryFilter, demandSearchQuery, demandRefreshTrigger]
  );

  const marketMetrics = useMemo(() => calculateDemandMarketValue(hotspots), [hotspots]);

  // Skjema for ny bursdag / samling
  const [category, setCategory] = useState<EventCategory>('birthday');
  const [title, setTitle] = useState('Olivers 10-års Utebursdag på Fløyen');
  const [birthdayKidName, setBirthdayKidName] = useState('Oliver Robertsen');
  const [birthdayKidAge, setBirthdayKidAge] = useState<number>(10);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('act-floyen-show');
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<string>('');
  const [locationName, setLocationName] = useState('Skomakerdiket, Fløyen');
  const [city, setCity] = useState('Bergen');
  const [date, setDate] = useState('2027-05-15');
  const [time, setTime] = useState('12:00');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [rsvpDeadline, setRsvpDeadline] = useState('2027-05-10');
  const [dressCodeAdvice, setDressCodeAdvice] = useState('Uteklær etter vær og gode tursko. Vi skal grille pinnebrød og pølser!');
  const [wishlistNote, setWishlistNote] = useState('Oliver samler på Luks-poeng til sesongkort i klatreparken i stedet for plastleker!');
  const [paymentMode, setPaymentMode] = useState<'organizer_pays_all' | 'split_costs' | 'free_event'>('organizer_pays_all');
  const [pricePerPersonNok, setPricePerPersonNok] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (initialActivity) {
        if (initialActivity.category === 'accommodation' || initialActivity.category === 'hostel') {
          setSelectedAccommodationId(initialActivity.id);
          setSelectedActivityId('');
          setTitle(`Overnatting & Opplevelse: ${initialActivity.title}`);
          setLocationName(initialActivity.locationName);
          setCity(initialActivity.city || defaultCity);
          const price = initialActivity.accommodation?.pricePerNightNok || initialActivity.ticket?.priceNok || 0;
          setPricePerPersonNok(price);
          setPaymentMode('split_costs');
          setCategory('accommodation');
        } else {
          setSelectedActivityId(initialActivity.id);
          setTitle(`Fellestur: ${initialActivity.title}`);
          setLocationName(initialActivity.locationName);
          setCity(initialActivity.city || defaultCity);
          const price = initialActivity.ticket?.priceNok || 0;
          setPricePerPersonNok(price);
          setPaymentMode(price > 0 ? 'split_costs' : 'free_event');
          setDurationMinutes(initialActivity.durationMinutes || 180);
          setCategory(initialActivity.category === 'family' ? 'birthday' : 'outdoor_trip');
        }
        setActiveTab('new_trip');
      }
    }
  }, [isOpen, initialActivity, initialTab, defaultCity]);

  // Ny gjest-skjema
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestAllergy, setNewGuestAllergy] = useState('');

  // Tilbakemelding
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedShareText, setCopiedShareText] = useState(false);

  if (!isOpen) return null;

  const events = getPlannedEvents();
  const currentEvent = events.find(e => e.id === (selectedEventId || events[0]?.id)) || events[0];

  const handleCreateEvent = (cat?: EventCategory) => {
    setStatusMessage(null);
    const chosenCat = cat || category;
    const newEvt = createPlannedEvent({
      category: chosenCat,
      title,
      description: chosenCat === 'birthday' 
        ? `Vi feirer ${birthdayKidName} som fyller ${birthdayKidAge} år med utendørs moro, lek og mat!`
        : `Fellestur og opplevelser i regi av familien.`,
      activityId: selectedActivityId || undefined,
      accommodationId: selectedAccommodationId || undefined,
      locationName,
      city,
      date,
      time,
      durationMinutes,
      birthdayKidName: chosenCat === 'birthday' ? birthdayKidName : undefined,
      birthdayKidAge: chosenCat === 'birthday' ? birthdayKidAge : undefined,
      rsvpDeadline: chosenCat === 'birthday' ? rsvpDeadline : undefined,
      themeEmoji: chosenCat === 'birthday' ? '🎂' : '🌲',
      dressCodeAdvice,
      wishlistNote: chosenCat === 'birthday' ? wishlistNote : undefined,
      organizerName: 'Alexander Robertsen',
      organizerPhone: '+47 912 34 567',
      paymentMode,
      pricePerPersonNok,
      invitees: [
        { id: 'g1', name: 'Henrik (Klasse 2B)', phone: '+47 987 65 432', status: 'accepted', allergy: 'Ingen', giftPointsPledged: 150 },
        { id: 'g2', name: 'Sander (Klasse 2B)', phone: '+47 976 54 321', status: 'accepted', allergy: 'Glutenfri pølse', giftPointsPledged: 200 },
        { id: 'g3', name: 'Emma (Klasse 2B)', phone: '+47 965 43 210', status: 'invited', giftPointsPledged: 100 },
        { id: 'g4', name: 'Milla (Søster)', phone: '+47 923 45 678', status: 'accepted' },
      ],
      packingList: ['Sitteunderlag', 'Drikkeflaske', 'Varm genser'],
    });

    setSelectedEventId(newEvt.id);
    setStatusMessage({ type: 'success', text: `Arrangementet «${newEvt.title}» er opprettet!` });
    setActiveTab('events');
  };

  const handleAddGuest = (eventId: string) => {
    if (!newGuestName.trim()) return;
    addInviteeToEvent(eventId, {
      name: newGuestName,
      phone: newGuestPhone || '+47 900 00 000',
      allergy: newGuestAllergy || undefined,
    });
    setNewGuestName('');
    setNewGuestPhone('');
    setNewGuestAllergy('');
    setStatusMessage({ type: 'success', text: `${newGuestName} ble lagt til i gjestelisten!` });
  };

  const handleToggleRsvp = (eventId: string, inviteeId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'accepted' ? 'declined' : 'accepted';
    updateInviteeStatus(eventId, inviteeId, nextStatus);
  };

  const handleCopyInvitation = (event: PlannedEvent) => {
    const text = generateInvitationShareText(event);
    navigator.clipboard.writeText(text);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2000);
  };

  const handlePayForEvent = async (event: PlannedEvent) => {
    const acceptedCount = event.invitees.filter(i => i.status === 'accepted').length;
    const totalCostNok = acceptedCount * event.pricePerPersonNok;
    const pointsNeeded = totalCostNok * POINTS_PER_NOK;

    const res = await payForEventWithPoints(event.id, Math.min(pointsNeeded, userPoints));
    if (res.success) {
      onPointsUpdated(userPoints - Math.min(pointsNeeded, userPoints));
      setStatusMessage({ 
        type: 'success', 
        text: `Betalt med Luks-poeng! Resterende å betale: ${res.remainingNok} kr.` 
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Feil ved betaling.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-wide">Tur- & Bursdagsplanlegger</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-semibold">
                  INVITASJONER & RSVP
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Planlegg barnebursdager, uteturer og svømmehallbesøk. Inviter, samle inn fellesgaver og betal.
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
            onClick={() => { setActiveTab('events'); setStatusMessage(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'events'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Aktive Arrangementer ({events.length})</span>
          </button>

          <button
            onClick={() => { 
              setActiveTab('new_birthday'); 
              setCategory('birthday');
              setTitle('Olivers 10-års Utebursdag på Fløyen');
              setLocationName('Skomakerdiket, Fløyen');
              setStatusMessage(null); 
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'new_birthday'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Cake className="w-3.5 h-3.5" />
            <span>Planlegg Barnebursdag 🎂</span>
          </button>

          <button
            onClick={() => { 
              setActiveTab('new_trip'); 
              setCategory('outdoor_trip');
              setTitle('Søndagstur & Grilling i Nordnesparken');
              setLocationName('Nordnesparken / Sjøbadet');
              setStatusMessage(null); 
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'new_trip'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Planlegg Vintertur / Bading 🌲🔥</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trail_demand');
              setStatusMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'trail_demand'
                ? 'bg-zinc-950 text-white dark:bg-amber-500 dark:text-zinc-950 shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-zinc-950" />
            <span>Søk & Ønsk langs turen (Gullkartet) 🛖🚲🦌</span>
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

        {/* Hovedinnhold */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* FANE 1: AKTIVE ARRANGEMENTER */}
          {activeTab === 'events' && currentEvent && (
            <div className="space-y-6">
              {/* Velg arrangement dersom flere */}
              {events.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {events.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                        currentEvent.id === ev.id
                          ? 'bg-orange-500/20 border border-orange-500 text-white'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{ev.themeEmoji}</span>
                      <span>{ev.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Hovedkort for valgt arrangement */}
              <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{currentEvent.themeEmoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{currentEvent.title}</h3>
                        {currentEvent.category === 'birthday' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                            BURSDAGSBESØK
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                          {currentEvent.locationName}, {currentEvent.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-orange-400" />
                          {currentEvent.date} kl. {currentEvent.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-klikk kopiering av invitasjonstekst */}
                  <button
                    onClick={() => handleCopyInvitation(currentEvent)}
                    className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
                    title="Kopier ferdig formatert invitasjon til SMS, Spond eller WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{copiedShareText ? 'Kopiert til utklipp!' : 'Del Invitasjon (SMS/Spond)'}</span>
                  </button>
                </div>

                {/* Bursdagsdetaljer & Råd */}
                {currentEvent.category === 'birthday' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-zinc-950 rounded-2xl border border-zinc-850 text-xs">
                    <div>
                      <span className="text-zinc-400 font-medium block">Bursdagsbarn:</span>
                      <strong className="text-white text-sm">{currentEvent.birthdayKidName} ({currentEvent.birthdayKidAge} år)</strong>
                    </div>
                    {currentEvent.rsvpDeadline && (
                      <div>
                        <span className="text-zinc-400 font-medium block">Svarfrist (SU):</span>
                        <strong className="text-rose-400">{currentEvent.rsvpDeadline}</strong>
                      </div>
                    )}
                    <div className="sm:col-span-2 pt-2 border-t border-zinc-900">
                      <span className="text-zinc-400 font-medium block">Bekledning & Info:</span>
                      <p className="text-zinc-300">{currentEvent.dressCodeAdvice}</p>
                    </div>
                    {currentEvent.wishlistNote && (
                      <div className="sm:col-span-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 text-amber-300 mb-0.5">
                            <Gift className="w-3.5 h-3.5" />
                            Bursdagsønske:
                          </span>
                          {onOpenGifts && (
                            <button
                              type="button"
                              onClick={onOpenGifts}
                              className="text-[11px] font-bold text-amber-300 hover:text-white underline flex items-center gap-1"
                            >
                              <span>Gi Luks-poeng til gaven 🎁</span>
                            </button>
                          )}
                        </div>
                        <p>{currentEvent.wishlistNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Gjesteliste & RSVP */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Gjesteliste & RSVP ({currentEvent.invitees.filter(i => i.status === 'accepted').length} av {currentEvent.invitees.length} kommer)
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentEvent.invitees.map(inv => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{inv.name}</span>
                            {inv.status === 'accepted' ? (
                              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Kommer
                              </span>
                            ) : inv.status === 'declined' ? (
                              <span className="text-[10px] text-red-400 font-mono">Kan ikke</span>
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-mono">Venter svar</span>
                            )}
                          </div>
                          {inv.allergy && (
                            <div className="text-[10px] text-amber-400">Allergi: {inv.allergy}</div>
                          )}
                          {inv.giftPointsPledged && inv.giftPointsPledged > 0 && (
                            <div className="text-[10px] text-rose-300 flex items-center gap-1">
                              <Gift className="w-2.5 h-2.5" />
                              Gir +{inv.giftPointsPledged} Luks-poeng i felles bursdagsgave!
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleRsvp(currentEvent.id, inv.id, inv.status)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            inv.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {inv.status === 'accepted' ? 'Meldt på' : 'Endre svar'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Legg til gjest i listen */}
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-850 flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={newGuestName}
                      onChange={e => setNewGuestName(e.target.value)}
                      placeholder="Navn på klassekamerat / venn"
                      className="w-full sm:w-1/3 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={newGuestAllergy}
                      onChange={e => setNewGuestAllergy(e.target.value)}
                      placeholder="Eventuell allergi (f.eks. gluten/melk)"
                      className="w-full sm:w-1/3 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddGuest(currentEvent.id)}
                      disabled={!newGuestName.trim()}
                      className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Legg til</span>
                    </button>
                  </div>
                </div>

                {/* Betalings- / Spanderingsknapp dersom arrangementet koster noe */}
                {currentEvent.pricePerPersonNok > 0 && (
                  <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/30 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-white">Betaling / Spandering</div>
                      <div className="text-[11px] text-zinc-400">
                        {currentEvent.invitees.filter(i => i.status === 'accepted').length} deltakere x {currentEvent.pricePerPersonNok} kr = <strong>{currentEvent.invitees.filter(i => i.status === 'accepted').length * currentEvent.pricePerPersonNok} NOK</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePayForEvent(currentEvent)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Spander med Luks-poeng</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FANE 2: PLANLEGG NY BARNEBURSDAG */}
          {activeTab === 'new_birthday' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <Cake className="w-4 h-4 text-rose-400" />
                  Planlegg Bursdagsbesøk i Friluft eller Svømmehall
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Gjør det enkelt og gøy å feire ute! Fyll inn detaljer, så lager Utaktiv et komplett invitasjonskort med svarfrist, råd om klær, allergiliste og mulighet for at gjestene gir Luks-poeng i fellesgave.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Bursdagsbarnets navn</label>
                    <input
                      type="text"
                      value={birthdayKidName}
                      onChange={e => {
                        setBirthdayKidName(e.target.value);
                        setTitle(`${e.target.value}s ${birthdayKidAge}-års Bursdag!`);
                      }}
                      placeholder="F.eks. Oliver Robertsen"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Alder som fylles</label>
                    <input
                      type="number"
                      value={birthdayKidAge}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setBirthdayKidAge(val);
                        setTitle(`${birthdayKidName}s ${val}-års Bursdag!`);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Knytt til arena / aktivitet */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Velg arena / opplevelse (Friluft eller Svømmehall)</label>
                  <select
                    value={selectedActivityId}
                    onChange={e => {
                      setSelectedActivityId(e.target.value);
                      const act = activities.find(a => a.id === e.target.value);
                      if (act) {
                        setLocationName(act.locationName);
                        setCity(act.city);
                        setPricePerPersonNok(act.ticket?.priceNok || 0);
                        setDurationMinutes(act.durationMinutes || 120);
                        if (act.ticket && act.ticket.priceNok > 0) {
                          setPaymentMode('organizer_pays_all');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  >
                    {activities.map(act => (
                      <option key={act.id} value={act.id}>
                        {act.title} ({act.locationName}) {act.ticket ? `— ${act.ticket.priceNok} kr` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valg av sted / type feiring */}
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 font-medium block">Hurtigvelger for oppmøtested</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { name: 'Skomakerdiket (Fløyen)', desc: 'Skog, natursti & grilling', emoji: '🌲' },
                      { name: 'Høyt & Lavt Klatrepark', desc: 'Tretoppklatring på Nesttun', emoji: '🧗' },
                      { name: 'Nordnes Sjøbad', desc: 'Oppvarmet utendørsbasseng', emoji: '🏊' },
                      { name: 'Nygårdsparken', desc: 'Parkleker, pølser & ball', emoji: '⚽' },
                      { name: 'AdO Arena Svømmehall', desc: 'Badebursdag i dagslyshall', emoji: '🌊' },
                    ].map(opt => (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => {
                          setLocationName(opt.name);
                          setTitle(`${birthdayKidName}s ${opt.name}-Bursdag!`);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          locationName.includes(opt.name)
                            ? 'bg-rose-500/20 border-rose-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="text-base mb-1">{opt.emoji}</div>
                        <div className="text-xs font-bold truncate text-white">{opt.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Dato</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Klokkeslett</label>
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Svarfrist (SU)</label>
                    <input
                      type="date"
                      value={rsvpDeadline}
                      onChange={e => setRsvpDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Råd om klær og utstyr</label>
                  <input
                    type="text"
                    value={dressCodeAdvice}
                    onChange={e => setDressCodeAdvice(e.target.value)}
                    placeholder="F.eks. Uteklær etter vær, gode sko, badetøy..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Felles gaveønske (Luks-poeng i stedet for plastleker)</label>
                  <input
                    type="text"
                    value={wishlistNote}
                    onChange={e => setWishlistNote(e.target.value)}
                    placeholder="F.eks. Oliver samler på Luks-poeng til tretoppklatring!"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateEvent('birthday')}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-rose-500/25"
                >
                  <Cake className="w-4 h-4" />
                  <span>Opprett Bursdagsbesøk & Generer Invitasjon</span>
                </button>
              </div>
            </div>
          )}

          {/* FANE 3: PLANLEGG NY TUR / BADING */}
          {activeTab === 'new_trip' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  Planlegg Utendørs Fellestur eller Svømmehallbesøk
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Inviter familie, venner eller nabolaget med på fjelltur, badeutflukt eller klatring.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Tittel på turen</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="F.eks. Søndagsbad på Nordnes Sjøbad & Kaffe"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Oppmøtested</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={e => setLocationName(e.target.value)}
                      placeholder="Nordnes Sjøbad / Fløyen / Stoltzen"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Dato og klokkeslett</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-2/3 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-1/3 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Opplevelse / Aktivitetvelger */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Knytt til opplevelse / konsert / fjelltur</label>
                  <select
                    value={selectedActivityId}
                    onChange={e => {
                      setSelectedActivityId(e.target.value);
                      const act = activities.find(a => a.id === e.target.value);
                      if (act) {
                        setTitle(`Fellestur: ${act.title}`);
                        setLocationName(act.locationName);
                        setCity(act.city);
                        const cost = act.ticket?.priceNok || 0;
                        setPricePerPersonNok(cost);
                        setDurationMinutes(act.durationMinutes || 180);
                        if (cost > 0) setPaymentMode('split_costs');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Ingen spesifikk (egendefinert rute)</option>
                    {activities
                      .filter(a => a.category !== 'accommodation' && a.category !== 'hostel')
                      .map(act => (
                        <option key={act.id} value={act.id}>
                          {act.category === 'concert' ? '🎸 ' : act.category === 'hike' ? '🥾 ' : act.category === 'ski' ? '⛷️ ' : '🌲 '}
                          {act.title} ({act.city}) {act.ticket ? `— ${act.ticket.priceNok} kr` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Overnatting & Hostel Basecamp */}
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Overnattingsbase / Hostel (valgfritt basecamp for turen)</label>
                  <select
                    value={selectedAccommodationId}
                    onChange={e => {
                      setSelectedAccommodationId(e.target.value);
                      const acc = activities.find(a => a.id === e.target.value);
                      if (acc) {
                        if (!selectedActivityId) {
                          setTitle(`Helgetur & Basecamp: ${acc.title}`);
                          setLocationName(acc.locationName);
                          setCity(acc.city);
                        }
                        const cost = acc.accommodation?.pricePerNightNok || acc.ticket?.priceNok || 0;
                        if (cost > 0 && pricePerPersonNok === 0) {
                          setPricePerPersonNok(cost);
                          setPaymentMode('split_costs');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Ingen overnatting valgt (dagstur)</option>
                    {activities
                      .filter(a => a.category === 'accommodation' || a.category === 'hostel' || a.accommodation)
                      .map(acc => (
                        <option key={acc.id} value={acc.id}>
                          🏨 {acc.title} ({acc.accommodation?.pricePerNightNok || acc.ticket?.priceNok || 0} kr/natt)
                        </option>
                      ))}
                  </select>
                </div>

                {/* Kostnadsfordeling & Pris */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Kostnadsfordeling</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="free_event">Gratis tur</option>
                      <option value="split_costs">Delte kostnader / Spleis</option>
                      <option value="organizer_pays_all">Arrangør spanderer alt</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">Pris / egenandel per person (NOK)</label>
                    <input
                      type="number"
                      value={pricePerPersonNok}
                      onChange={e => setPricePerPersonNok(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Råd om klær og pakkeliste</label>
                  <input
                    type="text"
                    value={dressCodeAdvice}
                    onChange={e => setDressCodeAdvice(e.target.value)}
                    placeholder="Gode tursko, vindjakke, termos, lakenpose..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateEvent('outdoor_trip')}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25"
                >
                  <Compass className="w-4 h-4" />
                  <span>Opprett Tur & Inviter Deltakere</span>
                </button>
              </div>
            </div>
          )}

          {/* FANE 4: SØK & ØNSK LANGS TUREN («GULLKARTET») */}
          {activeTab === 'trail_demand' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    Etterspørsels- og Mulighetsmotor («Gullkartet»)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 w-fit">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {hotspots.length} hotspots · {marketMetrics.totalInterestedPeople} interesserte
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Familier, turgåere og bedrifter melder inn behov for badstuer, hytter, elsykkel, fjordkajakk og turbuss langs norske turløyper.
                </p>

                {/* B2B- & Investormåltall */}
                <div className="pt-2 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-zinc-950/60 border border-amber-500/20">
                    <span className="text-[10px] text-zinc-400 block">Registrerte ønsker</span>
                    <strong className="text-white text-xs font-mono">{marketMetrics.totalRequests} grupper ({marketMetrics.totalInterestedPeople} pers)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950/60 border border-amber-500/20">
                    <span className="text-[10px] text-zinc-400 block">Estimert årlig marked (GMV)</span>
                    <strong className="text-amber-300 text-xs font-mono">kr {marketMetrics.estimatedAnnualGmvNok.toLocaleString('no-NO')}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950/60 border border-amber-500/20 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-zinc-400 block">Est. provisjon Utaktiv (12–20%)</span>
                    <strong className="text-emerald-400 text-xs font-mono">kr {marketMetrics.estimatedUtaktivCommissionNok.toLocaleString('no-NO')}</strong>
                  </div>
                </div>
              </div>

              {/* Søk og filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={demandSearchQuery}
                    onChange={e => setDemandSearchQuery(e.target.value)}
                    placeholder="Søk i løyper, partnere og steder..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <select
                  value={demandCityFilter}
                  onChange={e => setDemandCityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Alle byer og regioner</option>
                  {SUPPORTED_CITIES.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={demandCategoryFilter}
                  onChange={e => setDemandCategoryFilter(e.target.value as OutdoorOpportunityCategory | 'all')}
                  className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Alle 11 opplevelseskategorier</option>
                  {OPPORTUNITY_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.shortTitle}</option>
                  ))}
                </select>
              </div>

              {/* Hotspots liste */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Aktive etterspørsler ({hotspots.length})
                  </h4>
                  {(demandSearchQuery || demandCityFilter !== 'all' || demandCategoryFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDemandSearchQuery('');
                        setDemandCityFilter('all');
                        setDemandCategoryFilter('all');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline"
                    >
                      Nullstill filtre
                    </button>
                  )}
                </div>

                {hotspots.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-2">
                    <p className="text-xs font-medium text-zinc-300">
                      Ingen registrerte hotspots matcher det valgte filteret.
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Vær den første til å melde inn et ønske i skjemaet under for å åpne denne destinasjonen!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {hotspots.map(spot => {
                      const catMeta = OPPORTUNITY_CATEGORIES.find(c => c.id === spot.category);
                      return (
                        <div key={spot.id} className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs hover:border-zinc-700 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white text-xs">{spot.trailOrAreaName}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-orange-400" />
                                  {spot.city} ({spot.region})
                                </span>
                                {catMeta && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-amber-300 font-medium">
                                    {catMeta.emoji} {catMeta.shortTitle}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-orange-400 font-mono font-bold shrink-0 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                              {spot.interestedPeopleCount} pers ({spot.requestCount} grupper)
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-300 italic bg-zinc-950/40 p-2 rounded-lg border border-zinc-850">
                            {spot.highlightReason}
                          </p>

                          {spot.potentialPartnerExamples && spot.potentialPartnerExamples.length > 0 && (
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1 flex-wrap">
                              <span className="font-semibold text-zinc-500">Relevante partnere:</span>
                              <span>{spot.potentialPartnerExamples.join(', ')}</span>
                            </div>
                          )}

                          {spot.crowdBusThreshold && (
                            <div className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded w-fit">
                              Folkekrav: {spot.interestedPeopleCount}/{spot.crowdBusThreshold} påmeldte for direktebuss
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ny forespørsel skjema */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-400">Meld inn et ønske eller behov langs din løype</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    value={reqTrailName}
                    onChange={e => setReqTrailName(e.target.value)}
                    placeholder="Løypenavn / område (f.eks. Vidden, Skistua, Dalsnuten) *"
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={reqCategory}
                    onChange={e => setReqCategory(e.target.value as OutdoorOpportunityCategory)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    {OPPORTUNITY_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <select
                    value={reqCity}
                    onChange={e => setReqCity(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    {SUPPORTED_CITIES.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={reqAudience}
                    onChange={e => setReqAudience(e.target.value as AudienceSegment)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="family">Familie</option>
                    <option value="senior">Senior / Rolig</option>
                    <option value="corporate">Bedrift / Gruppe</option>
                    <option value="friends">Vennegjeng</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={reqPartySize}
                    onChange={e => setReqPartySize(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Antall personer"
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <input
                  type="text"
                  value={reqNote}
                  onChange={e => setReqNote(e.target.value)}
                  placeholder="Valgfri kommentar (f.eks. 'Trenger vedfyrt badstue etter målgang')"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!reqTrailName.trim()) {
                      setStatusMessage({
                        type: 'error',
                        text: 'Vennligst oppgi navn på sti eller turområde (f.eks. Vidden, Skomakerdiket).',
                      });
                      return;
                    }
                    if (reqPartySize < 1 || isNaN(reqPartySize)) {
                      setStatusMessage({
                        type: 'error',
                        text: 'Antall personer må være minst 1.',
                      });
                      return;
                    }

                    submitOpportunityRequest({
                      category: reqCategory,
                      city: reqCity,
                      trailOrAreaName: reqTrailName,
                      audience: reqAudience,
                      partySize: reqPartySize,
                      note: reqNote,
                    });
                    setReqTrailName('');
                    setReqNote('');
                    setDemandRefreshTrigger(prev => prev + 1);
                    setStatusMessage({
                      type: 'success',
                      text: 'Takk! Ønsket ditt er registrert på Gullkartet og synlig for partnere.',
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                >
                  Registrer Ønske på Gullkartet
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
