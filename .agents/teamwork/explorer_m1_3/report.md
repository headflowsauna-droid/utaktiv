# Utredningsrapport: Idempotensnøkler, Berøringsfusjon & Testkonsistens

**Dato**: 2026-10-27  
**Utført av**: teamwork_preview_explorer (Instance 3, Milestone 1)  
**Arbeidsområde**: `/Users/alexr/Projects/Sol-Uteliv/`  

---

## 1. Sammendrag (Executive Summary)

Denne utredningen analyserer idempotensnøkler, testkonsistens og berøringsfusjon i Utaktiv Soljakten og Skattejakten:
1. **Idempotensfeil i `src/App.tsx:1355`**: Koden bruker `naturequest-${today}-${Date.now()}`. Fordi `Date.now()` genererer et unikt millisekund-tall ved hvert klikk, oppheves all beskyttelse mot utilsiktede dobbeltutbetalinger. Anbefalt løsning er en deterministisk, dato- og handlingslåst nøkkel `naturequest-${today}-${actionId}`.
2. **Idempotensfeil i `src/test/familieSpillflytFull.test.ts:98`**: Testen benytter `familie-eventyr-${Date.now()}`. Dette erstattes med deterministisk dato-låst nøkkel `familie-eventyr-${adv.id}-${today}`, og utvides med eksplisitt verifikasjon av at duplikatkall samme dag gir `applied: 0`.
3. **Avdekket tidsfeil i Berøringsfusjonen (`FamilieEventyrModal.tsx:75-83`)**: Koden legger til 5 % per 100 ms (`prev + 5`). Dette fullfører på nøyaktig 20 intervaller à 100 ms = **2,0 sekunder** i stedet for de spesifiserte **3,0 sekundene** (3000 ms). I tillegg mangler sjekk av `e.touches.length >= 2` for ekte multi-touch. Det anbefales å eksportere `TOUCH_FUSION_DURATION_MS = 3000` fra `familieEventyr.ts` og legge til dedikerte tester i `familieEventyr.test.ts` og `askeladden.test.ts`.
4. **100 % grønne tester over 25 testsuiter (188 tester)**: Alle 25 testsuiter og 188 tester kjører grønt per nå (`vitest run`). Rapporten dokumenterer miljøkrav, mock-avhengigheter og nulltoleranse for flakiness slik at de nye testene forblir 100 % grønne.

---

## 2. Analyse 1: `src/App.tsx:1355` (`idempotencyKey: 'naturequest-${today}-${Date.now()}'`)

### 2.1 Observasjon
I `src/App.tsx`, linje 1350–1358:
```tsx
1350:         onAddCoinsToWallet={pts => {
1351:           const today = new Date().toISOString().split('T')[0];
1352:           void grantEarned({
1353:             points: pts,
1354:             reason: 'checkin',
1355:             idempotencyKey: `naturequest-${today}-${Date.now()}`,
1356:           }).then(() => refreshBalances());
1357:         }}
```

### 2.2 Problemidentifikasjon
I `src/engine/pointsLedger.ts` implementeres idempotens ved direkte strengsammenligning:
```ts
if (entries.some(entry => entry.idempotencyKey === input.idempotencyKey)) {
  return { applied: 0, balance: earnedBalance() };
}
```
Når idempotensnøkkelen inneholder `${Date.now()}`, blir hver registrering unik. Dette er dokumentert som en sårbarhet i `src/test/economicAudit.test.ts:36-48`:
> *"avslører at Date.now() i idempotencyKey tillater uendelig poengsanking inntil dagstaket"*

Til sammenligning bruker de to andre modalene i `src/App.tsx` allerede deterministiske dato-låste nøkler:
- `SkattekisteModal` (linje 1310): `idempotencyKey: 'skattekiste-${selectedCity}-${today}'`
- `FamilieEventyrModal` (linje 1343): `idempotencyKey: 'familie-soljakten-${today}'`

### 2.3 Anbefalt erstatning

#### Alternativ A (Beste praksis: Dato- og handlingslåst nøkkel)
I `src/components/NatureQuestModal.tsx` kalles `onAddCoinsToWallet` ved 4 distinkte milepæler:
1. Linje 97 (Solkastet): `onAddCoinsToWallet?.(5, 'solkastet');`
2. Linje 109 (Gåte): `onAddCoinsToWallet?.(5, 'riddle-' + animalId);`
3. Linje 117 (Askeladd-funn): `onAddCoinsToWallet?.(5, 'tool-' + toolId);`
4. Linje 126 (Skattekiste): `onAddCoinsToWallet?.(10, 'chest');`

