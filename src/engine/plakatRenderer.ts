/**
 * plakatRenderer.ts — Genererer høyoppløselig 1080x1920 PNG Turplakat (Instagram Story / iMessage / SMS)
 * Bruker HTML5 Canvas med automatisk CORS-fallback til prosedyrisk norsk fjell- og solnedgangsgrafikk
 * slik at bilde-eksporten aldri feiler.
 */

import { TurKurv, TurStop } from '../hooks/useTurKurv';
import { getActivityHeroUrl } from './imageResolver';

export interface RouteAddonOption {
  id: string;
  label: string;
  priceNok: number;
  kind: 'food' | 'sauna';
  windowDurationMin: number;
  badgeText: string;
  cities?: string[];
}

export const ROUTE_ADDON_CARDS: RouteAddonOption[] = [
  {
    id: 'addon-bolle-kaffe',
    label: '2x Skillingsbolle & kaffe',
    priceNok: 90,
    kind: 'food',
    windowDurationMin: 30,
    badgeText: 'Hent bolle & kaffe',
  },
  {
    id: 'addon-kakao-vaffel',
    label: 'Varm kakao & vaffel',
    priceNok: 75,
    kind: 'food',
    windowDurationMin: 30,
    badgeText: 'Vaffel & kaffestopp',
  },
  {
    id: 'addon-fjordbadstue',
    label: 'Fjordbadstue etter turen',
    priceNok: 199,
    kind: 'sauna',
    windowDurationMin: 75,
    badgeText: 'Møt på fjordbadstue',
  },
  {
    id: 'addon-gratis-badstue',
    label: 'Gratis badstue ved fjorden',
    priceNok: 0,
    kind: 'sauna',
    windowDurationMin: 60,
    badgeText: 'Gratis badstue (0 kr)',
    cities: ['eidfjord'],
  },
  {
    id: 'addon-suppe-lunsj',
    label: 'Varm suppe & surdeigsbrød',
    priceNok: 145,
    kind: 'food',
    windowDurationMin: 45,
    badgeText: 'Varm lunsjpause',
  },
];

/**
 * Returnerer tilgjengelige opplevelses-tillegg for gitt by.
 * "Gratis badstue ved fjorden" finnes kun i Eidfjord (dugnadsbadstuen nede ved fjorden).
 * I Bergen og andre byer tilbys i stedet betalt fjordbadstue (Heit/Nordnes) og varm suppe & brød.
 */
export function getRouteAddonCardsForCity(city?: string): RouteAddonOption[] {
  const isEidfjord = (city || '').trim().toLowerCase() === 'eidfjord';
  return ROUTE_ADDON_CARDS.filter(card => {
    if (card.id === 'addon-gratis-badstue') {
      return isEidfjord;
    }
    if (card.id === 'addon-suppe-lunsj') {
      return !isEidfjord;
    }
    if (card.cities && card.cities.length > 0) {
      return card.cities.map(c => c.toLowerCase()).includes((city || '').trim().toLowerCase());
    }
    return true;
  });
}

export function estimateAddonItemPriceNok(itemText: string): number {
  const lower = itemText.trim().toLowerCase();
  if (!lower) return 0;
  for (const card of ROUTE_ADDON_CARDS) {
    if (card.label.toLowerCase() === lower) {
      return card.priceNok;
    }
  }
  if (lower.includes('gratis')) return 0;
  if (lower.includes('skillingsbolle') || lower.includes('bolle')) return 90;
  if (lower.includes('vaffel') || lower.includes('kakao') || lower.includes('svele')) return 75;
  if (lower.includes('badstue') || lower.includes('sauna') || lower.includes('sjøbad')) return 199;
  if (lower.includes('suppe') || lower.includes('surdeig')) return 145;
  if (lower.includes('middag') || lower.includes('sjel og gane')) return 495;
  if (lower.includes('lunsj')) return 145;
  return 85;
}

