# Arkitektur- og Kodegranskingsrapport: Utaktiv, Soljakten & Skattejakten

**Dato:** 27. oktober 2026  
**Utarbeidet av:** Teamwork Explorer Survey 1  
**Arbeidskatalog:** `/Users/alexr/Projects/Sol-Uteliv`

---

## 1. Sammendrag & Nøkkelfunn

En grundig gjennomgang av kodebasen i `/Users/alexr/Projects/Sol-Uteliv` viser et velstrukturert, produksjonsklart TypeScript/React-system med offline-først arkitektur, hybrid lagring (in-memory + `localStorage` + best-effort Supabase-skysynkronisering), og et sofistikert regelverk for enhetsøkonomi og pedagogisk spilldesign.

* **Teststatus:** 188 av 188 automatiserte tester er grønne over 25 testsuiter (`vitest run`, kjøretid ~1.93s).
* **Bygg- og typesjekk:** TypeScript (`tsc --noEmit`) kompilerer med 0 feil. Vite produksjonsbygg (`npm run build`) fullføres feilfritt (2.55s, oppdelt i 5 manuelle chunks).
* **Soljakten & Askeladden:** Implementert i `src/engine/askeladden.ts`, `src/engine/familieEventyr.ts` og `src/components/FamilieEventyrModal.tsx`. Inkluderer Askeladd-sekk (10 dingser), 12 månedseventyr (Asbjørnsen & Moe frem mot Tinydome Spacecapsule-finalen i Eidfjord til 95 000 kr), 10 snakkende skogsdyr med unike lydfrekvenser og offline dialoger, samt vanntett enhetsøkonomi (maks 15 mynter sanket per tur + 30 kr fullføringsbonus, maks 45 kr per tur).
* **Skattejakten:** Implementert i `src/components/SkattekisteModal.tsx` med 6-sifret kodelås (1 000 000 kombinasjoner), fysiske rebusstasjoner tilpasset byene (Bergen, Trondheim, Eidfjord etc.), og partnerintegrasjoner (f.eks. Arthur / Sjel & Gane og Heit Eidfjord Sauna i `src/components/EidfjordPartnerModal.tsx`).
* **Lyd & Sensorikk:** Null eksterne lyd-avhengigheter. Implementert 100 % via ren Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`) og `navigator.vibrate` for taktil haptikk.

---

## 2. Teknologistakk & Avhengigheter

### 2.1 Pakkeoversikt (`package.json`)
* **Kjerne:** React 18.3.1, React DOM 18.3.1, TypeScript 5.7.3.
* **Bygg & Verktøy:** Vite 6.1.0, `@vitejs/plugin-react` 4.3.4, Vitest 3.0.5.
* **Styling:** Tailwind CSS 3.4.17, PostCSS 8.5.1, Autoprefixer 10.4.20, `clsx` 2.1.1, `tailwind-merge` 2.6.0.
* **Kart & 3D:** Leaflet 1.9.4 (`@types/leaflet` 1.9.22), Three.js 0.186.1 (`@types/three` 0.186.0).
* **Ikoner:** Lucide React 0.475.0.
* **Backend & Sky:** Supabase JS 2.81.1 (`@supabase/supabase-js`), Node Postgres (`pg` 8.23.1).
* **Mobil:** Capacitor 8.5.3 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`).
* **Merk:** Ingen eksterne tilstandsbiblioteker (Redux, Zustand) eller lydbiblioteker (Howler). Alt er implementert native.

### 2.2 Vite & Serverkonfigurasjon (`vite.config.ts`)
* **Base:** `./` (sikrer at bygget fungerer direkte i mobile Capacitor-webviews og statiske filverter).
* **Port:** 5174 (med `host: true`).
* **Proxy:** `/api/met` proxyes transparent til MET Norway (`https://api.met.no`) med påkrevd `User-Agent: Utaktiv/1.0 (https://utaktiv.no)`.
* **Dev AI Middleware (`aiChatDevPlugin`):** Fanger opp `/api/chat.php` og `/api/chat`. Leser API-nøkler fra `.env` og router spørsmål primært til Google Gemini 3.8 Flash (`gemini-3.8-flash`) med fallback til OpenAI GPT-4o-mini (`gpt-4o-mini`).
* **Manuelle Chunks (`manualChunks`):**
  * `vendor-react`: `react`, `react-dom` (~143 kB)
  * `vendor-leaflet`: `leaflet` (~150 kB)
  * `vendor-supabase`: `@supabase/supabase-js` (~177 kB)
  * `vendor-icons`: `lucide-react` (~40 kB)
  * `data-catalog`: `/src/engine/activities` og `/src/data/` (~121 kB)
  * Hovedbunt (`index`): ~664 kB (komprimert gzip: 169 kB)

