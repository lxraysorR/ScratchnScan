import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { buildDeterministicScratchRecipe } from '../app/js/manualRecipe.js';

const appJs = readFileSync('app/js/app.js', 'utf8');
assert.match(appJs, /import\s+\{\s*initPackageEntry,\s*refreshBarcodeBanner\s*\}\s+from\s+"\.\/packageEntry\.js";/);
assert.match(appJs, /typeof refreshBarcodeBanner === "function"/, 'app.js should safely guard refreshBarcodeBanner');
const packageEntryJs = readFileSync('app/js/packageEntry.js', 'utf8');
assert.match(packageEntryJs, /export function refreshBarcodeBanner\(/, 'packageEntry should export refreshBarcodeBanner');

const scanJs = readFileSync('app/js/scan.js', 'utf8');
assert.match(scanJs, /const draftBarcode = normalizeBarcode\(getDraftBarcode\?\.\(\) \|\| ""\);/);
assert.match(scanJs, /const manualBarcode = normalizeBarcode\(document\.getElementById\("barcode-input"\)\?\.value \|\| ""\);/);
assert.match(scanJs, /const barcode = draftBarcode \|\| manualBarcode \|\| null;/);
assert.ok(!scanJs.includes('let recipeError'), 'recipeError leftover should be removed');
assert.ok(!scanJs.includes('void recipeError'), 'recipeError void leftover should be removed');
assert.match(scanJs, /const frontImagePreviewDataUrl = draft\.frontImagePreviewDataUrl \|\| null;/);
assert.match(scanJs, /const backImagePreviewDataUrl = draft\.backImagePreviewDataUrl \|\| null;/);
assert.match(scanJs, /const hasFrontImage = !!frontImagePreviewDataUrl;/);
assert.match(scanJs, /const hasBackImage = !!backImagePreviewDataUrl;/);
assert.match(scanJs, /const inputEl = event\.currentTarget;/);
assert.match(scanJs, /await handlePhotoSelected\(which, file\);/);
assert.match(scanJs, /if \(inputEl\) \{\s*inputEl\.value = "";/s);
assert.match(scanJs, /console\.warn\("AI recipe unavailable\. Using local fallback\.", err\);/);
assert.match(scanJs, /barcode,\s*\n\s*productName,/);

const recipe = buildDeterministicScratchRecipe({ productName: 'chips' });
assert.ok(recipe && recipe.title && recipe.ingredients.length > 0 && recipe.steps.length > 0,
  'fallback recipe should generate from productName only');

const localDb = readFileSync('app/js/localDb.js', 'utf8');
assert.match(localDb, /const barcode = input\.barcode \? normalizeBarcode\(input\.barcode\) \|\| null/);

console.log('Manual regression checks passed.');
