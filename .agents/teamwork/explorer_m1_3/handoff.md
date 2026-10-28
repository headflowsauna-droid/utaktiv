# Handoff Report — Explorer M1.3 (Idempotence & Test Consistency)

**Agent**: teamwork_preview_explorer (Instance 3, Milestone 1)  
**Target Path**: `/Users/alexr/Projects/Sol-Uteliv/.agents/teamwork/explorer_m1_3/handoff.md`  
**Reference Report**: `/Users/alexr/Projects/Sol-Uteliv/.agents/teamwork/explorer_m1_3/report.md`  
**Handoff Type**: Hard (Investigation complete, actionable implementation roadmap provided)  

---

## 1. Observation

1. **Non-deterministic key in `src/App.tsx:1355`**:
   Direct inspection of `src/App.tsx` (lines 1350–1358):
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
   Contrast with `SkattekisteModal` (line 1310: `idempotencyKey: 'skattekiste-${selectedCity}-${today}'`) and `FamilieEventyrModal` (line 1343: `idempotencyKey: 'familie-soljakten-${today}'`).

2. **Non-deterministic key in test suite `src/test/familieSpillflytFull.test.ts:98`**:
   Direct inspection of `src/test/familieSpillflytFull.test.ts` (lines 95–101):
   ```ts
   95:     const grantRes = creditEarnedLocal({
   96:       points: rewardPoints,
   97:       reason: 'checkin',
   98:       idempotencyKey: `familie-eventyr-${Date.now()}`
   99:     });
   100:     expect(grantRes.applied).toBe(15);
   101:     expect(earnedBalance()).toBe(15);
   ```

