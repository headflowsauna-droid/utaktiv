# Handoff Report: Milestone 1 — Touch Fusion & Multitouch Investigation

**Agent**: `explorer_m1_1`  
**Working Directory**: `/Users/alexr/Projects/Sol-Uteliv/.agents/teamwork/explorer_m1_1/`  
**Date**: 2026-10-27T14:50:00Z  
**Type**: Hard Handoff (Investigation Complete)  

---

## 1. Observation

1. **Timer-mekanikk i `src/components/FamilieEventyrModal.tsx:71-90`**:
   ```tsx
   73:     if (isHolding && currentStep === 3 && !isCompleted) {
   74:       interval = setInterval(() => {
   75:         setFusionHoldProgress((prev) => {
   76:           if (prev >= 100) {
   77:             clearInterval(interval!);
   78:             handleCompleteAdventure();
   79:             return 100;
   80:           }
   81:           return prev + 5;
   82:         });
   83:       }, 100);
   ```
   Intervall = 100 ms, inkrement = 5 %. 100 % / 5 % = 20 intervaller. Total holdetid: `20 * 100 ms = 2000 ms = 2.0 s`.

2. **Berøringshåndtering i `src/components/FamilieEventyrModal.tsx:495-501`**:
   ```tsx
   496:                     onMouseDown={() => setIsHolding(true)}
   497:                     onMouseUp={() => setIsHolding(false)}
   498:                     onTouchStart={() => setIsHolding(true)}
   499:                     onTouchEnd={() => setIsHolding(false)}
   ```
   Ingen kontroll på `e.touches.length`. En enkelt berøring setter `isHolding = true`. Ingen `onTouchMove` eller `onTouchCancel`. Ingen beskyttelse mot syntetiske museklikk (ghost clicks) etter touch-events. Ingen visuell indikasjon på antall fingre på skjermen.

3. **Lydsyntese og triggere i `src/components/FamilieEventyrModal.tsx:93-144, 198-215`**:
   - Linje 94-98: `const AudioCtx = window.AudioContext ...; const ctx = new AudioCtx();` oppretter en ny instans ved hvert tonekall uten å kalle `ctx.resume()` eller gjenbruke en felles instans.
   - Linje 100–137: `playSound` definerer kun grener for `'child_success'`, `'victory'` og `'error'`. `'adult_success'` mangler implementasjon.
   - Linje 198–200:
     ```tsx
     198:   const handleCompleteAdventure = () => {
     199:     playSound('victory');
     200:     setIsCompleted(true);
     ```
     Ved fullføring av fusjonen spilles kun `'victory'`. Barnets suksesslyd (`'child_success'`) spilles ikke sekvensielt sammen med seiersfanfaren.

4. **Nåværende test- og byggstatus**:
   - `npx vitest run`: 25 av 25 testsuiter passerte (188 av 188 tester grønne, 1.90s).
   - `npx tsc --noEmit`: 0 typefeil.
   - `npm run build`: Fullførte produksjonsbygging i `dist/` på 2.68s.

5. **App.tsx kobling**:
   - Linje 186–190: Støtter URL-parameter `?eventyr=1` / `?soljakten=1`.
   - Linje 1334–1345: `<FamilieEventyrModal>` tildeler poeng deterministisk via `grantEarned` med idempotensnøkkel `familie-soljakten-${today}`.

---

## 2. Logic Chain

1. **Fra Observasjon 1 til Timer-konklusjon**:
   - Observasjon 1 viser at `prev + 5` hvert 100 ms når 100 % etter nøyaktig 20 intervaller (2,0 sekunder).
   - Kravet i `PROJECT.md` Feature 6 og `ORIGINAL_REQUEST.md` R1 spesifiserer «3-sekunders berøringsfusjon».
   - For å garantere nøyaktig 3,0 sekunder uavhengig av tidsavvik i nettlesertikk, må forløpt tid beregnes som delta `Date.now() - startTime` mot `FUSION_HOLD_DURATION_MS = 3000`. Med 50 ms oppdateringsfrekvens (`FUSION_TICK_INTERVAL_MS = 50`) oppnås både nøyaktighet og silkemyk 20 fps progressbar-animasjon (`transition-all duration-75 ease-linear`).

