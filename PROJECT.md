# Project: Utaktiv Soljakten og Skattejakten

## Architecture
- **Tech Stack**: React 18, TypeScript 5.7, Vite 6, Tailwind CSS, Leaflet, Three.js, Lucide React, Vitest.
- **Offline-First Hybrid State**: Native in-memory engine state + localStorage persistent keys (`utaktiv_askeladd_*`, `sol_uteliv_point_entries_v1`) + best-effort Supabase cloud sync (`cloudSync.ts`).
- **Two-Pot Economy**: Separated `purchased` vs `earned` ledger in `pointsLedger.ts`.
- **Audio Engine**: Zero-dependency Web Audio API oscillator tone synthesis (`AudioContext`, `OscillatorNode`, `GainNode`) and haptic vibration (`navigator.vibrate`).
- **Core Modules**:
  - `src/engine/askeladden.ts`: 10 Askeladd items, 10 animals with distinct frequencies (220 Hz - 987.77 Hz), 12-month fairy tale calendar with July Grand Finale, unit economy caps (15 coins / 30 kr bonus / 45 kr max total hike payout).
  - `src/engine/familieEventyr.ts`: `SOLJAKTEN_EVENTYR` asymmetric gameplay (Lys-speideren child observation, Kart-leseren adult riddle, 3-second touch fusion).
  - `src/components/FamilieEventyrModal.tsx`: 4-tab modal (`📖 Eventyret`, `🎒 Sekken`, `🦊 10 Dyr`, `📅 12 Mnd`), touch fusion, family pot status.
  - `src/components/SkattekisteModal.tsx`: 6-digit rolling combination lock, physical rebus stations (Bergen, Trondheim, Eidfjord).
  - `src/components/EidfjordPartnerModal.tsx`: Sjel & Gane and Heit Eidfjord Sauna partner integrations.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Asymmetrisk familiespill | Lys-speideren child role + Kart-leseren adult role | M1 | survey (R1) |
| 2 | 5-åringen som helten | "Lys-speideren" child discovers secret symbol | M1 | survey (R1) |
| 3 | Askeladd-sekken | 10 items with "Jeg fant, jeg fant!" catchphrase | M1 | survey (R1) |
| 4 | Naturgjenstander | Elvestein, einerkvist, krystallflis + 7 natural items | M1 | survey (R1) |
| 5 | Voksen må spørre barn | Adult cannot guess riddle alone without child secret | M1 | survey (R1) |
| 6 | 3-sekunders berøringsfusjon | Exact 3.0s hold timer + multi-touch for family touch fusion | M1 | survey (R1) |
| 7 | Hovedmeny-aksess | Én ren knapp på Skattejakten («Åpne Skattekisten 🔓») per brukerkrav, med direkte snarveier til Familieeventyret og AR innad i SkattekisteModal | M1 | survey (R1 - Brukerjustert) |
| 8 | 10 snakkende skogsdyr | 10 distinct animals with folkloric personalities | M1 | survey (R2) |
| 9 | Distinkte personligheter | Unique greetings, riddles, and rewards per animal | M1 | survey (R2) |
| 10 | Spesifikke lydfrekvenser | 220.00 Hz (A3) to 987.77 Hz (B5) frequencies | M1 | survey (R2) |
| 11 | Offline dialoger | 100% offline in-browser dialogues and tone synthesis | M1 | survey (R2) |
| 12 | Syntetisk lydarkitektur | Pure Web Audio API tone synthesis, zero network assets | M1 | survey (R2) |
| 13 | 12 mnd Asbjørnsen & Moe | Monthly rotating fairy tale wheel with July Grand Finale | M1 | survey (R2) |
| 14 | Maks 15 mynter på stien | Strict daily cap of 15 trail coins per hike | M1 | survey (R3) |
| 15 | 30 kr fullføringsbonus | 30 kr completion bonus to family pot | M1 | survey (R3) |
| 16 | Maks 45 kr totalt per tur | Combined hike payout cap of 45 kr (15 + 30) | M1 | survey (R3) |
| 17 | Dato-låst idempotens | Deterministic date-locked keys without non-deterministic Date.now() | M1 | survey (R3) |
| 18 | 0% saunarabatt & 35 kr provisjon | Regular prices for Heit Sauna (Bergen 225 kr, Eidfjord 199/1000 kr) | M1 | survey (R3) |
| 19 | 100% partner-finansierte gaver | Free coffee refill (Fløistuen), climbing gloves (Høyt & Lavt) | M1 | survey (R3) |
| 20 | Eidfjord finale (95 000 kr) | 1/12 ownership ticket in Tinydome Spacecapsule (95 000 kr) | M1 | survey (R3) |
| 21 | Test- og bygg-verifisering | 228/228 green tests over 27 suites, tsc, vite build, zip pack | M1 | survey (Acceptance) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Soljakten & Skattejakten Full Implementation Polish & Verification | Fulle krav R1, R2, R3: 3,0s berøringsfusjon & multitouch, ren enkeltknapp på Skattejakt-banneret med modal-snarveier for Familieeventyret per brukerkrav, idempotensrensing av Date.now(), 228/228 grønne tester, tsc/vite build, og utaktiv-web.zip | none | DONE |

