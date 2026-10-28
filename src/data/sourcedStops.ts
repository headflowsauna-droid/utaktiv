import type { ActivityItem } from '../engine/activities';
import { osloDateKey } from '../engine/sunPlace';

/**
 * Lokale turperler, Åsane-turer, besøksgårder og nabolagsfavoritter.
 * Ingen påtvunget billett eller addOns i denne listen, slik at gratis turer
 * og lokale besøksgårder vises ærlig med direkte informasjon og solberegning.
 */

export const SOURCED_STOPS: ActivityItem[] = [
  // ==========================================
  // ÅSANE & BERGEN LOKALE TURPERLER
  // ==========================================
  {
    id: 'act-vikinghytten-hjortland-asane',
    title: 'Vikinghytten fra Hjortland (Åsane / Vardegga 590 moh.)',
    titleEn: 'Vikinghytten from Hjortland (Åsane Mountain Hike)',
    category: 'hike',
    description:
      'Klassisk og elsket fjelltur i Åsane! Start fra parkeringen innerst på Hjortland og følg grusveien opp gjennom Rimmaskaret før stien tar deg videre opp på snaufjellet til den ikoniske, torvtekte Vikinghytten (reist av TIF Viking i 1913) på Vardegga. Fantastisk 360-graders utsikt mot Byfjorden, Åsane, Osterøy og Ulriken, og svært gode solforhold på platået.',
    descriptionEn:
      'Classic mountain hike in Åsane starting from Hjortland up through Rimmaskaret to the historic turf-roofed Vikinghytten cabin (built in 1913) on Vardegga (590m). Wide-open panoramic views and great afternoon sun.',
    locationName: 'Hjortland til Vikinghytten, Åsane',
    locationNameEn: 'Hjortland to Vikinghytten, Åsane',
    city: 'Bergen',
    coordinates: { lat: 60.4582, lng: 5.3886 },
    isOutdoor: true,
    durationMinutes: 165,
    targetAgeMin: 5,
    strollerAccessible: false,
    sourceUrl: 'https://ut.no/turforslag/115064/fra-hjortland-til-vikinghytten',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 38000,
    stopKind: 'free',
    trail: {
      type: 'mountain_hike',
      difficulty: 'blue',
      distanceKm: 7.4,
      elevationMeters: 420,
      surface: 'Grusvei gjennom Rimmaskaret + merket fjellsti',
      trailMarking: 'T-merket / skiltet fra Hjortland (TIF Viking / DNT)',
    },
    checkinTarget: {
      badgeName: 'Vikinghytten Åsane 590 moh. 🏔️',
      solarBonusLux: 38000,
      radiusMeters: 350,
    },
  },
  {
    id: 'act-postveien-asane-bergen',
    title: 'Den Trondhjemske Postvei gjennom Åsane (Steinhellebrua på Saurås – Sætregården)',
    titleEn: 'The Historic Trondheim Post Road in Åsane (Steinhellebrua – Sætregården)',
    category: 'hike',
    description:
      'En av Bergens vakreste og mest familievennlige historiske vandringer! Start ved Steinhellebrua på Saurås (like ved IKEA Åsane og E39) og følg den bilfrie, oppmurte postveien fra 1780-tallet nordover gjennom skogholter, over gamle steinbroer og kulturlandskap til Sætregården i Falkangervegen 235 i Hordvik. Stien opp mot Veten går også ut fra gården. Perfekt med barnevogn, sykkel eller rolig søndagsgange i le for vinden.',
    descriptionEn:
      'Walk the historic 18th-century stone-lined Royal Post Road through Åsane starting at Steinhellebrua at Saurås behind IKEA Åsane toward Sætregården in Hordvik. Traffic-free, stroller-accessible gravel path over historic stone bridges.',
    locationName: 'Steinhellebrua på Saurås (bak IKEA Åsane) til Hordvik',
    locationNameEn: 'Steinhellebrua at Saurås to Hordvik, Åsane',
    city: 'Bergen',
    coordinates: { lat: 60.4825, lng: 5.3318 },
    isOutdoor: true,
    durationMinutes: 95,
    targetAgeMin: 0,
    strollerAccessible: true,
    sourceUrl: 'https://www.bergen.kommune.no/hvaskjer/tema/friluftsliv/turer-og-turveier/den-trondhjemske-postvei',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 28000,
    stopKind: 'free',
    sunPointId: 'saetregaarden',
    trail: {
      type: 'forest_trail',
      difficulty: 'green',
      distanceKm: 5.2,
      elevationMeters: 95,
      surface: 'Historisk grusvei og steinhvelvsbroer (vognvennlig)',
      trailMarking: 'Historiske postveiskilt fra Steinhellebrua gjennom Åsane',
    },
    seniorSafety: {
      surface: 'firm_gravel',
      benchDensity: 'occasional',
      hasPublicRestroom: false,
      parkingDistanceMeters: 100,
      shelteredSunCorner: true,
    },
    checkinTarget: {
      badgeName: 'Postveien i Åsane 🌲',
      solarBonusLux: 25000,
      radiusMeters: 400,
    },
  },
  {
    id: 'act-saetregaarden-hordvik',
    title: 'Sætregården i Åsane — Åpen gård på Postveien & kos med kaniner',
    titleEn: 'Sætregården — Open Farm on the Post Road & Cuddle with Rabbits',
    category: 'family',
    description:
      'Start ved Steinhellebrua på Saurås bak IKEA Åsane og gå starten av Den trondhjemske postvei til Sætregården i Falkangervegen 235 i Hordvik (ikke Øvre-Eide i Eidsvåg). Stien opp mot Veten går også ut fra gården. Sætregården er besøksgård, ikke en restaurant med bordbestilling. Søndager klokken 12–16 i vårsesongen og høstsesongen er det åpen gård uten påmelding: kose med kaniner og dyr, kaffe og vafler i varmestuen, og en kort tur på hest. Teksten deres sier fortsatt at søndagene er sommerstengt, så les siden samme dag. Utenfor disse søndagene avtales besøk og ridetime.',
    descriptionEn:
      'Start at Steinhellebrua behind IKEA Åsane and walk the beginning of the old Trondheim post road to Sætregården at Falkangervegen 235 in Hordvik, not Øvre-Eide. The trail up to Veten also starts from the farm. Visiting farm with open Sundays 12–16 in spring and autumn seasons: cuddle with rabbits and animals, coffee and waffles in the warm room, and pony rides. Outside those Sundays visits and riding lessons are by appointment.',
    locationName: 'Falkangervegen 235, 5108 Hordvik (Åsane)',
    locationNameEn: 'Falkangervegen 235, 5108 Hordvik (Åsane)',
    city: 'Bergen',
    coordinates: { lat: 60.5035909, lng: 5.3021345 },
    isOutdoor: true,
    durationMinutes: 120,
    targetAgeMin: 0,
    strollerAccessible: true,
    sourceUrl: 'https://www.saetregaarden.no/besoksgaard/',
    imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 26000,
    stopKind: 'sunday-dropin',
    sunPointId: 'saetregaarden',
    trail: {
      type: 'forest_trail',
      difficulty: 'green',
      distanceKm: 3.4,
      elevationMeters: 65,
      surface: 'Grusvei langs Den trondhjemske postvei til gårdstunet',
      trailMarking: 'Skiltet fra Steinhellebrua / Postveien til Hordvik',
    },
    checkinTarget: {
      badgeName: 'Kaninkos på Sætregården 🐇',
      solarBonusLux: 24000,
      radiusMeters: 300,
    },
  },
  {
    id: 'act-veten-asane-bergen',
    title: 'Veten i Åsane (486 moh.) — Åsanes tak fra Saurås',
    titleEn: 'Mount Veten in Åsane (486m) — Sunset Viewpoint',
    category: 'hike',
    description:
      'Åsanes høyeste og mest populære fjelltopp! Turen fra Saurås / Trondhjemsveien går på tydelig sti og klopper opp til den store varden på 486 moh. Her oppe har du fri horisont i alle himmelretninger — fra Folgefonna i sør til Øygarden og havet i vest, noe som gir kveldssol helt til solen går ned i Nordsjøen.',
    descriptionEn:
      'The highest peak in Åsane (486m). Well-marked trail from Saurås up to the summit cairn with 360-degree views of the coast, fjords and evening sun.',
    locationName: 'Saurås til Veten, Åsane',
    locationNameEn: 'Saurås to Veten, Åsane',
    city: 'Bergen',
    coordinates: { lat: 60.4968, lng: 5.3249 },
    isOutdoor: true,
    durationMinutes: 120,
    targetAgeMin: 4,
    strollerAccessible: false,
    sourceUrl: 'https://ut.no/turforslag/115063/veten-i-asane',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 39000,
    stopKind: 'free',
    trail: {
      type: 'mountain_hike',
      difficulty: 'blue',
      distanceKm: 5.6,
      elevationMeters: 370,
      surface: 'Skogssti, klopper og fast fjell',
      trailMarking: 'Skiltet tursti til Veten i Åsane',
    },
    checkinTarget: {
      badgeName: 'Veten i Åsane 486 moh. ☀️',
      solarBonusLux: 35000,
      radiusMeters: 300,
    },
  },
  {
    id: 'act-geitanuken-asane-bergen',
    title: 'Geitanuken (304 moh.) & Myrdalsvatnet i Åsane',
    titleEn: 'Geitanuken (304m) & Myrdalsvatnet in Åsane',
    category: 'hike',
    description:
      'En herlig og lettgått familietur midt i Åsane! Kombiner en runde rundt idylliske Myrdalsvatnet (tilrettelagt for barnevogn og rullestol) eller følg grusveien og stien fra Ulset opp til toppen av Geitanuken med flott utsikt over hele Åsane, Byfjorden og inn mot Bergen sentrum.',
    descriptionEn:
      'Easy family hike in central Åsane. Combine the stroller-friendly loop around Myrdalsvatnet lake with the short climb to Geitanuken (304m) overlooking Åsane and Byfjorden.',
    locationName: 'Myrdalsvatnet / Ulset, Åsane',
    locationNameEn: 'Myrdalsvatnet / Ulset, Åsane',
    city: 'Bergen',
    coordinates: { lat: 60.4561, lng: 5.3189 },
    isOutdoor: true,
    durationMinutes: 75,
    targetAgeMin: 0,
    strollerAccessible: true,
    sourceUrl: 'https://ut.no/turforslag/1110114/geitanuken-i-asane',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 31000,
    stopKind: 'free',
    trail: {
      type: 'mountain_hike',
      difficulty: 'green',
      distanceKm: 3.8,
      elevationMeters: 180,
      surface: 'Fast grusvei rundt vannet + enkel skogssti til toppen',
      trailMarking: 'Skiltet fra Myrdalsvatnet / Ulset',
    },
    checkinTarget: {
      badgeName: 'Geitanuken i Åsane 🌲',
      solarBonusLux: 25000,
      radiusMeters: 300,
    },
  },
  {
    id: 'act-alpakkaparken-holsnoy',
    title: 'Alpakkaparken på Holsnøy (Nord for Åsane)',
    titleEn: 'Alpakkaparken on Holsnøy',
    category: 'family',
    description:
      'Familiepark i Alver, omtrent 30 minutter nord for Åsane over Nordhordlandsbrua mot Frekhaug, deretter skilt ved Landsvik. Buss 300E og deretter 310. Billettsiden skriver Landsvik 4. Andre sider skriver Landsvik 6. Nålen står på Landsvik 4, som er adressen kartet fant. Dagsbillett kjøpes i parken, ikke her. Engelsk side: 399 kr for 2–67 år og 265 kr fra 67 år. Norsk billettside: 399 kr for 2–66 år og 265 kr fra 67 år. Under 2 år er gratis. Sesongen 2026 på siden deres er 2. april–6. september. Utenom høysommeren lørdag og søndag. 28. juni–16. august tirsdag til søndag, stengt mandag. Stengt 1. og 17. mai. De selger sesongbillett for 2027. Åpningsdager for 2027 er ikke lagt ut. Dette er ikke alpakkavandringen på Solbakken i Os.',
    descriptionEn:
      'Family park in Alver, north of Åsane across the Nordhordland bridge toward Frekhaug, then signs at Landsvik. Bus 300E and then 310. The ticket page says Landsvik 4. Day tickets are bought in the park, not here. Under 2 is free. Their 2026 season is 2 April–6 September. This is not the guided alpaca walk at Solbakken in Os.',
    locationName: 'Landsvik 4, 5917 Rossland',
    locationNameEn: 'Landsvik 4, 5917 Rossland',
    city: 'Bergen',
    coordinates: { lat: 60.6027389, lng: 5.0491056 },
    isOutdoor: true,
    durationMinutes: 240,
    targetAgeMin: 0,
    strollerAccessible: false,
    sourceUrl: 'https://www.alpakkaparken.no/en/englishversion',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 28000,
    stopKind: 'ticket-on-site',
    sunPointId: 'alpakkaparken',
  },
  {
    id: 'act-nordnesparken-sol',
    title: 'Nordnesparken — gratis solnedgang på pynten',
    titleEn: 'Nordnesparken — free sunset at the point',
    category: 'nature',
    description:
      'Gratis tur i Nordnesparken, ytterst på pynten. Bergen kommune skriver at utsikten går over Byfjorden mot Laksevåg, Sotra, Askøy og nordover. Parken har ingen billett. Nordnes sjøbad er et annet kort, med egen billett, og er ikke denne turen. Klokken under regnes for dagen. Den er ikke lagret.',
    descriptionEn:
      'A free walk in Nordnesparken, at the outer point. Bergen municipality writes that the view goes across Byfjorden toward Laksevåg, Sotra, Askøy and north. The park has no ticket. Nordnes sjøbad is a different card, with its own ticket, and is not this walk. The clock below is calculated for the day. It is not stored.',
    locationName: 'Nordnesparken, ytterst på pynten',
    locationNameEn: 'Nordnesparken, at the outer point',
    city: 'Bergen',
    coordinates: { lat: 60.3989675, lng: 5.3025007 },
    isOutdoor: true,
    durationMinutes: 45,
    strollerAccessible: true,
    sourceUrl: 'https://www.bergen.kommune.no/hvaskjer/tema/badevann-og-parker/parker-og-byrom/bergenhus/nordnesparken',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 25000,
    stopKind: 'free',
    sunPointId: 'nordnesparken',
    viewAzimuthDeg: 270,
    viewLabel: 'vest over Byfjorden',
  },
  {
    id: 'act-gangvei-svanevik-solheimsvannet',
    title: 'Gangveien Svaneviksveien–Solheimsvannet',
    titleEn: 'The path from Svaneviksveien to Solheimsvannet',
    category: 'nature',
    description:
      'Gangveien har ikke et egennavn. Bergen kommune, kontrakt BME NOR 2023-12, skulle utbedre koblingen mellom Svaneviksveien og Solheimsvannet, med sluttfrist før 30. juni 2024. Bymiljøetaten skrev 23. august 2024 at gangveien, trappen, benkene og blomsterengen var på plass. Prosjektleder var Tord Magne Brudvik. Nålen står mellom de to kartpunktene. Dette er ikke sjøpromenaden ut mot sjøen, og ikke en promenade fra kaien i Solheimsviken til Minde. Ingen billett. Hvor sola treffer, regnes ut under. Vi har ikke lagret et klokkeslett, og ikke gjette hvilken side av fjellet som lyser.',
    descriptionEn:
      'The path has no proper name. Bergen municipality contract BME NOR 2023-12 was to upgrade the link between Svaneviksveien and Solheimsvannet, with a deadline before 30 June 2024. The city environment agency wrote on 23 August 2024 that the path, stairs, benches and flower meadow were in place. The project lead was Tord Magne Brudvik. The pin sits between the two map points. No ticket. Where the sun lands is calculated below.',
    locationName: 'Svaneviksveien til Solheimsvannet',
    locationNameEn: 'Svaneviksveien to Solheimsvannet',
    city: 'Bergen',
    coordinates: { lat: 60.3681821, lng: 5.3476255 },
    isOutdoor: true,
    durationMinutes: 30,
    strollerAccessible: false,
    sourceUrl:
      'https://www.mercell.com/en/tender/206294355/konkurranse-bme-nor-2023-12---solheimsvannet---svaneviksvegen--opparbeidelse-av-gangveg-tender.aspx',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 22000,
    stopKind: 'free',
    sunPointId: 'svanevik-solheimsvannet',
  },
  // ==========================================
  // EIDFJORD: GRATIS SAUNA HELT NEDE VED FJORDEN & HÆREID-TUREN
  // ==========================================
  {
    id: 'act-gratis-sauna-eidfjord',
    title: 'Gratis Badstue helt nede ved fjorden i Eidfjord',
    titleEn: 'Free Fjord Sauna right by the water in Eidfjord',
    category: 'nature',
    description:
      'Helt nede ved fjorden i Eidfjord ligger en gratis badstue der du kan varme deg etter fjellturen og ta et friskt bad i Hardangerfjorden (0 kr). Kombiner gjerne med en gåtur langs elva og fjorden eller middag på restauranten Sjel og Gane i Heggjagarden rett i nærheten.',
    descriptionEn:
      'Right down by the fjord in Eidfjord is a free sauna where hikers and visitors can warm up after a walk and take a refreshing dip in Hardangerfjorden (free).',
    locationName: 'Fjordkanten / Stranda i Eidfjord sentrum',
    locationNameEn: 'Waterfront in Central Eidfjord',
    city: 'Eidfjord',
    coordinates: { lat: 60.4676, lng: 7.0695 },
    isOutdoor: true,
    durationMinutes: 60,
    targetAgeMin: 0,
    strollerAccessible: true,
    sourceUrl: 'https://www.visiteidfjord.no',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 36000,
    stopKind: 'free',
    checkinTarget: {
      badgeName: 'Gratis Fjordbadstue Eidfjord 🔥🌊',
      solarBonusLux: 30000,
      radiusMeters: 200,
    },
  },
  {
    id: 'act-haereid-eidfjordvatnet',
    title: 'Hæreid Jernaldergravfelt, Eio-elva & Eidfjordvatnet Rundt',
    titleEn: 'Hæreid Iron Age Burial Terrace, Eio River & Lake Eidfjordvatnet',
    category: 'hike',
    description:
      'Solrik og familievennlig vandring fra Eidfjord sentrum langs lakseelva Eio opp på den mektige moreneterrassen Hæreid med 350 gravrøyser fra jernalderen og vidstrakt utsikt over fjorden og Eidfjordvatnet. Etter turen kan du gå rett ned til den gratis badstuen ved fjorden eller spise på Sjel og Gane.',
    descriptionEn:
      'Sunny and family-friendly walk from central Eidfjord along the Eio salmon river up to the Hæreid terrace with 350 Iron Age burial cairns and panoramic views over the fjord and Lake Eidfjordvatnet.',
    locationName: 'Eidfjord sentrum – Hæreid – Eidfjordvatnet',
    locationNameEn: 'Central Eidfjord – Hæreid – Eidfjordvatnet',
    city: 'Eidfjord',
    coordinates: { lat: 60.4622, lng: 7.0815 },
    isOutdoor: true,
    durationMinutes: 110,
    targetAgeMin: 0,
    strollerAccessible: true,
    sourceUrl: 'https://ut.no',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80',
    estimatedLux: 42000,
    stopKind: 'free',
    trail: {
      type: 'forest_trail',
      difficulty: 'green',
      distanceKm: 5.5,
      elevationMeters: 110,
      surface: 'Turvei og grussti langs elva og på Hæreid-platået',
      trailMarking: 'Skiltet kultur- og tursti fra Eidfjord sentrum',
    },
    checkinTarget: {
      badgeName: 'Hæreid Solvandrer ☀️🏔️',
      solarBonusLux: 35000,
      radiusMeters: 300,
    },
  },
];

