/**
 * Utaktiv Askeladden Motor
 * 
 * 1. Askeladd-sekken («Jeg fant, jeg fant!»): Barn samler rare dingser på stien som blir nyttige verktøy.
 * 2. 12 Måneder = 12 Asbjørnsen & Moe eventyr med månedlige premier frem mot juli-finalen (Tinydome 95 000 kr).
 * 3. 10 Snakkende Dyr med unike personligheter, lydfrekvenser og dialoger.
 * 4. Familiepotten & Enhetsøkonomi:
 *    - Maks 15 mynter sanket på stien per familietur.
 *    - 30 kr fullføringsbonus til Familiepotten ved fullført eventyr.
 *    - Maksimal gevinst = 45 kr per tur (1 Sol-poeng = 1 NOK).
 */

import { creditEarnedLocal } from './pointsLedger';

export const MAX_TRAIL_COINS_PER_HIKE = 15;
export const ADVENTURE_COMPLETION_BONUS_NOK = 30;
export const MAX_TOTAL_HIKE_PAYOUT = 45;

const STORAGE_PREFIX = 'utaktiv_askeladd_';

export interface AskeladdItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  askeladdCatchphrase: string;
  practicalUse: string;
  foundLocation: string;
}

export const ASKELADD_ITEMS: AskeladdItem[] = [
  {
    id: 'tung_elvestein',
    name: 'Tung elvestein',
    icon: '🪨',
    description: 'En flat, mosekledd elvestein slipt rund av fossende fjellvann.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «En stein så tung at den kan veie opp trollets vektskål!»',
    practicalUse: 'Balanserer trollets vektskål eller kastes flyndre med i Skomakerdiket.',
    foundLocation: 'Langs bekken mot Skomakerstuen'
  },
  {
    id: 'krokete_einerkvist',
    name: 'Krokete einerkvist',
    icon: '🌿',
    description: 'En vridd einerkvist som dufter frisk vestlandsnatur og ramsalt fjelluft.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «En krokete einerkvist som jager vekk tussene i skuggen!»',
    practicalUse: 'Fungerer som spak i den hemmelige porten og holder mørkeredde tanker unna.',
    foundLocation: 'Under furutrærne på Tippetue'
  },
  {
    id: 'ravnefjaer',
    name: 'Glinsende ravnefjær',
    icon: '🪶',
    description: 'En kullsvart fjær fra ravnen på fjellet, med et blålig skimmer i sollyset.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «En fjær som peker nøyaktig dit vinden blåser!»',
    practicalUse: 'Viser vindretningen for Sol-Astrolabiet og avdekker usynlige symboler.',
    foundLocation: 'Ved utsikten over Byfjorden'
  },
  {
    id: 'krystallflis',
    name: 'Gyllen krystallflis',
    icon: '✨',
    description: 'En liten flis av ekte bergkrystall som gløder når solstrålene treffer den.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «En krystallbit som fanger dagslyset selv på en regnværsdag!»',
    practicalUse: 'Retter solstrålen mot det mørkeste hjørnet av trollhulen.',
    foundLocation: 'I fjellsprekken ved Sandviksbatteriet'
  },
  {
    id: 'rusten_spiker',
    name: 'Gammel smidd spiker',
    icon: '🗝️',
    description: 'En håndsmidd jernspiker fra gamle dager, bøyd i en lur vinkel.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «En gammel spiker som passer i nøkkelhullet!»',
    practicalUse: 'Dirker opp den rustne hengelåsen på den glemte skattekisten.',
    foundLocation: 'Under steinhellen ved Ulriken'
  },
  {
    id: 'magisk_kongle',
    name: 'Tre-takket furukongle',
    icon: '🌰',
    description: 'En lukket kongle med nøyaktig tre spisser som åpner seg i tørr solskinnsvarme.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «En furukongle som avslører kodemønsteret i trærne!»',
    practicalUse: 'Avslører hemmelige tallkoder i furubarken.',
    foundLocation: 'Trollskogen på Fløyen'
  },
  {
    id: 'seljefloyte',
    name: 'Liten seljefløyte',
    icon: '🪵',
    description: 'Skåret i ferskt seljetre med et rent og klart plystrehull.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «En seljefløyte som kan kalle på skogsfuglene!»',
    practicalUse: 'Vekker sovende skogsdyr og kaller på ekornet i trekronene.',
    foundLocation: 'Langs stien mot Skansemyren'
  },
  {
    id: 'notteskall',
    name: 'Tomt hasselnøtteskall',
    icon: '🥣',
    description: 'Et rent delt nøtteskall som en gang har vært et lite skogsmåltid.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «Et lite drikkebeger til skogsfeene og kildens klare vann!»',
    practicalUse: 'Henter opp magiske vanndråper fra Skomakerdiket.',
    foundLocation: 'I hasselkrattet ved Svartediket'
  },
  {
    id: 'bjorkenever',
    name: 'Rull med bjørkenever',
    icon: '📜',
    description: 'Kritt-hvit never fra en gammel fjellbjørk, glatt som ekte pergament.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «Et kartpapir man kan risse hemmelige runer på!»',
    practicalUse: 'Gir familien et sted å tegne opp sporene fra de 10 dyrene.',
    foundLocation: 'Bjørkelunden på Vidden'
  },
  {
    id: 'ulltrad',
    name: 'Gullspunnet ulltråd',
    icon: '🧵',
    description: 'En tråd av ren saueull spunnet sammen med gylne hårstrå fra en eventyrprinsesse.',
    askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «En tråd som knyter sammen to ledetråder og reparerer sekken!»',
    practicalUse: 'Binder sammen ledetrådene slik at kodelåsen klikker i lås.',
    foundLocation: 'Ved sauegjerdet på Fløyen'
  }
];

