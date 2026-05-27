# QA Report: 07 — Result & Details UI

## Overview

| Field | Value |
|-------|-------|
| QA file | `docs/qa/07-result-details-ui-qa.md` |
| Date | 2026-05-27 |
| Branch | `claude/nifty-maxwell-PINs1` |
| Tester | Claude Code (automated) |
| Overall status | FIXED |

## Commands run

```
node scripts/test_result_details_ui_generated.mjs
npm test
npm run build
```

## Pass/fail results

| Command | Result | Notes |
|---------|--------|-------|
| `node scripts/test_result_details_ui_generated.mjs` | PASS | Existing test already green |
| `npm test` | PASS (after fix) | All 17 suites |
| `npm run build` | PASS | dist/ output clean |

## Checklist results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1.1 | `test_result_details_ui_generated.mjs` exits 0 | PASS | |
| 1.2 | `test_result_details_ui_generated.mjs` in `npm test` | PASS | Already present |
| 2 | All result-* HTML IDs exist | PASS | Verified in index.html |
| 3 | All details-* HTML IDs exist | PASS | Verified in index.html |
| 4 | Required CSS classes exist | PASS | |
| 5.1 | No record → redirects to `#manual` | PASS | result.js line 80 |
| 5.2 | Accordion open by default for ingredients/steps | PASS | `renderAccordion(..., true)` |
| 5.3 | Accordion closed by default for why/tips | PASS | `renderAccordion(..., false)` |
| 5.4 | `sanitizePlaceholders` filters placeholder strings | PASS | |
| 5.5 | `result-note` uses textContent | PASS | |
| 5.6 | `result-name` uses textContent | PASS | |
| 6.1 | No record → redirects to `#history` | PASS | details.js line 81 |
| 6.2 | `escapeHtml` used for ingredientsText in details.js | PASS | details.js line 111 |
| 6.3 | Photo row hidden when no images | PASS | details.js line 157 |
| 6.4 | Photo figures hidden individually | PASS | details.js lines 143–156 |
| 6.5 | Favorite toggle wired | PASS | details.js line 227 |
| 6.6 | Delete calls deleteMvpRecipe + navigates #history | PASS | details.js line 249 |
| 7.1 | result.js escapes ingredientsText in innerHTML | PASS (after fix) | Fixed |
| 7.2 | result.js has escapeHtml helper | PASS (after fix) | Fixed |
| 7.3 | details.js escapes ingredientsText | PASS | Was already correct |
| 8.1 | `npm test` passes | PASS | All 17 suites |
| 8.2 | `npm run build` passes | PASS | |

## Issues found

### Issue 1 — Medium: XSS risk — `result.js` interpolates user strings into innerHTML without escaping

**File:** `app/js/result.js`
**Description:** `result.js` interpolated `productContext.productName`, `productContext.ingredientsText`, and `productContext.claims` directly into `innerHTML` template literals without HTML-encoding. `details.js` already had `escapeHtml` and used it for `ingredientsText`, creating an inconsistency. The ingredients field is typed by the user into a `<textarea>`, so a crafted value like `<img src=x onerror=...>` would execute in the result view.
**Impact:** Stored-XSS vector via user's own textarea input reflected back in the result view. Low exploitability in a single-user offline app, but inconsistent with `details.js` and unsafe if the app is later extended with shared records.

## Fixes made

### Fix 1 — Add `escapeHtml` to `result.js` and apply to user strings in innerHTML

**Files changed:**
- `app/js/result.js`

**What changed:**
1. Added `escapeHtml` function (identical to the one in `details.js`):
```js
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```
2. Applied it to `productContext.productName`, `productContext.ingredientsText`, and `productContext.claims` in the `result-understood-panel` `innerHTML` build (the three places where user-supplied text is interpolated directly).

## Files changed

- `app/js/result.js` — added `escapeHtml`, applied to user strings in understood-panel innerHTML
- `docs/qa/07-result-details-ui-qa.md` — new QA file (this run)
- `docs/qa/reports/07-result-details-ui-qa-report.md` — this report

## Tests rerun after fixes

| Command | Result |
|---------|--------|
| `npm test` | PASS — all 17 suites |
| `npm run build` | PASS |

## Remaining issues

| ID | Description | Severity | Recommended action |
|----|-------------|----------|--------------------|
| R1 | `result.js` and `details.js` both interpolate `productContext.productName`, `brand`, `category`, `flavor` (from AI/scanner) into `product-summary` innerHTML without escaping | Low | Apply `escapeHtml` to all productContext fields used in innerHTML if sharing/export is added |

## Recommended next QA file

`docs/qa/08-storage-supabase-indexeddb-qa.md`

## Recommended Codex prompt for unresolved issues

```
In app/js/result.js and app/js/details.js, the product-summary card interpolates
productContext.productName, productContext.brand, productContext.category,
productContext.flavor, and productContext.source directly into innerHTML without
HTML-encoding. Apply escapeHtml() to each of these fields in both files, using
the escapeHtml function already defined in both files.
```
