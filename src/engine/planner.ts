/**
 * Utaktiv — Tur-, Bursdags- & Aktivitetsplanlegger (Planner & Invitations Engine)
 * 
 * Håndterer planlegging av turer, konserter og barnebursdager (bursdagsbesøk),
 * med invitasjoner, RSVP (svarfrist), allergiregistrering, felles gaveønsker og betaling.
 */

import { commitSpend } from './cloudSync';
import { appendWalletTransaction, POINTS_PER_NOK } from './wallet';

export type EventCategory = 'birthday' | 'outdoor_trip' | 'activity_park' | 'concert' | 'neighborhood' | 'accommodation';

export interface EventInvitee {
  id: string;
  name: string;
  parentName?: string;
  phone: string;
  status: 'invited' | 'accepted' | 'declined';
  allergy?: string;
  giftPointsPledged?: number; // Gjester kan gi felles Luks-poeng i bursdagsgave
}

export interface PlannedEvent {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  activityId?: string;
  accommodationId?: string; // Valgfri overnattingsbase for helgeturen (f.eks. Montana Hostel, Citybox)
  locationName: string;
  city: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  
  // Spesifikt for bursdagsbesøk
  birthdayKidName?: string;
  birthdayKidAge?: number;
  rsvpDeadline?: string;
  themeEmoji: string;
  dressCodeAdvice: string; // F.eks. «Uteklær etter vær, gode sko»
  wishlistNote?: string; // F.eks. «Ønsker seg Luks-poeng til tretoppklatring»
  
  // Organisering & Betaling
  organizerName: string;
  organizerPhone: string;
  paymentMode: 'organizer_pays_all' | 'split_costs' | 'free_event';
  pricePerPersonNok: number;
  totalPaidWithPoints?: number;
  
  // Gjesteliste
  invitees: EventInvitee[];
  packingList: string[];
  createdAt: string;
}

const STORAGE_KEY_EVENTS = 'sol_uteliv_planned_events_v1';

export const INITIAL_PLANNED_EVENTS: PlannedEvent[] = [
  {
    id: 'evt-bursdag-oliver-10',
    category: 'birthday',
    title: 'Olivers 10-års Utebursdag på Fløyen',
    description: 'Vi feirer 10 år med natursti, grilling av pinnebrød/pølser og lek ved Skomakerdiket!',
    locationName: 'Skomakerdiket, Fløyen',
    city: 'Bergen',
    date: '2027-05-15',
    time: '12:00',
    durationMinutes: 180,
    birthdayKidName: 'Oliver Robertsen',
    birthdayKidAge: 10,
    rsvpDeadline: '2027-05-10',
    themeEmoji: '🎂',
    dressCodeAdvice: 'Gode tursko og vindjakke. Vi er ute hele tiden!',
    wishlistNote: 'Oliver samler på Luks-poeng til sesongkort i Høyt & Lavt Klatrepark!',
    organizerName: 'Alexander Robertsen',
    organizerPhone: '+47 912 34 567',
    paymentMode: 'organizer_pays_all',
    pricePerPersonNok: 0,
    invitees: [
      { id: 'inv-1', name: 'Henrik (Klasse 2B)', phone: '+47 987 65 432', status: 'accepted', allergy: 'Ingen', giftPointsPledged: 150 },
      { id: 'inv-2', name: 'Sander (Fotball)', phone: '+47 976 54 321', status: 'accepted', allergy: 'Glutenfri pølse', giftPointsPledged: 200 },
      { id: 'inv-3', name: 'Emma (Klasse 2B)', phone: '+47 965 43 210', status: 'invited', giftPointsPledged: 100 },
      { id: 'inv-4', name: 'Milla (Søster)', phone: '+47 923 45 678', status: 'accepted' },
      { id: 'inv-5', name: 'Kasper (Nabo)', phone: '+47 954 32 109', status: 'invited' },
    ],
    packingList: ['Sitteunderlag', 'Drikkeflaske', 'Varm genser'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-klatre-tur-fana',
    category: 'activity_park',
    title: 'Familiedag i Klatreparken',
    description: 'Fellestur for familien og naboer i løypene på Nesttun.',
    locationName: 'Høyt & Lavt Nesttun',
    city: 'Bergen',
    date: '2027-06-05',
    time: '11:00',
    durationMinutes: 240,
    themeEmoji: '🌲',
    dressCodeAdvice: 'Treningstøy og joggesko',
    organizerName: 'Alexander Robertsen',
    organizerPhone: '+47 912 34 567',
    paymentMode: 'split_costs',
    pricePerPersonNok: 350,
    invitees: [
      { id: 'inv-fam1', name: 'Bestemor Torill', phone: '+47 945 67 890', status: 'accepted' },
      { id: 'inv-fam2', name: 'Nabo Kari m/familie', phone: '+47 934 56 789', status: 'accepted' },
    ],
    packingList: ['Klatrehansker', 'Vannflaske', 'Solkrem'],
    createdAt: new Date().toISOString(),
  },
];

let _memoryEvents: PlannedEvent[] = [...INITIAL_PLANNED_EVENTS];

/**
 * Henter alle planlagte arrangementer
 */
export function getPlannedEvents(): PlannedEvent[] {
  if (typeof window === 'undefined') return _memoryEvents;
  const val = localStorage.getItem(STORAGE_KEY_EVENTS);
  if (!val) {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(INITIAL_PLANNED_EVENTS));
    return INITIAL_PLANNED_EVENTS;
  }
  try {
    return JSON.parse(val);
  } catch {
    return INITIAL_PLANNED_EVENTS;
  }
}

