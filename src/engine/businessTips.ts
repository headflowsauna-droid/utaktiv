/**
 * Stopp og bedrifter langs turveien («Tips oss om en bedrift på veien»).
 * Kombinerer bekreftede stopp langs ruter (som Sætregården langs Den trondhjemske postvei
 * og Sjel & Gane / Gratis fjordbadstue i Eidfjord) med brukernes egne tips,
 * slik at turgåere ser hva som finnes langs ruten og vi kan hjelpe lokale bedrifter å få trafikk.
 */

import { loadPendingTips, LocalTip } from './localTips';

export interface RouteBusinessStop {
  id: string;
  routeActivityIds: string[];
  city: string;
  name: string;
  address: string;
  summary: string;
  whenOpen: string;
  url: string;
  isFreeOrDropIn?: boolean;
  verified: boolean;
}

/**
 * Bekreftede stopp og bedrifter som ligger langs konkrete turruter i appen.
 */
export const VERIFIED_ROUTE_STOPS: RouteBusinessStop[] = [
  {
    id: 'route-stop-saetregaarden',
    routeActivityIds: [
      'act-postveien-asane-bergen',
      'act-saetregaarden-hordvik',
      'act-veten-asane-bergen',
    ],
    city: 'Bergen',
    name: 'Sætregården Besøksgård (Hordvik i Åsane)',
    address: 'Falkangervegen 235, 5108 Hordvik (langs Den trondhjemske postvei fra Steinhellebrua ved IKEA Åsane)',
    summary:
      'Besøksgård rett ved Den trondhjemske postvei og foten av stien opp mot Veten (ikke Øvre-Eide). Dyr og kaninkos på tunet, kaffe og vafler i varmestuen, og kort tur på hest. Ikke en restaurant med bordbestilling.',
    whenOpen:
      'Søndager kl. 12–16 i vårsesongen og høstsesongen (åpen gård uten påmelding). Utenfor disse søndagene avtales besøk og ridetime på forhånd.',
    url: 'https://www.saetregaarden.no/besoksgaard/',
    isFreeOrDropIn: true,
    verified: true,
  },
  {
    id: 'route-stop-sjel-og-gane-eidfjord',
    routeActivityIds: [
      'act-voringsfossen-trappebro',
      'act-kjeasen-eidfjord',
      'act-haereid-eidfjordvatnet',
      'act-gratis-sauna-eidfjord',
      'act-heit-eidfjord-sauna',
    ],
    city: 'Eidfjord',
    name: 'Sjel og Gane — Restaurant i Heggjagarden',
    address: 'Eidfjordvegen 300 (Heggjagarden), Eidfjord sentrum',
    summary:
      '300 år gammelt hus (Eidfjords første gjestgiveri og øltapperi) med Cognacloft i 3. etasje, vannhull i kjelleren og urtehage. Marinert seirygg, bakt kveite, hjemmerøkt kjøtt/carpaccio, selvpresset eplesaft og Hardanger-sider.',
    whenOpen: 'Forhåndsbestilling hos kokken Arthur (tlf. 932 57 370 / post@kokken-arthur.no).',
    url: 'https://menykort.menu/restaurants/eidfjord/sjel-og-gane-bar-og-restaurant',
    verified: true,
  },
  {
    id: 'route-stop-gratis-fjordbadstue-eidfjord',
    routeActivityIds: [
      'act-voringsfossen-trappebro',
      'act-kjeasen-eidfjord',
      'act-haereid-eidfjordvatnet',
      'act-sjel-og-gane-eidfjord',
      'act-heit-eidfjord-sauna',
    ],
    city: 'Eidfjord',
    name: 'Gratis Badstue helt nede ved fjorden + Heit Eidfjord Sauna',
    address: 'Fjordkanten / Kråkeskarvet i Eidfjord sentrum',
    summary:
      'Gratis badstue helt nede ved fjorden (0 kr), eller forhåndsbook garantert tid i Heit Eidfjord panoramabadstue (enkeltbillett 199 kr / privat badstue 1 000 kr med dørkode på SMS).',
    whenOpen: 'Hver dag kl. 06:00–22:00 ved fjorden.',
    url: 'https://heiteidfjord.no/?utm_source=utaktiv',
    isFreeOrDropIn: true,
    verified: true,
  },
];

/**
 * Henter både bekreftede stopp og innsendte brukertips som matcher en gitt tur eller sti.
 */
export function getStopsForRoute(
  activityId: string,
  activityTitle: string,
  city: string
): {
  verifiedStops: RouteBusinessStop[];
  userTippedStops: LocalTip[];
} {
  const verifiedStops = VERIFIED_ROUTE_STOPS.filter(s =>
    s.routeActivityIds.includes(activityId)
  );

  const pending = loadPendingTips();
  const normTitle = activityTitle.toLowerCase();
  const normCity = city.toLowerCase();

  const userTippedStops = pending.filter(tip => {
    if (tip.city.toLowerCase() !== normCity) return false;
    const tipTrail = tip.trail.toLowerCase();
    return (
      tipTrail.length > 2 &&
      (normTitle.includes(tipTrail) || tipTrail.includes(normTitle.slice(0, 12)))
    );
  });

  return { verifiedStops, userTippedStops };
}
