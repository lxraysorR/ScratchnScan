# Workflow Status

- Date: 2026-05-26
- Task: Fix critical manual-entry runtime bugs so typed-name fallback recipe generation always works without barcode/scanner/AI.
- Required references read: `AGENTS.md`, `CLAUDE.md`, `.agents/skills/scratchnscan-build/SKILL.md`, `.agents/03-homemade-recipe-engine/AGENT.md`.

## File-level patch plan
1. Fix route safety for optional `refreshBarcodeBanner` in `app/js/app.js`.
2. Fix manual submit stability in `app/js/scan.js` (barcode declaration order, photo-input currentTarget capture, fallback-first generation, AI-failure tolerance, optional barcode persistence, remove recipeError leftovers).
3. Add focused regression checks for the exact browser errors and fallback behavior.
4. Run `npm test` and `npm run build`.