I `src/App.tsx:1350-1358` oppdateres mottaket:
```tsx
<<<<
        onAddCoinsToWallet={pts => {
          const today = new Date().toISOString().split('T')[0];
          void grantEarned({
            points: pts,
            reason: 'checkin',
            idempotencyKey: `naturequest-${today}-${Date.now()}`,
          }).then(() => refreshBalances());
        }}
====
        onAddCoinsToWallet={(pts, actionKey = 'generic') => {
          const today = new Date().toISOString().split('T')[0];
          void grantEarned({
            points: pts,
            reason: 'checkin',
            idempotencyKey: `naturequest-${today}-${actionKey}`,
          }).then(() => refreshBalances());
        }}
>>>>
```

#### Alternativ B (Minimal drop-in kun i `App.tsx`)
Dersom man kun ønsker å endre `src/App.tsx` uten å røre `NatureQuestModal.tsx`:
```tsx
<<<<
            idempotencyKey: `naturequest-${today}-${Date.now()}`,
====
            idempotencyKey: `naturequest-${today}`,
>>>>
```
*Merk ved Alternativ B*: Dette begrenser utbetaling fra NatureQuest til én gang per dag per bruker. Dersom flere deloppgaver i NatureQuest skal gi poeng på samme tur, er Alternativ A påkrevd.

---

## 3. Analyse 2: `src/test/familieSpillflytFull.test.ts:98`

### 3.1 Observasjon
I `src/test/familieSpillflytFull.test.ts:92-104`:
```ts
92:     // 7. Kontroller belønningen og poengsaldoen
93:     const rewardPoints = adv.reward.points; // 15
94:     expect(rewardPoints).toBe(15);
95:     const grantRes = creditEarnedLocal({
96:       points: rewardPoints,
97:       reason: 'checkin',
98:       idempotencyKey: `familie-eventyr-${Date.now()}`
99:     });
100:     expect(grantRes.applied).toBe(15);
101:     expect(earnedBalance()).toBe(15);
102:     // Kjøpt saldo forblir 0
103:     expect(purchasedBalance()).toBe(0);
```

### 3.2 Problemidentifikasjon
Testen har til hensikt å verifisere den fulle spillflyten inkludert poengbelønning. Bruken av `Date.now()` på linje 98 maskerer eventuelle idempotensfeil og bryter med `PROJECT.md:34` og `PROJECT.md:55`:
> *"Idempotency keys must be deterministic strings: `trail-coin-${dateKey}-${n}` and `adventure-bonus-${adventureId}-${dateKey}`."*

### 3.3 Anbefalt erstatning
Erstatt linje 95–104 i `src/test/familieSpillflytFull.test.ts` med:
```ts
<<<<
    const grantRes = creditEarnedLocal({
      points: rewardPoints,
      reason: 'checkin',
      idempotencyKey: `familie-eventyr-${Date.now()}`
    });
    expect(grantRes.applied).toBe(15);
    expect(earnedBalance()).toBe(15);
    // Kjøpt saldo forblir 0
    expect(purchasedBalance()).toBe(0);
====
    const today = new Date().toISOString().split('T')[0];
    const grantRes = creditEarnedLocal({
      points: rewardPoints,
      reason: 'checkin',
      idempotencyKey: `familie-eventyr-${adv.id}-${today}`
    });
    expect(grantRes.applied).toBe(15);
    expect(earnedBalance()).toBe(15);
    expect(purchasedBalance()).toBe(0);

    // 7b. Verifiser deterministisk dato-låst idempotens (duplikatkall samme dag gir 0)
    const duplicateRes = creditEarnedLocal({
      points: rewardPoints,
      reason: 'checkin',
      idempotencyKey: `familie-eventyr-${adv.id}-${today}`
    });
    expect(duplicateRes.applied).toBe(0);
    expect(earnedBalance()).toBe(15);
>>>>
```

Dette gjør ikke bare testen deterministisk, men beviser aktivt at duplikatbeskyttelsen fungerer som forventet.

---

## 4. Analyse 3: 3.0-sekunders berøringsfusjon og multi-touch

