# Rapport: Domene-krav og Funksjonsinventar (R1, R2, R3)

**Prosjekt:** Utaktiv Soljakten og Skattejakten (Sol-Uteliv)  
**Dato:** 2026-10-27  
**Utført av:** Explorer Survey Agent 2 (`explorer_survey_2`)  
**Arbeidskatalog:** `/Users/alexr/Projects/Sol-Uteliv`  
**Referansedokument:** `.agents/teamwork/ORIGINAL_REQUEST.md`, `DEN-STORE-NORSKE-SKATTEJAKTEN-MASTERPLAN.md`, `alexander-app-architecture`

---

## 1. Sammendrag (Executive Summary)

En grundig kildekode- og testgjennomgang av `/Users/alexr/Projects/Sol-Uteliv` bekrefter at fundamentet for **R1 (Asymmetrisk familiesamarbeid & Askeladd-sekk)**, **R2 (10 snakkende fabeldyr & 12 måneders eventyrhjul)** og **R3 (Vanntett enhetsøkonomi & Familiepott)** allerede er implementert i en dedikert motormodul (`src/engine/askeladden.ts`), samarbeidsskjermen (`src/components/FamilieEventyrModal.tsx`) og AR-droppmotoren (`src/engine/arDrops.ts`). Alle **188 av 188 automatiserte tester over 25 testsuiter** passerer feilfritt med `vitest run`.

Kartleggingen avdekker imidlertid noen viktige nyanser, ulik modenhetsgrad og konkrete avvik mellom formelle krav og eksisterende kode:
1. **R1 (Asymmetri og fusjon):** Asymmetrisk rollefordeling (5-åringen som «Lys-speideren» og den voksne som «Kart-leseren») er ferdig kodet. Men felles berøringsfusjon i `FamilieEventyrModal.tsx` har en timer på 2,0 sekunder (i stedet for spesifiserte 3,0 sekunder) og sjekker ikke ekte maskinvare-multitouch (`e.touches.length >= 2`). Videre er modalen kun tilgjengelig via URL-parametere (`?eventyr=1`), og mangler en fast knapp i hovedmenyen.
2. **R2 (10 Dyr og 12 Måneder):** Nøyaktig 10 dyr med distinkte personligheter, offline dialoger og eksakte Web Audio-frekvenser (fra dype 220 Hz for Bamse Brakar til 987,77 Hz for Skjæra) er på plass. Årshjulet med 12 Asbjørnsen & Moe-eventyr er komplett spesifisert med månedspremier og juli-finale. Det interaktive flerstegs-spillet er likevel foreløpig kun skriptet for Måned 1 (Soljakten); måned 2–12 vises som kalender/rammeverk, men har ikke egne 3-stegs oppgaver.
3. **R3 (Enhetsøkonomi & Familiepott):** Taket på maks 15 mynter sanket på stien, 30 kr fullføringsbonus til Familiepotten (totalt maks 45 kr per tur) og deterministisk dato-lås er fullstendig implementert i `askeladden.ts`. 0 % saunarabatt og 100 % partnerfinansierte gaver (Fløistuen, Høyt & Lavt) er verifisert i koden. Eidfjord-finalen for 1/12 Tinydome Spacecapsule (95 000 kr) er integrert i AR-drops, eventyrkalender og Skattekisten. Enkelte eldre deler av koden (`NatureQuestModal`, eldre tester) bruker fremdeles `Date.now()` i idempotensnøklene sine.

---

## 2. Komplett Funksjonsinventar (Feature Inventory Table)

Statusdefinisjoner:
- **Implemented:** Kravet er fullstendig realisert i kode og verifisert med tester.
- **Partial:** Funksjonaliteten eksisterer, men har mindre avvik, mangler fullskala innhold, eller mangler full UI-kobling.
- **Missing:** Kravet mangler i kodebasen.