/**
 * Oppretter et nytt arrangement / bursdagsbesøk
 */
export function createPlannedEvent(eventData: Omit<PlannedEvent, 'id' | 'createdAt'>): PlannedEvent {
  const newEvent: PlannedEvent = {
    ...eventData,
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
  };

  const current = getPlannedEvents();
  const updated = [newEvent, ...current];
  _memoryEvents = updated;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
  }

  return newEvent;
}

/**
 * Oppdaterer RSVP / svar for en invitasjon
 */
export function updateInviteeStatus(
  eventId: string,
  inviteeId: string,
  status: 'accepted' | 'declined',
  allergy?: string,
  giftPointsPledged?: number
): { success: boolean; event?: PlannedEvent } {
  const events = getPlannedEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return { success: false };

  const updatedInvitees = event.invitees.map(inv => {
    if (inv.id === inviteeId) {
      return {
        ...inv,
        status,
        allergy: allergy !== undefined ? allergy : inv.allergy,
        giftPointsPledged: giftPointsPledged !== undefined ? giftPointsPledged : inv.giftPointsPledged,
      };
    }
    return inv;
  });

  const updatedEvent = { ...event, invitees: updatedInvitees };
  const allUpdated = events.map(e => e.id === eventId ? updatedEvent : e);
  _memoryEvents = allUpdated;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(allUpdated));
  }

  return { success: true, event: updatedEvent };
}

/**
 * Legger til en ny gjest i arrangementet
 */
export function addInviteeToEvent(
  eventId: string,
  invitee: Omit<EventInvitee, 'id' | 'status'>
): { success: boolean; event?: PlannedEvent; newInvitee?: EventInvitee } {
  const events = getPlannedEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return { success: false };

  const newInv: EventInvitee = {
    ...invitee,
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    status: 'invited',
  };

  const updatedEvent = {
    ...event,
    invitees: [...event.invitees, newInv],
  };

  const allUpdated = events.map(e => e.id === eventId ? updatedEvent : e);
  _memoryEvents = allUpdated;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(allUpdated));
  }

  return { success: true, event: updatedEvent, newInvitee: newInv };
}

/**
 * Spandere / betale for arrangementet med Luks-poeng
 */
export async function payForEventWithPoints(
  eventId: string,
  pointsToUse: number
): Promise<{ success: boolean; remainingNok: number; error?: string }> {
  const events = getPlannedEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return { success: false, remainingNok: 0, error: 'Arrangement ikke funnet.' };

  const acceptedCount = event.invitees.filter(i => i.status === 'accepted').length;
  const totalCostNok = acceptedCount * event.pricePerPersonNok;

  const discountNok = Math.floor(pointsToUse / POINTS_PER_NOK);
  const remainingNok = Math.max(0, totalCostNok - discountNok);
  const spent = await commitSpend(
    pointsToUse,
    `event-${eventId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  if (!spent.ok) {
    return { success: false, remainingNok: totalCostNok, error: spent.error || 'Ikke nok kjøpte poeng i lommeboka.' };
  }

  appendWalletTransaction({
    id: `tx-event-${Date.now()}`,
    type: 'activity_payment',
    points: -pointsToUse,
    nokValue: discountNok,
    title: `Betalt for arrangement: ${event.title}`,
    description: `Spanderte for ${acceptedCount} deltakere. Brukte ${pointsToUse} poeng (${discountNok} kr).`,
    createdAt: new Date().toISOString(),
  });

  return { success: true, remainingNok };
}

/**
 * Genererer en ferdig delevennlig invitasjonstekst (for SMS, Spond eller WhatsApp)
 */
export function generateInvitationShareText(event: PlannedEvent): string {
  if (event.category === 'birthday') {
    return `🎉 Du er invitert til bursdagsfeiring! 🎉\n\n` +
      `Hurra! ${event.birthdayKidName || 'Bursdagsbarnet'} fyller ${event.birthdayKidAge || ''} år, og vil gjerne feire sammen med deg!\n\n` +
      `📅 Dato: ${event.date} kl. ${event.time}\n` +
      `📍 Sted: ${event.locationName}, ${event.city}\n` +
      `🧣 Kle deg etter været: ${event.dressCodeAdvice}\n` +
      (event.rsvpDeadline ? `⏰ Svarfrist (SU): ${event.rsvpDeadline}\n` : '') +
      (event.wishlistNote ? `🎁 Gaveønske: ${event.wishlistNote}\n` : '') +
      `\nSvar enkelt i Utaktiv-appen: https://utaktiv.no/invitasjon/${event.id}`;
  }

  return `☀️ Bli med på tur: ${event.title}! ☀️\n\n` +
    `📅 ${event.date} kl. ${event.time}\n` +
    `📍 ${event.locationName}\n` +
    `📝 ${event.description}\n` +
    `\nSvar og se detaljer her: https://utaktiv.no/invitasjon/${event.id}`;
}
