import assert from 'node:assert/strict';
import { saveRecipe, getConfiguredStorageMode, saveRecipeMedia } from '../app/js/recipeStorage.js';
import { getMvpRecipeById } from '../app/js/localDb.js';
import 'fake-indexeddb/auto';

if (!globalThis.crypto?.randomUUID) {
  globalThis.crypto = { randomUUID: ()=> 'id-'+Math.random() };
}

assert.equal(getConfiguredStorageMode(), 'indexeddb-only');

const payload = {
  id: 'r1',
  productName: 'Test chips',
  scratchRecipe: { title:'x', ingredients:['a'], steps:['b'] },
  frontImagePreviewDataUrl: 'data:image/jpeg;base64,AAA',
  backImagePreviewDataUrl: 'data:image/jpeg;base64,BBB',
};
const saved = await saveRecipe(payload);
assert.equal(saved.mode, 'indexeddb-local-only');
const row = await getMvpRecipeById('r1');
assert.ok(row.frontImagePreviewDataUrl?.startsWith('data:image/'));

globalThis.SUPABASE_URL = 'https://example.supabase.co';
globalThis.SUPABASE_ANON_KEY = 'anon';
const saved2 = await saveRecipe({ ...payload, id: 'r2' });
assert.equal(saved2.mode, 'indexeddb-fallback-pending-sync');
const row2 = await getMvpRecipeById('r2');
assert.ok(Array.isArray(row2.mediaRefs) && row2.mediaRefs.length >= 1);
assert.equal(row2.frontImagePreviewDataUrl ?? null, null);
assert.ok(['pending','local_only',undefined].includes(row2.syncStatus));

const media = await saveRecipeMedia({ recipeId: 'r2', role: 'front_package', fileOrBlob: { size: 12, type: 'image/jpeg' } });
assert.equal(media.mediaRole, 'front_package');
assert.match(media.storagePath, /front_package\.jpg$/);

console.log('Recipe storage tests passed.');