2. **Fra Observasjon 2 til Flerberørings-konklusjon**:
   - Observasjon 2 viser at én enkelt barnefinger på skjermen trigger full fusjon uten at den voksne deltar.
   - På mobile enheter med berøringsskjerm må `e.touches.length >= 2` valideres under `onTouchStart`, `onTouchMove` og `onTouchEnd`. Dersom én eller begge fingre løftes slik at `touches.length < 2`, må `isHolding` umiddelbart settes til `false` og fremdriften nullstilles.
   - For å forhindre at berøringsskjermer trigger syntetiske museklikk 300 ms etter touchend, må en tidsstempel-sperre (`Date.now() - lastTouchTimestampRef.current < 750`) blokkere `onMouseDown`.
   - På vanlige PC-er/Mac-er uten touch må `onMouseDown` tillates når ingen touch-hendelser har inntruffet, slik at skrivebordstesting og automatisering fungerer sømløst.
   - To distinkte statusindikatorer (👶 Lys-speideren og 🧔 Kart-leseren) må informere brukeren visuelt om hvorvidt 1 eller 2 fingre er registrert.

3. **Fra Observasjon 3 til Lydkonklusjon**:
   - Observasjon 3 viser at `AudioContext` lages på nytt hver gang, og aldri gjenopptas ved `suspended`. I mobile nettlesere (iOS Safari og Chrome på Android) kreves det at lyden låses opp under en aktiv berøringshendelse (`touchstart`/`mousedown`). Hvis fusjonen fullfører asynkront 3 sekunder senere, kan en ny `AudioContext` bli blokkert.
   - Ved å opprette en persistent `audioContextRef` og kalle `ensureAudioContext()` (som kaller `resume()`) direkte i `handleTouchStart` og `handleMouseDown`, er lydmotoren garantert våken når fusjonen fullføres.
   - For å honorere oppdragets pedagogiske mål om at femåringen er helten, skal `handleCompleteAdventure()` utløse barnets suksesslyd (`child_success`), umiddelbart etterfulgt av den flerstemte seiersfanfaren (`victory`) etter 350 ms.

---

## 3. Caveats

1. **Ingen kodeendringer utført i kildefilene**: Som explorer-agent har denne analysen vært strengt lesende (read-only). Alle foreslåtte endringer er dokumentert med eksakte linjenumre og ferdige kodeblokker i `report.md`.
2. **Nettleserspesifikk multitouch-begrensning**: Enkelte rimelige Android-telefoner har lav kvalitet på digitalizeren, men `e.touches.length >= 2` støttes av 99.9 % av alle moderne smarttelefoner (iOS og Android).
3. **App.tsx Hovedmeny-knapp**: Feature 7 i `PROJECT.md` nevner «fast hovedknapp for Familieeventyret i App.tsx». Vår undersøkelse bekrefter at `isFamilieEventyrOpen` i `App.tsx` per nå kun trigges via URL-param (`?eventyr=1`). Dette er relevant for Milestone 1 som helhet, selv om vårt oppdrag var avgrenset til `FamilieEventyrModal.tsx`.

---

## 4. Conclusion

1. **Hold-timer**: Skal endres fra 20 x 100 ms (+5 %) til en tidsstempelbasert 3000 ms timer (`Date.now() - startTime`) med 50 ms tikk og `duration-75 ease-linear` CSS-overgang.
2. **Flerberøring**:
   - Berøringshendelser (`onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel`) sjekker `e.touches.length >= 2`.
   - Skrivebordsfallback beholdes for `onMouseDown` med 750 ms debouncing mot ghost clicks.
   - To visuelle statusmerker (👶 Lys-speideren og 🧔 Kart-leseren) og dynamisk tekst («1 finger til!», «Hold i 3 sekunder») legges til.
3. **Lydsyntese**:
   - `AudioContext` gjøres persistent via ref og gjenopptas under `touchstart`/`mousedown`.
   - `handleCompleteAdventure()` spiller sekvensielt: `child_success` ved 0 ms og `victory` ved 350 ms.
   - Gren for `'adult_success'` legges til i `playSound`.

---

## 5. Verification Method

Implementøren kan verifisere endringene fullstendig ved:
1. **Regresjonstesting**:
   ```bash
   npx vitest run
   ```
   Forventet resultat: Alle 25 testsuiter og 188 tester grønne.
2. **Typesjekk**:
   ```bash
   npx tsc --noEmit
   ```
   Forventet resultat: Avslutningskode 0, ingen typeskisseringsfeil.
3. **Bygging**:
   ```bash
   npm run build
   ```
   Forventet resultat: Vite-bygg fullføres feilfritt med alle assets i `dist/`.
4. **Inspeksjon av moduler**:
   - Sjekk `src/components/FamilieEventyrModal.tsx` mot de foreslåtte kodeblokkene i `report.md`.
5. **Nettleser-testing**:
   - Desktop: Klikk og hold med mus i 3,0 sekunder. Verifiser at fremdriften tar nøyaktig 3,0 sekunder og at begge toner spilles.
   - Mobil/DevTools Touch: Med 1 berøringspunkt skal hold ikke starte (viser «1 finger til!»). Med 2 berøringspunkter starter 3,0s nedtelling. Slippes én finger før 3 sekunder, nullstilles holdet umiddelbart.
