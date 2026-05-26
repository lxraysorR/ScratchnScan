import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateHealthierScratchRecipe } from '../app/js/recipeGenerator.js';

const recipe = generateHealthierScratchRecipe({
  productName: 'Krinkle Cut Pink Salt Potato Chips',
  brand: 'Kettle Brand / Kirkland Signature',
  category: 'potato chips',
  flavor: 'pink salt',
  ingredientsText: 'potatoes, vegetable oil, pink salt',
  detectedIngredients: ['potatoes', 'vegetable oil', 'pink salt'],
  claims: ['gluten free', 'non-GMO ingredients'],
  source: 'photo',
});

const blob = JSON.stringify(recipe).toLowerCase();
assert.match(blob, /potato/);
assert.match(blob, /pink salt/);
assert.match(blob, /chips?/);
assert.match(blob, /bake|air-fry|air fry/);
assert.doesNotMatch(recipe.originalProductName.toLowerCase(), /packaged food/);
assert.doesNotMatch(blob, /main base ingredient/);
assert.doesNotMatch(blob, /whole-food flavor ingredient/);

const html = readFileSync('app/index.html', 'utf8');
const healthGoalCount = (html.match(/<h3>Health goal<\/h3>/g) || []).length;
assert.equal(healthGoalCount, 1, 'Health goal heading should appear once in result view');

let failed = false;
try {
  generateHealthierScratchRecipe({});
} catch (err) {
  failed = /type a packaged food name first/i.test(String(err?.message || ''));
}
assert.equal(failed, true, 'no-product context must ask for manual details');

console.log('Product-context recipe regression tests passed.');