| # | Krav-element | Krav-ID | Kildekodefil & Linjer | Status | Observasjon & Teknisk Tilstand |
|---|---|---|---|---|---|
| 1 | **Asymmetrisk familiespill** (delt kunnskap) | R1 | `src/engine/familieEventyr.ts:1-29, 80-130`<br>`src/components/FamilieEventyrModal.tsx:416-489` | **Implemented** | Barn og voksen har adskilte oppgaver. Steg 1 tilhører barnet, Steg 2 krever barnets hemmelighet. Verifisert i `familieSpillflytFull.test.ts`. |
| 2 | **5-åringen som «Lys-speideren»** | R1 | `src/engine/familieEventyr.ts:66, 83-85`<br>`src/components/FamilieEventyrModal.tsx:151, 427` | **Implemented** | `roleName: 'Lys-speideren (Barnet)'`. Målgruppe 4–8 år. Tagline: «Mysteriet der femåringen er familiens helt». |
| 3 | **Askeladd-sekken («Jeg fant, jeg fant!»)** | R1 | `src/engine/askeladden.ts:31-122, 386-440`<br>`src/components/FamilieEventyrModal.tsx:589-646` | **Implemented** | 10 dingser med standard catchphrase «Jeg fant, jeg fant!». Egen fane i modalen med beholdning, duplikatbeskyttelse og lydeffekter. |
| 4 | **Naturgjenstander: Elvestein, einerkvist, krystallflis** | R1 | `src/engine/askeladden.ts:33-67, 248-379`<br>`src/components/FamilieEventyrModal.tsx:605-643` | **Implemented** (i sekk & dyr)<br>**Partial** (i Soljakten-steg 1) | `tung_elvestein`, `krokete_einerkvist` og `krystallflis` er definert med lokasjoner og kreves av dyrene. I selve `SOLJAKTEN_EVENTYR` Steg 1 er imidlertid oppgaven låst til `eikeblad`. |
| 5 | **Voksen må spørre barnet for å løse gåten** | R1 | `src/engine/familieEventyr.ts:103-108`<br>`src/components/FamilieEventyrModal.tsx:180-195` | **Implemented** | `requiresChildSecret: true`. Steg 2 instruerer eksplisitt: «Pappa kan ikke løse dette alene – han MÅ spørre Lys-speideren!». Feilklikk gir advarsel. |
| 6 | **Felles 3-sekunders berøringsfusjon** | R1 | `src/engine/familieEventyr.ts:118-129`<br>`src/components/FamilieEventyrModal.tsx:70-90, 492-527` | **Partial** | Hold-nede mekanikk med progressring og lyspulsering eksisterer, men timeren er 2,0 sek (20 x 100 ms) fremfor 3,0 sek, og multi-touch (`touches.length >= 2`) valideres ikke hardware-messig. |
| 7 | **Hovedmeny-aksess for Familieeventyret** | R1 | `src/App.tsx:186-190, 701-717, 1342-1354` | **Partial** | `FamilieEventyrModal` er montert i `App.tsx`, men kan kun åpnes via URL-parameter (`?eventyr=1` / `?familie=1`). Mangler fast knapp i `App.tsx` ved siden av Skattekisten. |
| 8 | **10 snakkende skogsdyr** | R2 | `src/engine/askeladden.ts:248-379`<br>`src/components/FamilieEventyrModal.tsx:648-730` | **Implemented** | Nøyaktig 10 dyr definert (Mikkel Rev, Hubro/Ugle, Ekorn, Pinnsvin, Kongeørn, Trollfrosk, Hjort, Bjørn, Skjære, Fjellhund). Verifisert i `askeladden.test.ts`. |
| 9 | **Distinkte personligheter & folketone** | R2 | `src/engine/askeladden.ts:248-379` | **Implemented** | Hvert dyr har særpreget norsk eventyrpersonlighet, hilsen, gåte og belønningshint. |
| 10 | **Spesifikke lydfrekvenser (Hz)** | R2 | `src/engine/askeladden.ts:260, 273, 286, 299, 312, 325, 338, 351, 364, 377`<br>`src/components/FamilieEventyrModal.tsx:217-236` | **Implemented** | Hvert dyr har en tildelt frekvens fra 220,00 Hz (A3) til 987,77 Hz (B5). Spilles av via Web Audio API uten eksterne filer. |
| 11 | **Offline dialoger** | R2 | `src/engine/askeladden.ts:248-379` | **Implemented** | 100 % offline. All tekst og Web Audio-syntese ligger lokalt i koden. Ingen nettverkskall eller API-avhengigheter. |
| 12 | **Tale-syntese / TTS for dyrestemmer** | R2 | `src/components/FamilieEventyrModal.tsx:217-236` | **Partial** | Lyd spilles som rene oscillator-toner (Web Audio). Det foreligger ikke innleste stemmefiler (MP3) eller Web Speech API tekstopplesing. |
| 13 | **12 måneders Asbjørnsen & Moe årshjul** | R2 | `src/engine/askeladden.ts:134-232, 446-451`<br>`src/components/FamilieEventyrModal.tsx:734-791` | **Implemented** (Kalender)<br>**Partial** (Spilloppgaver) | Alle 12 måneder har tittel, tema, stisted og månedspremie. Roterer automatisk etter måned. Måned 2–12 mangler egne interaktive 3-trinnsoppgaver. |
| 14 | **Maks 15 mynter sanket på stien per tur** | R3 | `src/engine/askeladden.ts:15, 456-491`<br>`src/engine/arDrops.ts:5, 344-348`<br>`src/components/FamilieEventyrModal.tsx:272-282, 321-337` | **Implemented** | Hard grense på 15 mynter per dato. Krediteres til ledger under eventCap (`checkin`). Verifisert i `askeladden.test.ts:107-127`. |
| 15 | **30 kr fullføringsbonus til Familiepotten** | R3 | `src/engine/askeladden.ts:16, 493-533`<br>`src/components/FamilieEventyrModal.tsx:212-214` | **Implemented** | 30 kr (30 poeng) tildeles én gang per dag for fullført eventyr. Verifisert i `askeladden.test.ts:129-143`. |
| 16 | **Maks 45 kr samlet utbetaling per tur** | R3 | `src/engine/askeladden.ts:17, 535-561`<br>`src/components/FamilieEventyrModal.tsx:328` | **Implemented** | `MAX_TOTAL_HIKE_PAYOUT = 45`. Familiepott-sammendrag summerer 15 + 30 = 45 kr. Verifisert i `askeladden.test.ts:145-160`. |
| 17 | **Deterministisk dato-låst idempotens** | R3 | `src/engine/askeladden.ts:479, 521`<br>`src/engine/arDrops.ts:371`<br>`src/App.tsx:1318, 1351` | **Implemented** (Kjernemotorer)<br>**Partial** (Legacy/tester) | Nøkler følger formatet `trail-coin-${dateKey}-${next}` og `adventure-bonus-${adventureId}-${dateKey}`. Avvik: `App.tsx:1363` (NatureQuest) og `familieSpillflytFull.test.ts:98` bruker ennå `Date.now()`. |
| 18 | **0 % saunarabatt & 35 kr provisjon** | R3 | `src/engine/activities.ts:447-448`<br>`src/components/EidfjordPartnerModal.tsx:406, 431`<br>`DEN-STORE-NORSKE-SKATTEJAKTEN-MASTERPLAN.md:251` | **Implemented** | Ordinære priser (Heit Bergen 225 kr, Heit Eidfjord 199 kr / 1000 kr). Utaktiv gir 0 % rabatt og tar 35 kr affiliate-provisjon. |
| 19 | **100 % partner-finansierte gaver (0 kr nettokostnad)** | R3 | `src/engine/arDrops.ts:9, 191-204, 231-243`<br>`src/components/SolCameraAR.tsx:285-300` | **Implemented** | Fløistuen Kafé (kaffepåfyll ved kjøp av bolle), Høyt & Lavt (klatrehansker ved klatrepass). 0 kr poengkostnad for Utaktiv. |
| 20 | **Eidfjord finale: 1/12 Tinydome Spacecapsule (95 000 kr)** | R3 | `src/engine/arDrops.ts:10, 48-55, 245-255`<br>`src/engine/askeladden.ts:184-191`<br>`src/components/FamilieEventyrModal.tsx:737-776`<br>`src/components/SkattekisteModal.tsx:141-160`<br>`src/components/EidfjordPartnerModal.tsx:1-100` | **Implemented** | Sommerfinale i juli for 1/12 eierandel i Tinydome Spacecapsule (95 000 kr). Lodd sankes i AR-motor. Eidfjord støttes fullt ut i Skattekisten og partner-modal. |

