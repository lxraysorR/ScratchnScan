/**
 * QA tests for R-08: usage strip copy calculation must not be duplicated.
 *
 * usageCopyFromState() now returns both `text` (generic strip) and `homeText`
 * (home-screen strip), so refreshUsageStrips() no longer needs its own
 * branching copy logic.
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const src = await readFile(resolve('app/js/usage.js'), 'utf8');
const mod = await import(pathToFileURL(resolve('app/js/usage.js')).href);
const { usageCopyFromState, FREE_GENERATION_LIMIT } = mod;

// ---------------------------------------------------------------------------
// Source-level: duplicate branching in refreshUsageStrips must be gone
// ---------------------------------------------------------------------------
{
  // All "Developer unlock active" copy must live inside usageCopyFromState,
  // not be repeated again inside refreshUsageStrips.
  // Verify by checking refreshUsageStrips body has no inline copy branches.
  const refreshFnBody = src.slice(src.indexOf('async function refreshUsageStrips'));
  const hasDupeInRefresh = /Developer unlock active/.test(refreshFnBody);
  assert.ok(!hasDupeInRefresh, 'Developer unlock copy is not duplicated inside refreshUsageStrips');
}

{
  const hasDupeBlocked = (src.match(/10 free recipes\. More coming soon/g) || []).length;
  assert.equal(hasDupeBlocked, 1, 'blocked homeText copy appears exactly once');
}

{
  // refreshUsageStrips must use copy.homeText, not a local branch.
  assert.ok(/copy\.homeText/.test(src), 'refreshUsageStrips uses copy.homeText');
  // No more inline if/else on state fields inside refreshUsageStrips for copy.
  const hasDupeBranch = /homeStrip[\s\S]*?if\s*\(state\.isLocalPremiumUnlocked\)/s.test(src);
  assert.ok(!hasDupeBranch, 'inline premium branch removed from refreshUsageStrips');
}

// ---------------------------------------------------------------------------
// Runtime: every state variant returns a homeText field
// ---------------------------------------------------------------------------

{
  // null state → homeText matches full-quota copy
  const copy = usageCopyFromState(null);
  assert.ok(typeof copy.homeText === 'string' && copy.homeText.length > 0,
    'null state returns homeText');
  assert.ok(copy.homeText.includes('this device'), 'null homeText mentions this device');
}

{
  // premium unlocked
  const copy = usageCopyFromState({ isLocalPremiumUnlocked: true, freeGenerationLimit: 10, successfulGenerationCount: 0 });
  assert.ok(copy.homeText.toLowerCase().includes('unlimited'), 'premium homeText mentions unlimited');
  assert.equal(copy.tone, 'unlocked');
}

{
  // blocked (used all)
  const copy = usageCopyFromState({ isLocalPremiumUnlocked: false, freeGenerationLimit: 10, successfulGenerationCount: 10 });
  assert.equal(copy.blocked, true);
  assert.ok(copy.homeText.length > 0, 'blocked state has homeText');
}

{
  // 1 remaining (warn)
  const copy = usageCopyFromState({ isLocalPremiumUnlocked: false, freeGenerationLimit: 10, successfulGenerationCount: 9 });
  assert.equal(copy.remaining, 1);
  assert.ok(copy.homeText.includes('1'), 'homeText mentions 1 remaining');
  assert.ok(copy.homeText.includes('this device'), 'homeText mentions this device');
}

{
  // 3 remaining (warn)
  const copy = usageCopyFromState({ isLocalPremiumUnlocked: false, freeGenerationLimit: 10, successfulGenerationCount: 7 });
  assert.equal(copy.remaining, 3);
  assert.ok(copy.homeText.includes('3'), 'homeText mentions 3 remaining');
  assert.ok(copy.homeText.includes(String(FREE_GENERATION_LIMIT)), 'homeText includes total limit');
}

{
  // 7 remaining (ok)
  const copy = usageCopyFromState({ isLocalPremiumUnlocked: false, freeGenerationLimit: 10, successfulGenerationCount: 3 });
  assert.equal(copy.remaining, 7);
  assert.ok(copy.homeText.includes('7'), 'homeText mentions 7 remaining');
  assert.equal(copy.tone, 'ok');
}

console.log('R-08 usage strip copy deduplication tests passed (12 assertions).');
