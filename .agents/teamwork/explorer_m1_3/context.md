# Context for Explorer M1_3 (Idempotence & Test Consistency)

## Role
Investigate exact changes needed in `src/App.tsx:1363` (NatureQuest) and `src/test/familieSpillflytFull.test.ts:98` to eliminate `Date.now()` in idempotency keys, and verify that all 25 test suites (188 tests) remain 100% green with `npx vitest run`.
