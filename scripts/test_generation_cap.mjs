import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';

const {
  canGenerate,
  recordSuccessfulGeneration,
  resetUsageForDev,
  setLocalPremiumUnlockedForDev,
  FREE_GENERATION_LIMIT,
} = await import('../app/js/localDb.js');

let passed = 0;

async function test(name, fn) {
  await resetUsageForDev();
  try {
    await fn();
    passed++;
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (err) {
    process.stderr.write(`  ✗ ${name}\n    ${err.message}\n`);
    process.exit(1);
  }
}

await test('canGenerate returns true on a fresh device (0 of 10 used)', async () => {
  assert.equal(await canGenerate(), true);
});

await test('canGenerate returns true after 9 successful generations', async () => {
  for (let i = 0; i < FREE_GENERATION_LIMIT - 1; i++) {
    await recordSuccessfulGeneration();
  }
  assert.equal(await canGenerate(), true);
});

await test('canGenerate returns false after the limit is reached', async () => {
  for (let i = 0; i < FREE_GENERATION_LIMIT; i++) {
    await recordSuccessfulGeneration();
  }
  assert.equal(await canGenerate(), false);
});

await test('canGenerate returns false when count exceeds the limit', async () => {
  for (let i = 0; i < FREE_GENERATION_LIMIT + 3; i++) {
    await recordSuccessfulGeneration();
  }
  assert.equal(await canGenerate(), false);
});

await test('canGenerate returns true when dev premium unlock is active, even past limit', async () => {
  for (let i = 0; i < FREE_GENERATION_LIMIT; i++) {
    await recordSuccessfulGeneration();
  }
  await setLocalPremiumUnlockedForDev(true);
  assert.equal(await canGenerate(), true);
});

await test('revoking dev premium unlock re-enables the cap', async () => {
  for (let i = 0; i < FREE_GENERATION_LIMIT; i++) {
    await recordSuccessfulGeneration();
  }
  await setLocalPremiumUnlockedForDev(true);
  assert.equal(await canGenerate(), true);
  await setLocalPremiumUnlockedForDev(false);
  assert.equal(await canGenerate(), false);
});

await test('resetUsageForDev restores canGenerate to true', async () => {
  for (let i = 0; i < FREE_GENERATION_LIMIT; i++) {
    await recordSuccessfulGeneration();
  }
  assert.equal(await canGenerate(), false);
  await resetUsageForDev();
  assert.equal(await canGenerate(), true);
});

await test('FREE_GENERATION_LIMIT is 10', async () => {
  assert.equal(FREE_GENERATION_LIMIT, 10);
});

process.stdout.write(`\nGeneration cap: ${passed} passed\n`);
