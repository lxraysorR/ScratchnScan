import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const required = [
  'app/index.html',
  'app/styles.css',
  'app/js/app.js',
  'app/js/localDb.js',
  'app/js/scan.js',
  'app/js/result.js',
  'app/js/history.js',
  'app/js/details.js',
  'app/js/manualRecipe.js',
  'AGENTS.md',
  'docs/MVP_SCOPE.md',
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

// HTML tokens — keep this list aligned with what the MVP actually renders.
const html = readFileSync('app/index.html', 'utf8');
const htmlChecks = [
  'ScratchnScan',
  'Create Homemade Version',
  'Generate Homemade Version',
  'Scan Barcode',
  'View Saved Recipes',
  'Save Recipe',
  'Why this is cleaner',
  'view-home',
  'view-scan',
  'view-manual',
  'view-result',
  'view-history',
  'view-details',
  'product-name-input',
  'ingredients-input',
  'dietary-input',
  'photo-tile',
  'data-photo="front"',
  'data-photo="back"',
  'details-favorite-btn',
  'details-delete-btn',
  'bottom-nav',
  'data-target="home"',
  'data-target="scan"',
  'data-target="manual"',
  'data-target="history"',
];
for (const token of htmlChecks) {
  if (!html.includes(token)) throw new Error(`Missing token in app/index.html: ${token}`);
}

// Brand and category should NOT appear as primary form inputs anymore.
const removedFormInputs = ['id="brand-input"', 'id="category-input"', 'id="notes-input"'];
for (const token of removedFormInputs) {
  if (html.includes(token)) {
    throw new Error(`Unexpected legacy input still present in app/index.html: ${token}`);
  }
}

// localDb.js sanity — required exports.
const localDb = readFileSync('app/js/localDb.js', 'utf8');
const requiredExports = [
  'initDatabase',
  'normalizeBarcode',
  'saveMvpRecipe',
  'getMvpHistory',
  'getMvpRecipeById',
  'updateMvpRecipe',
  'deleteMvpRecipe',
  'toggleMvpFavorite',
  'saveScanHistory',
  'getScanHistory',
  'saveProductCache',
  'getProductByBarcode',
  'saveProductRescueDraft',
  'getProductRescueDrafts',
  'saveHomemadeRecipe',
  'getHomemadeRecipes',
  'logAppEvent',
  'clearLocalData',
];
for (const name of requiredExports) {
  if (!new RegExp(`export\\s+(?:async\\s+)?(?:function|const)\\s+${name}\\b`).test(localDb)) {
    throw new Error(`Missing exported symbol in app/js/localDb.js: ${name}`);
  }
}

// New persistence fields for the photo-first MVP layout.
const localDbFields = [
  'frontImagePlaceholder',
  'backImagePlaceholder',
  'recipeTips',
];
for (const field of localDbFields) {
  if (!localDb.includes(field)) {
    throw new Error(`Missing field in app/js/localDb.js payload: ${field}`);
  }
}

// Live-import normalizeBarcode and assert its behaviour. It must run with no
// IndexedDB present because we just call the pure helper.
const mod = await import(pathToFileURL(resolve('app/js/localDb.js')).href);
const cases = [
  ['012000001772', '012000001772'],
  ['012-000-001772', '012000001772'],
  [' 012 000 001772 ', '012000001772'],
  ['abc012def', '012'],
  [null, ''],
  [undefined, ''],
  [12345, '12345'],
];
for (const [input, expected] of cases) {
  const got = mod.normalizeBarcode(input);
  if (got !== expected) {
    throw new Error(`normalizeBarcode(${JSON.stringify(input)}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`);
  }
}

// manualRecipe.js fallback: targeted product names should pick a category-aware template.
const recipeMod = await import(pathToFileURL(resolve('app/js/manualRecipe.js')).href);
const mayo = recipeMod.buildDeterministicScratchRecipe({ productName: 'Mayonnaise' });
if (!/mayonnaise/i.test(mayo.title)) {
  throw new Error(`mayonnaise fallback title unexpected: ${mayo.title}`);
}
const mayoIngText = mayo.ingredients.join('\n').toLowerCase();
if (!mayoIngText.includes('oil') || !(mayoIngText.includes('egg') || mayoIngText.includes('aquafaba'))) {
  throw new Error(`mayonnaise fallback ingredients missing oil/egg: ${mayoIngText}`);
}
const generic = recipeMod.buildDeterministicScratchRecipe({ productName: '' });
if (!generic.ingredients.length || !generic.steps.length) {
  throw new Error('generic fallback should still return ingredients and steps');
}
const veganMayo = recipeMod.buildDeterministicScratchRecipe({
  productName: 'mayo',
  dietaryPreference: 'vegan',
});
if (!veganMayo.tips.some((t) => /aquafaba|plant/i.test(t))) {
  throw new Error('vegan dietary tip should appear');
}

console.log('App shell + localDb tests passed.');