export function liveStopNote(activityId: string, now: Date): string | null {
  if (activityId !== 'act-alpakkaparken-holsnoy') return null;
  const key = osloDateKey(now);
  if (key > '2026-09-06') {
    return 'Sesongen 2026 på siden deres varte til 6. september. Åpningsdager for 2027 er ikke lagt ut.';
  }
  if (key < '2026-04-02') {
    return 'Sesongen 2026 på siden deres starter 2. april.';
  }
  return 'Datoen ligger i sesongen 2026. Sjekk hvilken ukedag siden deres sier er åpen. Stengt 1. og 17. mai.';
}

export function turNoteForStop(activityId: string): string | undefined {
  if (activityId === 'act-vikinghytten-hjortland-asane') {
    return 'Fra Hjortland opp Rimmaskaret til Vikinghytten på Vardegga (590 moh.). Ta med termos og niste!';
  }
  if (activityId === 'act-postveien-asane-bergen') {
    return 'Den trondhjemske postvei fra Steinhellebrua på Saurås bak IKEA Åsane til Sætregården i Falkangervegen 235 i Hordvik.';
  }
  if (activityId === 'act-saetregaarden-hordvik') {
    return 'Sætregården (Falkangervegen 235, Hordvik). Åpen gård søndager kl. 12–16 i vår- og høstsesongen uten påmelding: dyr/kaniner, kaffe og vafler i varmestuen. Utenfor søndagene etter avtale.';
  }
  if (activityId === 'act-alpakkaparken-holsnoy') {
    return 'Alpakkaparken på Holsnøy. Dagsbillett kjøpes i parken den dagen siden deres sier de har åpent.';
  }
  if (activityId === 'act-nordnesparken-sol') {
    return 'Nordnesparken, ytterst på pynten. Ingen billett. Klokken står på kortet og regnes for dagen.';
  }
  if (activityId === 'act-gangvei-svanevik-solheimsvannet') {
    return 'Gangveien Svaneviksveien–Solheimsvannet. Ingen billett.';
  }
  if (activityId === 'act-gratis-sauna-eidfjord') {
    return 'Gratis badstue helt nede ved fjorden i Eidfjord (0 kr). Kan kombineres med restauranten Sjel og Gane i Heggjagarden.';
  }
  if (activityId === 'act-haereid-eidfjordvatnet') {
    return 'Tur fra Eidfjord sentrum langs Eio opp til Hæreid-terrassen, med mulighet for gratis badstue ved fjorden og mat på Sjel og Gane.';
  }
  return undefined;
}
