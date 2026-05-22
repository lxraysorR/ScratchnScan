# Workflow Status

- Date: 2026-05-22
- Task: Manual-entry MVP completion (manual -> result -> save -> history -> details) with local persistence fallback.
- Required references read: `AGENTS.md`, `CLAUDE.md`, `.agents/skills/scratchnscan-build/SKILL.md`, `.agents/04-ux-and-mobile-flow/AGENT.md`, `docs/MVP_SCOPE.md`.
- Note: `AGENTS.md` references `.agents/skills/scan-scratch-build/SKILL.md`; repository contains `.agents/skills/scratchnscan-build/SKILL.md`.

## File-level patch plan
1. Update `app/index.html` view IDs and nav for required `view-manual`, `view-history`, and `view-details` flow.
2. Update SPA routing in `app/js/app.js` to route `#manual`, `#history`, and `#details/:id`.
3. Add deterministic manual fallback recipe builder in a small reusable module.
4. Repair `app/js/scan.js`, `app/js/history.js`, `app/js/details.js` around consistent data shape and CRUD actions.
5. Extend `app/js/localDb.js` with small backwards-compatible helpers for favorite/delete/update and cache/event stubs.
6. Add lightweight Node tests for fallback recipe creation and localDb helper contracts in `scripts/test_app_shell.mjs` and `scripts/test_manual_mvp.mjs`.
7. Fix build shell copy behavior so JS modules are included in `dist/`.
8. Update README only for MVP local usage and no-key fallback behavior.
