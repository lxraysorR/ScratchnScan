# QA Report: 05 — Popular Starters

## Overview

| Field | Value |
|-------|-------|
| QA file | `docs/qa/05-popular-starters-qa.md` |
| Date | 2026-05-27 |
| Branch | `claude/nifty-maxwell-PINs1` |
| Tester | Claude Code (automated) |
| Overall status | **FIXED** |

## Commands run

```
node scripts/test_popular_items_generated.mjs
node scripts/test_frontend_dom.mjs
node scripts/test_frontend_helpers.mjs
npm test
npm run build
```

## Pass/fail results

| Command | Result | Notes |
|---------|--------|-------|
| `test_popular_items_generated.mjs` | PASS | All token checks |
| `test_frontend_dom.mjs` | PASS | 10/10 (includes chip rendering) |
| `test_frontend_helpers.mjs` | PASS | 21/21 (includes `pickChipNames`) |
| `npm test` | PASS | All 16 suites |
| `npm run build` | PASS | dist/ written |

## Checklist results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1.1 | `test_popular_items_generated.mjs` exits 0 | PASS | |
| 1.2 | `test_frontend_dom.mjs` exits 0 | PASS | |
| 1.3 | `test_frontend_helpers.mjs` exits 0 | PASS | |
| 2.1 | `pickChipNames` returns up to 5 unique names | PASS | |
| 2.2 | Deduplicates by `normalizedName` | PASS | |
| 2.3 | Respects custom `limit` | PASS | |
| 2.4 | Falls back to `STARTER_PANTRY_ITEMS` | PASS | |
| 2.5 | `STARTER_PANTRY_ITEMS` correct values | PASS | |
| 3.1 | Chips rendered as `button.chip[data-sample]` | PASS | |
| 3.2 | Clears stale chips before re-render | PASS | |
| 3.3 | Falls back to pantry starters on empty input | PASS | |
| 3.4 | All chips are `type="button"` | PASS | |
| 4.1 | `app.js` imports `renderPopularChips` from `popularChips.js` | PASS (after fix) | Was a local duplicate |
| 4.2 | `app.js` does NOT define its own `renderPopularChips` | PASS (after fix) | Local copy removed |
| 4.3 | `loadPopularItems` calls imported `renderPopularChips` | PASS | |
| 4.4 | `[data-sample]` click routes to `#manual` | PASS | `app.js wireGlobalActions` |
| 4.5 | Sample click gates on `canGenerate()` | PASS | `app.js:163` |
| 5.1 | `getPopularItems` → `{ ok: false, items: [] }` on network error | PASS | `test_frontend_helpers.mjs` |
| 5.2 | `getPopularItems` → `{ ok: false, items: [] }` on non-JSON | PASS | `test_frontend_helpers.mjs` |
| 5.3 | `loadPopularItems` calls `renderPopularChips([])` on error | PASS | `app.js:50–52` |
| 6.1 | `/api/popular-items` exists in `src/worker.js` | PASS | Line 752 |
| 7.1 | `npm test` passes | PASS | |
| 7.2 | `npm run build` passes | PASS | |

## Issues found

### Issue 1 — `app.js` defined its own `renderPopularChips` instead of importing from `popularChips.js` [Severity: Medium]

**Files:** `app/js/app.js`

**Description:** `app.js` contained a local copy of both `renderPopularChips` (lines 21–44) and `STARTER_PANTRY_ITEMS` (line 19) that duplicated the logic in `popularChips.js`. The app was using this untested local copy at runtime, while `test_frontend_dom.mjs` and `test_frontend_helpers.mjs` tested the exported `popularChips.js` versions.

Consequences:
1. **Tests passed but tested the wrong code.** Any bug in the `app.js` local copy (e.g. a divergence in deduplication logic or `STARTER_PANTRY_ITEMS` values) would be invisible to the test suite.
2. **Divergence risk.** The two implementations were functionally near-identical now, but would silently drift if either was changed independently.
3. **`app.js` used `document.createElement`** while `popularChips.js` uses `container.ownerDocument.createElement` — harmless in a real browser but a subtle difference that matters in test environments.

## Fixes made

### Fix 1 — Import `renderPopularChips` and `STARTER_PANTRY_ITEMS` from `popularChips.js`

**Files changed:** `app/js/app.js`

**What changed:**
- Added `import { renderPopularChips, STARTER_PANTRY_ITEMS } from "./popularChips.js";`
- Removed the 24-line local `renderPopularChips` function
- Removed the local `STARTER_PANTRY_ITEMS` constant

`loadPopularItems` and the initial `renderPopularChips([])` call are unchanged — they now call the imported module function. The imported `renderPopularChips` defaults its `container` argument to `document.getElementById("home-samples")`, so behaviour is identical.

The `test_popular_items_generated.mjs` token checks (`'STARTER_PANTRY_ITEMS'`, `'renderPopularChips'`) still pass because both names appear in the import statement.

## Files changed

- `app/js/app.js` — removed local duplicate; now imports from `popularChips.js`
- `docs/qa/05-popular-starters-qa.md` — created
- `docs/qa/reports/05-popular-starters-qa-report.md` — created

## Tests rerun after fix

| Command | Result |
|---------|--------|
| `node scripts/test_popular_items_generated.mjs` | PASS |
| `npm test` | PASS — all 16 suites |
| `npm run build` | PASS |

## Remaining issues

None from this scope.

## Recommended next QA file

`docs/qa/06-scanner-flow-qa.md`
