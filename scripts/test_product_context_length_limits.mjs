/**
 * QA tests for R-07: input fields sent to the AI must be capped at safe
 * maximum lengths to prevent oversized prompts and prompt-injection via
 * crafted long strings.
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const src = await (await import('node:fs/promises')).readFile(resolve('app/js/productContext.js'), 'utf8');
const mod = await import(pathToFileURL(resolve('app/js/productContext.js')).href);
const { normalizeProductContext, contextToRecipeInput } = mod;

// ---------------------------------------------------------------------------
// Source-level checks
// ---------------------------------------------------------------------------
{
  assert.ok(/MAX_LENGTHS/.test(src), 'MAX_LENGTHS constant is defined');
  assert.ok(/function truncate/.test(src), 'truncate() helper is defined');

  // Each guarded field must use truncate() in the ctx object literal.
  for (const field of ['productName', 'brand', 'flavor', 'category', 'packageText', 'ingredientsText', 'userPreferences']) {
    assert.ok(
      new RegExp(`truncate[^,)]*${field}`).test(src) || new RegExp(`${field}.*truncate`).test(src),
      `${field} is passed through truncate()`,
    );
  }
}

// ---------------------------------------------------------------------------
// Runtime: fields exceeding limits are truncated
// ---------------------------------------------------------------------------

const LONG = 'A'.repeat(2000);

{
  // productName capped at 120
  const ctx = normalizeProductContext({ productName: LONG });
  assert.ok(ctx.productName.length <= 120, `productName capped at 120 (got ${ctx.productName.length})`);
}

{
  // brand capped at 80
  const ctx = normalizeProductContext({ brand: LONG });
  assert.ok(ctx.brand.length <= 80, `brand capped at 80 (got ${ctx.brand.length})`);
}

{
  // flavor capped at 80
  const ctx = normalizeProductContext({ flavor: LONG });
  assert.ok(ctx.flavor.length <= 80, `flavor capped at 80 (got ${ctx.flavor.length})`);
}

{
  // category capped at 80
  const ctx = normalizeProductContext({ category: LONG });
  assert.ok(ctx.category.length <= 80, `category capped at 80 (got ${ctx.category.length})`);
}

{
  // ingredientsText capped at 1000
  const ctx = normalizeProductContext({ ingredientsText: LONG });
  assert.ok(ctx.ingredientsText.length <= 1000, `ingredientsText capped at 1000 (got ${ctx.ingredientsText.length})`);
}

{
  // packageText capped at 1000
  const ctx = normalizeProductContext({ packageText: LONG });
  assert.ok(ctx.packageText.length <= 1000, `packageText capped at 1000 (got ${ctx.packageText.length})`);
}

{
  // userPreferences capped at 300
  const ctx = normalizeProductContext({ userPreferences: LONG });
  assert.ok(ctx.userPreferences.length <= 300, `userPreferences capped at 300 (got ${ctx.userPreferences.length})`);
}

// ---------------------------------------------------------------------------
// Runtime: short values pass through unchanged
// ---------------------------------------------------------------------------
{
  const ctx = normalizeProductContext({
    productName: 'Oreos',
    brand: 'Nabisco',
    flavor: 'Original',
    category: 'cookies',
    ingredientsText: 'sugar, flour, cocoa',
    packageText: 'Nabisco Oreos',
    userPreferences: 'vegan',
  });
  assert.equal(ctx.productName, 'Oreos', 'short productName unchanged');
  assert.equal(ctx.brand, 'Nabisco', 'short brand unchanged');
  assert.equal(ctx.ingredientsText, 'sugar, flour, cocoa', 'short ingredientsText unchanged');
  assert.equal(ctx.userPreferences, 'vegan', 'short userPreferences unchanged');
}

// ---------------------------------------------------------------------------
// Runtime: limits survive contextToRecipeInput passthrough
// ---------------------------------------------------------------------------
{
  const recipe = contextToRecipeInput({ productName: LONG, ingredientsText: LONG, userPreferences: LONG });
  assert.ok(recipe.productName.length <= 120, 'productName still capped after contextToRecipeInput');
  assert.ok(recipe.ingredientsText.length <= 1000, 'ingredientsText still capped after contextToRecipeInput');
  assert.ok(recipe.userPreferences.length <= 300, 'userPreferences still capped after contextToRecipeInput');
}

console.log('R-07 input length limit tests passed (19 assertions).');
