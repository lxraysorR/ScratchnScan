# QA 07 — Result & Details UI

## Purpose

Verify the result view (`result.js`), details view (`details.js`), supporting HTML IDs, CSS classes, accordion wiring, save/favorite/delete actions, and XSS safety for user-supplied strings rendered via `innerHTML`.

## Scope

- `app/js/result.js` — `initResultView`, accordion, save flow
- `app/js/details.js` — `initDetailsView`, favorite/delete, accordion, photo visibility
- `app/js/labelTip.js` — `renderLabelLiteracyTips`, result-label-tip-slot
- `app/index.html` — result-* and details-* IDs
- `app/styles.css` — result/details CSS classes
- `scripts/test_result_details_ui_generated.mjs`

## Out of scope

- IndexedDB storage internals (QA 08)
- Scanner flow (QA 06)
- Generation flow (QA 02)

## Checklist

### 1. Test suite

- [ ] `node scripts/test_result_details_ui_generated.mjs` exits 0
- [ ] `test_result_details_ui_generated.mjs` is in `npm test`

### 2. HTML IDs — result view

- [ ] `result-badges`, `result-name`, `result-original`, `result-summary` exist
- [ ] `result-product-summary`, `result-understood-panel`, `result-quick-facts` exist
- [ ] `result-health-goal`, `result-why-block`, `result-why` exist
- [ ] `result-homemade-ingredients`, `result-homemade-steps` exist
- [ ] `result-tips-block`, `result-tips` exist
- [ ] `result-note`, `result-save-btn` exist
- [ ] `result-label-tip-slot` exists

### 3. HTML IDs — details view

- [ ] `details-badges`, `details-name`, `details-meta`, `details-date` exist
- [ ] `details-product-summary`, `details-understood-panel`, `details-quick-facts` exist
- [ ] `details-photo-row`, `details-front-photo`, `details-back-photo` exist
- [ ] `details-metrics` exist
- [ ] `details-summary`, `details-healthgoal` exist
- [ ] `details-why-block`, `details-why` exist
- [ ] `details-ingredients`, `details-steps` exist
- [ ] `details-tips-block`, `details-tips` exist
- [ ] `details-input`, `details-fallback-note` exist
- [ ] `details-favorite-btn`, `details-delete-btn` exist

### 4. CSS classes

- [ ] `.product-summary-card`, `.understood-panel`, `.quick-facts` exist in CSS
- [ ] `.sticky-action-bar`, `.accordion-toggle` exist in CSS

### 5. result.js — rendering contract

- [ ] No session record + no lastGeneratedRecord → redirects to `#manual`
- [ ] `renderAccordion` called with `true` (open by default) for ingredients and steps
- [ ] `renderAccordion` called with `false` (closed) for why-block and tips-block
- [ ] `sanitizePlaceholders` filters out placeholder strings from ingredients
- [ ] `result-note` uses `.textContent` (not innerHTML)
- [ ] `result-name` uses `.textContent` (not innerHTML)

### 6. details.js — rendering contract

- [ ] No record in IndexedDB → redirects to `#history`
- [ ] `escapeHtml` is defined and used for `ingredientsText` in the understood panel
- [ ] Photo row is hidden when neither front nor back image is present
- [ ] Photo figures are individually hidden when their image is absent
- [ ] Favorite toggle wires `details-favorite-btn` click
- [ ] Delete button calls `deleteMvpRecipe` and navigates to `#history`

### 7. XSS safety — innerHTML with user data

- [ ] `result.js` escapes `productContext.ingredientsText` before writing to `innerHTML`
- [ ] `result.js` has an `escapeHtml` helper (or imports one)
- [ ] `details.js` escapes `productContext.ingredientsText` before writing to `innerHTML` (already present)

### 8. No regressions

- [ ] `npm test` passes
- [ ] `npm run build` passes

## Commands to run

```bash
node scripts/test_result_details_ui_generated.mjs
npm test
npm run build
```

## Pass criteria

All checklist items checked. All commands exit 0.

## Failure response

1. Document failing command and full output.
2. Fix only result/details rendering issues — no storage, no generation, no scanner scope.
3. Rerun failing test.
