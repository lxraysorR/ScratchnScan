import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';

const { buildDeterministicScratchRecipe } = await import('../app/js/manualRecipe.js');
const {
  clearLocalData,
  saveMvpRecipe,
  getMvpHistory,
  getMvpRecipeById,
  toggleMvpFavorite,
  deleteMvpRecipe,
} = await import('../app/js/localDb.js');

await clearLocalData();

const fallback = buildDeterministicScratchRecipe({
  productName: 'boxed mac and cheese',
  inputIngredients: 'wheat flour, palm oil, whey',
  notes: 'less salty please',
});

assert.equal(typeof fallback.title, 'string');
assert.ok(Array.isArray(fallback.ingredients) && fallback.ingredients.length > 0);
assert.ok(Array.isArray(fallback.steps) && fallback.steps.length > 0);
assert.ok(Array.isArray(fallback.tips));

const id = await saveMvpRecipe({
  productName: 'boxed mac and cheese',
  ingredientsText: 'wheat flour, palm oil, whey',
  notes: 'less salty please',
  scratchRecipe: fallback,
  recipeTitle: fallback.title,
  recipeIngredients: fallback.ingredients,
  recipeSteps: fallback.steps,
  recipeTips: fallback.tips,
  fallbackUsed: true,
});

assert.equal(typeof id, 'string');

const one = await getMvpRecipeById(id);
assert.ok(one, 'saved record should be retrievable by id');
assert.equal(one.productName, 'boxed mac and cheese');
assert.equal(one.fallbackUsed, true);
assert.equal(one.favorite, false);
assert.ok(Array.isArray(one.recipeIngredients) && one.recipeIngredients.length > 0);
assert.ok(Array.isArray(one.recipeSteps) && one.recipeSteps.length > 0);
assert.ok(Array.isArray(one.recipeTips) && one.recipeTips.length > 0);

const history = await getMvpHistory();
assert.equal(history.length >= 1, true);
assert.equal(history[0].id, id);

await toggleMvpFavorite(id, true);
const afterFav = await getMvpRecipeById(id);
assert.equal(afterFav.favorite, true);
assert.equal(afterFav.isFavorite, true);

const deleted = await deleteMvpRecipe(id);
assert.equal(deleted, true);
const afterDelete = await getMvpRecipeById(id);
assert.equal(afterDelete, undefined);
const empty = await getMvpHistory();
assert.equal(empty.length, 0);

console.log('LocalDB MVP regression tests passed.');