---

## 3. Detaljert Teknisk Analyse av Kravene

### R1. Asymmetrisk Familiesamarbeid og Askeladd-sekken

#### 3.1. Hva som eksisterer:
- **Pedagogisk modell:** `src/engine/familieEventyr.ts` definerer en 3-trinns spillflyt:
  1. *Steg 1 (Barnet / «Lys-speideren»):* Barnet ser etter et hemmelig natursymbol (f.eks. eikeblad med tre spisser).
  2. *Steg 2 (Den voksne / «Kart-leseren»):* Den voksne har fire mulige portnøkler, men vet ikke hvilket symbol barnet fant. Koden setter `requiresChildSecret: true`. Teksten formaner: *«Pappa kan ikke løse dette alene – han MÅ spørre Lys-speideren!»*.
  3. *Steg 3 (Hele familien sammen):* Felles berøringsfusjon for å tenne Solkrystallen.
- **Askeladd-sekken:** `src/engine/askeladden.ts` definerer 10 gjenstander i `ASKELADD_ITEMS`, inkludert:
  - `tung_elvestein` (🪨)
  - `krokete_einerkvist` (🌿)
  - `krystallflis` (✨)
  - Samt ravnefjær, smidd spiker, furukongle, seljefløyte, nøtteskall, bjørkenever og ulltråd.
  Hver gjenstand har en unik Askeladd-replikk: *«Jeg fant, jeg fant!» — «Hva fant du nå da?» — «En stein så tung at den kan veie opp trollets vektskål!»*.