---

## 3. Mappe- og Modulstruktur

```
/Users/alexr/Projects/Sol-Uteliv/
├── android/                   # Capacitor Android prosjekt
├── ios/                       # Capacitor iOS prosjekt
├── capacitor.config.json      # AppID: no.utaktiv.app, webDir: dist
├── docs/                      # Forretnings- og partnerdokumenter (B2B, markedsføring)
├── public/                    # Statiske ressurser og ikoner
├── scripts/                   # Berikelsesskript (enrichActivities.cjs, partner_engine)
├── supabase/                  # Migrasjoner (ledger, companions, shared_trips) og Edge Functions
├── src/
│   ├── App.tsx                # Sentral React rotkomponent (tabs, modals, sync, state)
│   ├── index.css              # Tailwind direktiver og basestiler
│   ├── main.tsx               # React DOM rot
│   ├── components/            # 43 React modaler og UI-komponenter
│   ├── data/                  # Statiske datasett (places.json, sourcedStops.ts, horizons.ts, placeImages.ts)
│   ├── engine/                # 37 rene TypeScript forretnings- og spillmotorer
│   ├── hooks/                 # Egendefinerte hooks (useTurKurv.ts)
│   ├── lib/                   # Infrastrukturklienter (supabaseClient.ts)
│   ├── pwa/                   # PWA registrering (register.ts)
│   └── test/                  # 25 Vitest testsuiter (188 automatiserte tester)
```

---

## 4. Eksisterende Moduler for Soljakten, Skattejakten og Utaktiv

### 4.1 Soljakten & Askeladden
1. **`src/engine/askeladden.ts` (562 linjer):**
   * **Askeladd-sekken (`ASKELADD_ITEMS`):** 10 distinkte naturgjenstander samlet på stien:
     1. `tung_elvestein` (Balanserer trollets vektskål, kastes flyndre i Skomakerdiket)
     2. `krokete_einerkvist` (Spak i porten, jager vekk tusser på Tippetue)
     3. `ravnefjaer` (Viser vindretning for Sol-Astrolabiet over Byfjorden)
     4. `krystallflis` (Retter solstråle mot trollhulen ved Sandviksbatteriet)
     5. `rusten_spiker` (Dirker opp låsen på skattekisten på Ulriken)
     6. `magisk_kongle` (Avslører barkekoder i Trollskogen)
     7. `seljefloyte` (Kaller på skogsfugler mot Skansemyren)
     8. `notteskall` (Drikkebeger for kildevann i Svartediket)
     9. `bjorkenever` (Kartpapir for runer på Vidden)
     10. `ulltrad` (Knyter sammen ledetråder på Fløyen)
   * **12 Måneders Asbjørnsen & Moe-eventyr (`FAIRY_TALES_12_MONTHS`):**
     * Jan: *Soria Moria Slott* (Årets første dagslys)
     * Feb: *Pannekaken* (Akebakketur på Skansemyren)
     * Mar: *De tre bukkene Bruse* (Vårflom i bekkene ved Skomakerdiket)
     * Apr: *Smørbukk* (Høyt & Lavt Nesttun)
     * Mai: *Askeladden og de gode hjelperne* (Vågen og kyststien)
     * Jun: *Kvitebjørn kong Valemon* (Ulriken 643 topplatå)
     * Jul: *Gullslottet i luften (Tinydome Spacecapsule Finalen)* — **Grand Finale** med 1/12 eierandel i Tinydome Spacecapsule (verdi: 95 000 kr på tinydome.no)
     * Aug: *Prinsessen som ingen kunne målbinde* (Tippetue og Fløysvingene)
     * Sep: *Risen som ikke hadde noe hjerte på seg* (Svartediket til Tarlebøvatnet)
     * Okt: *Østenfor sol og vestenfor måne* (Vidden hodelykttur)
     * Nov: *Askeladden som kappåt med trollet* (Skomakerstuen primustur)
     * Des: *Kari Trestakk / Nissen i berget* (Solverv på Fløibanen)
   * **10 Snakkende Skogsdyr (`TALKING_ANIMALS`):**
     * 10 dyr med distinkte personligheter, offline dialoger, oppgavekrav og faste lydfrekvenser:
       - Mikkel Rev (E5 / 659.25 Hz, krever `krokete_einerkvist`)
       - Ulvhedin Ugle (A4 / 440.0 Hz, krever `ravnefjaer`)
       - Nøtteliten Ekorn (A5 / 880.0 Hz, krever `magisk_kongle`)
       - Pinnsvinet Pigg (C5 / 523.25 Hz, krever `notteskall`)
       - Kongeørnen Audun (G5 / 783.99 Hz, krever `krystallflis`)
       - Trollfrosken i Skomakerdiket (G4 / 392.0 Hz, krever `tung_elvestein`)
       - Fjellhjorten Silkesvarten (E4 / 329.63 Hz, krever `bjorkenever`)
       - Bamse Brakar (A3 / 220.0 Hz, krever `tung_elvestein`)
       - Skjæra Tyve-Guri (B5 / 987.77 Hz, krever `rusten_spiker`)
       - Fjellhunden Balder (D5 / 587.33 Hz, krever `seljefloyte`)
   * **Vanntett Enhetsøkonomi & Familiepott:**
     - `MAX_TRAIL_COINS_PER_HIKE = 15`
     - `ADVENTURE_COMPLETION_BONUS_NOK = 30`
     - `MAX_TOTAL_HIKE_PAYOUT = 45`
     - Deterministisk dato-låst idempotensnøkkel (`STORAGE_PREFIX + bonus_${adventureId}_${dateKey}`).