export interface MonthAdventure {
  monthIndex: number; // 0 = Jan, 11 = Des
  monthName: string;
  fairyTaleTitle: string;
  themeDescription: string;
  locationSuggestion: string;
  monthlyPrize: string;
  isGrandFinale?: boolean;
}

export const FAIRY_TALES_12_MONTHS: MonthAdventure[] = [
  {
    monthIndex: 0,
    monthName: 'Januar',
    fairyTaleTitle: 'Soria Moria Slott',
    themeDescription: 'Jakten på årets første dagslys over fjerne fjelltopper i nysnøen.',
    locationSuggestion: 'Fløyen til Skomakerdiket',
    monthlyPrize: 'Vinterbål-sett i emalje & turbok'
  },
  {
    monthIndex: 1,
    monthName: 'Februar',
    fairyTaleTitle: 'Pannekaken',
    themeDescription: '«Trill i vei!» — Full fart i akebakken og jakt på de raskeste sporene i snøen.',
    locationSuggestion: 'Ake- og turløypene på Skansemyren',
    monthlyPrize: 'Tur-vaffeljern for primus & kakao-termos'
  },
  {
    monthIndex: 2,
    monthName: 'Mars',
    fairyTaleTitle: 'De tre bukkene Bruse',
    themeDescription: 'Vårflom i bekkene! Familien må krysse tre broer uten å vekke trollet.',
    locationSuggestion: 'Trollskogen og tømmerbroene ved Skomakerdiket',
    monthlyPrize: 'DNT-familieovernatting på hytte i Byfjellene'
  },
  {
    monthIndex: 3,
    monthName: 'April',
    fairyTaleTitle: 'Smørbukk',
    themeDescription: 'Vårsprett og oppfinnsomhet i skogen. Barnet lurer trollet med dingser fra sekken.',
    locationSuggestion: 'Høyt & Lavt Klatrepark Nesttun',
    monthlyPrize: 'Familie-klatrepass hos Høyt & Lavt'
  },
  {
    monthIndex: 4,
    monthName: 'Mai',
    fairyTaleTitle: 'Askeladden og de gode hjelperne',
    themeDescription: 'Skipet som går like godt til lands som til vanns. Samarbeid og fellesskapsånd.',
    locationSuggestion: 'Vågen, Sandviksbatteriet og kyststien',
    monthlyPrize: 'Fjordkajakk-opplevelse for hele familien'
  },
  {
    monthIndex: 5,
    monthName: 'Juni',
    fairyTaleTitle: 'Kvitebjørn kong Valemon',
    themeDescription: 'Lyse sommernetter, blomstrende lyng og den stolte bjørnen som vokter fjellplatået.',
    locationSuggestion: 'Ulriken 643 topp-platået',
    monthlyPrize: 'Fjellstuehelg med lokal mat for familien'
  },
  {
    monthIndex: 6,
    monthName: 'Juli',
    fairyTaleTitle: 'Gullslottet i luften (Tinydome Spacecapsule Finalen)',
    themeDescription: 'Den store sommerfinalen! Jakten på romkapselen i Hardanger og stjernene over Eidfjord.',
    locationSuggestion: 'Eidfjord / Hardanger & Byfjellene',
    monthlyPrize: '1/12 Eierandel i Tinydome Spacecapsule (verdi: 95 000 kr på tinydome.no)',
    isGrandFinale: true
  },
  {
    monthIndex: 7,
    monthName: 'August',
    fairyTaleTitle: 'Prinsessen som ingen kunne målbinde',
    themeDescription: 'Sensommer og raringene Askeladden finner langs veien: skjæra, skosålen og spikeren.',
    locationSuggestion: 'Tippetue og Fløysvingene',
    monthlyPrize: 'Forskerfabrikkens store utendørssett'
  },
  {
    monthIndex: 8,
    monthName: 'September',
    fairyTaleTitle: 'Risen som ikke hadde noe hjerte på seg',
    themeDescription: 'Bærsanking, høstgule bjørketrær og mysteriet om det gjemte hjertet i berget.',
    locationSuggestion: 'Svartediket til Tarlebøvatnet',
    monthlyPrize: 'Bærplukker- og soppsankesett i håndlaget tre'
  },
  {
    monthIndex: 9,
    monthName: 'Oktober',
    fairyTaleTitle: 'Østenfor sol og vestenfor måne',
    themeDescription: 'Mørketid og hodelyktturer. Nordavinden leder familien frem mot stjernene.',
    locationSuggestion: 'Vidden mellom Ulriken og Fløyen',
    monthlyPrize: 'Kraftig hodelykt- og stjernekikkersett'
  },
  {
    monthIndex: 10,
    monthName: 'November',
    fairyTaleTitle: 'Askeladden som kappåt med trollet',
    themeDescription: 'Høstkvelder, skodde over fjellet, skinnsekk på magen og varm havregrøt på primus.',
    locationSuggestion: 'Skomakerstuen og Byfjellene',
    monthlyPrize: 'Fjordbadstue for hele familien + stormkjøkken'
  },
  {
    monthIndex: 11,
    monthName: 'Desember',
    fairyTaleTitle: 'Kari Trestakk / Nissen i berget',
    themeDescription: 'Vintersolverv, julelys i skogen og letingen etter nissehulen under fjellknausen.',
    locationSuggestion: 'Fløibanen og Trollskogen',
    monthlyPrize: 'Julenatt-opplevelse med kanefart i fjellet'
  }
];

