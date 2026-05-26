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
  'app/js/platform.js',
  'app/js/scannerService.js',
  'app/js/scanCoordinator.js',
  'app/js/capacitorBarcodeScannerAdapter.js',
  'app/js/packageEntry.js',
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
  'Why this is healthier',
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
  'scan-start-btn',
  'scan-status',
  'draft-barcode',
  'Scan package',
  'Enter manually instead',
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

// Scanner service: behaves in a non-Capacitor (web) environment.
const platformMod = await import(pathToFileURL(resolve('app/js/platform.js')).href);
if (platformMod.isNativePlatform() !== false) {
  throw new Error('isNativePlatform() should be false in Node test environment');
}
if (platformMod.getPlatform() !== 'web') {
  throw new Error('getPlatform() should be "web" in Node test environment');
}

// Provide a sessionStorage shim so scannerService can run under Node.
const memory = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
  clear: () => memory.clear(),
};

const scanner = await import(pathToFileURL(resolve('app/js/scannerService.js')).href);
const webScan = await scanner.startScan();
if (webScan.status !== 'unsupported') {
  throw new Error(`expected web startScan to return unsupported, got ${webScan.status}`);
}
if (scanner.normalizeBarcode(' 012-000-001772 ') !== '012000001772') {
  throw new Error('scannerService.normalizeBarcode should strip non-digit characters');
}
scanner.setDraftBarcode('012000001772');
if (scanner.getDraftBarcode() !== '012000001772') {
  throw new Error('draft barcode round-trip failed');
}
scanner.clearDraftBarcode();
if (scanner.getDraftBarcode() !== '') {
  throw new Error('clearDraftBarcode should empty the draft');
}

// Scan coordinator guard rails.
const coord = await import(pathToFileURL(resolve('app/js/scanCoordinator.js')).href);
coord.resetScanState();
if (!coord.beginScan()) throw new Error('beginScan should succeed when idle');
if (coord.beginScan()) throw new Error('beginScan should reject while a scan is in flight');
coord.endScan();
if (!coord.beginScan()) throw new Error('beginScan should succeed after endScan');
coord.endScan();
coord.setCooldownMs(50);
if (!coord.shouldAcceptBarcode('111')) throw new Error('first barcode should be accepted');
if (coord.shouldAcceptBarcode('111')) throw new Error('duplicate barcode inside cooldown should be rejected');
if (!coord.shouldAcceptBarcode('222')) throw new Error('different barcode should be accepted');
await new Promise((r) => setTimeout(r, 80));
if (!coord.shouldAcceptBarcode('111')) throw new Error('same barcode after cooldown should be accepted');
coord.resetScanState();

console.log('App shell + localDb + scanner tests passed.');