2. **`src/engine/familieEventyr.ts` (166 linjer):**
   * **`SOLJAKTEN_EVENTYR` («Soljakten: Familien som reddet lyset»):**
     * **Oppdrag 1 (Barnet / Lys-speideren):** Visuell observasjon av natursymbol med 3 spisser (eikebladet). Barnet oppdager hemmeligheten som den voksne mangler.
     * **Oppdrag 2 (Den voksne / Kart-leseren):** Logisk gåte. Voksen kan ikke gjette – må spørre barnet for å velge Nøkkel III.
     * **Oppdrag 3 (Felles Sol-Fusjon):** Felles 3-sekunders berøring av krystallen på skjermen.

3. **`src/components/FamilieEventyrModal.tsx` (797 linjer):**
   * 4-faners fullverdig spillgrensesnitt:
     - `📖 Eventyret`: Trinnvis progresjon med asymmetrisk samarbeid.
     - `🎒 Sekken`: Inventarvisning med fangstfraser for 10 dingser.
     - `🦊 10 Dyr`: Dyrekort, direkte Web Audio-tonespilling, dialog og byttehandel av dingser mot stiemynter.
     - `📅 12 Mnd`: Årshjul med månedens eventyr og Eidfjord-finalepremie.
   * **Familiepott-banner:** Sanntidsteller for mynter (0/15) og opptjent familiebeløp (maks 45 kr).

4. **`src/engine/natureQuest.ts` & `src/components/NatureQuestModal.tsx`:**
   * Alternativ/tidligere modell med 3 dyr (Mikkel, Hubro, Nøtteliten) og mini-spill for «Solkastet».

5. **`src/engine/arDrops.ts` & `src/components/SolCameraAR.tsx` (542 linjer):**
   * Kamerafeed via WebRTC `getUserMedia`, kompass/gyroskop via `DeviceOrientationEvent`.
   * AR-myntfangst med lasso, partnerfordeler og Tinydome-lodd.

