# Workflow Status

- Date: 2026-05-26
- Task: Complete manual MVP flow (typed product -> generate healthier homemade recipe -> render result -> save locally) without scanner/barcode/AI requirements.
- Required references read: `AGENTS.md`, `CLAUDE.md`, `.agents/skills/scratchnscan-build/SKILL.md`, `.agents/03-homemade-recipe-engine/AGENT.md`.
- Blocker noted: `AGENTS.md` references `.agents/skills/scan-scratch-build/SKILL.md`, but repository path is `.agents/skills/scratchnscan-build/SKILL.md`.

## File-level patch plan
1. Add deterministic product-name-first generator (`generateHealthierScratchRecipe`) and keep compatibility wrapper.
2. Fix manual submit runtime issues in `app/js/scan.js` (duplicate declarations, empty-name validation, fallback behavior, resilient error copy).
3. Ensure result view always renders recipe + health goal + why healthier and supports save/make another/history actions.
4. Ensure save behavior preserves manual source and optional/null barcode using existing IndexedDB helper.
5. Add/refresh lightweight Node tests for generator categories and save payload rules.
