import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const generatorMod = await import(pathToFileURL(resolve('app/js/recipeGenerator.js')).href);
const { generateHealthierScratchRecipe } = generatorMod;

const requiredKeys = ['title', 'originalProductName', 'summary', 'healthGoal', 'whyHealthier', 'ingredients', 'steps', 'tips'];

for (const name of ['Oreos', 'Doritos Cool Ranch', 'Kraft Mac and Cheese', 'Pop-Tarts', 'Unknown Snack Product']) {
  const r = generateHealthierScratchRecipe({ productName: name });
  for (const key of requiredKeys) assert.ok(key in r, `${name}: missing ${key}`);
  assert.ok(Array.isArray(r.whyHealthier) && r.whyHealthier.length > 0, `${name}: whyHealthier`);
}

assert.equal(generateHealthierScratchRecipe({ productName: 'Oreos' }).title, 'Healthier Homemade Chocolate Sandwich Cookies');
assert.equal(generateHealthierScratchRecipe({ productName: 'Doritos Cool Ranch' }).title, 'Baked Cool Ranch Tortilla Chips');
assert.equal(generateHealthierScratchRecipe({ productName: 'Kraft Mac and Cheese' }).title, 'Lighter Real-Cheese Mac and Cheese');
assert.equal(generateHealthierScratchRecipe({ productName: 'Pop-Tarts' }).title, 'Homemade Fruit Breakfast Pastries');

const localDb = (await import('node:fs')).readFileSync('app/js/localDb.js', 'utf8');
assert.ok(/barcode\s*=/.test(localDb), 'barcode is accepted in save payload');
assert.ok(/source:\s*input\.source \|\| "manual"/.test(localDb), 'source manual accepted');

console.log('Manual flow tests passed.');
