import assert from 'node:assert/strict';
import { buildDeterministicScratchRecipe } from '../app/js/manualRecipe.js';

const recipe = buildDeterministicScratchRecipe({
  productName: 'boxed brownie mix',
  inputIngredients: 'flour, cocoa, sugar',
  notes: 'less sweet'
});
assert.equal(recipe.title.includes('boxed brownie mix'), true);
assert.equal(recipe.ingredients.length > 0, true);
assert.equal(recipe.steps.length > 0, true);
assert.equal(recipe.tips[0].includes('less sweet'), true);
console.log('Manual MVP fallback test passed.');