### 4.1 Avdekket tidsavvik i `src/components/FamilieEventyrModal.tsx`
I `src/components/FamilieEventyrModal.tsx:71-90`:
```tsx
  // Håndter 3-sekunders hold for Steg 3 (Sol-Fusjonen)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isHolding && currentStep === 3 && !isCompleted) {
      interval = setInterval(() => {
        setFusionHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval!);
            handleCompleteAdventure();
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    } else {
      setFusionHoldProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHolding, currentStep, isCompleted]);
```
**Beregning**:
- Intervall: 100 ms
- Økning per tick: +5
- Antall ticks til 100 %: `100 / 5 = 20` ticks
- Faktisk tid: `20 * 100 ms = 2000 ms = 2,0 sekunder`!
- **Krav**: R1 og `PROJECT.md:23` krever eksplisitt **3.0 sekunder** (3000 ms).

I tillegg ser vi i linje 495–501:
```tsx
  <div
    onMouseDown={() => setIsHolding(true)}
    onMouseUp={() => setIsHolding(false)}
    onTouchStart={() => setIsHolding(true)}
    onTouchEnd={() => setIsHolding(false)}
```
Her registreres enhver berøring som start på fusjon, uten å sjekke om det faktisk er felles berøring (minst 2 berøringspunkter: `e.touches.length >= 2`).

### 4.2 Anbefalte utvidelser i `src/engine/familieEventyr.ts`
For å gjøre reglene enhetlige og testbare uten DOM/render-avhengigheter, bør `src/engine/familieEventyr.ts` eksportere konstanter og en evalueringsfunksjon:

```ts
// I src/engine/familieEventyr.ts
export const TOUCH_FUSION_DURATION_MS = 3000;
export const TOUCH_FUSION_TICK_MS = 100;
export const TOUCH_FUSION_REQUIRED_TOUCHES = 2;

export function evaluateTouchFusion(
  elapsedMs: number,
  touchesCount: number = 2
): {
  isCompleted: boolean;
  progressPercent: number;
  hasMultiTouch: boolean;
} {
  const hasMultiTouch = touchesCount >= TOUCH_FUSION_REQUIRED_TOUCHES;
  const progressPercent = Math.min(100, (elapsedMs / TOUCH_FUSION_DURATION_MS) * 100);
  return {
    isCompleted: progressPercent >= 100 && hasMultiTouch,
    progressPercent: Math.round(progressPercent),
    hasMultiTouch,
  };
}
```

### 4.3 Anbefalte tester til `src/test/familieEventyr.test.ts`
Legg til følgende testblokk i `src/test/familieEventyr.test.ts`:

```ts
  describe('Felles 3.0-sekunders berøringsfusjon & multitouch (Krav R1)', () => {
    it('konfigurerer Oppdrag 3 til nøyaktig 3.0 sekunder (3000 ms) holdetid', () => {
      const m3 = SOLJAKTEN_EVENTYR.missions[2];
      expect(m3.step).toBe(3);
      expect(m3.roleResponsible).toBe('together');
      expect(m3.options?.[0].label).toContain('3 sekunder');
      expect(TOUCH_FUSION_DURATION_MS).toBe(3000);
      expect(TOUCH_FUSION_REQUIRED_TOUCHES).toBe(2);
    });

    it('krever multi-touch: 1 berøring avvises, 2 berøringer godkjennes', () => {
      // 1 finger (kun én person)
      const single = evaluateTouchFusion(3000, 1);
      expect(single.hasMultiTouch).toBe(false);
      expect(single.isCompleted).toBe(false);

      // 2 fingre (barnet og den voksne sammen)
      const dual = evaluateTouchFusion(3000, 2);
      expect(dual.hasMultiTouch).toBe(true);
      expect(dual.isCompleted).toBe(true);
      expect(dual.progressPercent).toBe(100);
    });

    it('beregner progress presist og krever fulle 3000 ms før fullføring', () => {
      // 0 ms -> 0 %
      expect(evaluateTouchFusion(0, 2).progressPercent).toBe(0);
      expect(evaluateTouchFusion(0, 2).isCompleted).toBe(false);

      // 1500 ms (halvveis) -> 50 %
      expect(evaluateTouchFusion(1500, 2).progressPercent).toBe(50);
      expect(evaluateTouchFusion(1500, 2).isCompleted).toBe(false);

      // 2000 ms (gammel feilaktig 2.0s grense) -> 67 % og IKKE fullført
      expect(evaluateTouchFusion(2000, 2).progressPercent).toBe(67);
      expect(evaluateTouchFusion(2000, 2).isCompleted).toBe(false);

      // 2900 ms -> 97 % og fremdeles ikke fullført
      expect(evaluateTouchFusion(2900, 2).progressPercent).toBe(97);
      expect(evaluateTouchFusion(2900, 2).isCompleted).toBe(false);

      // 3000 ms -> 100 % og fullført seier
      expect(evaluateTouchFusion(3000, 2).progressPercent).toBe(100);
      expect(evaluateTouchFusion(3000, 2).isCompleted).toBe(true);
    });
  });
```