- **UI-presentasjon:** `FamilieEventyrModal.tsx` har en dedikert fane (`askeladd`) med oversikt over samlede dingser, statusmerking («I sekken»), stedsbeskrivelse og knapp for å plukke opp.
- **Testdekning:** `src/test/askeladden.test.ts` (9 tester) og `src/test/familieSpillflytFull.test.ts` verifiserer hele mekanikken.

#### 3.2. Hva som mangler eller er ufullstendig:
1. **Holdetid for fusjon (2,0 sek vs 3,0 sek):**
   I `FamilieEventyrModal.tsx:74-83` økes progress med `+5` hvert 100. millisekund:
   $$\frac{100}{5} \times 100\text{ ms} = 2000\text{ ms} = 2,0\text{ sekunder}$$
   Kravet spesifiserer en «felles 3-sekunders berøringsfusjon». Dette bør justeres til 3000 ms (f.eks. `prev + 3.33` eller interval på 30 ms).
2. **Multi-touch maskinvarevalidering:**
   I `FamilieEventyrModal.tsx:498-499` utløses holdet av standard `onTouchStart` / `onMouseDown` uten å sjekke om to fingre faktisk berører skjermen (`e.touches.length >= 2`). På mobil kan man kreve ekte to-finger-berøring for maksimal pedagogisk effekt.
3. **Kobling mellom Askeladd-sekk og Soljakten Steg 1:**
   I dagens `SOLJAKTEN_EVENTYR` er barnets hemmelighet hardkodet til et `eikeblad` (`options: eikeblad, sopp, stein, kongle`). Det er ingen direkte sjekk av om barnet har plukket opp elvesteinen eller krystallflisen i sekk-fanen før de kan løse Steg 1.
4. **Mangler fast startknapp i hoved-UI:**
   I `App.tsx` åpnes `FamilieEventyrModal` utelukkende dersom URL inneholder `?eventyr=1`, `?familie=1` eller `?soljakten=1`. I motsetning til Skattekisten (som har en fast knapp under Hero-seksjonen) mangler Familieeventyret en fast knapp for barnefamilier.

---

### R2. 10 Snakkende Skogsdyr og Månedseventyr

#### 3.1. Hva som eksisterer:
- **10 Fabeldyr med distinkte frekvenser:**  
  I `src/engine/askeladden.ts:248-379` er alle 10 dyr implementert med presise frekvenser som dekker et harmonisk register:
  1. **Bamse Brakar** (Brunbjørn, 🐻) — **220.00 Hz** (A3, dyp brummende bjørnebass)
  2. **Fjellhjorten Silkesvarten** (Kronhjort, 🦌) — **329.63 Hz** (E4, rolig skogsresonans)
  3. **Trollfrosken** (Frosk, 🐸) — **392.00 Hz** (G4, kvekkende vannfrekvens)
  4. **Ulvhedin Ugle** (Hubro, 🦉) — **440.00 Hz** (A4, visdomskammertone)
  5. **Pinnsvinet Pigg** (Pinnsvin, 🦔) — **523.25 Hz** (C5, forsiktig piping)
  6. **Fjellhunden Balder** (Elghund, 🐕) — **587.33 Hz** (D5, energisk bjeffetone)
  7. **Mikkel Rev** (Rødrev, 🦊) — **659.25 Hz** (E5, lur lystone)
  8. **Kongeørnen Audun** (Kongeørn, 🦅) — **783.99 Hz** (G5, høy luftig overtoner)
  9. **Nøtteliten Ekorn** (Ekorn, 🐿️) — **880.00 Hz** (A5, sprettende oktav)
  10. **Skjæra Tyve-Guri** (Skjære, 🐦) — **987.77 Hz** (B5, skingrende skravletone)
