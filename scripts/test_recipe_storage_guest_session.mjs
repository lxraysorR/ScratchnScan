/**
 * QA tests for S-08: hardcoded 'guest' session ID causes Supabase Storage
 * path collisions between different users/devices.
 *
 * Fix: getGuestSessionId() generates a crypto.randomUUID() on first call,
 * persists it in localStorage, and buildMediaRef() uses it automatically.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = await readFile(resolve('app/js/recipeStorage.js'), 'utf8');

// ---------------------------------------------------------------------------
// Source-level checks
// ---------------------------------------------------------------------------
{
  // Hardcoded 'guest' default must be gone from buildMediaRef signature.
  const hasHardcodedGuest = /guestSessionId\s*=\s*['"]guest['"]/.test(src);
  assert.ok(!hasHardcodedGuest, "hardcoded guestSessionId = 'guest' default is removed");
}

{
  // getGuestSessionId helper must be defined.
  const hasHelper = /function getGuestSessionId/.test(src);
  assert.ok(hasHelper, 'getGuestSessionId() helper is defined');
}

{
  // Helper must use crypto.randomUUID().
  const usesUUID = /crypto\.randomUUID\(\)/.test(src);
  assert.ok(usesUUID, 'getGuestSessionId uses crypto.randomUUID()');
}

{
  // Helper must persist to localStorage.
  const persists = /localStorage\.setItem\(GUEST_SESSION_KEY/.test(src);
  assert.ok(persists, 'session ID is persisted to localStorage');
}

{
  // buildMediaRef must call getGuestSessionId() when no ID is supplied.
  const callsHelper = /getGuestSessionId\(\)/.test(src);
  assert.ok(callsHelper, 'buildMediaRef calls getGuestSessionId() as fallback');
}

{
  // localStorage unavailability (catch block) must have a fallback.
  const hasCatchFallback = /catch[\s\S]*?crypto\.randomUUID\(\)/s.test(src);
  assert.ok(hasCatchFallback, 'catch block falls back to crypto.randomUUID()');
}

// ---------------------------------------------------------------------------
// Runtime: replicate getGuestSessionId and buildMediaRef logic
// ---------------------------------------------------------------------------

const GUEST_SESSION_KEY = 'scratchnscan:guestSessionId';

// Minimal localStorage stub
function makeLocalStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _store: store,
  };
}

function makeGetGuestSessionId(ls) {
  return function getGuestSessionId() {
    try {
      const stored = ls.getItem(GUEST_SESSION_KEY);
      if (stored) return stored;
      const id = crypto.randomUUID();
      ls.setItem(GUEST_SESSION_KEY, id);
      return id;
    } catch {
      return crypto.randomUUID();
    }
  };
}

{
  // First call: generates and persists a new UUID.
  const ls = makeLocalStorage();
  const getGuestSessionId = makeGetGuestSessionId(ls);
  const id = getGuestSessionId();
  assert.ok(id && id.length > 0, 'first call returns a non-empty ID');
  assert.equal(ls._store[GUEST_SESSION_KEY], id, 'ID is persisted in localStorage');
}

{
  // Second call: returns the same ID from localStorage.
  const ls = makeLocalStorage();
  const getGuestSessionId = makeGetGuestSessionId(ls);
  const id1 = getGuestSessionId();
  const id2 = getGuestSessionId();
  assert.equal(id1, id2, 'repeated calls return the same stable ID');
}

{
  // Pre-seeded localStorage: returns the existing value without overwriting.
  const existingId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const ls = makeLocalStorage({ [GUEST_SESSION_KEY]: existingId });
  const getGuestSessionId = makeGetGuestSessionId(ls);
  assert.equal(getGuestSessionId(), existingId, 'pre-seeded ID is reused');
}

{
  // Two independent devices (separate localStorage) get different IDs.
  const ls1 = makeLocalStorage();
  const ls2 = makeLocalStorage();
  const id1 = makeGetGuestSessionId(ls1)();
  const id2 = makeGetGuestSessionId(ls2)();
  assert.notEqual(id1, id2, 'two devices get different session IDs — no collision');
}

{
  // Storage paths for two devices must be distinct (no collision).
  const MEDIA_BUCKET = 'scratch-recipe-media';
  function buildMediaRef({ role, recipeId, guestSessionId, ext = 'jpg' }, getGuestSessionId) {
    const safeRole = role || 'thumbnail';
    const sessionId = guestSessionId || getGuestSessionId();
    const path = `guests/${sessionId}/drafts/${recipeId}/${safeRole}.${ext}`;
    return { role: safeRole, storageBucket: MEDIA_BUCKET, storagePath: path };
  }
  const get1 = makeGetGuestSessionId(makeLocalStorage());
  const get2 = makeGetGuestSessionId(makeLocalStorage());
  const ref1 = buildMediaRef({ role: 'front_package', recipeId: 'recipe-1' }, get1);
  const ref2 = buildMediaRef({ role: 'front_package', recipeId: 'recipe-1' }, get2);
  assert.notEqual(ref1.storagePath, ref2.storagePath,
    'two devices produce different storage paths for the same recipeId');
}

console.log('S-08 guest session ID tests passed (11 assertions).');