export interface TalkingAnimal {
  id: string;
  name: string;
  species: string;
  icon: string;
  locationHint: string;
  personality: string;
  greeting: string;
  riddlePrompt: string;
  requiredItem?: string;
  rewardHint: string;
  audioToneHz: number;
}

export const TALKING_ANIMALS: TalkingAnimal[] = [
  {
    id: 'mikkel_rev',
    name: 'Mikkel Rev',
    species: 'Rødrev',
    icon: '🦊',
    locationHint: 'Langs stien mot Fløysvingene',
    personality: 'Lur, sulten og elsker gode gåter. Snuser nysgjerrig på sekken til barna.',
    greeting: '«Heisann turgåer! Har du noe godt i sekken, eller kanskje en finurlig dings jeg kan lukte på?»',
    riddlePrompt: '«Hva har tre spisser, kaster gyllent solskinn og visner aldri i et barnehjerte?»',
    requiredItem: 'krokete_einerkvist',
    rewardHint: 'Mikkel hvisker: «Følg lukten av fersk einer mot Skomakerstuen, der ligger neste skattemynt!»',
    audioToneHz: 659.25 // E5
  },
  {
    id: 'ulvhedin_ugle',
    name: 'Ulvhedin Ugle',
    species: 'Hubro / Kattugle',
    icon: '🦉',
    locationHint: 'Høyt oppe i den gamle furua på Tippetue',
    personality: 'Vis, taler i rolige rim og krever at barn og voksne lytter sammen.',
    greeting: '«Hu-huu... Dagslyset svinner, men barnets øye ser det den voksne går rett forbi.»',
    riddlePrompt: '«Lukk øynene i 5 sekunder sammen med pappa. Hvilken lyd kom fra trekronen?»',
    requiredItem: 'ravnefjaer',
    rewardHint: 'Ulvhedin nikker: «Fjæren du holder peker rett mot vestavinden over Byfjorden.»',
    audioToneHz: 440.0 // A4
  },
  {
    id: 'notteliten_ekorn',
    name: 'Nøtteliten Ekorn',
    species: 'Ekorn',
    icon: '🐿️',
    locationHint: 'Spretter mellom grantrærne i Trollskogen',
    personality: 'Rask, vimsete og elsker kongler og nøtter. Har alltid dårlig tid.',
    greeting: '«Smett, hopp og sprett! Pappa, du er for treig! Barnet, kan du hjelpe meg å finne en kongle?»',
    riddlePrompt: '«Hvor mange kongler må til for å veie opp en ekorn-lunsj? Finn en med 3 spisser!»',
    requiredItem: 'magisk_kongle',
    rewardHint: 'Nøtteliten kvitrer: «Takk! Nå skal jeg vise deg hvor Solkrystallen gløder under mosen!»',
    audioToneHz: 880.0 // A5
  },
  {
    id: 'pinnsvinet_pigg',
    name: 'Pinnsvinet Pigg',
    species: 'Pinnsvin',
    icon: '🦔',
    locationHint: 'Under einerbusken ved Skansemyren',
    personality: 'Forsiktig og litt sjenert filosof. Ruller seg sammen hvis man tramper tungt.',
    greeting: '«Pssst... Ikke tramp så hardt med fjellskoene! Pust rolig inn gjennom nesen, så tør jeg stikke snuten ut.»',
    riddlePrompt: '«Klarer hele familien å stå musestille i 10 sekunder uten å le?»',
    requiredItem: 'notteskall',
    rewardHint: 'Pigg smiler: «Her har du en glitrende Sol-mynt som jeg fant under røttene!»',
    audioToneHz: 523.25 // C5
  },
  {
    id: 'kongeornen_audun',
    name: 'Kongeørnen Audun',
    species: 'Kongeørn',
    icon: '🦅',
    locationHint: 'Svever over toppen av Ulriken (643 moh.)',
    personality: 'Majestetisk, overblikkende og kjenner alle vinder og skyer over Bergen.',
    greeting: '«Fra denne toppen ser jeg helt til Nordsjøen. Er familien klar til å bestige fjellet?»',
    riddlePrompt: '«Hvilken topp peker Sol-Astrolabiet mot når himmelen åpner seg bak skydekket?»',
    requiredItem: 'krystallflis',
    rewardHint: 'Audun slår med vingene: «Krystallen din leder dagslyset ned til Hæreid og Tinydome i Hardanger!»',
    audioToneHz: 783.99 // G5
  },
  {
    id: 'trollfrosken',
    name: 'Trollfrosken i Skomakerdiket',
    species: 'Frosk',
    icon: '🐸',
    locationHint: 'I sivet ved vannkanten av Skomakerdiket',
    personality: 'Kvekker mystiske rim fra vannkanten, elsker plask og friskt regnvann.',
    greeting: '«Kvekk! Vannet er speilet til himmelen. Hvem tør å kaste en flat elvestein uti?»',
    riddlePrompt: '«Kast elvesteinen så den spretter to ganger. Hvor mange ringer dannes i vannet?»',
    requiredItem: 'tung_elvestein',
    rewardHint: 'Frosken dukker og etterlater en glødende nøkkel på vannliljen!',
    audioToneHz: 392.0 // G4
  },
  {
    id: 'hjorten_silkesvarten',
    name: 'Fjellhjorten Silkesvarten',
    species: 'Kronhjort',
    icon: '🦌',
    locationHint: 'Mellom bjørketrærne på Vidden',
    personality: 'Sky og staselig konge over skogen. Lærer familien å liste seg stille.',
    greeting: '«Jeg hører hjerteslagene deres før dere ser geviret mitt. Velkommen til skogens stillhet.»',
    riddlePrompt: '«Hvor mange hjortespor ser dere i den myke mosen langs stien?»',
    requiredItem: 'bjorkenever',
    rewardHint: 'Silkesvarten bukker: «Runene dere tegnet på neveren åpner trollets hemmelige gjemmested.»',
    audioToneHz: 329.63 // E4
  },
  {
    id: 'bamse_brakar',
    name: 'Bamse Brakar',
    species: 'Brunbjørn',
    icon: '🐻',
    locationHint: 'Under den store steinura ved Tarlebøvatnet',
    personality: 'Brummende, godmodig kjempe som sover tungt og trenger hjelp til å rulle en stein.',
    greeting: '«Brummm... Hvem vekker meg fra formiddagsluren? Pappa, har du styrke til å hjelpe barnet?»',
    riddlePrompt: '«Finn en tung stein sammen og legg den på vektskålen for å balansere trollets gåte!»',
    requiredItem: 'tung_elvestein',
    rewardHint: 'Bamse brummer fornøyd: «Takk for hjelpen, småtroll! Nå sover jeg godt frem til våren.»',
    audioToneHz: 220.0 // A3
  },
  {
    id: 'tyve_skjaere',
    name: 'Skjæra Tyve-Guri',
    species: 'Skjære',
    icon: '🐦',
    locationHint: 'I bjørketoppen ved Skansen',
    personality: 'Kjapp i replikken og samler på alt som glitrer. Har en Sol-mynt i nebbet!',
    greeting: '«Sjakk-sjakk! Se hva jeg har! En blank Sol-mynt! Men hvis du gir meg noe spennende, bytter jeg gjerne!»',
    riddlePrompt: '«Hva er blankere enn sølv og lettere enn en fjær? Vis meg hva du har i sekken!»',
    requiredItem: 'rusten_spiker',
    rewardHint: 'Guri slipper Sol-mynten rett ned i Askeladd-sekken din med et fornøyd kvekk!',
    audioToneHz: 987.77 // B5
  },
  {
    id: 'fjellhunden_balder',
    name: 'Fjellhunden Balder',
    species: 'Norsk Elghund / Stifinner',
    icon: '🐕',
    locationHint: 'Løper foran familien på stien',
    personality: 'Glad, trofast og logrer entusiastisk hver gang familien løser et mysterium sammen.',
    greeting: '«Voff! Sniff, sniff! Jeg kjenner lukten av eventyr og nysteikte skillingsboller lenger fremme!»',
    riddlePrompt: '«Løp om kapp med meg de neste 20 meterne bort til den store furua!»',
    requiredItem: 'seljefloyte',
    rewardHint: 'Balder logrer vilt: «Fløyten din samlet hele flokken! Nå henter vi familiebonusen sammen!»',
    audioToneHz: 587.33 // D5
  }
];

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

