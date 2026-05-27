# QA 04 — Product Context

## Purpose

Verify ProductContext normalization, confidence scoring, `needsManualCorrection`, `contextToRecipeInput`, and `mergeProductContexts` behave correctly for all source types (manual, photo, ai, popular, fallback).

## Scope

- `app/js/productContext.js` — all exported functions
- `scripts/test_product_context_normalization_generated.mjs`
- `scripts/test_product_context_recipe_generated.mjs`

## Out of scope

- Generation flow wiring (QA 02)
- Storage (QA 08)

## Checklist

### 1. Test suite

- [ ] `node scripts/test_product_context_normalization_generated.mjs` exits 0
- [ ] `node scripts/test_product_context_recipe_generated.mjs` exits 0

### 2. `normalizeConfidence`

- [ ] `'high'` → `{ confidence: 0.9, confidenceLabel: 'high' }`
- [ ] `'medium'` → `{ confidence: 0.65, confidenceLabel: 'medium' }`
- [ ] `'low'` → `{ confidence: 0.35, confidenceLabel: 'low' }`
- [ ] Numeric `0.92` → `{ confidence: 0.92, confidenceLabel: 'high' }`
- [ ] Percent `65` → `{ confidence: 0.65, confidenceLabel: 'medium' }`
- [ ] `null` → `{ confidence: null, confidenceLabel: 'unknown' }`

### 3. `normalizeProductContext`

- [ ] Nested `product.*` fields are flattened (`product.name` → `productName`)
- [ ] `foodType` maps to `category`
- [ ] `source` is lowercased and restricted to the allowed set
- [ ] Unknown source strings normalize to `'unknown'`
- [ ] `detectedIngredients` and `claims` are deduped arrays
- [ ] `sourceBasis` is preserved as a deduped array
- [ ] Manual context with productName and unknown confidence gets `confidenceLabel: 'medium'`

### 4. `needsManualCorrection`

- [ ] Manual source always returns `false`
- [ ] Popular source always returns `false`
- [ ] Fallback source always returns `false`
- [ ] Photo source with low confidence and no product data returns `true`
- [ ] Photo source with high confidence returns `false`

### 5. `contextToRecipeInput`

- [ ] Returns `productName`, `category`, `brand`, `flavor`, `ingredientsText`, `detectedIngredients`, `userPreferences`, `claims`, `confidenceLabel`
- [ ] Falls back to `category` if `productName` is empty

### 6. `mergeProductContexts`

- [ ] First non-empty `productName` wins
- [ ] First non-empty `ingredientsText` wins
- [ ] `detectedIngredients` and `claims` are union-merged (no duplicates)
- [ ] `sourceBasis` is union-merged
- [ ] Latest `confidence` / `confidenceLabel` wins (from last context)

### 7. Recipe from context

- [ ] Photo-based full context (pink salt chips) produces a specific, non-generic recipe
- [ ] `originalProductName` is the real product name, not "packaged food"
- [ ] No generic placeholder text in ingredients
- [ ] Empty productName context throws a user-readable error

### 8. No regressions

- [ ] `npm test` passes
- [ ] `npm run build` passes

## Commands to run

```bash
node scripts/test_product_context_normalization_generated.mjs
node scripts/test_product_context_recipe_generated.mjs
npm test
npm run build
```

## Pass criteria

All checklist items checked. All commands exit 0.

## Failure response

1. Document the failing check and exact output.
2. Fix only ProductContext normalization/enrichment issues.
3. Rerun the failing test.