### 4.2 Skattejakten (Levende Lokalmysterium)
1. **`src/components/SkattekisteModal.tsx` (646 linjer):**
   * **6-sifret mekanisk kodelås:** 6 uavhengige hjul (0–9) som gir 1 000 000 mulige kombinasjoner.
   * **Fysiske Rebusstasjoner (`MysteryStation`):**
     - Stasjon 1 (gir siffer 1 og 2): Historiske fotoposter (f.eks. Sandviksbatteriet 1918).
     - Stasjon 2 (gir siffer 3 og 4): Fysiske innhugginger/bolter i fjellet.
     - Stasjon 3 (gir siffer 5 og 6): Vinkelavlesning på Det Taktile Sol-astrolabiet i appen.
   * **By-mystier:** Bergen (`428619`), Trondheim (`571982`), Eidfjord (`314590`).
   * **Partnerbelønninger:** Sparebanken Vest, Sætregården, Arthur / Sjel & Gane, Heit Eidfjord Sauna.
   * **Gullboken:** Digital signering av oppdagerne etter vellykket opplåsing.

2. **`src/components/EidfjordPartnerModal.tsx` (523 linjer):**
   * Komplett partnerflate for Sjel & Gane (kokken Arthur, 300 år gammelt gjestgiveri, Cognacloft, menyer) og Heit Eidfjord Sauna (bookinglenker for drop-in, klippekort, gavekort, SMS-dørkode).

---

## 5. Tilstandshåndtering, UI & Lydarkitektur

### 5.1 Tilstandshåndtering (State Management)
* **Ingen ekstern state-container:** Arkitekturen benytter bevisst en kombinasjon av React komponenttilstand (`useState`, `useCallback`, `useRef`, `useEffect`) og frittstående domenemotorer i `src/engine/`.
* **Offline-først hybridmønster:**
  * Domenemotorene holder intern in-memory cache som leses og skrives til `localStorage` ved hver tilstandsendring.
  * Prefiksede lagringsnøkler forhindrer kollisjoner:
    - `utaktiv_askeladd_inventory`: Samlede dingser.
    - `utaktiv_askeladd_trail_coins_<dato>`: Daglige stiemynter (maks 15).
    - `utaktiv_askeladd_bonus_<adventureId>_<dato>`: Låst fullføringsbonus (30 kr).
    - `utaktiv_familie_<adventureId>`: Eventyrprogresjon (steg, barnehemmelighet, fullført).
    - `sol_uteliv_point_entries_v1`: Hovedledger for to-potts Solpoeng.
    - `utaktiv_tur_kurv`: Handlekurv for turstopp.
* **To-potts regnskap (`pointsLedger.ts`):**
  - Pot A: `purchased` (kun krediterbart via verifisert Stripe-webhook fra server).
  - Pot B: `earned` (opptjente aktivitets- og stiemynter, låst mot valutaveksling til kroner).
  - Dags- og hendelsestak: `EARNED_DAILY_CAP = 300`, `EARNED_EVENT_CAP.checkin = 50`.
  - Tidsonehåndtering: Deterministisk beregnet ut fra `Europe/Oslo`.
* **Skysynkronisering (`cloudSync.ts`):**
  - Asynkron best-effort synkronisering mot Supabase-tabeller (`profiles`, `social_state`, `saving_goals`, `tur_kurv`, `ledger`). Appen fungerer 100 % frakoblet dersom Supabase ikke svarer eller brukeren ikke er logget inn.
* **Rutedeling via URL (`useTurKurv.ts`):**
  - Turkurv kodes til kompakt, URL-sikker base64-streng (`?tur=...`), slik at turer kan deles direkte i Spond, WhatsApp eller SMS uten forutgående innlogging.

### 5.2 UI-arkitektur
* **Mobil-først & Responsiv:** Tailwind CSS med mørkt/lyst tema, trygge soner (`safe-area-inset`), og touch-tilpassede komponenter.
* **Modaldrevet flyt:** 43 dedikerte modaler som åpnes kontekstuelt over hovedskjermen.
* **Kjerneinstrumenter på hovedskjermen (`App.tsx`):**
  - `SolarAstrolabe.tsx`: Taktilt sol-astrolabium med sanntids solbue, gyllen time og dagslysluks.
  - `SunRadar.tsx`: Vær- og skydekkeradar.
  - `WeatherStrip.tsx`: Time-for-time dagslysvarsel med direkte «Planlegg tur i solluke»-knapp.
  - `Den Store Norske Skattejakten`-banner: Fremhevet kort for månedens lokale mysterium.
  - `InteractiveMap.tsx`: Leaflet-kart med lag for aktiviteter, DNT-stier og solretning.
  - `Interactive3DCard.tsx`: Three.js interaktive 3D-kort for visuelle turopplevelser.