- **Offline arkitektur:**  
  Alle dyrenes gåter, replikker, byttehandler mot sekk-gjenstander og Web Audio tone-syntese genereres 100 % lokalt i nettleseren via Web Audio API (`OscillatorNode` / `GainNode`). Ingen eksterne filer eller server-kall kreves.
- **Årshjul med 12 Asbjørnsen & Moe-eventyr:**  
  Tabellen `FAIRY_TALES_12_MONTHS` i `askeladden.ts` mapper hver måned til et eventyr:
  - *Januar:* Soria Moria Slott
  - *Februar:* Pannekaken
  - *Mars:* De tre bukkene Bruse
  - *April:* Smørbukk
  - *Mai:* Askeladden og de gode hjelperne
  - *Juni:* Kvitebjørn kong Valemon
  - *Juli:* Gullslottet i luften (Tinydome Spacecapsule Finalen, 95 000 kr)
  - *August:* Prinsessen som ingen kunne målbinde
  - *September:* Risen som ikke hadde noe hjerte på seg
  - *Oktober:* Østenfor sol og vestenfor måne
  - *November:* Askeladden som kappåt med trollet
  - *Desember:* Kari Trestakk / Nissen i berget
  `getActiveMonthAdventure()` velger automatisk gjeldende måned basert på `new Date().getMonth()`.

#### 3.2. Hva som mangler eller er ufullstendig:
1. **Kun Måned 1 er spillbar med oppgaver:**  
   `SOLJAKTEN_EVENTYR` i `familieEventyr.ts` representerer én spesifikk 3-stegs oppgave. De øvrige 11 månedene eksisterer som metadata, beskrivelser og premieløfter i kalenderfanen, men har ikke egne programmerte oppgaver eller interaktive valg.
2. **Dyrene mangler GPS-geofence på kartet:**  
   Dyrene har tekstlige stedsanvisninger (f.eks. «Langs stien mot Fløysvingene», «Toppen av Ulriken (643 moh.)»), men har ikke eksplisitte `lat`/`lng`-koordinater i datamodellen, og er ikke tegnet inn som interaktive markører på `InteractiveMap.tsx`.
3. **Tale / Spoken audio:**  
   Lyden er per nå en ren syntetisk tone (`playTone`). Det finnes ikke innlest stemmeskuespill eller Web Speech API TTS som leser opp dyrenes replikker.

---

### R3. Vanntett Enhetsøkonomi & Familiepott

#### 3.1. Hva som eksisterer:
- **Maks 15 mynter på stien:**  
  `MAX_TRAIL_COINS_PER_HIKE = 15` er kodet som en hard sperre i `askeladden.ts:456-491`. Funksjonen `addTrailCoin` avkorter ethvert forsøk på å overskride 15 mynter for samme dato.
- **30 kr fullføringsbonus til Familiepotten:**  
  `ADVENTURE_COMPLETION_BONUS_NOK = 30` tildeles når familien fullfører oppdraget via `claimAdventureBonus()`.
- **Maks 45 kr per tur:**  
  `MAX_TOTAL_HIKE_PAYOUT = 45`. `getFamilyPotSummary()` returnerer `totalHikeNok` ($15 + 30 = 45\text{ kr}$). Dette vises i statuslinjen i `FamilieEventyrModal.tsx`.
- **Deterministisk dato-lås:**  
  - For mynter: `idempotencyKey: 'trail-coin-${dateKey}-${next}'`
  - For fullføringsbonus: `idempotencyKey: 'adventure-bonus-${adventureId}-${dateKey}'`
  - For AR-drops: `idempotencyKey: 'ar-drop-${drop.id}-${today}'`
  - For Skattekisten i App.tsx: `idempotencyKey: 'skattekiste-${selectedCity}-${today}'`
  - For Familieeventyret i App.tsx: `idempotencyKey: 'familie-soljakten-${today}'`
  - Hvis familien forsøker å kreve bonusen to ganger samme dag, blokkeres det både i `localStorage` og via ledgerens idempotenssjekk.
