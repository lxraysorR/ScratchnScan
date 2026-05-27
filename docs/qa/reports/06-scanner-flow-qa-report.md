# QA Report: 06 — Scanner Flow

## Overview

| Field | Value |
|-------|-------|
| QA file | `docs/qa/06-scanner-flow-qa.md` |
| Date | 2026-05-27 |
| Branch | `claude/nifty-maxwell-PINs1` |
| Tester | Claude Code (automated) |
| Overall status | FIXED |

## Commands run

```
node scripts/test_scan_submit_regression.mjs
node scripts/test_frontend_helpers.mjs
npm test
npm run build
```

## Pass/fail results

| Command | Result | Notes |
|---------|--------|-------|
| `node scripts/test_scan_submit_regression.mjs` | PASS (after fix) | Was failing before fix |
| `node scripts/test_frontend_helpers.mjs` | PASS | 21 cases |
| `npm test` | PASS (after fix) | All 17 suites |
| `npm run build` | PASS | dist/ output clean |

## Checklist results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1.1 | `test_scan_submit_regression.mjs` exits 0 | PASS | Fixed |
| 1.2 | `test_frontend_helpers.mjs` exits 0 (scanner/coordinator) | PASS | 21 cases |
| 1.3 | `test_scan_submit_regression.mjs` in `npm test` | PASS | Added to test chain |
| 2.1 | `barcode` declared with `const` in `handleSubmit` | PASS | Line 208 |
| 2.2 | `frontImagePreviewDataUrl` declared with `const` in `handleSubmit` | PASS | Line 239 |
| 2.3 | `backImagePreviewDataUrl` declared with `const` in `handleSubmit` | PASS | Line 240 |
| 2.4 | `barcode` passed into `runGenerationFlow` input | PASS | Line 243 |
| 2.5 | `barcode` NOT hardcoded as `null` in saved payload | PASS | |
| 2.6 | No dead declarations of unused variables in `handleSubmit` | PASS | Fixed (removed hasFrontImage/hasBackImage) |
| 3–8 | Scanner service statuses, normalizeBarcode, draft helpers, coordinator, packageEntry wiring, STATUS_COPY | PASS | Covered by test_frontend_helpers.mjs |
| 9.1 | `npm test` passes | PASS | |
| 9.2 | `npm run build` passes | PASS | |

## Issues found

### Issue 1 — Medium: Dead declarations left in `scan.js` after generationController extraction

**File:** `app/js/scan.js`
**Description:** `const hasFrontImage = !!frontImagePreviewDataUrl;` and `const hasBackImage = !!backImagePreviewDataUrl;` were declared in `handleSubmit` but never used. These variables were computed by `generationController.js` directly from the `photos` object after the generation record was extracted from `scan.js`.
**Impact:** Dead code; `test_scan_submit_regression.mjs` would flag them as misuse patterns.

### Issue 2 — Medium: `test_scan_submit_regression.mjs` not in `npm test`

**File:** `package.json`
**Description:** The regression guard for the scan submit flow existed but was never included in the test chain, so its failures were invisible to CI.
**Impact:** The broken pattern check could regress silently.

### Issue 3 — Medium: `test_manual_regressions_generated.mjs` had stale positive assertions

**File:** `scripts/test_manual_regressions_generated.mjs`
**Description:** Lines 19–20 positively asserted that `hasFrontImage` and `hasBackImage` were declared in `scan.js`. After Issue 1 was fixed (dead code removed), these assertions became blockers for `npm test`.
**Impact:** `npm test` failed after the correct fix to `scan.js`.

## Fixes made

### Fix 1 — Dead declarations removed from `scan.js`

**Files changed:**
- `app/js/scan.js`

**What changed:** Removed two dead declarations from `handleSubmit`:
```js
// REMOVED:
const hasFrontImage = !!frontImagePreviewDataUrl;
const hasBackImage = !!backImagePreviewDataUrl;
```
These are now computed inside `generationController.js` from the `photos` object.

### Fix 2 — `test_scan_submit_regression.mjs` added to `npm test`

**Files changed:**
- `package.json`

**What changed:** Appended `&& node scripts/test_scan_submit_regression.mjs` to the test script. The suite now runs as the 17th test in the chain.

### Fix 3 — `test_scan_submit_regression.mjs` rewritten for current architecture

**Files changed:**
- `scripts/test_scan_submit_regression.mjs`

**What changed:** The old version checked for `hasFrontImage`/`hasBackImage` declarations and the `source: "manual", barcode,` pattern on the `createSessionRecord` call (which moved to the controller). The new version:
- Asserts `barcode`, `frontImagePreviewDataUrl`, `backImagePreviewDataUrl` are declared with `const`
- Asserts `barcode` appears in the `runGenerationFlow` `input:` object
- Asserts `barcode: null` is not hardcoded
- Adds architecture comment explaining why `hasFrontImage`/`hasBackImage` are no longer scan.js concerns

### Fix 4 — Stale assertions converted to negative guards in `test_manual_regressions_generated.mjs`

**Files changed:**
- `scripts/test_manual_regressions_generated.mjs`

**What changed:** Lines 19–20 changed from positive `assert.match` to negative `assert.ok(!...)` guards, confirming that `hasFrontImage`/`hasBackImage` do NOT appear in `scan.js`. This turns them into regression guards against re-introducing the dead code.

## Files changed

- `app/js/scan.js` — removed dead `hasFrontImage` / `hasBackImage` declarations
- `package.json` — added `test_scan_submit_regression.mjs` to test chain
- `scripts/test_scan_submit_regression.mjs` — rewritten for current controller architecture
- `scripts/test_manual_regressions_generated.mjs` — stale positive assertions replaced with negative guards

## Tests rerun after fixes

| Command | Result |
|---------|--------|
| `npm test` | PASS — all 17 suites |
| `npm run build` | PASS |

## Remaining issues

None.

## Recommended next QA file

`docs/qa/07-result-details-ui-qa.md`

## Recommended Codex prompt for unresolved issues

N/A — all issues resolved.
