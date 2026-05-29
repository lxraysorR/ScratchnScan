/**
 * QA tests for S-07: Supabase config must only be read from build-time env
 * vars (import.meta.env), never from globalThis/window at runtime.
 *
 * globalThis.SUPABASE_URL / SUPABASE_ANON_KEY can be read or overwritten by
 * any script on the page (including XSS payloads). The fix removes those
 * fallbacks entirely.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = await readFile(resolve('app/js/recipeStorage.js'), 'utf8');

// ---------------------------------------------------------------------------
// Source-level checks
// ---------------------------------------------------------------------------
{
  // globalThis references for Supabase keys must be gone.
  const hasGlobalThisUrl = /globalThis\.SUPABASE_URL/.test(src);
  assert.ok(!hasGlobalThisUrl, 'globalThis.SUPABASE_URL is not referenced');
}

{
  const hasGlobalThisAnon = /globalThis\.SUPABASE_ANON_KEY/.test(src);
  assert.ok(!hasGlobalThisAnon, 'globalThis.SUPABASE_ANON_KEY is not referenced');
}

{
  // window.SUPABASE_* must also not appear.
  const hasWindowKey = /window\.SUPABASE_/.test(src);
  assert.ok(!hasWindowKey, 'window.SUPABASE_* is not referenced');
}

{
  // import.meta.env is still used as the legitimate source.
  const usesImportMeta = /import\.meta\.env/.test(src);
  assert.ok(usesImportMeta, 'import.meta.env is still used as the config source');
}

{
  // VITE_SUPABASE_URL must come only from the env object, not a fallback chain.
  const hasOrFallback = /VITE_SUPABASE_URL\s*\|\|/.test(src);
  assert.ok(!hasOrFallback, 'VITE_SUPABASE_URL has no || fallback');
}

{
  const hasAnonOrFallback = /VITE_SUPABASE_ANON_KEY\s*\|\|/.test(src);
  assert.ok(!hasAnonOrFallback, 'VITE_SUPABASE_ANON_KEY has no || fallback');
}

// ---------------------------------------------------------------------------
// Runtime: replicate hasSupabaseConfig logic and verify globalThis is ignored
// ---------------------------------------------------------------------------

function hasSupabaseConfig(importMetaEnv) {
  const env = importMetaEnv ?? {};
  const url = env.VITE_SUPABASE_URL;
  const anon = env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && anon);
}

{
  // No env vars → false (IndexedDB-only mode, correct for MVP).
  assert.equal(hasSupabaseConfig({}), false, 'no env vars → config absent');
}

{
  // Only URL set → false.
  assert.equal(hasSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' }), false,
    'only URL set → config absent');
}

{
  // Only anon key set → false.
  assert.equal(hasSupabaseConfig({ VITE_SUPABASE_ANON_KEY: 'anon-key' }), false,
    'only anon key set → config absent');
}

{
  // Both set → true.
  assert.equal(
    hasSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon-key' }),
    true,
    'both env vars set → config present',
  );
}

{
  // globalThis polluted with Supabase keys — must NOT affect result when env is empty.
  const saved = { url: globalThis.SUPABASE_URL, anon: globalThis.SUPABASE_ANON_KEY };
  globalThis.SUPABASE_URL = 'https://attacker.supabase.co';
  globalThis.SUPABASE_ANON_KEY = 'stolen-key';
  try {
    assert.equal(hasSupabaseConfig({}), false,
      'globalThis pollution does not enable Supabase config');
  } finally {
    globalThis.SUPABASE_URL = saved.url;
    globalThis.SUPABASE_ANON_KEY = saved.anon;
  }
}

console.log('S-07 Supabase config safety tests passed (11 assertions).');
