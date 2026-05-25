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