- **0 % Saunarabatt:**  
  I `src/engine/activities.ts:447-448` har Heit Bergen Sauna ordinær pris (225 kr) og 35 kr provisjon. I `src/components/EidfjordPartnerModal.tsx:406, 431` koster enkeltbillett 199 kr og privat badstue 1 000 kr. Det gis 0 % rabatt.
- **100 % Partner-finansierte gaver:**  
  I `src/engine/arDrops.ts` gir partner-drops som Fløistuen Kafé (kaffepåfyll ved kjøp av bolle) og Høyt & Lavt (klatrehansker ved klatrepass) 0 poengs kostnad for Utaktiv (`pointsValue: 0`). Partnerne dekker gaven fullt ut for å drive mersalg.
- **Eidfjord Finale & Tinydome Spacecapsule (95 000 kr):**  
  - `GRAND_PRIZE_INFO` i `arDrops.ts:48-55` har tittel «1/12 Eierandel i Tinydome Spacecapsule», verdi 95 000 kr, sted «Eidfjord / Hæreid, Hardanger» og lenke til `tinydome.no`.
  - Drop `drop_tinydome_summer_ticket` gir gull-lodd til trekningen.
  - Juli-eventyret i `askeladden.ts` er definert som `isGrandFinale: true` med Tinydome-opphold.
  - `SkattekisteModal.tsx` har Eidfjord som spillbar by med 3 poster (Hæreidsplatået, Kokken Arthurs krydderhage på Sjel & Gane, og Heit fjordbadstue).
  - `EidfjordPartnerModal.tsx` inneholder komplette profiler og menyer for Sjel & Gane og Heit Eidfjord.

#### 3.2. Hva som mangler eller er ufullstendig:
1. **Dobbelt-tildeling ved eventyr-fullføring i `FamilieEventyrModal`:**  
   Ved fullføring av Steg 3 i `FamilieEventyrModal.tsx:210-213`:
   - Kaller `onAwardPoints(adventure.reward.points)` (som i `App.tsx:1348` gir 15 poeng med nøkkel `familie-soljakten-${today}`).
   - Kaller DERETTER `claimAdventureBonus(adventure.id)` (som i `askeladden.ts:518` gir 30 poeng med nøkkel `adventure-bonus-${adventureId}-${dateKey}`).
   - Til sammen tildeles $15 + 30 = 45$ poeng til ledgeren på én fullføring. Dersom familien OGSÅ har sanket 15 mynter på stien tidligere på turen, vil samlet opptjening kunne bli $15 + 45 = 60$ poeng i ledgeren dersom ikke `askeladden.ts` sin interne `MAX_TOTAL_HIKE_PAYOUT` overstyrer `onAwardPoints`.
2. **Resterende `Date.now()` i `App.tsx` og tester:**  
   - `App.tsx:1363`: `idempotencyKey: 'naturequest-${today}-${Date.now()}'`
   - `src/test/familieSpillflytFull.test.ts:98`: `idempotencyKey: 'familie-eventyr-${Date.now()}'`
   Dette bryter med regelen i `alexander-app-architecture` om aldri å bruke `Date.now()` i idempotensnøkler.

---

## 4. Konklusjon og Anbefalinger for Neste Faser

Domene-kravene R1, R2 og R3 er arkitektonisk og funksjonelt godt forankret i kodebasen. 188 automatiserte tester passerer, og kjernemotorene `askeladden.ts`, `familieEventyr.ts` og `arDrops.ts` fungerer harmonisk sammen.

### Konkrete utbedringer som bør prioriteres av implementerende agenter:
1. **Fusjons-timer:** Endre holdetiden i `FamilieEventyrModal.tsx` fra 2,0 s til nøyaktig 3,0 s, og legg til sjekk for `e.touches.length >= 2`.
2. **Synlig startknapp:** Legg til en «🌲 Familieeventyret (Lys-speideren)»-knapp i `App.tsx` ved siden av «Utforsk Eventyret & Skattejakten» og «Åpne Skattekisten».
3. **Idempotens-rensing:** Fjern de siste tilfellene av `Date.now()` i `App.tsx:1363` og `familieSpillflytFull.test.ts:98`.
4. **Månedsoppgaver:** Skript interaktive 3-trinns oppdrag for de resterende 11 månedene i årshjulet.
5. **Kartmarkører for dyrene:** Tilføy GPS-koordinater på de 10 dyrene slik at de dukker opp som pins langs stiene på Fløyen og Ulriken i `InteractiveMap.tsx`.
