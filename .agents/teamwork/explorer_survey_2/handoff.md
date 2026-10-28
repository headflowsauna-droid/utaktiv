# Handoff Report: Domain Requirements R1, R2, R3 Survey & Feature Inventory

**Agent:** `explorer_survey_2`  
**Working Directory:** `/Users/alexr/Projects/Sol-Uteliv/.agents/teamwork/explorer_survey_2/`  
**Handoff Type:** Hard (Task complete)  
**Date:** 2026-10-27  

---

## 1. Observation

1. **Test Suite Status:**  
   Ran command `npx vitest run` in `/Users/alexr/Projects/Sol-Uteliv`.  
   Result: **25 test files passed (25), 188 tests passed (188)**, duration 2.33s.  
   Key test files include `src/test/askeladden.test.ts` (9 tests), `src/test/familieEventyr.test.ts` (4 tests), `src/test/familieSpillflytFull.test.ts` (1 test), `src/test/economicAudit.test.ts` (4 tests), and `src/test/arDrops.test.ts` (5 tests).

2. **R1: Asymmetric Family Co-op & Askeladd-sekk:**  
   - `src/engine/familieEventyr.ts:83-85`: `roleName: 'Lys-speideren (Barnet)'`, tagline: `«Pappa må lukke øynene – nå er det barnet som må finne hemmeligheten!»`.
   - `src/engine/familieEventyr.ts:101-105`: Adult role `Kart-leseren (Den voksne)` with `requiresChildSecret: true`. Instruction: `«Pappa, du vet ikke hvilket symbol barnet fant – spør barnet ditt nå!»`.
   - `src/engine/askeladden.ts:31-122`: `ASKELADD_ITEMS` defines 10 items including `tung_elvestein`, `krokete_einerkvist`, `krystallflis`, each with `askeladdCatchphrase: '«Jeg fant, jeg fant!» — «Hva fant du nå da?» — ...'`.
   - `src/components/FamilieEventyrModal.tsx:70-90`: Hold interval:
     ```ts
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
     ```
     At `prev + 5` per 100 ms, 100% is reached in 20 steps $\times$ 100 ms = **2000 ms (2.0 seconds)**, rather than 3.0 seconds. Furthermore, `onTouchStart={() => setIsHolding(true)}` (line 498) does not inspect `e.touches.length >= 2`.

3. **R2: 10 Talking Animals & 12-Month Wheel:**  
   - `src/engine/askeladden.ts:248-379`: Nøyaktig 10 dyr i `TALKING_ANIMALS`:
     1. `mikkel_rev` (659.25 Hz - E5)
     2. `ulvhedin_ugle` (440.0 Hz - A4)
     3. `notteliten_ekorn` (880.0 Hz - A5)
     4. `pinnsvinet_pigg` (523.25 Hz - C5)
     5. `kongeornen_audun` (783.99 Hz - G5)
     6. `trollfrosken` (392.0 Hz - G4)
     7. `hjorten_silkesvarten` (329.63 Hz - E4)
     8. `bamse_brakar` (220.0 Hz - A3)
     9. `tyve_skjaere` (987.77 Hz - B5)
     10. `fjellhunden_balder` (587.33 Hz - D5)
   - `src/components/FamilieEventyrModal.tsx:217-236`: `playTone(frequency)` uses Web Audio API `OscillatorNode` (triangle wave, gain decay, 100% offline).
   - `src/engine/askeladden.ts:134-232`: `FAIRY_TALES_12_MONTHS` defines 12 months with Asbjørnsen & Moe titles and prizes. July is flagged `isGrandFinale: true` with `Tinydome Spacecapsule (verdi: 95 000 kr)`. However, only Month 1 has an interactive 3-step puzzle mission script in `familieEventyr.ts`.

4. **R3: Watertight Unit Economy & Family Pot:**  
   - `src/engine/askeladden.ts:15-18`:  
     `MAX_TRAIL_COINS_PER_HIKE = 15;`  
     `ADVENTURE_COMPLETION_BONUS_NOK = 30;`  
     `MAX_TOTAL_HIKE_PAYOUT = 45;`  
   - `src/engine/askeladden.ts:479, 521`: Date-locked keys `trail-coin-${dateKey}-${next}` and `adventure-bonus-${adventureId}-${dateKey}`.
   - `src/engine/activities.ts:447-448`: Heit Bergen Sauna has `priceNok: 225, commissionNok: 35, directSaleAvailable: true` (0% discount).
   - `src/components/EidfjordPartnerModal.tsx:406, 431`: Ordinary prices 199 kr / 1 000 kr (0% discount).
   - `src/engine/arDrops.ts:191-204, 231-243`: Fløistuen Kafé & Skomakerstuen (coffee refill) and Høyt & Lavt (climbing gloves) have `pointsValue: 0` (100% partner-funded perks).
   - `src/engine/arDrops.ts:48-55, 245-255`: Grand prize `1/12 Eierandel i Tinydome Spacecapsule` (95 000 kr, Eidfjord/Hæreid, tinydome.no).

