import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const usageMod = await import(pathToFileURL(resolve('app/js/usage.js')).href);
const dbMod = await import(pathToFileURL(resolve('app/js/localDb.js')).href);

const {
  remainingFromState,
  usageCopyFromState,
  FREE_GENERATION_LIMIT,
} = usageMod;

// Limit is the canonical 10.
assert.equal(FREE_GENERATION_LIMIT, 10, 'free generation limit should be 10');
assert.equal(dbMod.FREE_GENERATION_LIMIT, 10, 'localDb exports same limit');

// Initial state (null) -> full quota and not blocked.
{
  const copy = usageCopyFromState(null);
  assert.equal(copy.remaining, 10);
  assert.equal(copy.blocked, false);
  assert.match(copy.text, /10 free/);
}

// Zero successful generations -> 10 remaining, ok tone.
{
  const state = {
    freeGenerationLimit: 10,
    successfulGenerationCount: 0,
    isLocalPremiumUnlocked: false,
  };
  assert.equal(remainingFromState(state), 10);
  const copy = usageCopyFromState(state);
  assert.equal(copy.blocked, false);
  assert.equal(copy.tone, 'ok');
}

// 7 used -> 3 remaining, warn tone.
{
  const state = {
    freeGenerationLimit: 10,
    successfulGenerationCount: 7,
    isLocalPremiumUnlocked: false,
  };
  const copy = usageCopyFromState(state);
  assert.equal(copy.remaining, 3);
  assert.equal(copy.tone, 'warn');
  assert.equal(copy.blocked, false);
  assert.match(copy.text, /3 free creations left/);
}

// 9 used -> 1 remaining, singular warn copy.
{
  const state = {
    freeGenerationLimit: 10,
    successfulGenerationCount: 9,
    isLocalPremiumUnlocked: false,
  };
  const copy = usageCopyFromState(state);
  assert.equal(copy.remaining, 1);
  assert.match(copy.text, /1 free creation left/);
  assert.equal(copy.blocked, false);
}

// 10 used -> blocked.
{
  const state = {
    freeGenerationLimit: 10,
    successfulGenerationCount: 10,
    isLocalPremiumUnlocked: false,
  };
  const copy = usageCopyFromState(state);
  assert.equal(copy.remaining, 0);
  assert.equal(copy.blocked, true);
  assert.equal(copy.tone, 'blocked');
}

// 12 used -> still blocked, never negative remaining.
{
  const state = {
    freeGenerationLimit: 10,
    successfulGenerationCount: 12,
    isLocalPremiumUnlocked: false,
  };
  const copy = usageCopyFromState(state);
  assert.equal(copy.remaining, 0);
  assert.equal(copy.blocked, true);
}

// Premium dev unlock bypasses the limit even past the cap.
{
  const state = {
    freeGenerationLimit: 10,
    successfulGenerationCount: 50,
    isLocalPremiumUnlocked: true,
  };
  const copy = usageCopyFromState(state);
  assert.equal(copy.blocked, false);
  assert.equal(copy.tone, 'unlocked');
  assert.equal(copy.remaining, Infinity);
}

console.log('Usage meter tests passed.');
