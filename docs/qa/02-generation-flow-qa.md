# QA 02 — Generation Flow

## Purpose

Verify the end-to-end generation flow: manual entry submission, loading state lifecycle, AI path, deterministic fallback path, error and timeout paths, and the correction-needed path for photo-only submissions.

## Scope

- `app/js/generationController.js` — `runGenerationFlow`
- `app/js/scan.js` — `handleSubmit`, validation, loading UI
- `app/js/api.js` — `generateScratchRecipe` (AI path)
- `app/js/manualRecipe.js` — `buildDeterministicScratchRecipe` (fallback)
- `app/js/recipeGenerator.js` — recipe template matching
- `app/js/productContext.js` — `normalizeProductContext`, `needsManualCorrection`
- `scripts/test_generation_flow_generated.mjs`
- `scripts/test_generation_controller.mjs`

## Out of scope

- Photo capture/compression (QA 03)
- Storage/save (QA 08)
- Scanner/barcode (QA 06)
- Result/details rendering (QA 07)

## Checklist

### 1. Test suite — generation flow

- [ ] `node scripts/test_generation_flow_generated.mjs` exits 0
- [ ] `node scripts/test_generation_controller.mjs` exits 0
- [ ] `node scripts/test_manual_flow.mjs` exits 0
- [ ] `node scripts/test_manual_mvp.mjs` exits 0
- [ ] `node scripts/test_manual_mvp_generated.mjs` exits 0

### 2. Success path (AI response)

- [ ] Valid AI JSON response routes to `#result`
- [ ] `sessionStorage.scratchnscan:lastGenerated` is written
- [ ] `fallbackUsed` is `false` when AI returns a recipe
- [ ] Recipe title from AI is used
- [ ] Loading state is cleared (scan-loading is hidden)
- [ ] Submit button is re-enabled

### 3. Fallback path (network/AI unavailable)

- [ ] Network failure still produces a deterministic result (routes to `#result`)
- [ ] `fallbackUsed` is `true`
- [ ] Fallback recipe has no placeholder ingredient text (no "base ingredient" or "placeholder")
- [ ] Recipe title matches the product category (e.g., "granola" input → oat/cereal themed title)
- [ ] Loading state is cleared

### 4. Empty input validation

- [ ] Submitting with no product name, no ingredients, no photo, and no barcode shows error
- [ ] Error message mentions "product name, ingredient list, package photo, or starter"
- [ ] User stays on `#manual`

### 5. Error path

- [ ] A failure after AI/fallback step shows a friendly error message in `#scan-error`
- [ ] Retry button is shown
- [ ] User input is preserved after error
- [ ] User stays on `#manual`
- [ ] A `console.error` diagnostic is logged (not timeout path)

### 6. Timeout path

- [ ] A hung AI request exits loading with "taking longer" message
- [ ] Retry button is shown
- [ ] User stays on `#manual`

### 7. Photo-only correction path

- [ ] Photo-only input with low-confidence AI response shows correction message
- [ ] Correction message mentions "could not confidently identify"
- [ ] Loading state is cleared
- [ ] User is NOT routed to `#result`

### 8. Progress component

- [ ] Progress renders one row per generation stage
- [ ] Stage 1 is active on start
- [ ] Stage title updates as stages advance
- [ ] Stage marks done as progress advances
- [ ] Advancing past final stage does not crash (holds on final)
- [ ] `stop()` is idempotent (safe to call twice)

### 9. AI response contract

- [ ] `generationController` reads `ai.recipe.homemadeAlternative` for recipe
- [ ] `generationController` reads `ai.recipe.product` for product context
- [ ] `buildTipsFromAiRecipe` converts `tips`, `simpleSwaps`, `whyLessProcessed`, `storageTips` into flat strings
- [ ] `whyCleaner` array is read as `scratchRecipe.whyHealthier`
- [ ] Missing AI fields do not crash (graceful defaults)

### 10. No regressions

- [ ] `npm test` passes after any fixes
- [ ] `npm run build` passes after any fixes

## Commands to run

```bash
node scripts/test_generation_flow_generated.mjs
node scripts/test_generation_controller.mjs
node scripts/test_manual_flow.mjs
node scripts/test_manual_mvp.mjs
node scripts/test_manual_mvp_generated.mjs
npm test
npm run build
```

## Pass criteria

All checklist items checked. All test scripts exit 0.

## Failure response

1. Document failing command and full output.
2. Fix only generation/loading/fallback/error issues — no other scope.
3. Rerun failing test.
4. If unfixable, mark BLOCKED and document why.
