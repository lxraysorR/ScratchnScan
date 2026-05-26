# Workflow Status

- Date: 2026-05-25
- Task: Repair manual-entry MVP runtime issues so barcode/manual flow is stable and test/build/QA commands pass.
- Required references read: `AGENTS.md`, `CLAUDE.md`, `.agents/skills/scratchnscan-build/SKILL.md`, `.agents/04-ux-and-mobile-flow/AGENT.md`, `.agents/05-testing-security-release/AGENT.md`.
- Blocker noted: `AGENTS.md` references `.agents/skills/scan-scratch-build/SKILL.md`, but repository path is `.agents/skills/scratchnscan-build/SKILL.md`.

## File-level patch plan
1. Add a visible draft barcode banner (and optional manual UPC field) in `app/index.html` so the manual-entry flow can carry scan/manual barcode context.
2. Fix `app/js/app.js` imports for package-entry initializers (`initPackageEntry`, `refreshBarcodeBanner`) and make route initialization safe.
3. Fix `app/js/scan.js` barcode sourcing and imports so barcode resolution is explicit and optional (draft -> manual input -> null).
4. Normalize AI recipe fields from worker shape (`simpleSwaps`, `whyLessProcessed`, `storageTips`) into frontend tips rendering without breaking deterministic fallback.
5. Add/adjust lightweight regression checks in existing test scripts for draft barcode banner token and optional-barcode safety.
6. Run required verification commands: `npm test`, `npm run qa:smoke`, `npm run build`; then update MVP docs with current state.
