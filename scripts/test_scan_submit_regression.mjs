// Regression guard for the Manual Entry "Generate Homemade Version" submit
// flow. These bugs were runtime ReferenceErrors (recipeError / barcode) that
// token-only tests missed. This file asserts, at the source level, that the
// undefined-variable patterns cannot return, and at the behavior level that
// generation never requires a barcode.
//
// Architecture note: hasFrontImage / hasBackImage were removed from scan.js
// when the generation record was moved into generationController.js. The
// controller computes those flags from the photos object directly. scan.js
// only needs to pass the raw data URLs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const scan = readFileSync('app/js/scan.js', 'utf8');

// --- The exact broken patterns must be gone. -------------------------------
assert.ok(!/recipeError\s*=/.test(scan), 'scan.js must not assign to undeclared recipeError');
assert.ok(!scan.includes('void recipeError'), 'scan.js must not reference recipeError via void');

// --- Core submit variables must be declared. --------------------------------
for (const name of ['barcode', 'frontImagePreviewDataUrl', 'backImagePreviewDataUrl']) {
  assert.ok(
    new RegExp(`const\\s+${name}\\s*=`).test(scan),
    `scan.js must declare ${name} with const before using it`,
  );
}

// --- barcode must be used after its declaration (not dead). ----------------
function declaredBeforeUse(name) {
  const declIdx = scan.search(new RegExp(`const\\s+${name}\\s*=`));
  const afterDecl = scan.slice(declIdx + `const ${name} =`.length);
  const useIdx = afterDecl.search(new RegExp(`\\b${name}\\b`));
  return declIdx >= 0 && useIdx >= 0;
}
assert.ok(declaredBeforeUse('barcode'), 'barcode should be declared and then used in runGenerationFlow input');

// --- barcode must be forwarded into runGenerationFlow, not hardcoded null. --
assert.ok(!/barcode:\s*null/.test(scan), 'scan.js must not hardcode barcode: null');
assert.ok(/input:\s*\{[^}]*\bbarcode\b/.test(scan), 'barcode must appear in the runGenerationFlow input object');

// --- Behavior: generation works with no barcode and no images. -------------
const { buildGenerationPayload } = await import(pathToFileURL(resolve('app/js/generationPayload.js')).href);
const { generateHealthierScratchRecipe } = await import(pathToFileURL(resolve('app/js/recipeGenerator.js')).href);

const payload = buildGenerationPayload({ productName: 'Oreos' });
assert.equal(payload.upc, undefined, 'barcode is optional in the generation payload');
assert.equal(payload.hasFrontImage, false);
assert.equal(payload.hasBackImage, false);

const recipe = generateHealthierScratchRecipe({ productName: 'Oreos' });
assert.ok(recipe && recipe.title && recipe.ingredients.length && recipe.steps.length, 'a healthier recipe generates from a product name alone (no barcode required)');

console.log('Scan submit regression checks passed.');
