import assert from 'node:assert/strict';
import {
  normalizeConfidence,
  normalizeProductContext,
  needsManualCorrection,
  contextToRecipeInput,
} from '../app/js/productContext.js';

assert.deepEqual(normalizeConfidence('high'), { confidence: 0.9, confidenceLabel: 'high' });
assert.deepEqual(normalizeConfidence('medium'), { confidence: 0.65, confidenceLabel: 'medium' });
assert.deepEqual(normalizeConfidence('low'), { confidence: 0.35, confidenceLabel: 'low' });
assert.deepEqual(normalizeConfidence(0.92), { confidence: 0.92, confidenceLabel: 'high' });
assert.deepEqual(normalizeConfidence(65), { confidence: 0.65, confidenceLabel: 'medium' });
assert.deepEqual(normalizeConfidence(null), { confidence: null, confidenceLabel: 'unknown' });

const workerMapped = normalizeProductContext({
  product: {
    name: 'Krinkle Cut Pink Salt Potato Chips',
    foodType: 'potato chips',
    confidence: 'high',
    sourceBasis: ['front_label', 'ingredients_label'],
  },
  source: 'ai',
});
assert.equal(workerMapped.productName, 'Krinkle Cut Pink Salt Potato Chips');
assert.equal(workerMapped.category, 'potato chips');
assert.equal(workerMapped.confidence, 0.9);
assert.equal(workerMapped.confidenceLabel, 'high');
assert.deepEqual(workerMapped.sourceBasis, ['front_label', 'ingredients_label']);

const manualCtx = normalizeProductContext({
  productName: 'potato chips',
  ingredientsText: 'potatoes, oil, pink salt',
  source: 'manual',
});
assert.equal(manualCtx.source, 'manual');
assert.equal(manualCtx.productName, 'potato chips');
assert.equal(manualCtx.ingredientsText, 'potatoes, oil, pink salt');
assert.equal(needsManualCorrection(manualCtx), false);

const weakPhoto = normalizeProductContext({
  source: 'photo',
  sourceBasis: ['front_label'],
  confidence: 'low',
});
assert.equal(needsManualCorrection(weakPhoto), true);

const popularCtx = normalizeProductContext({
  source: 'popular',
  sourceBasis: ['popular_starter'],
  productName: 'Potato Chips',
  category: 'snack',
});
assert.equal(popularCtx.source, 'popular');
assert.ok(popularCtx.sourceBasis.includes('popular_starter'));
assert.equal(needsManualCorrection(popularCtx), false);

const recipeInput = contextToRecipeInput(normalizeProductContext({
  productName: 'Potato Chips',
  category: 'snack',
  ingredientsText: 'potatoes, oil',
  detectedIngredients: ['potatoes'],
  userPreferences: 'less salt',
  claims: ['gluten free'],
  confidence: 'medium',
  source: 'photo',
}));
assert.equal(recipeInput.productName, 'Potato Chips');
assert.equal(recipeInput.category, 'snack');
assert.equal(recipeInput.ingredientsText, 'potatoes, oil');
assert.deepEqual(recipeInput.detectedIngredients, ['potatoes']);
assert.equal(recipeInput.userPreferences, 'less salt');
assert.deepEqual(recipeInput.claims, ['gluten free']);
assert.equal(recipeInput.confidenceLabel, 'medium');

console.log('ProductContext normalization tests passed.');
