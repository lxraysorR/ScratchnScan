import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const required = [
  'app/index.html',
  'app/styles.css',
  'app/js/localDb.js',
  'app/js/scan.js',
  'AGENTS.md',
  'docs/MVP_SCOPE.md',
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

// HTML tokens — keep this list aligned with what the MVP actually renders.
const html = readFileSync('app/index.html', 'utf8');
const htmlChecks = [
  'ScratchNScan',
  'Scan / Enter UPC',
  'Add Product Info',
  'Recent lookups',
  'Not medical advice',
];
for (const token of htmlChecks) {
  if (!html.includes(token)) throw new Error(`Missing token in app/index.html: ${token}`);
}

// localDb.js sanity — required exports.
const localDb = readFileSync('app/js/localDb.js', 'utf8');
const requiredExports = [
  'initDatabase',
  'normalizeBarcode',
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

console.log('App shell + localDb tests passed.');