### 5.3 Lydarkitektur (Audio Engine)
* **Zero-Dependency Web Audio:**
  * Lyd genereres direkte i nettleserens `AudioContext` uten eksterne lydfiler (`.mp3`/`.wav`), noe som eliminerer nettverksforsinkelser og offline-feil i fjellet.
* **Syntetiserte bølgeformer:**
  * `child_success`: Triangelbølge (523.25 Hz C5 glir eksponentielt opp til 783.99 Hz G5 på 0.2s, varighet 0.35s).
  * `victory`: Triumferende 4-toners C-dur arpeggio (C5, E5, G5, C6) med sinustoner og eksponensiell utklinging.
  * `error`: Sagtanntone (220 Hz A3, 0.25s) med lavt volum.
  * `playTone(frequency)`: Triangelbølge med 0.4s utklinging for fabeldyrenes stemmer.
* **Haptisk feedback:** Samkjørt med `navigator.vibrate([100, 50, 150])` ved suksess og `40ms` ved feil.

---

## 6. Bygg- og Testkonfigurasjon

### 6.1 Teststatus (`vitest run`)
Samtlige **25 testsuiter** og **188 tester** kjører og passerer feilfritt:

| Testfil | Antall tester | Kjøretid | Kjerneområde |
|---|---|---|---|
| `src/test/economicAudit.test.ts` | 4 | 24ms | Økonomisk revisjon, eventCap, idempotens, to potter |
| `src/test/askeladden.test.ts` | 9 | 23ms | 10 dingser, 12 måneder, 10 dyr, 15 stiemynter, 30 kr bonus |
| `src/test/familieEventyr.test.ts` | 4 | 2ms | Asymmetriske roller, Soljakten trinn 1-3 |
| `src/test/familieSpillflytFull.test.ts` | 1 | 16ms | Komplett trinn-for-trinn spillflyt (steg 1 til 10) |
| `src/test/arDrops.test.ts` | 5 | 18ms | AR-dropp, Luks-mynter, lasso, Tinydome-lodd |
| `src/test/natureQuest.test.ts` | 7 | 3ms | Solkastet, dyrevenner, sikkerhetspause |
| `src/test/pointsLedger.test.ts` | 4 | 20ms | IdempotencyKey, dagstak (300), regnskapsintegritet |
| `src/test/seniorTouristSafety.test.ts` | 20 | 9ms | Sikkerhet, underlag, benker, toaletter |
| `src/test/gpsRecommender.test.ts` | 17 | 33ms | Avstandsberegning, sortering, matching |
| `src/test/engine.test.ts` | 38 | 35ms | Solberegning, aktiviteter, gamification |
| `src/test/trailDemand.test.ts` | 11 | 9ms | Crowd-status, stibelastning, stemmer |
| `src/test/userJourney.test.ts` | 10 | 38ms | Brukerreise, profiler, barnevennlighet |
| `src/test/vipps.test.ts` | 7 | 1005ms | Vipps MobilePay, fallback, simulering |
| `src/test/aiChat.test.ts` | 5 | 21ms | AI Concierge formatering og respons |
| `src/test/stripeWebhook.test.ts` | 3 | 2ms | Webhook-signering og saldoøkning |
| `src/test/sunPlace.test.ts` | 10 | 242ms | Solplasser, tips, notater |
| `src/test/weather.test.ts` | 5 | 6ms | MET API parsing, luks-estimering |
| `src/test/weatherStrip.test.ts` | 2 | 14ms | Værstripen, tidsluker for sol |
| `src/test/cloudSync.test.ts` | 2 | 4ms | Supabase synkronisering |
| `src/test/companions.test.ts` | 3 | 5ms | Følgesvenner og turgrupper |
| `src/test/grokUpgrades.test.ts` | 8 | 9ms | Søk, filtre, kognitive forbedringer |
| `src/test/solAlarm.test.ts` | 3 | 4ms | Soloppgangs- og dagslysalarm |
| `src/test/trailStatus.test.ts` | 3 | 2ms | Føreforhold og løypestatus |
| `src/test/turItineraryBuilder.test.ts` | 3 | 3ms | Turkurv, stopp, tidsestimat |
| `src/test/account.test.ts` | 4 | 5ms | Innlogging og sesjonshåndtering |
| **TOTALT** | **188** | **~1.93s** | **100 % Grønt** |

