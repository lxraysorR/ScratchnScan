# QA Report: 04 — Product Context

## Overview

| Field | Value |
|-------|-------|
| QA file | `docs/qa/04-product-context-qa.md` |
| Date | 2026-05-27 |
| Branch | `claude/nifty-maxwell-PINs1` |
| Tester | Claude Code (automated) |
| Overall status | **PASSED** |

## Commands run

```
node scripts/test_product_context_normalization_generated.mjs
node scripts/test_product_context_recipe_generated.mjs
npm test
npm run build
```

## Pass/fail results

| Command | Result | Notes |
|---------|--------|-------|
| `test_product_context_normalization_generated.mjs` | PASS | All assertions |
| `test_product_context_recipe_generated.mjs` | PASS | All assertions |
| `npm test` | PASS | All 16 suites |
| `npm run build` | PASS | dist/ written |

## Checklist results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1.1 | `test_product_context_normalization_generated.mjs` exits 0 | PASS | |
| 1.2 | `test_product_context_recipe_generated.mjs` exits 0 | PASS | |
| 2.1 | `'high'` → `confidence: 0.9` | PASS | |
| 2.2 | `'medium'` → `confidence: 0.65` | PASS | |
| 2.3 | `'low'` → `confidence: 0.35` | PASS | |
| 2.4 | Numeric `0.92` → `confidenceLabel: 'high'` | PASS | |
| 2.5 | Percent `65` → `confidence: 0.65` | PASS | |
| 2.6 | `null` → `confidence: null, confidenceLabel: 'unknown'` | PASS | |
| 3.1 | Nested `product.*` fields flattened | PASS | `product.name` → `productName` |
| 3.2 | `foodType` maps to `category` | PASS | |
| 3.3 | Unknown source normalizes to `'unknown'` | PASS | |
| 3.4 | `detectedIngredients`/`claims` are deduped arrays | PASS | |
| 3.5 | `sourceBasis` preserved as deduped array | PASS | |
| 3.6 | Manual context with productName → `confidenceLabel: 'medium'` | PASS | |
| 4.1 | Manual source → `needsManualCorrection` false | PASS | |
| 4.2 | Popular source → false | PASS | |
| 4.3 | Fallback source → false | PASS | |
| 4.4 | Photo + low confidence + no product data → true | PASS | |
| 5.1 | `contextToRecipeInput` returns all required fields | PASS | |
| 5.2 | Falls back to `category` when `productName` empty | PASS | |
| 6.1–6.5 | `mergeProductContexts` merge semantics | PASS (indirect) | Exercised via `test_generation_controller.mjs`; no direct unit test — see Remaining Issues |
| 7.1 | Photo context produces specific recipe | PASS | Pink salt chips recipe is specific |
| 7.2 | `originalProductName` is not "packaged food" | PASS | |
| 7.3 | No placeholder text in ingredients | PASS | |
| 7.4 | Empty context throws user-readable error | PASS | |
| 8.1 | `npm test` passes | PASS | |
| 8.2 | `npm run build` passes | PASS | |

## Issues found

None blocking. One low-severity coverage gap noted.

## Remaining issues

| ID | Description | Severity | Recommended action |
|----|-------------|----------|--------------------|
| D1 | `mergeProductContexts` has no dedicated unit test; it is only exercised indirectly through the generation controller integration test | Low | Add a focused unit test in a future Codex pass alongside other `productContext.js` test additions |

## Files changed

- `docs/qa/04-product-context-qa.md` — created

## Recommended next QA file

`docs/qa/05-popular-starters-qa.md`
