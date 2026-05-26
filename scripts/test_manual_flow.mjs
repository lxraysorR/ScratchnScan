import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const recipeMod = await import(pathToFileURL(resolve('app/js/manualRecipe.js')).href);
const { buildDeterministicScratchRecipe } = recipeMod;

// 1) Product name ONLY generates a usable recipe (no barcode, no ingredients, no AI).
{
  const r = buildDeterministicScratchRecipe({ productName: 'Oreos' });
  assert.ok(r.title.includes('Oreos'), `title should include product name: ${r.title}`);
  assert.equal(r.originalProductName, 'Oreos', 'originalProductName echoes product name');
  assert.ok(typeof r.summary === 'string' && r.summary.length, 'summary present');
  assert.ok(Array.isArray(r.whyCleaner) && r.whyCleaner.length >= 2, 'whyCleaner has reasons');
  assert.ok(Array.isArray(r.ingredients) && r.ingredients.length, 'ingredients present');
  assert.ok(Array.isArray(r.steps) && r.steps.length, 'steps present');
  assert.ok(Array.isArray(r.tips) && r.tips.length, 'tips present');
}

// 2) Works the same for every required example product name.
for (const name of ['Doritos Cool Ranch', 'Kraft Mac and Cheese', 'Pop-Tarts', 'Honey Nut Cheerios']) {
  const r = buildDeterministicScratchRecipe({ productName: name });
  assert.ok(r.ingredients.length && r.steps.length && r.whyCleaner.length,
    `example "${name}" should produce a complete recipe`);
}

// 3) Optional ingredients improve the result but are not required.
{
  const withIng = buildDeterministicScratchRecipe({
    productName: 'Oreos',
    inputIngredients: 'sugar, flour, cocoa, palm oil',
  });
  assert.ok(withIng.ingredients.length, 'ingredients-informed recipe still returns ingredients');
  assert.ok(withIng.whyCleaner.length >= 2, 'whyCleaner still present with ingredients');
}

// 4) Returns the documented shape keys.
{
  const r = buildDeterministicScratchRecipe({ productName: 'Pop-Tarts' });
  for (const key of ['title', 'originalProductName', 'summary', 'whyCleaner', 'ingredients', 'steps', 'tips']) {
    assert.ok(key in r, `recipe object should include "${key}"`);
  }
}

// 5) Empty product name still returns something (graceful), without throwing.
{
  const r = buildDeterministicScratchRecipe({ productName: '' });
  assert.ok(r.ingredients.length && r.steps.length, 'empty name still returns a skeleton recipe');
}

// 6) localDb saved shape: barcode is optional and defaults to null for manual entries.
const localDb = (await import('node:fs')).readFileSync('app/js/localDb.js', 'utf8');
assert.ok(/barcode/.test(localDb), 'localDb payload includes a barcode field');
assert.ok(/source:\s*input\.source/.test(localDb), 'localDb payload keeps a source field');

console.log('Manual flow tests passed.');
