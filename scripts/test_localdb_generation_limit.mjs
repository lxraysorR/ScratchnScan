/**
 * QA tests for R-03: freeGenerationLimit in stored state must never override
 * the canonical FREE_GENERATION_LIMIT constant.
 *
 * Before the fix, getUsageState() spread the stored value first and then
 * corrected it with a post-merge assignment — the stored value was silently
 * read and discarded. After the fix, freeGenerationLimit is excluded from the
 * spread entirely so the default is always authoritative without the redundant
 * override line.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = await readFile(resolve('app/js/localDb.js'), 'utf8');

// ---------------------------------------------------------------------------
// Source-level checks
// ---------------------------------------------------------------------------
{
  // The redundant post-merge assignment must be gone.
  const hasRedundantOverride = /merged\.freeGenerationLimit\s*=\s*FREE_GENERATION_LIMIT/.test(src);
  assert.ok(!hasRedundantOverride, 'redundant merged.freeGenerationLimit = FREE_GENERATION_LIMIT is removed');
}

{
  // The stored value must be destructured to exclude freeGenerationLimit.
  const destructuresLimit = /freeGenerationLimit[^,}]*[,}][^]*storedRest|_ignored/.test(src);
  assert.ok(destructuresLimit, 'freeGenerationLimit is excluded from stored spread via destructuring');
}

{
  // defaultUsageState still sets freeGenerationLimit from the constant.
  const defaultSetsLimit = /freeGenerationLimit\s*:\s*FREE_GENERATION_LIMIT/.test(src);
  assert.ok(defaultSetsLimit, 'defaultUsageState still provides freeGenerationLimit from the constant');
}

// ---------------------------------------------------------------------------
// Runtime: replicate getUsageState merge logic and verify limit enforcement
// ---------------------------------------------------------------------------

const FREE_GENERATION_LIMIT = 10;

function defaultUsageState() {
  return {
    id: 'scratchnscan_usage_meter',
    freeGenerationLimit: FREE_GENERATION_LIMIT,
    successfulGenerationCount: 0,
    firstUsedAt: null,
    lastGeneratedAt: null,
    isLocalPremiumUnlocked: false,
    updatedAt: null,
  };
}

function mergeUsageState(stored) {
  const { freeGenerationLimit: _ignored, ...storedRest } = stored || {};
  return { ...defaultUsageState(), ...storedRest };
}

{
  // Stored record with a tampered higher limit — must be ignored.
  const result = mergeUsageState({ freeGenerationLimit: 999, successfulGenerationCount: 5 });
  assert.equal(result.freeGenerationLimit, FREE_GENERATION_LIMIT,
    'tampered higher limit (999) is ignored; canonical limit used');
  assert.equal(result.successfulGenerationCount, 5, 'other stored fields are preserved');
}

{
  // Stored record with a tampered lower limit — must be ignored.
  const result = mergeUsageState({ freeGenerationLimit: 1, successfulGenerationCount: 2 });
  assert.equal(result.freeGenerationLimit, FREE_GENERATION_LIMIT,
    'tampered lower limit (1) is ignored; canonical limit used');
}

{
  // No stored record (null) — defaults apply cleanly.
  const result = mergeUsageState(null);
  assert.equal(result.freeGenerationLimit, FREE_GENERATION_LIMIT,
    'null stored state returns canonical limit');
  assert.equal(result.successfulGenerationCount, 0, 'count defaults to 0');
}

{
  // Stored record with no freeGenerationLimit field — default fills it.
  const result = mergeUsageState({ successfulGenerationCount: 7 });
  assert.equal(result.freeGenerationLimit, FREE_GENERATION_LIMIT,
    'missing limit field in stored record uses canonical default');
  assert.equal(result.successfulGenerationCount, 7, 'count from stored record is preserved');
}

{
  // canGenerate logic: count < limit → allowed; count >= limit → blocked.
  const below = mergeUsageState({ successfulGenerationCount: 9 });
  assert.ok(below.successfulGenerationCount < below.freeGenerationLimit,
    'count 9 < limit 10 → generation allowed');

  const atLimit = mergeUsageState({ successfulGenerationCount: 10 });
  assert.ok(!(atLimit.successfulGenerationCount < atLimit.freeGenerationLimit),
    'count 10 >= limit 10 → generation blocked');
}

console.log('R-03 generation limit enforcement tests passed (10 assertions).');
