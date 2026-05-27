# QA 05 — Popular Starters

## Purpose

Verify the popular starters chip row: API wiring, fallback to pantry defaults, deduplication, rendering, and that `app.js` uses the tested `popularChips.js` module rather than a silent local copy.

## Scope

- `app/js/popularChips.js` — `pickChipNames`, `renderPopularChips`, `STARTER_PANTRY_ITEMS`
- `app/js/app.js` — `loadPopularItems`, import wiring, `[data-sample]` click handler
- `app/js/api.js` — `getPopularItems`
- `src/worker.js` — `/api/popular-items` route presence
- `scripts/test_popular_items_generated.mjs`
- `scripts/test_frontend_dom.mjs` (chip rendering cases)
- `scripts/test_frontend_helpers.mjs` (`pickChipNames` cases)

## Out of scope

- AI generation triggered by chip click (QA 02)
- Storage (QA 08)

## Checklist

### 1. Test suite

- [ ] `node scripts/test_popular_items_generated.mjs` exits 0
- [ ] `node scripts/test_frontend_dom.mjs` exits 0 (includes chip render cases)
- [ ] `node scripts/test_frontend_helpers.mjs` exits 0 (includes `pickChipNames` cases)

### 2. `pickChipNames`

- [ ] Returns up to 5 unique names from API data
- [ ] Deduplicates by `normalizedName` key
- [ ] Respects a custom `limit` argument
- [ ] Falls back to `STARTER_PANTRY_ITEMS` on empty / blank / undefined input
- [ ] `STARTER_PANTRY_ITEMS` = `['Cream Cheese', 'Mayo', 'Mustard', 'Ketchup', 'Tomato Sauce']`

### 3. `renderPopularChips`

- [ ] Renders `button.chip` elements with `data-sample` and matching text
- [ ] Clears stale chips before re-render (no duplicates)
- [ ] Falls back to pantry starters when API data is empty
- [ ] All chips are `type="button"` elements

### 4. `app.js` wiring

- [ ] `app.js` imports `renderPopularChips` from `popularChips.js` (no local duplicate)
- [ ] `app.js` does NOT define its own `renderPopularChips` function
- [ ] `loadPopularItems` calls the imported `renderPopularChips`
- [ ] `[data-sample]` click handler calls `applySample` and routes to `#manual`
- [ ] Sample chip click gates on `canGenerate()` before proceeding

### 5. API fallback

- [ ] `getPopularItems` returns `{ ok: false, items: [] }` on network error
- [ ] `getPopularItems` returns `{ ok: false, items: [] }` on non-JSON response
- [ ] `loadPopularItems` calls `renderPopularChips([])` on any error (shows fallback starters)

### 6. Worker endpoint

- [ ] `/api/popular-items` route exists in `src/worker.js`

### 7. No regressions

- [ ] `npm test` passes
- [ ] `npm run build` passes

## Commands to run

```bash
node scripts/test_popular_items_generated.mjs
node scripts/test_frontend_dom.mjs
node scripts/test_frontend_helpers.mjs
npm test
npm run build
```

## Pass criteria

All checklist items checked. All commands exit 0. `app.js` uses `popularChips.js`, not a local copy.

## Failure response

1. Document the failing check and exact output.
2. Fix only popular-starters/chip-rendering issues.
3. Rerun the failing test.