---

## 2. Logic Chain

1. **Premise:** The requirements R1, R2, R3 specify an asymmetric family game where a 5-year-old is "Lys-speideren", 10 talking animals give offline clues, and a strict unit economy caps payout at 45 kr per trip (15 coins + 30 kr bonus) with deterministic date-locking and 0% sauna discounts.
2. **From Observation 1:** All 188 automated tests across 25 suites pass, confirming that the current codebase is compiling and syntactically consistent.
3. **From Observation 2:** `familieEventyr.ts` and `askeladden.ts` directly fulfill the asymmetric role division, "Lys-speideren", "Jeg fant, jeg fant!" catchphrases, and natural items (`tung_elvestein`, `krokete_einerkvist`, `krystallflis`). However, the touch fusion timer in `FamilieEventyrModal.tsx` runs for only 2.0s rather than 3.0s, and multi-touch (`e.touches.length >= 2`) is not verified.
4. **From Observation 3:** All 10 talking animals and their specific audio frequencies exist in `askeladden.ts`, producing offline audio tones. The 12-month calendar wheel exists, but interactive multi-step puzzle scripts are currently only written for Month 1.
5. **From Observation 4:** The 15 coin cap, 30 kr completion bonus, max 45 kr total hike payout, 0% sauna discounts, 100% partner-funded gifts, and Tinydome 95 000 kr finale are implemented and tested in `askeladden.ts`, `arDrops.ts`, `activities.ts`, and `EidfjordPartnerModal.tsx`. Remaining gaps include lingering `Date.now()` calls in `App.tsx:1363` and `familieSpillflytFull.test.ts:98`, plus the potential double-grant of points in `FamilieEventyrModal.tsx:210-213`.

---

## 3. Caveats

1. **No Source Code Changes Made:** As an explorer agent with read-only constraints, no source code was modified.
2. **Production Bundle Verification:** The production archive `utaktiv-web.zip` (4.3 MB) contains the built assets. Any changes made in source will require running `npm run build` to update `dist/` and repackage `utaktiv-web.zip`.
3. **Real Device Multi-touch:** Multi-touch behavior was inspected statically in source code. Physical testing with 2 simultaneous touch fingers on iOS Safari / Android Chrome will be needed once the implementation is updated.

---

## 4. Conclusion

The core domain requirements R1, R2, and R3 are already substantially implemented in the codebase (16 features fully implemented, 4 features partial, 0 completely missing). The application architecture strongly aligns with the masterplan.

### Prioritized Action Items for Implementers:
1. **Fix Fusion Timer & Multi-touch:** In `FamilieEventyrModal.tsx:75-83`, adjust the interval to 3000 ms (e.g. `prev + 3.33` per 100 ms) and check `e.touches.length >= 2` for mobile devices.
2. **Add Permanent Family Quest Button:** Add a prominent button in `App.tsx` (next to `SkattekisteModal` / `SolCameraAR`) so users can open `FamilieEventyrModal` without needing URL query parameters (`?eventyr=1`).
3. **Eliminate Remaining `Date.now()` Idempotency Keys:** Update `App.tsx:1363` (NatureQuest) and `familieSpillflytFull.test.ts:98` to use date-locked keys.
4. **Harmonize Eventyr Completion Points:** Ensure `FamilieEventyrModal.tsx:210-214` does not double-credit points beyond the 45 kr total hike payout limit.
5. **Add Geofenced GPS Pins for the 10 Animals:** Add `lat`/`lng` coordinates to `TALKING_ANIMALS` in `askeladden.ts` and display them on `InteractiveMap.tsx`.

---

## 5. Verification Method

To independently verify all observations and test results:
1. **Run Full Test Suite:**
   ```bash
   npx vitest run
   ```
   Expected result: 25 test files passed, 188 tests passed.
2. **Verify Askeladden & Family Engine specifically:**
   ```bash
   npx vitest run src/test/askeladden.test.ts src/test/familieEventyr.test.ts src/test/familieSpillflytFull.test.ts src/test/economicAudit.test.ts
   ```
   Expected result: All 4 test files pass (18 tests total).
3. **Inspect Implementation Files:**
   - Review `/Users/alexr/Projects/Sol-Uteliv/.agents/teamwork/explorer_survey_2/report.md` for the line-by-line feature inventory.
   - Inspect `src/engine/askeladden.ts` for items, 10 animals, 12 months, and 15+30=45 kr limits.
   - Inspect `src/components/FamilieEventyrModal.tsx:70-90` for the touch fusion timer logic.
