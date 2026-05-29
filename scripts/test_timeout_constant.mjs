/**
 * QA tests for R-01: AI_TIMEOUT_MS must be defined once in constants.js and
 * imported by api.js, scan.js, and generationController.js — no hardcoded
 * 25000 literals remaining in those files.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [apiSrc, scanSrc, gcSrc, constSrc] = await Promise.all([
  readFile(resolve('app/js/api.js'), 'utf8'),
  readFile(resolve('app/js/scan.js'), 'utf8'),
  readFile(resolve('app/js/generationController.js'), 'utf8'),
  readFile(resolve('app/js/constants.js'), 'utf8'),
]);

// ---------------------------------------------------------------------------
// constants.js defines AI_TIMEOUT_MS
// ---------------------------------------------------------------------------
{
  assert.ok(/export const AI_TIMEOUT_MS/.test(constSrc), 'AI_TIMEOUT_MS is exported from constants.js');
  assert.ok(/25[_,]?000/.test(constSrc), 'AI_TIMEOUT_MS value is 25 000 ms');
}

// ---------------------------------------------------------------------------
// Each file imports from constants.js
// ---------------------------------------------------------------------------
{
  assert.ok(/from ["']\.\/constants\.js["']/.test(apiSrc), 'api.js imports from constants.js');
  assert.ok(/from ["']\.\/constants\.js["']/.test(scanSrc), 'scan.js imports from constants.js');
  assert.ok(/from ["']\.\/constants\.js["']/.test(gcSrc), 'generationController.js imports from constants.js');
}

// ---------------------------------------------------------------------------
// No hardcoded 25000 literals remain in the three files
// ---------------------------------------------------------------------------
{
  // Allow 25_000 or 25000 only inside constants.js itself, not in the consumers.
  const bare25000 = /\b25000\b/.test(apiSrc);
  assert.ok(!bare25000, 'no hardcoded 25000 in api.js');
}

{
  const bare25000 = /\b25000\b/.test(scanSrc);
  assert.ok(!bare25000, 'no hardcoded 25000 in scan.js');
}

{
  const bare25000 = /\b25000\b/.test(gcSrc);
  assert.ok(!bare25000, 'no hardcoded 25000 in generationController.js');
}

// ---------------------------------------------------------------------------
// Each file references AI_TIMEOUT_MS (not a local magic number)
// ---------------------------------------------------------------------------
{
  assert.ok(/AI_TIMEOUT_MS/.test(apiSrc), 'api.js uses AI_TIMEOUT_MS');
  assert.ok(/AI_TIMEOUT_MS/.test(scanSrc), 'scan.js uses AI_TIMEOUT_MS');
  assert.ok(/AI_TIMEOUT_MS/.test(gcSrc), 'generationController.js uses AI_TIMEOUT_MS');
}

// ---------------------------------------------------------------------------
// Runtime: exported value is correct
// ---------------------------------------------------------------------------
{
  const mod = await import(pathToFileURL(resolve('app/js/constants.js')).href);
  assert.equal(mod.AI_TIMEOUT_MS, 25_000, 'AI_TIMEOUT_MS runtime value is 25 000');
}

console.log('R-01 timeout constant tests passed (12 assertions).');