### 4.4 Anbefalte tester til `src/test/askeladden.test.ts`
I `src/test/askeladden.test.ts`, under `describe('Familiepotten & Enhetsøkonomi')`, legg til:

```ts
    it('kobler fullføring av 3.0s berøringsfusjon mot Familiepotten (30 kr bonus)', () => {
      const advId = 'soljakten_reddet_lyset';
      expect(hasClaimedAdventureBonus(advId, TEST_DATE)).toBe(false);

      // Når 3.0s fusjon fullføres, tildeles fullføringsbonusen
      const res = claimAdventureBonus(advId, TEST_DATE);
      expect(res.success).toBe(true);
      expect(res.bonusAdded).toBe(30);

      // Bekrefter at familiepott-oversikten har registrert bonusen
      const summary = getFamilyPotSummary(TEST_DATE);
      expect(summary.hasCompletionBonus).toBe(true);
      expect(summary.completionBonusNok).toBe(30);
      expect(summary.totalHikeNok).toBe(30);
    });
```

### 4.5 Nødvendig fiks i `src/components/FamilieEventyrModal.tsx`
For at UI-komponenten skal respektere 3.0 sekunder og multi-touch:
```tsx
<<<<
  // Håndter 3-sekunders hold for Steg 3 (Sol-Fusjonen)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isHolding && currentStep === 3 && !isCompleted) {
      interval = setInterval(() => {
        setFusionHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval!);
            handleCompleteAdventure();
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    } else {
      setFusionHoldProgress(0);
    }
====
  // Håndter 3.0-sekunders hold for Steg 3 (Sol-Fusjonen: 3000 ms)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const TOTAL_DURATION_MS = 3000;
    const TICK_INTERVAL_MS = 100;
    const STEP_INCREMENT = (TICK_INTERVAL_MS / TOTAL_DURATION_MS) * 100; // 3.333 % per 100 ms

    if (isHolding && currentStep === 3 && !isCompleted) {
      interval = setInterval(() => {
        setFusionHoldProgress((prev) => {
          if (prev + STEP_INCREMENT >= 100) {
            clearInterval(interval!);
            handleCompleteAdventure();
            return 100;
          }
          return prev + STEP_INCREMENT;
        });
      }, TICK_INTERVAL_MS);
    } else {
      setFusionHoldProgress(0);
    }
>>>>
```
Og for multi-touch hendelseshåndterer (linje 498):
```tsx
<<<<
                    onTouchStart={() => setIsHolding(true)}
                    onTouchEnd={() => setIsHolding(false)}
====
                    onTouchStart={(e) => {
                      if (e.touches.length >= 2) {
                        setIsHolding(true);
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (e.touches.length < 2) {
                        setIsHolding(false);
                      }
                    }}
>>>>
```

---

## 5. Analyse 4: Sikring av 100 % grønne tester over alle 25 testsuiter (188+ tester)

### 5.1 Gjeldende teststatus
Kjøring av `npm test` (`vitest run`) bekrefter:
- **Test Files**: 25 passed (25)
- **Tests**: 188 passed (188)
- **Tid**: ~2,5 sekunder

