/**
 * QA tests for R-10: buildTipsFromAiRecipe() must be exported and testable
 * in isolation so the tip-building logic has a single, verifiable home.
 *
 * The function assembles tips from four sources on the AI recipe object:
 *   1. recipe.tips          — plain tip strings
 *   2. recipe.simpleSwaps   — {insteadOf, use, why} swap objects
 *   3. recipe.whyLessProcessed — reason strings
 *   4. recipe.storageTips   — single storage advice string
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const src = await readFile(resolve('app/js/generationController.js'), 'utf8');
const mod = await import(pathToFileURL(resolve('app/js/generationController.js')).href);
const { buildTipsFromAiRecipe } = mod;

// ---------------------------------------------------------------------------
// Source-level: function must be exported
// ---------------------------------------------------------------------------
{
  assert.ok(/export function buildTipsFromAiRecipe/.test(src),
    'buildTipsFromAiRecipe is exported');
}

// ---------------------------------------------------------------------------
// Null / empty input — must return empty array without throwing
// ---------------------------------------------------------------------------
{
  assert.deepEqual(buildTipsFromAiRecipe(null), [], 'null returns []');
  assert.deepEqual(buildTipsFromAiRecipe(undefined), [], 'undefined returns []');
  assert.deepEqual(buildTipsFromAiRecipe({}), [], 'empty object returns []');
}

// ---------------------------------------------------------------------------
// Source 1: recipe.tips
// ---------------------------------------------------------------------------
{
  const result = buildTipsFromAiRecipe({ tips: ['Use fresh herbs', 'Season to taste'] });
  assert.deepEqual(result, ['Use fresh herbs', 'Season to taste'], 'plain tips passed through');
}

{
  // Falsy tips are filtered out
  const result = buildTipsFromAiRecipe({ tips: ['Good tip', '', null, 0, 'Another tip'] });
  assert.deepEqual(result, ['Good tip', 'Another tip'], 'falsy tips are filtered');
}

// ---------------------------------------------------------------------------
// Source 2: recipe.simpleSwaps
// ---------------------------------------------------------------------------
{
  // Full swap with insteadOf + use + why
  const result = buildTipsFromAiRecipe({
    simpleSwaps: [{ insteadOf: 'butter', use: 'olive oil', why: 'Less saturated fat.' }],
  });
  assert.equal(result.length, 1);
  assert.ok(result[0].includes('Swap butter for olive oil'), 'swap text includes Swap X for Y');
  assert.ok(result[0].includes('Less saturated fat'), 'swap text includes why');
}

{
  // Only `use` supplied
  const result = buildTipsFromAiRecipe({ simpleSwaps: [{ use: 'oat milk' }] });
  assert.ok(result[0].startsWith('Try oat milk'), 'use-only swap starts with Try');
}

{
  // Only `insteadOf` supplied
  const result = buildTipsFromAiRecipe({ simpleSwaps: [{ insteadOf: 'cream' }] });
  assert.ok(result[0].startsWith('Adjust from cream'), 'insteadOf-only swap starts with Adjust');
}

{
  // All-empty swap object — skipped
  const result = buildTipsFromAiRecipe({ simpleSwaps: [{ insteadOf: '', use: '', why: '' }] });
  assert.deepEqual(result, [], 'all-empty swap object produces no tip');
}

// ---------------------------------------------------------------------------
// Source 3: recipe.whyLessProcessed
// ---------------------------------------------------------------------------
{
  const result = buildTipsFromAiRecipe({ whyLessProcessed: ['No artificial colours', 'Whole grain'] });
  assert.ok(result[0].startsWith('Why less processed:'), 'whyLessProcessed prefixed correctly');
  assert.equal(result.length, 2, 'two reasons produce two tips');
}

// ---------------------------------------------------------------------------
// Source 4: recipe.storageTips
// ---------------------------------------------------------------------------
{
  const result = buildTipsFromAiRecipe({ storageTips: 'Keeps for 3 days in an airtight container.' });
  assert.equal(result.length, 1);
  assert.ok(result[0].startsWith('Storage:'), 'storageTips prefixed with Storage:');
}

{
  // Falsy storageTips — no tip added
  const result = buildTipsFromAiRecipe({ storageTips: '' });
  assert.deepEqual(result, [], 'empty storageTips produces no tip');
}

// ---------------------------------------------------------------------------
// All sources combined — correct count and order
// ---------------------------------------------------------------------------
{
  const result = buildTipsFromAiRecipe({
    tips: ['Tip one'],
    simpleSwaps: [{ insteadOf: 'sugar', use: 'honey', why: 'Lower GI.' }],
    whyLessProcessed: ['Whole ingredients'],
    storageTips: 'Refrigerate up to 5 days.',
  });
  assert.equal(result.length, 4, 'all four sources contribute one tip each');
  assert.ok(result[0] === 'Tip one', 'tips come first');
  assert.ok(result[1].includes('Swap sugar for honey'), 'swap comes second');
  assert.ok(result[2].startsWith('Why less processed:'), 'whyLessProcessed comes third');
  assert.ok(result[3].startsWith('Storage:'), 'storageTips comes last');
}

console.log('R-10 buildTipsFromAiRecipe tests passed (20 assertions).');