// -------------------------------------------------------------
// ASKELADD-SEKKEN (INVENTORY)
// -------------------------------------------------------------

export function getAskeladdInventory(): string[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(`${STORAGE_PREFIX}inventory`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasAskeladdItem(itemId: string): boolean {
  return getAskeladdInventory().includes(itemId);
}

export function collectAskeladdItem(itemId: string): {
  success: boolean;
  item?: AskeladdItem;
  message: string;
} {
  const item = ASKELADD_ITEMS.find(i => i.id === itemId);
  if (!item) {
    return { success: false, message: 'Ukjent gjenstand' };
  }

  const current = getAskeladdInventory();
  if (current.includes(itemId)) {
    return {
      success: false,
      item,
      message: `Du har allerede lagt ${item.name} i Askeladd-sekken!`
    };
  }

  const next = [...current, itemId];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}inventory`, JSON.stringify(next));
  }

  return {
    success: true,
    item,
    message: item.askeladdCatchphrase
  };
}

export function resetAskeladdInventory(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(`${STORAGE_PREFIX}inventory`);
  }
}

// -------------------------------------------------------------
// 12 MÅNEDER ASBJØRNSEN & MOE
// -------------------------------------------------------------

export function getActiveMonthAdventure(monthIndex?: number): MonthAdventure {
  const currentMonth = monthIndex !== undefined ? monthIndex : new Date().getMonth();
  const safeIdx = Math.max(0, Math.min(11, currentMonth));
  return FAIRY_TALES_12_MONTHS[safeIdx];
}

// -------------------------------------------------------------
// FAMILIEPOTTEN & MYNTSANKING (MAKS 15 MYNTER + 30 KR BONUS)
// -------------------------------------------------------------

export function getTrailCoins(dateKey: string = getTodayKey()): number {
  if (typeof localStorage === 'undefined') return 0;
  const raw = localStorage.getItem(`${STORAGE_PREFIX}trail_coins_${dateKey}`);
  return parseInt(raw || '0', 10);
}

export function addTrailCoin(
  amount: number = 1,
  dateKey: string = getTodayKey()
): { added: number; current: number; maxReached: boolean } {
  const current = getTrailCoins(dateKey);
  const remaining = Math.max(0, MAX_TRAIL_COINS_PER_HIKE - current);
  const toAdd = Math.min(Math.max(0, amount), remaining);

  const next = current + toAdd;
  if (typeof localStorage !== 'undefined' && toAdd > 0) {
    localStorage.setItem(`${STORAGE_PREFIX}trail_coins_${dateKey}`, next.toString());

    // Krediter ledger
    try {
      creditEarnedLocal({
        points: toAdd,
        reason: 'checkin',
        idempotencyKey: `trail-coin-${dateKey}-${next}`
      });
    } catch {
      // Test fallback
    }
  }

  return {
    added: toAdd,
    current: next,
    maxReached: next >= MAX_TRAIL_COINS_PER_HIKE
  };
}

export function hasClaimedAdventureBonus(
  adventureId: string,
  dateKey: string = getTodayKey()
): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(`${STORAGE_PREFIX}bonus_${adventureId}_${dateKey}`) === 'true';
}

export function claimAdventureBonus(
  adventureId: string,
  dateKey: string = getTodayKey()
): { success: boolean; bonusAdded: number; message: string } {
  if (hasClaimedAdventureBonus(adventureId, dateKey)) {
    return {
      success: false,
      bonusAdded: 0,
      message: 'Familien har allerede mottatt fullføringsbonusen for dette eventyret i dag!'
    };
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}bonus_${adventureId}_${dateKey}`, 'true');

    // Krediter Familiepotten i ledger med 30 kr (30 Sol-poeng)
    try {
      creditEarnedLocal({
        points: ADVENTURE_COMPLETION_BONUS_NOK,
        reason: 'checkin',
        idempotencyKey: `adventure-bonus-${adventureId}-${dateKey}`
      });
    } catch {
      // Test fallback
    }
  }

  return {
    success: true,
    bonusAdded: ADVENTURE_COMPLETION_BONUS_NOK,
    message: `Hurra! ${ADVENTURE_COMPLETION_BONUS_NOK} kr er lagt til i Familiepotten for fullført eventyr!`
  };
}

export function getFamilyPotSummary(dateKey: string = getTodayKey()): {
  trailCoins: number;
  maxTrailCoins: number;
  hasCompletionBonus: boolean;
  completionBonusNok: number;
  totalHikeNok: number;
  maxPossibleHikeNok: number;
  inventoryCount: number;
} {
  const trailCoins = getTrailCoins(dateKey);
  const activeMonth = getActiveMonthAdventure();
  const bonusClaimed = hasClaimedAdventureBonus(`soljakten_mnd_${activeMonth.monthIndex}`, dateKey)
    || hasClaimedAdventureBonus('soljakten_reddet_lyset', dateKey);
  
  const completionBonusNok = bonusClaimed ? ADVENTURE_COMPLETION_BONUS_NOK : 0;
  const totalHikeNok = trailCoins + completionBonusNok;

  return {
    trailCoins,
    maxTrailCoins: MAX_TRAIL_COINS_PER_HIKE,
    hasCompletionBonus: bonusClaimed,
    completionBonusNok,
    totalHikeNok,
    maxPossibleHikeNok: MAX_TOTAL_HIKE_PAYOUT,
    inventoryCount: getAskeladdInventory().length
  };
}