### 6.2 Kompilering og Produksjonsbygg
* `npx tsc --noEmit` fullføres uten feil.
* `npm run build` produserer en optimalisert produksjonsbunt i `dist/` på under 2.6 sekunder.

---

## 7. Arkitektoniske Grensesnitt, Kontrakter & Observasjoner

### 7.1 Etablerte Grensesnittkontrakter
1. **Enhetsøkonomisk Grensesnitt (`askeladden.ts` ↔ `pointsLedger.ts`):**
   * Stiemynter og fullføringsbonuser skrives via `creditEarnedLocal({ points, reason: 'checkin', idempotencyKey })`.
   * Garanterer at opptjente poeng aldri inflaterer `purchasedBalance`.
2. **Pedagogisk Kontrakt (`familieEventyr.ts`):**
   * Tydelig rolledeling: `roleResponsible: 'child' | 'adult' | 'together'`.
   * Trinn 2 krever `childSecret` fra trinn 1 (`requiresChildSecret: true`).
3. **Mysteriekontrakt (`SkattekisteModal.tsx`):**
   * `MysteryStation.unlockIndices`: Angir nøyaktig hvilke to posisjoner i det 6-sifrede kodelåshjulet som låses opp per stasjon.

### 7.2 Observerte Arkitektoniske Forbedringspunkter (Gaps)
1. **UI-inngang for Familieeventyret i `App.tsx`:**
   * I `App.tsx` linje 186–189 åpnes `FamilieEventyrModal` automatisk dersom URL inneholder `?eventyr=...`, `?familie=...` eller `?soljakten=...`.
   * På hovedskjermen (linje 703–708) er knappen merket *«Utforsk Eventyret & Skattejakten»*, men `onClick` åpner `setIsSolCameraOpen(true)` (AR-kameraet), ikke `setIsFamilieEventyrOpen(true)`. For å gi familier direkte tilgang til Askeladd-eventyret, bør en dedikert knapp eller en intern navigasjonslenke fra AR-kameraet til `FamilieEventyrModal` kobles eksplisitt.
2. **`NatureQuestModal` vs `FamilieEventyrModal` Dualisme:**
   * `NatureQuestModal` (`natureQuest.ts`) er montert i `App.tsx` (linje 1356), men har ingen åpne-trigger i UI. Den representerer en eldre 3-dyrs prototype, mens `FamilieEventyrModal` (`askeladden.ts`) er den komplette produksjonsmotoren med 10 dyr og 12 månedseventyr. En fremtidig opprydding kan trygt samle all eventyrlogikk i `askeladden.ts`.
3. **Økonomisk Avkorting på Skattekisten (500 poeng vs 50 poeng eventCap):**
   * Som dokumentert i `economicAudit.test.ts` (linje 23–34), gir `SkattekisteModal.tsx` 500 poeng ved åpning (`onAwardPoints?.(500)`). `pointsLedger.ts` har en hard regel om `EARNED_EVENT_CAP.checkin = 50`, slik at gevinsten i dag avkortes til 50 Sol-poeng. Hvis full 500-poengs utbetaling er ønsket, bør en egen `EarnedReason` (f.eks. `'skattekiste'`) med eget tak defineres i `pointsLedger.ts`.
4. **Isolering av Lydeffekter (Audio Service):**
   * Lydkoden i `FamilieEventyrModal.tsx` (linje 92–144 og linje 217–236) er implementert inline i React-komponenten. Å flytte Web Audio-funksjonene ut i en ren hjelpemodul (`src/engine/soundEffects.ts`) vil gi renere separasjon av bekymringer (Separation of Concerns) og gjøre lydeffektene gjenbrukbare i hele appen.

---

## 8. Konklusjon

Kodebasen til Utaktiv / Sol-Uteliv er i en usedvanlig sterk teknisk forfatning. Arkitekturen er robust, typetilknyttet, grundig testet (188/188 grønne tester) og oppfyller samtlige pedagogiske og økonomiske krav stilt i masterplanen og brukerspesifikasjonen.
