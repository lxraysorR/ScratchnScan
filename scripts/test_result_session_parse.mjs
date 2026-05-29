/**
 * QA tests for R-04: sessionStorage JSON.parse must be wrapped in try-catch.
 *
 * initResultView() reads scratchnscan:lastGenerated from sessionStorage and
 * calls JSON.parse on it. Without a try-catch a corrupted value throws a
 * SyntaxError and the result view breaks silently.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = await readFile(resolve('app/js/result.js'), 'utf8');

// ---------------------------------------------------------------------------
// Source-level checks
// ---------------------------------------------------------------------------
{
  // JSON.parse of sessionRecord must not appear outside a try block.
  // Simplest check: try { ... JSON.parse(sessionRecord) must exist.
  const hasTryCatch = /try\s*\{[^}]*JSON\.parse\(sessionRecord\)/s.test(src);
  assert.ok(hasTryCatch, 'JSON.parse(sessionRecord) is inside a try block');
}

{
  // On parse failure the corrupted item must be cleared from sessionStorage.
  const clearsOnFailure = /catch[\s\S]*?sessionStorage\.removeItem\(["']scratchnscan:lastGenerated["']\)/s.test(src);
  assert.ok(clearsOnFailure, 'corrupted sessionStorage item is removed in catch block');
}

{
  // The bare JSON.parse without try-catch must be gone.
  const bareParseGone = !/const parsed = sessionRecord \? JSON\.parse/.test(src);
  assert.ok(bareParseGone, 'bare unguarded JSON.parse assignment is removed');
}

// ---------------------------------------------------------------------------
// Runtime simulation using a minimal sessionStorage stub
// ---------------------------------------------------------------------------

// Stub that mimics the browser sessionStorage API
function makeStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _store: store,
  };
}

// Replicate the guarded parse logic from result.js
function parseSessionRecord(storage) {
  const sessionRecord = storage.getItem('scratchnscan:lastGenerated');
  let parsed = null;
  if (sessionRecord) {
    try {
      parsed = JSON.parse(sessionRecord);
    } catch {
      storage.removeItem('scratchnscan:lastGenerated');
    }
  }
  return parsed;
}

{
  // Valid JSON — parses correctly
  const storage = makeStorage({ 'scratchnscan:lastGenerated': JSON.stringify({ scratchRecipe: { name: 'test' } }) });
  const result = parseSessionRecord(storage);
  assert.ok(result !== null, 'valid JSON parses to an object');
  assert.equal(result.scratchRecipe.name, 'test', 'parsed content is correct');
  assert.ok('scratchnscan:lastGenerated' in storage._store, 'valid item is NOT removed');
}

{
  // Corrupted JSON — must return null and clear the item
  const storage = makeStorage({ 'scratchnscan:lastGenerated': '{bad json:::' });
  const result = parseSessionRecord(storage);
  assert.equal(result, null, 'corrupted JSON returns null');
  assert.ok(!('scratchnscan:lastGenerated' in storage._store), 'corrupted item is removed from storage');
}

{
  // Truncated JSON — must return null and clear the item
  const storage = makeStorage({ 'scratchnscan:lastGenerated': '{"scratchRecipe":{"name":' });
  const result = parseSessionRecord(storage);
  assert.equal(result, null, 'truncated JSON returns null');
  assert.ok(!('scratchnscan:lastGenerated' in storage._store), 'truncated item is removed from storage');
}

{
  // Empty sessionStorage — must return null without throwing
  const storage = makeStorage();
  const result = parseSessionRecord(storage);
  assert.equal(result, null, 'missing item returns null without throwing');
}

{
  // Null string stored — must return null without throwing
  const storage = makeStorage({ 'scratchnscan:lastGenerated': 'null' });
  const result = parseSessionRecord(storage);
  assert.equal(result, null, 'stored "null" string returns null');
}

console.log('R-04 sessionStorage safe-parse tests passed (11 assertions).');
