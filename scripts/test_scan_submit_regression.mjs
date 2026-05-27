// Regression guard for the Manual Entry "Generate Homemade Version" submit
// flow. These bugs were runtime ReferenceErrors (hasFrontImage / hasBackImage /
// recipeError / barcode) that token-only tests missed. This file asserts, at
// the source level, that the undefined-variable patterns cannot return, and at
// the behavior level that generation never requires a barcode.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const scan = readFileSync('app/js/scan.js', 'utf8');

// --- The exact broken patterns must be gone. -------------------------------
assert.ok(!/recipeError\s*=/.test(scan), 'scan.js must not assign to undeclared recipeError');
assert.ok(!scan.includes('void recipeError'), 'scan.js must not reference recipeError via void');

// --- Every variable used in the submit payload must be declared. -----------
for (const name of ['hasFrontImage', 'hasBackImage', 'barcode', 'frontImagePreviewDataUrl', 'backImagePreviewDataUrl']) {
  assert.ok(
    new RegExp(`const\\s+${name}\\s*=`).test(scan),
    `scan.js must declare ${name} (const ${name} = ...) before using it`,
  );
}

// Declaration must come before first *use* for the photo flags and barcode.
function declaredBeforeUse(name) {
  const declIdx = scan.search(new RegExp(`const\\s+${name}\\s*=`));
  // First use beyond the declaration: the next occurrence of the bare token.
  const afterDecl = scan.slice(declIdx + `const ${name} =`.length);
  const useIdx = afterDecl.search(new RegExp(`\\b${name}\\b`));
  return declIdx >= 0 && useIdx >= 0;
}
for (const name of ['hasFrontImage', 'hasBackImage', 'barcode']) {
  assert.ok(declaredBeforeUse(name), `${name} should be declared before it is used`);
}

// The saved record must preserve the (optional) barcode, not hardcode null.
assert.ok(!/barcode:\s*null/.test(scan), 'saved payload must use `barcode,` so a scanned/manual UPC survives');
assert.ok(/source:\s*"manual",\s*\n\s*barcode,/.test(scan), 'saved payload should carry the local barcode');

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
