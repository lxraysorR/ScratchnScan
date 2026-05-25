# ScratchnScan QA Report

## Run metadata

- Date: 2026-05-25
- Branch: `claude/affectionate-sagan-cVfzC`
- OS: Linux 6.18.5 x86_64 (Claude Code on-the-web sandbox)
- Node: v22.22.2
- Browser: Not available in this sandbox. Browser-only behavior is
  flagged as **Not Tested Here** below.

## Commands run

| Command | Result |
| --- | --- |
| `npm install` | PASS (no new dependencies were added) |
| `npm test` | PASS — app shell + usage meter + manual fallback + UI tokens (including draft barcode banner and optional barcode-safe generation path) |
| `npm run qa:smoke` | PASS — required files and scripts present |
| `npm run app:status` | PASS — script runs under ESM (no `require` runtime error) |
| `npm run agent:next` | PASS — script runs under ESM (no `require` runtime error) |
| `npm run check:syntax` | PASS — recursive `node --check` across `app/`, `src/`, `scripts/` |
| `npm run build` | PASS — guarded by syntax check, then `dist/` written |
| `npm run qa:flow` | PASS — aggregate QA flow gate succeeds |
| `node scripts/test_manual_mvp.mjs` | PASS |
| `node scripts/test_manual_mvp_generated.mjs` | PASS |
| `node scripts/test_n8n_repo_access_generated.mjs` | PASS |
| `node --check app/js/*.js` | PASS (all modules parse) |
| `npx --yes serve dist --listen 3000` + `curl` of `/`, `/styles.css`, `/js/app.js`, `/js/usage.js`, `/js/packageImages.js` | All HTTP 200 |

## Static QA verification (in this sandbox)

| Area | Result | Notes |
| --- | --- | --- |
| 1. App startup (server returns HTML/JS/CSS) | PASS | All assets HTTP 200 |
| 2. Home screen markup | PASS | Brand, hero copy, "Start with a packaged food", samples, `home-usage-strip` |
| 3. Package entry markup | PASS | Front/back photo slots, product name, ingredients, preference, samples |
| 4. Photo-first UX | PASS | `photo-slot`, `photo-input`, `photo-actions` (Replace/Remove) all present |
| 5. Manual product entry validation copy | PASS | `Add a product name or quick note…` |
| 6. Ingredients / preference fields | PASS | `ingredients-input`, `dietary-input` |
| 7. Sample chips | PASS | Mayonnaise, Ranch, Ketchup, Mac & cheese, Granola bar on both home + manual |
| 8. Homemade generation logic | PASS | Pure-function fallback covered by `test_manual_mvp.mjs` |
| 9. Free generation counter helpers | PASS | `test_usage_meter.mjs` covers initial state, partial, last-one, blocked, premium unlock |
| 10. Upgrade gate route | PASS | `view-upgrade` markup, copy ("Keep creating homemade swaps"), $4.99 / $29.99 placeholder, three buttons (Upgrade coming soon / View saved ideas / Edit existing recipes) |
| 11. IndexedDB schema | PASS | DB version bumped to 4; `scratchnscan_usage_meter` store added with a singleton row |
| 12. History screen markup | PASS | `history-list`, empty state, fav/delete affordances |
| 13. Details screen markup | PASS | Front/back photo figures, recipe blocks, source note, favorite/delete/back |
| 14. Favorite / delete behaviors | PASS | Source check: `toggleMvpFavorite`, `deleteMvpRecipe` used in both `history.js` and `details.js` |
| 15. Reload persistence | Not Tested Here | Requires a real browser session — see manual checklist |
| 16. Mobile layout (360–414px) | Not Tested Here | Static CSS reviewed; tile, grid, bottom-nav max-widths match spec |
| 17. Desktop preview layout | Not Tested Here | Static CSS reviewed; `@media (min-width: 720px)` boxes the shell |
| 18. Console errors during normal flow | Not Tested Here | No `console.error` calls remain in normal flow; only `console.warn` in error paths |
| 19. Build / test scripts | PASS | See command table above |
| 20. Documentation accuracy | PASS | README, DEMO_SCRIPT, COMPLETION_CHECKLIST, MVP_READINESS_REPORT updated to match |

## Manual browser QA

The Claude Code on-the-web environment does not include a browser
runtime, so the manual tests below must be executed by Lamar before the
demo. The corresponding code paths are wired and unit-tested.

| Test | Status | Notes |
| --- | --- | --- |
| 1 Home screen | Pending manual | Markup and copy verified statically |
| 2 Package entry | Pending manual | Photo tiles + form verified statically |
| 3 Required product name | Pending manual | Validation copy + early return present in `scan.js` |
| 4 Sample chip | Pending manual | `applySample` covers name + ingredients + preference |
| 5 Generation | Pending manual | Both AI + fallback branches covered; counter increments only after success |
| 6 Save and details | Pending manual | `saveMvpRecipe` + `getMvpRecipeById` + details render verified statically |
| 7 Favorite | Pending manual | `toggleMvpFavorite` toggles and re-renders |
| 8 Delete | Pending manual | `window.confirm` + `deleteMvpRecipe`, then route back to history |
| 9 Free generation limit | Pending manual | Helper tests cover state transitions; UI strip + gate verified statically |
| 10 Reload persistence | Pending manual | IndexedDB only; no in-memory state needed across reloads |
| 11 Mobile layout (360 / 375 / 390 / 414) | Pending manual | Layout uses `max-width: 480px` shell + photo grid `1fr 1fr` |
| 12 Desktop preview | Pending manual | `@media (min-width: 720px)` wraps the shell with a card |
| 13 Scanner behavior | Pending manual | Scanner button shows toast only; manual entry remains the only path |

## Bugs found / fixed during QA

- Fixed broken ESM runtime scripts: `scripts/app-status.js` and
  `scripts/agent-next-task.js` were using CommonJS `require` despite
  `"type": "module"`.
- Added syntax gating to prevent regressions:
  - new `scripts/check-js-syntax.mjs`
  - `npm test` and `npm run build` now fail on syntax errors
  - `qa:smoke` now explicitly syntax-checks critical runtime files.

## Blockers

- None. The MVP runs locally end-to-end.

## Remaining risks

- Photo capture in browsers that decline `capture="environment"` falls
  back to a regular file picker. Acceptable for demo; native flow will
  use a dedicated capacitor camera plugin.
- Very large source images may produce data URLs in the hundreds of KB
  range. We compress to ~720px longest edge before storage; further
  trimming can move to a blob store later.
- The deterministic fallback recipe may run if the AI worker is
  unavailable. It is clearly labeled "Starter suggestion" — confirm
  this is acceptable for the demo narrative.
- Browser-only manual tests still need to be run by a human on real
  hardware (see table above).

## Final recommendation

**Demo-ready with caveats.** All scripted tests pass and the static QA
checks line up with the task specs. Before the demo, Lamar should run
through the manual checklist on a real device to confirm the photo
capture path, reload persistence, and small-screen layout.

## Suggested next task

Native packaging + on-device scanner QA (Capacitor + ML Kit) so the
"Scan a package" entry path graduates from placeholder to real.
