import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const mod = await import(pathToFileURL(resolve('app/js/recipeGenerator.js')).href);
const { generateHealthierScratchRecipe } = mod;

const REQUIRED_KEYS = ['title', 'originalProductName', 'summary', 'healthGoal', 'whyHealthier', 'ingredients', 'steps', 'tips', 'tags', 'createdAt'];

function assertShape(r, label) {
  for (const k of REQUIRED_KEYS) assert.ok(k in r, `${label}: missing key "${k}"`);
  assert.ok(typeof r.title === 'string' && r.title.length, `${label}: title`);
  assert.ok(typeof r.summary === 'string' && r.summary.length, `${label}: summary`);
  assert.ok(typeof r.healthGoal === 'string' && r.healthGoal.length, `${label}: healthGoal`);
  assert.ok(Array.isArray(r.whyHealthier) && r.whyHealthier.length >= 2, `${label}: whyHealthier`);
  assert.ok(Array.isArray(r.ingredients) && r.ingredients.length, `${label}: ingredients`);
  assert.ok(Array.isArray(r.steps) && r.steps.length, `${label}: steps`);
  assert.ok(Array.isArray(r.tips) && r.tips.length, `${label}: tips`);
  assert.ok(Array.isArray(r.tags) && r.tags.length, `${label}: tags`);
}

// 1) Oreos -> chocolate sandwich cookies.
{
  const r = generateHealthierScratchRecipe({ productName: 'Oreos' });
  assertShape(r, 'Oreos');
  assert.equal(r.originalProductName, 'Oreos');
  assert.match(r.title, /cookie/i, 'Oreos should map to a cookie recipe');
  const ing = r.ingredients.join(' ').toLowerCase();
  assert.ok(ing.includes('cocoa'), 'Oreos recipe should include cocoa');
}

// 2) Doritos Cool Ranch -> baked tortilla chips (NOT salad dressing).
{
  const r = generateHealthierScratchRecipe({ productName: 'Doritos Cool Ranch' });
  assertShape(r, 'Doritos');
  assert.match(r.title, /chip/i, 'Doritos should map to tortilla chips');
  const text = (r.title + ' ' + r.healthGoal + ' ' + r.steps.join(' ')).toLowerCase();
  assert.ok(text.includes('bake') || text.includes('baked'), 'chips should be baked, not fried');
  const ing = r.ingredients.join(' ').toLowerCase();
  assert.ok(ing.includes('tortilla'), 'chips recipe should use tortillas');
}

// 3) Kraft Mac and Cheese -> lighter mac and cheese with real cheese.
{
  const r = generateHealthierScratchRecipe({ productName: 'Kraft Mac and Cheese' });
  assertShape(r, 'Mac');
  assert.match(r.title, /mac/i, 'should map to mac and cheese');
  const ing = r.ingredients.join(' ').toLowerCase();
  assert.ok(ing.includes('cheddar') || ing.includes('cheese'), 'should use real cheese');
}

// 4) Pop-Tarts and Cheerios map to their tailored recipes.
{
  const pt = generateHealthierScratchRecipe({ productName: 'Pop-Tarts' });
  assertShape(pt, 'Pop-Tarts');
  assert.match(pt.title, /pastr/i, 'Pop-Tarts -> pastries');

  const ch = generateHealthierScratchRecipe({ productName: 'Honey Nut Cheerios' });
  assertShape(ch, 'Cheerios');
  const chIng = ch.ingredients.join(' ').toLowerCase();
  assert.ok(chIng.includes('oat'), 'Cheerios -> oat-based recipe');
}

// 5) Unknown product name still returns a complete healthier recipe.
{
  const r = generateHealthierScratchRecipe({ productName: 'Galaxy Crunch Bites 5000' });
  assertShape(r, 'Unknown');
  assert.match(r.title, /Healthier Homemade Version of Galaxy Crunch Bites 5000/);
}

// 6) Barcode is NOT required and not part of the signature — productName alone works.
{
  const r = generateHealthierScratchRecipe({ productName: 'Oreos' });
  assert.ok(!('barcode' in r), 'recipe object should not require a barcode');
}

// 7) Optional ingredients/notes/dietary refine tips but are not required.
{
  const base = generateHealthierScratchRecipe({ productName: 'Pop-Tarts' });
  const withExtras = generateHealthierScratchRecipe({
    productName: 'Pop-Tarts',
    inputIngredients: 'enriched flour, corn syrup, gelatin',
    notes: 'for kids lunchbox',
    dietaryPreference: 'less sugar',
  });
  assert.ok(withExtras.tips.length >= base.tips.length, 'extras add tips');
  assert.ok(withExtras.tips.some((t) => /Personal note/.test(t)), 'notes surface as a tip');
}

// 8) Empty product name is graceful (no throw, still a recipe).
{
  const r = generateHealthierScratchRecipe({ productName: '' });
  assertShape(r, 'Empty');
  assert.equal(r.originalProductName, '');
}

// No medical claims in any required template output.
{
  const banned = /\b(cure|cures|treat|treats|prevent|prevents|heal|heals|guarantee|guarantees)\b/i;
  for (const name of ['Oreos', 'Doritos Cool Ranch', 'Kraft Mac and Cheese', 'Pop-Tarts', 'Honey Nut Cheerios', 'Unknown Thing']) {
    const r = generateHealthierScratchRecipe({ productName: name });
    const blob = [r.title, r.summary, r.healthGoal, ...r.whyHealthier, ...r.tips].join(' ');
    assert.ok(!banned.test(blob), `${name}: must avoid medical claims`);
  }
}

// Generator is actually wired into the manual flow (scan.js).
{
  const scanJs = readFileSync('app/js/scan.js', 'utf8');
  assert.ok(/generateHealthierScratchRecipe/.test(scanJs), 'scan.js should use the healthier generator');
}

console.log('Recipe generator tests passed.');
