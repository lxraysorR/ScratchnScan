# QA Report: 03 — Photo Upload

## Overview

| Field | Value |
|-------|-------|
| QA file | `docs/qa/03-photo-upload-qa.md` |
| Date | 2026-05-27 |
| Branch | `claude/nifty-maxwell-PINs1` |
| Tester | Claude Code (automated) |
| Overall status | **FIXED** |

## Commands run

```
node scripts/test_frontend_dom.mjs
node scripts/test_frontend_helpers.mjs
npm test
npm run build
```

## Pass/fail results

| Command | Result | Notes |
|---------|--------|-------|
| `node scripts/test_frontend_dom.mjs` | PASS | 10/10 cases |
| `node scripts/test_frontend_helpers.mjs` | PASS | 21/21 cases |
| `npm test` | PASS (after fix) | Now includes both photo test files; 16 suites total |
| `npm run build` | PASS | dist/ written |

## Checklist results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1.1 | `test_frontend_dom.mjs` exits 0 | PASS | |
| 1.2 | `test_frontend_helpers.mjs` exits 0 | PASS | |
| 1.3 | Both in `npm test` | PASS (after fix) | Was missing — see Issue 1 |
| 2.1 | Front slot `data-photo="front"` | PASS | `index.html:190` |
| 2.2 | Front tile `data-photo-trigger="front"` | PASS | `index.html:191` |
| 2.3 | Front input `data-photo-input="front"`, `accept="image/*"`, `capture="environment"` | PASS | `index.html:199` |
| 2.4 | Front actions `data-photo-actions="front"` hidden by default | PASS | `index.html:200` |
| 2.5 | Replace button `data-photo-replace="front"` | PASS | `index.html:201` |
| 2.6 | Remove button `data-photo-remove="front"` | PASS | `index.html:202` |
| 2.7 | Back slot mirrors same structure | PASS | `index.html:205–219` |
| 3.1 | Front selection sets src, unhides preview, adds `has-photo`, shows actions | PASS | Verified by `test_frontend_dom.mjs` |
| 3.2 | Back selection is independent | PASS | Verified by `test_frontend_dom.mjs` |
| 3.3 | Replace updates `img.src` | PASS | Verified by `test_frontend_dom.mjs` |
| 3.4 | Remove clears src, hides preview, removes `has-photo`, hides actions | PASS | Verified by `test_frontend_dom.mjs` |
| 3.5 | Front/back previews independent | PASS | Verified by `test_frontend_dom.mjs` |
| 3.6 | `applyThumbToTile` no-op on missing slot | PASS | Verified by `test_frontend_dom.mjs` |
| 3.7 | `aria-label` flips Replace/Add | PASS | Verified by `test_frontend_dom.mjs` |
| 4.1 | `null` throws "Not an image file" | PASS | Verified by `test_frontend_helpers.mjs` |
| 4.2 | `{ type: 'text/plain' }` throws "Not an image file" | PASS | Verified by `test_frontend_helpers.mjs` |
| 4.3 | `{}` (no type) throws "Not an image file" | PASS | Verified by `test_frontend_helpers.mjs` |
| 5.1 | Clear form clears draft photos | PASS | `scan.js:156–160` — `resetDraftUi()` nulls both draft fields and calls `applyThumbToTile(which, null)` |
| 5.2 | Clear form calls `applyThumbToTile(which, null)` | PASS | `scan.js:100–103` |
| 5.3 | Remove button sets draft field to `null` | PASS | `scan.js:142–145` |
| 5.4 | Remove button shows correct toast | PASS | `scan.js:146` |
| 6.1 | File input value reset after selection | PASS | `scan.js:131` — `inputEl.value = ""` |
| 7.1 | `npm test` passes | PASS | |
| 7.2 | `npm run build` passes | PASS | |

## Issues found

### Issue 1 — `test_frontend_dom.mjs` and `test_frontend_helpers.mjs` excluded from `npm test` [Severity: Medium]

**File:** `package.json`

**Description:** Two existing test files that directly cover the photo upload stack were not included in the `npm test` script:

- `scripts/test_frontend_dom.mjs` — 10 tests covering `applyThumbToTile` (photo tile preview, replace, remove, aria-label flip, front/back independence, no-throw on missing slot) and `renderPopularChips` / `createLabelTip`
- `scripts/test_frontend_helpers.mjs` — 21 tests covering `compressImageFile` validation, `buildGenerationPayload`, `pickChipNames`, `scanCoordinator`, `scannerService`, and `api.js` error handling

Both files run cleanly on their own (`PASS — 10 cases` and `PASS — 21 cases`), but because they were omitted from `npm test`, a regression in `applyThumbToTile` or `compressImageFile` would be silent in any CI or QA run using `npm test`.

**Impact:** Photo tile and compression regressions undetected by default test run.

## Fixes made

### Fix 1 — Added both photo test files to `npm test`

**File changed:** `package.json`

**What changed:** Appended `&& node scripts/test_frontend_helpers.mjs && node scripts/test_frontend_dom.mjs` to the `test` script. Order: helpers first (pure Node, no jsdom), then DOM tests (jsdom). Both pass.

`npm test` now runs 16 test suites total (was 14).

## Files changed

- `package.json` — added `test_frontend_helpers.mjs` and `test_frontend_dom.mjs` to `npm test`
- `docs/qa/03-photo-upload-qa.md` — created (this QA file)
- `docs/qa/reports/03-photo-upload-qa-report.md` — created (this report)

## Tests rerun after fix

| Command | Result |
|---------|--------|
| `npm test` | PASS — 16 suites, includes 31 newly registered cases |
| `npm run build` | PASS |

## Remaining issues

None from this scope.

## Recommended next QA file

`docs/qa/04-product-context-qa.md`

## Recommended Codex prompt for unresolved issues

None needed.