## Key Outputs
- `src/engine/familieEventyr.ts`: `TOUCH_FUSION_DURATION_MS = 3000`, `TOUCH_FUSION_REQUIRED_TOUCHES = 2`, `evaluateTouchFusion`.
- `src/components/FamilieEventyrModal.tsx`: Reell 3000ms tidsdelta, multi-touch (`e.touches.length >= 2`), 750ms mobil ghost-click vern, desktop mus-fallback, persistent AudioContext med `child_success` og `victory`-fanfare, Lys-speideren og Kart-leseren statusmerker.
- `src/App.tsx`: Én ren og fokusert knapp i Skattejakt-kortet («Åpne Skattekisten 🔓») per eksplisitt brukerkrav, med direkte snarveier til Familieeventyret og AR-kamera innad i `SkattekisteModal`, samt fjerning av `Date.now()` i idempotensnøkler (`naturequest-${today}`).
- `src/test/`: 27 testsuiter med 228 automatiserte tester, 100 % grønne (`vitest run`).
- `dist/`: Fullstendig feilfri produksjonsbunt (`tsc && vite build`).
- `/Users/alexr/Desktop/utaktiv-web.zip`: Oppdatert 4.7 MB produksjonspakke verifisert.

## Interface Contracts
### `FamilieEventyrModal` ↔ `App.tsx`
- Prop `isOpen: boolean`, `onClose: () => void`.
- Prop `onAwardPoints: (points: number) => void` updates points ledger.
- Direct UI trigger button on home screen in `App.tsx` opens modal (`setIsFamilieEventyrOpen(true)`).

### `askeladden.ts` ↔ `pointsLedger.ts`
- `addTrailCoin(dateKey)` respects `MAX_TRAIL_COINS_PER_HIKE = 15`.
- `claimAdventureBonus(adventureId, dateKey)` respects `ADVENTURE_COMPLETION_BONUS_NOK = 30`.
- Combined payout capped at `MAX_TOTAL_HIKE_PAYOUT = 45`.
- Idempotency keys must be deterministic strings: `trail-coin-${dateKey}-${n}` and `adventure-bonus-${adventureId}-${dateKey}`.

## Code Layout
- `src/engine/`: Pure business logic and domain calculation modules.
  - `askeladden.ts`: Askeladd backpack, 10 animals, 12 months, family pot limits.
  - `familieEventyr.ts`: Asymmetric adventure definitions and state management.
  - `arDrops.ts`: AR drops, partner perks, Tinydome grand prize ticket.
  - `pointsLedger.ts`: Strict 2-pot ledger, daily caps, idempotency.
- `src/components/`: React UI components and modals.
  - `FamilieEventyrModal.tsx`: 4-tab family adventure modal.
  - `SkattekisteModal.tsx`: 6-digit rolling combination lock.
  - `EidfjordPartnerModal.tsx`: Partner profiles and menus.
- `src/test/`: 27 Vitest test suites (228 tester).
- `dist/`: Production build output.
- `/Users/alexr/Desktop/utaktiv-web.zip`: Production cPanel package with APK.
