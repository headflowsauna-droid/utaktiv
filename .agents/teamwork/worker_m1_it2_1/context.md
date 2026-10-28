# Context for Worker M1_IT2_1 (Audit Remediation & Clean Packaging)

## Scope
Execute clean build and packaging:
1. Ensure `dist/` is fresh via `npm run build` (`tsc && vite build`).
2. Repackage `/Users/alexr/Desktop/utaktiv-web.zip` and `/Users/alexr/Projects/Sol-Uteliv/utaktiv-web.zip` cleanly without orphaned legacy bundles, including `.htaccess`, `api/`, and `Utaktiv.apk` so size is ~4.3 MB.
3. Verify all 27 test files (228 tests) pass green via `npx vitest run`.
4. Report output in handoff.md.