export interface TripTimelineStep {
  id: string;
  time: string;
  timeWindow: string;
  sunWindow: string;
  kind: 'start' | 'food' | 'sauna' | 'note';
  headline: string;
  where: string;
  description: string;
  priceNok: number;
  mapXPercent: number;
  mapYPercent: number;
}

export interface TripItinerary {
  narrative: string;
  steps: TripTimelineStep[];
  totalPriceNok: number;
  sunWindowSummary: string;
}

function addMinutesToClock(clock: string | undefined, addMinutes: number, fallback = '12:00'): string {
  const base = clock && /^\d{2}:\d{2}$/.test(clock.trim()) ? clock.trim() : fallback;
  const [hStr, mStr] = base.split(':');
  const totalMinutes = (Number(hStr) * 60 + Number(mStr) + addMinutes + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function resolveFoodPlaceForStop(stop: TurStop, city: string): string {
  const text = `${stop.title} ${stop.locationName}`.toLowerCase();
  if (text.includes('sætregården') || text.includes('postvei') || text.includes('hordvik') || text.includes('veten')) {
    return 'Varmestuen / gårdskiosken på Sætregården (Falkangervegen 235, Hordvik)';
  }
  if (text.includes('vikinghytten') || text.includes('hjortland') || text.includes('åsane')) {
    return `Ved turmålet på ${stop.locationName} (eller Sætregården / lokal turkafé i Åsane)`;
  }
  if (text.includes('fløyen') || text.includes('skomakerdiket') || text.includes('brushytten') || text.includes('vidden')) {
    return 'Fløistuen Kafé / Skomakerstuen / Brushytten på Fløyen';
  }
  const c = city.toLowerCase();
  if (c === 'eidfjord') return 'Sjel og Gane i Heggjagarden (Eidfjord sentrum) / Fossli Hotel';
  if (c === 'oslo') return 'Frognerseteren Kafé / Ullevålseter langs ruten';
  if (c === 'stavanger') return 'Gramstad / lokal turkafé ved løypa';
  if (c === 'trondheim') return 'Skistua / Elgsethytta i Bymarka';
  if (c === 'kristiansand') return 'Baneheia Parkkafé / Odderøya kafé';
  if (c === 'bodø' || c === 'bodo') return 'Turisthytta på Rønvikfjellet / Keiservarden';
  return `Kafé / varmestue ved ${stop.locationName}`;
}

function resolveSaunaPlaceForStop(stop: TurStop, city: string): string {
  const text = `${stop.title} ${stop.locationName}`.toLowerCase();
  const c = city.toLowerCase();
  if (c === 'eidfjord' || text.includes('eidfjord')) {
    return 'Gratis badstue helt nede ved fjorden i Eidfjord sentrum (eller Heit Eidfjord ved kaien)';
  }
  if (c === 'bergen') {
    return 'Heit Bergen Sauna ved fjorden (Marineholmen / Laksevåg) eller Nordnes Sjøbad';
  }
  if (c === 'oslo') {
    return 'KOK Badstue ved Sørenga / Langkaia i Oslofjorden';
  }
  if (c === 'stavanger') {
    return 'Damp Sauna i Stavanger Øst / Badedammen';
  }
  if (c === 'trondheim') {
    return 'Havet Arena Badstue ved Trondheimsfjorden';
  }
  if (c === 'kristiansand') {
    return 'Bystranda Sauna i vannkanten';
  }
  if (c === 'bodø' || c === 'bodo') {
    return 'Pust Badstue ytterst på moloen i Bodø Havn';
  }
  return `Lokal fjordbadstue i ${city}`;
}

function resolveSunWindowForCity(city: string): string {
  const c = city.toLowerCase();
  if (c === 'bodø' || c === 'bodo') return 'Sol kl. 10:30–14:45';
  if (c === 'trondheim') return 'Sol kl. 10:15–15:30';
  if (c === 'eidfjord') return 'Sol på platå/fjell kl. 10:30–15:15';
  if (c === 'bergen') return 'Sol i høyden kl. 10:00–16:00';
  return 'Sol kl. 10:00–16:15';
}

const ROUTE_MAP_ANCHORS: Array<{ x: number; y: number }> = [
  { x: 14, y: 74 },
  { x: 36, y: 46 },
  { x: 63, y: 30 },
  { x: 84, y: 58 },
  { x: 52, y: 76 },
  { x: 78, y: 24 },
];

/**
 * Bygger en fullstendig tidsplan, totalpris og kart-etapper om hvordan turen blir:
 * - Tider for sol på stedet
 * - Når og hvor vi starter turen
 * - Tidsrom for å hente bolle / vaffel / kaffe
 * - Tidsrom man må møte på sauna eller annen aktivitet etter turen
 */
export function buildTripItinerary(kurv: TurKurv): TripItinerary {
  const sunWindowSummary = resolveSunWindowForCity(kurv.city || 'Bergen');
  if (!kurv.stops || kurv.stops.length === 0) {
    return {
      narrative: `Legg til et stopp for å se tidsplanen for turen i ${kurv.city}.`,
      steps: [],
      totalPriceNok: 0,
      sunWindowSummary,
    };
  }

  const steps: TripTimelineStep[] = [];
  const narrativeParts: string[] = [];
  let totalPriceNok = 0;

  kurv.stops.forEach((stop, idx) => {
    const startClock = stop.scheduledTime && stop.scheduledTime.trim()
      ? stop.scheduledTime.trim()
      : addMinutesToClock('11:00', idx * 120);
    const startEndClock = addMinutesToClock(startClock, 45);
    const stopBasePrice = typeof stop.basePriceNok === 'number' && stop.basePriceNok > 0 ? stop.basePriceNok : 0;
    totalPriceNok += stopBasePrice;

    const anchorStart = ROUTE_MAP_ANCHORS[steps.length % ROUTE_MAP_ANCHORS.length];

    // 1. Selve turstarten / stoppet
    steps.push({
      id: `${stop.activityId}-start`,
      time: startClock,
      timeWindow: `Kl. ${startClock}–${startEndClock}`,
      sunWindow: sunWindowSummary,
      kind: 'start',
      headline: `Start på tur: ${stop.title || stop.locationName}`,
      where: stop.locationName,
      description: `Vi møtes kl. ${startClock} ved ${stop.locationName} (${sunWindowSummary.toLowerCase()}).`,
      priceNok: stopBasePrice,
      mapXPercent: anchorStart.x,
      mapYPercent: anchorStart.y,
    });

    if (idx === 0) {
      narrativeParts.push(
        `Vi møtes kl. ${startClock} ved ${stop.locationName} for «${stop.title || stop.locationName}» (${sunWindowSummary.toLowerCase()}).`
      );
    } else {
      narrativeParts.push(
        `Kl. ${startClock} fortsetter vi til «${stop.title || stop.locationName}» (${stop.locationName}).`
      );
    }

    // Analyser valgte tillegg i preBookingNote (kan inneholde både bolle, vaffel og fjordbadstue!)
    const noteParts = (stop.preBookingNote || '')
      .split(/\s*\+\s*/)
      .map(p => p.trim())
      .filter(Boolean);

    const foodItems = noteParts.filter(p =>
      /bolle|kaffe|kakao|vaffel|svele|middag|mat|lunsj|is|kiosk/i.test(p)
    );
    const saunaItems = noteParts.filter(p =>
      /badstue|sauna|fjordbad|sjøbad/i.test(p)
    );
    const otherItems = noteParts.filter(
      p => !foodItems.includes(p) && !saunaItems.includes(p)
    );

    let offsetMin = 45;

    if (foodItems.length > 0) {
      const foodClock = addMinutesToClock(startClock, offsetMin);
      const foodEndClock = addMinutesToClock(foodClock, 30);
      const foodLabel = foodItems.join(' + ');
      const foodWhere = resolveFoodPlaceForStop(stop, kurv.city);
      const foodPrice = foodItems.reduce((sum, item) => sum + estimateAddonItemPriceNok(item), 0);
      totalPriceNok += foodPrice;
      const anchorFood = ROUTE_MAP_ANCHORS[steps.length % ROUTE_MAP_ANCHORS.length];

      steps.push({
        id: `${stop.activityId}-food`,
        time: foodClock,
        timeWindow: `Kl. ${foodClock}–${foodEndClock}`,
        sunWindow: sunWindowSummary,
        kind: 'food',
        headline: `Hente bolle & kaffe: ${foodLabel}`,
        where: foodWhere,
        description: `Tidsrom kl. ${foodClock}–${foodEndClock}: Hent ${foodLabel.toLowerCase()} på ${foodWhere}.`,
        priceNok: foodPrice,
        mapXPercent: anchorFood.x,
        mapYPercent: anchorFood.y,
      });
      narrativeParts.push(
        `Kl. ${foodClock}–${foodEndClock} henter vi ${foodLabel.toLowerCase()} ved ${foodWhere}.`
      );
      offsetMin += 60;
    }

    if (saunaItems.length > 0) {
      const saunaClock = addMinutesToClock(startClock, offsetMin);
      const saunaEndClock = addMinutesToClock(saunaClock, 75);
      const saunaLabel = saunaItems.join(' + ');
      const saunaWhere = resolveSaunaPlaceForStop(stop, kurv.city);
      const saunaPrice = saunaItems.reduce((sum, item) => sum + estimateAddonItemPriceNok(item), 0);
      totalPriceNok += saunaPrice;
      const anchorSauna = ROUTE_MAP_ANCHORS[steps.length % ROUTE_MAP_ANCHORS.length];

      steps.push({
        id: `${stop.activityId}-sauna`,
        time: saunaClock,
        timeWindow: `Kl. ${saunaClock}–${saunaEndClock}`,
        sunWindow: sunWindowSummary,
        kind: 'sauna',
        headline: `Møte på badstue: ${saunaLabel}`,
        where: saunaWhere,
        description: `Oppmøte kl. ${saunaClock} (badstuetid til kl. ${saunaEndClock}) hos ${saunaWhere}.`,
        priceNok: saunaPrice,
        mapXPercent: anchorSauna.x,
        mapYPercent: anchorSauna.y,
      });
      narrativeParts.push(
        `Kl. ${saunaClock}–${saunaEndClock} møter vi opp til varm badstue hos ${saunaWhere}.`
      );
      offsetMin += 60;
    }

    if (otherItems.length > 0) {
      const noteClock = addMinutesToClock(startClock, 30);
      const noteEndClock = addMinutesToClock(noteClock, 45);
      const otherLabel = otherItems.join(' · ');
      const otherPrice = otherItems.reduce((sum, item) => sum + estimateAddonItemPriceNok(item), 0);
      totalPriceNok += otherPrice;
      const anchorOther = ROUTE_MAP_ANCHORS[steps.length % ROUTE_MAP_ANCHORS.length];

      steps.push({
        id: `${stop.activityId}-other`,
        time: noteClock,
        timeWindow: `Kl. ${noteClock}–${noteEndClock}`,
        sunWindow: sunWindowSummary,
        kind: 'note',
        headline: `Aktivitet underveis: ${otherLabel}`,
        where: stop.locationName,
        description: otherLabel,
        priceNok: otherPrice,
        mapXPercent: anchorOther.x,
        mapYPercent: anchorOther.y,
      });
      narrativeParts.push(otherLabel);
    }
  });

  return {
    narrative: narrativeParts.join(' '),
    steps,
    totalPriceNok,
    sunWindowSummary,
  };
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function loadHeroImageSafe(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 2500);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

export function buildCommitmentQuote(kurv: TurKurv): string {
  const firstStop = kurv.stops[0];
  const primaryPreBook = kurv.stops.find(s => s.preBooked || s.preBookingNote);
  if (primaryPreBook) {
    return `Jeg har booket ${primaryPreBook.preBookingNote || 'en bolle og kaffe'} på ${primaryPreBook.locationName}${primaryPreBook.scheduledTime ? ` kl. ${primaryPreBook.scheduledTime}` : ''} – den må vi rekke!`;
  }
  if (firstStop?.scheduledTime) {
    return `Vi møtes kl. ${firstStop.scheduledTime} på ${firstStop.locationName}!`;
  }
  return `Bli med på en nydelig tur i ${kurv.city}!`;
}

export async function renderTurPlakatPngBlob(
  kurv: TurKurv,
  friendName: string = 'Emma'
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Bakgrunn: Dyp fjellgrafitt (#141311)
  ctx.fillStyle = '#141311';
  ctx.fillRect(0, 0, width, height);

  // 2. Hero-seksjon øverst (0..680px)
  const firstStop = kurv.stops[0];
  const lastStop = kurv.stops.length > 1 ? kurv.stops[kurv.stops.length - 1] : null;
  const heroUrl = getActivityHeroUrl(firstStop?.locationName, kurv.city, firstStop?.imageUrl);
  const heroImg = await loadHeroImageSafe(heroUrl);

  if (heroImg) {
    const scale = Math.max(width / heroImg.width, 680 / heroImg.height);
    const dw = heroImg.width * scale;
    const dh = heroImg.height * scale;
    const dx = (width - dw) / 2;
    const dy = (680 - dh) / 2;
    ctx.drawImage(heroImg, dx, dy, dw, dh);
  } else {
    // Prosedyrisk norsk fjell- og solnedgangs-gradient ved offline/CORS
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 680);
    skyGrad.addColorStop(0, '#1e1b4b');
    skyGrad.addColorStop(0.55, '#9a3412');
    skyGrad.addColorStop(1, '#141311');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, 680);

    // Glødende sol
    const sunGrad = ctx.createRadialGradient(820, 220, 20, 820, 220, 260);
    sunGrad.addColorStop(0, 'rgba(251, 146, 60, 0.85)');
    sunGrad.addColorStop(1, 'rgba(232, 98, 44, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, 680);
  }

  // Mørk redaksjonell fade fra hero ned i kortet
  const fadeGrad = ctx.createLinearGradient(0, 200, 0, 690);
  fadeGrad.addColorStop(0, 'rgba(20, 19, 17, 0.15)');
  fadeGrad.addColorStop(0.65, 'rgba(20, 19, 17, 0.78)');
  fadeGrad.addColorStop(1, '#141311');
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(0, 0, width, 700);

  // 3. Topp-badge ("UTAKTIV TURPLAKAT")
  const padX = 76;
  drawRoundRect(ctx, padX, 410, 360, 56, 28);
  ctx.fillStyle = '#E8622C';
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('☀️  UTAKTIV TURPLAKAT', padX + 28, 446);

  // 4. Hovedtittel (f.eks. "Fløyen → Nordnes Sjøbad")
  const routeHeadline = `${firstStop?.locationName || kurv.city}${lastStop ? ` → ${lastStop.locationName}` : ''}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 60px "Playfair Display", Georgia, serif';
  const titleLines = wrapText(ctx, routeHeadline, width - padX * 2).slice(0, 2);
  let yCursor = 535;
  for (const line of titleLines) {
    ctx.fillText(line, padX, yCursor);
    yCursor += 72;
  }

  // Undertittel med vennens navn
  ctx.fillStyle = '#fdba74';
  ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`Personlig turinvitasjon til ${friendName || 'deg'} · ${kurv.city}`, padX, yCursor + 6);
  yCursor += 56;

  // 5. "Forpliktelse & Kosegaranti" boks
  const commitmentQuote = `"${buildCommitmentQuote(kurv)}"`;
  ctx.font = 'italic 600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const quoteLines = wrapText(ctx, commitmentQuote, width - padX * 2 - 80);
  const boxHeight = 110 + quoteLines.length * 44;

  drawRoundRect(ctx, padX, yCursor, width - padX * 2, boxHeight, 36);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('FORPLIKTELSE & KOSEGARANTI', padX + 40, yCursor + 48);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'italic 600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  let qY = yCursor + 98;
  for (const qLine of quoteLines) {
    ctx.fillText(qLine, padX + 40, qY);
    qY += 44;
  }

  yCursor += boxHeight + 54;

  // 6. Planlagte stopp
  ctx.fillStyle = '#a8a29e';
  ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`PLANLAGTE STOPP (${kurv.stops.length})`, padX, yCursor);
  yCursor += 30;

  const visibleStops = kurv.stops.slice(0, 4);
  for (let i = 0; i < visibleStops.length; i++) {
    const stop = visibleStops[i];
    const hasNote = Boolean(stop.preBookingNote);
    const cardH = hasNote ? 185 : 140;

    drawRoundRect(ctx, padX, yCursor, width - padX * 2, cardH, 28);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.stroke();

    // Nummer-sirkel
    ctx.beginPath();
    ctx.arc(padX + 54, yCursor + 58, 26, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(232, 98, 44, 0.22)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#E8622C';
    ctx.stroke();

    ctx.fillStyle = '#E8622C';
    ctx.font = '900 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(String(i + 1), padX + 46, yCursor + 67);

    // Stopp-tittel
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const stopTitle = (stop.title || stop.locationName).slice(0, 42);
    ctx.fillText(stopTitle, padX + 104, yCursor + 56);

    // Lokasjon + klokkeslett
    ctx.fillStyle = '#d6d3d1';
    ctx.font = '500 25px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const metaText = `📍 ${stop.locationName}${stop.scheduledTime ? `   •   🕒 kl. ${stop.scheduledTime}` : ''}`;
    ctx.fillText(metaText, padX + 104, yCursor + 98);

    // Forhåndsbooking-badge
    if (hasNote) {
      ctx.fillStyle = '#34d399';
      ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`☕ Forhåndsbooket: ${stop.preBookingNote}`, padX + 104, yCursor + 144);
    }

    yCursor += cardH + 22;
  }

  // 7. Bunnlinje (Footer)
  const footerY = height - 90;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, footerY - 45);
  ctx.lineTo(width - padX, footerY - 45);
  ctx.stroke();

  ctx.fillStyle = '#a8a29e';
  ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`By: ${kurv.city} · Dagslys, turer & gode minner`, padX, footerY);

  ctx.fillStyle = '#E8622C';
  ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('utaktiv.no ☀️', width - padX - 185, footerY);

  return new Promise<Blob | null>(resolve => {
    try {
      canvas.toBlob(blob => resolve(blob), 'image/png', 0.95);
    } catch {
      resolve(null);
    }
  });
}

export async function downloadTurPlakatPng(
  kurv: TurKurv,
  friendName: string = 'Emma'
): Promise<{ ok: boolean; sharedAsFile?: boolean }> {
  const blob = await renderTurPlakatPngBlob(kurv, friendName);
  if (!blob) return { ok: false };

  const safeCity = (kurv.city || 'tur').toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `utaktiv-turplakat-${safeCity}.png`;

  // Prøv Web Share Level 2 med bildefil hvis støttet på mobil
  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && typeof File !== 'undefined') {
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Utaktiv Turplakat · ${kurv.city}`,
          text: buildCommitmentQuote(kurv),
        });
        return { ok: true, sharedAsFile: true };
      }
    } catch {
      // Fallback til direkte nedlasting
    }
  }

  // Standard filnedlasting
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return { ok: true, sharedAsFile: false };
}