### 5.2 Oversikt over alle 25 testsuiter og testantall
| # | Testfil | Antall tester | Kategori |
|---|---------|---------------|----------|
| 1 | `src/test/askeladden.test.ts` | 9 tester | Spillmotor / Askeladd |
| 2 | `src/test/economicAudit.test.ts` | 4 tester | Økonomisk revisjon |
| 3 | `src/test/aiChat.test.ts` | 5 tester | AI-assistent |
| 4 | `src/test/gpsRecommender.test.ts` | 17 tester | GPS & Rutevalg |
| 5 | `src/test/pointsLedger.test.ts` | 4 tester | To-pott hovedbok |
| 6 | `src/test/userJourney.test.ts` | 10 tester | Brukerreise |
| 7 | `src/test/engine.test.ts` | 38 tester | Solmotor kjerne |
| 8 | `src/test/arDrops.test.ts` | 5 tester | AR-dråper & Fløyen |
| 9 | `src/test/familieSpillflytFull.test.ts` | 1 test | End-to-end flyt |
| 10 | `src/test/account.test.ts` | 4 tester | Konto & Vipps auth |
| 11 | `src/test/trailDemand.test.ts` | 11 tester | Etterspørselsmotor |
| 12 | `src/test/seniorTouristSafety.test.ts` | 20 tester | Senior- & Turistsikkerhet |
| 13 | `src/test/grokUpgrades.test.ts` | 8 tester | Grok-optimaliseringer |
| 14 | `src/test/weather.test.ts` | 5 tester | Værvarsling & MET |
| 15 | `src/test/vipps.test.ts` | 7 tester | Vipps betaling & API |
| 16 | `src/test/cloudSync.test.ts` | 2 tester | Supabase sky-synk |
| 17 | `src/test/companions.test.ts` | 3 tester | Turfølge |
| 18 | `src/test/solAlarm.test.ts` | 3 tester | Sol-alarm |
| 19 | `src/test/natureQuest.test.ts` | 7 tester | Naturvokterne motor |
| 20 | `src/test/turItineraryBuilder.test.ts` | 3 tester | Turbygger & kalkyle |
| 21 | `src/test/trailStatus.test.ts` | 3 tester | Løypestatus |
| 22 | `src/test/stripeWebhook.test.ts` | 3 tester | Stripe webhooks |
| 23 | `src/test/familieEventyr.test.ts` | 4 tester | Familieeventyr motor |
| 24 | `src/test/weatherStrip.test.ts` | 2 tester | Opplett-radar |
| 25 | `src/test/sunPlace.test.ts` | 10 tester | Solplass & partnere |
| **Sum** | **25 testsuiter** | **188 tester** | **100 % grønne** |

### 5.3 Kritiske suksessfaktorer for å bevare 100 % grønne tester
1. **Mocking av `localStorage` i Node.js/Vitest**:
   Vitest kjører i et Node-miljø uten nativ `window.localStorage`. Testene polyfiller `localStorage` med in-memory `store` og kjører `localStorage.clear()` i `beforeEach()`. Nye tester i `familieEventyr.test.ts` må bevare denne polyfillen.
2. **Beskyttelse av `economicAudit.test.ts`**:
   `economicAudit.test.ts` demonstrerer eksplisitt hvordan `Date.now()` ville brutt idempotens. Testen oppretter sine egne nøkler direkte i testkroppen (`familie-eventyr-${Date.now() + i}`). Oppdatering av `App.tsx` og `familieSpillflytFull.test.ts` påvirker ikke `economicAudit.test.ts`, som forblir 100 % grønn.
3. **TypeScript- og Byggverifisering**:
   - `npx tsc --noEmit` må kjøre med 0 feil.
   - `npm run build` (`tsc && vite build`) transformerer 1752 moduler på ~2,6 sekunder uten feil.
4. **Ingen nettverksavhengighet i tester**:
   Alle tester er isolerte offline enhets- og integrasjonstester. Web Audio API, geolokasjon og Supabase er mocked eller pakket inn i trygge fallbacks.

---

## 6. Konklusjon og Anbefalte Neste Steg for Implementer

1. Oppdater `src/App.tsx:1355` til å benytte en deterministisk dato-låst nøkkel.
2. Oppdater `src/test/familieSpillflytFull.test.ts:98` til å benytte `familie-eventyr-${adv.id}-${today}` og legg til duplikatsjekk.
3. Eksporter `TOUCH_FUSION_DURATION_MS = 3000`, `TOUCH_FUSION_REQUIRED_TOUCHES = 2`, og `evaluateTouchFusion()` i `src/engine/familieEventyr.ts`.
4. Rett opp intervallet i `src/components/FamilieEventyrModal.tsx:75-83` fra 20 ticks (+5) til 30 ticks (+3.333 %) for ekte 3,0 sekunders holdetid, samt `e.touches.length >= 2`.
5. Utvid `src/test/familieEventyr.test.ts` og `src/test/askeladden.test.ts` med de nye testene for berøringsfusjon og multitouch.
6. Verifiser med `npm test && npm run build` (forventet: 192+ tester grønne over 25 suiter, 0 tsc-feil).
