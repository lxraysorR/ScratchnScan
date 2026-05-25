# Known Issues

Track active blockers, defects, and environment limitations.

## Open
- 2026-05-16: If worker AI secret (`GEMINI_API_KEY`) is missing, recipe generation falls back to local starter output by design.
- 2026-05-16: Referenced skill path `.agents/skills/scan-scratch-build/SKILL.md` is missing; closest existing file is `.agents/skills/scratchnscan-build/SKILL.md`.

## Resolved
- 2026-05-25: Manual-entry runtime crash risk fixed by explicitly resolving barcode in `scan.js` (draft barcode -> manual barcode -> `null`) so blank/omitted barcode does not throw.
- 2026-05-25: Added manual-entry draft barcode banner markup (`#draft-barcode`) and wiring so scan context is visible and clearable in package entry flow.
- 2026-05-25: Fixed missing `app.js` imports for `initPackageEntry()` and `refreshBarcodeBanner()`.
- 2026-05-25: Normalized AI recipe tips mapping so `simpleSwaps`, `whyLessProcessed`, and `storageTips` render in result tips UI.
- 2026-05-25: Fixed JavaScript module script failures by converting `scripts/app-status.js` and `scripts/agent-next-task.js` from CommonJS `require` usage to ESM imports.
- 2026-05-25: Added repository syntax gate (`npm run check:syntax`) and wired it into `npm test` and `npm run build` so syntax regressions fail CI checks early.
- 2026-05-25: `qa:smoke` now runs syntax checks for critical runtime files (`app.js`, `scan.js`, `packageEntry.js`, `result.js`, `history.js`, `app-status.js`, `agent-next-task.js`).