3. **Touch fusion hold timer bug in `src/components/FamilieEventyrModal.tsx:75-83`**:
   Direct inspection of `src/components/FamilieEventyrModal.tsx` (lines 74–83):
   ```tsx
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
   At +5 per 100 ms tick, `100 / 5 = 20` ticks. `20 * 100 ms = 2000 ms = 2.0 seconds`.  
   Requirement R1 in `ORIGINAL_REQUEST.md:12` and `PROJECT.md:23` requires **3.0 seconds** (3000 ms).  
   Additionally, touch handlers on line 498 (`onTouchStart={() => setIsHolding(true)}`) lack inspection of `e.touches.length >= 2`.

4. **Missing assertions in `src/test/familieEventyr.test.ts` and `src/test/askeladden.test.ts`**:
   `src/test/familieEventyr.test.ts` (lines 28–34) asserts:
   ```ts
   expect(SOLJAKTEN_EVENTYR.missions.length).toBe(3);
   expect(SOLJAKTEN_EVENTYR.missions[2].roleResponsible).toBe('together');
   ```
   Neither file asserts the 3.0s duration (3000 ms) nor multi-touch (2 simultaneous touch points).

5. **Test suite baseline**:
   Command `npx vitest run` output:
   `Test Files 25 passed (25)`  
   `Tests 188 passed (188)`  
   `Duration 2.50s`  
   Command `npx tsc --noEmit`: Exited with code 0.  
   Command `npm run build`: Exited with code 0 (`built in 2.67s`).

---

## 2. Logic Chain

1. **Premise**: In `src/engine/pointsLedger.ts:109`, duplicate detection evaluates `entries.some(entry => entry.idempotencyKey === input.idempotencyKey)`.
2. **Inference 1 (from Observation 1 & 2)**: Appending `${Date.now()}` produces a timestamp that changes every millisecond. Consequently, repeated clicks or duplicate invocations always bypass deduplication, violating Requirement R3 ("deterministisk dato-låst idempotens").
3. **Inference 2 (from Observation 1 & PROJECT.md:55)**: Replacing `naturequest-${today}-${Date.now()}` with `naturequest-${today}-${actionKey}` (or `naturequest-${today}`) locks points to that specific calendar day and quest event.
4. **Inference 3 (from Observation 2)**: Replacing `src/test/familieSpillflytFull.test.ts:98` with `familie-eventyr-${adv.id}-${today}` aligns the test with `PROJECT.md:55` (`adventure-bonus-${adventureId}-${dateKey}`) and permits asserting that an immediate duplicate call produces `applied: 0`.
5. **Inference 4 (from Observation 3 & 4)**: The timer in `FamilieEventyrModal.tsx` runs in 2.0 seconds instead of 3.0 seconds because it increments by 5 % each 100 ms. For 3000 ms with 100 ms ticks, the increment must be `(100 / 3000) * 100 = 3.333 %` (or 30 ticks). Exporting `TOUCH_FUSION_DURATION_MS = 3000` and `TOUCH_FUSION_REQUIRED_TOUCHES = 2` with `evaluateTouchFusion()` provides a testable engine contract that can be asserted in `familieEventyr.test.ts`.
6. **Inference 5 (from Observation 5)**: Because all 25 test files are offline and self-contained with mock fallbacks, introducing the proposed changes will retain 100 % pass rate across all suites while expanding coverage from 188 to 192+ tests.

---

## 3. Caveats

1. **NatureQuestModal prop signature**: Updating `onAddCoinsToWallet` to `(amount: number, actionKey?: string) => void` is backwards-compatible. If the implementer prefers a single-file change only in `src/App.tsx`, `idempotencyKey: 'naturequest-${today}'` can be used, but limits NatureQuest earnings to 1 checkin event per day.
2. **Desktop mouse vs Mobile touch**: On desktop browsers without touch screens, `onTouchStart` does not fire; users use `onMouseDown`. The multi-touch check (`e.touches.length >= 2`) applies strictly to touch events (`onTouchStart` / `onTouchEnd`), with mouse events left as single-pointer fallback for automated testing and desktop previews.
3. **`economicAudit.test.ts` preservation**: Do NOT remove `Date.now()` from `economicAudit.test.ts:42` — that test intentionally uses `Date.now()` to demonstrate why non-deterministic keys are dangerous.

---

## 4. Conclusion

1. **`src/App.tsx:1355`**: Replace `naturequest-${today}-${Date.now()}` with `naturequest-${today}-${actionKey}` (where `actionKey` defaults to `'generic'` or specific quest actions: `'solkastet'`, `'riddle'`, `'knapsack'`, `'chest'`).
2. **`src/test/familieSpillflytFull.test.ts:98`**: Replace `familie-eventyr-${Date.now()}` with `familie-eventyr-${adv.id}-${today}` and assert `duplicateRes.applied === 0`.
3. **Touch fusion & multi-touch**:
   - In `src/engine/familieEventyr.ts`: Export `TOUCH_FUSION_DURATION_MS = 3000`, `TOUCH_FUSION_REQUIRED_TOUCHES = 2`, and `evaluateTouchFusion()`.
   - In `src/components/FamilieEventyrModal.tsx:75-83`: Fix tick increment to 30 ticks (3000 ms), and inspect `e.touches.length >= 2` on `onTouchStart`.
   - In `src/test/familieEventyr.test.ts`: Add 3 unit tests verifying the 3000 ms duration, progress milestones (0%, 50%, 67%, 100%), and multi-touch requirement.
   - In `src/test/askeladden.test.ts`: Add 1 test linking touch fusion completion to the 30 kr completion bonus in `claimAdventureBonus` and `getFamilyPotSummary`.
4. **All 25 test suites will remain 100 % green** (expanding from 188 to 192+ passing tests).

---

## 5. Verification Method

To verify these findings and any subsequent implementation:

1. **Run project test suite**:
   ```bash
   npm test
   ```
   *Expected result*: 25/25 test files pass, >= 188 tests passing (192+ with new tests).
2. **Run TypeScript compiler check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected result*: Exit code 0, 0 errors.
3. **Run Vite production build**:
   ```bash
   npm run build
   ```
   *Expected result*: Exit code 0, all chunks rendered cleanly to `dist/`.
4. **Verify idempotency key grep**:
   ```bash
   git grep "Date.now()" src/App.tsx src/test/familieSpillflytFull.test.ts
   ```
   *Expected result*: 0 matches in production keys or family adventure flow.
5. **Invalidation condition**: Any regression in existing test suites, non-zero exit from `tsc`, or failure of `evaluateTouchFusion(3000, 2).isCompleted` to return `true`.
