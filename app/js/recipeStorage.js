import {
  saveMvpRecipe,
  getMvpRecipeById,
  getMvpHistory,
  updateMvpRecipe,
  deleteMvpRecipe,
  toggleMvpFavorite,
} from './localDb.js';

const MEDIA_BUCKET = 'scratch-recipe-media';

function hasSupabaseConfig() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  const url = env.VITE_SUPABASE_URL || globalThis.SUPABASE_URL;
  const anon = env.VITE_SUPABASE_ANON_KEY || globalThis.SUPABASE_ANON_KEY;
  return Boolean(url && anon);
}

function buildMediaRef({ role, recipeId, guestSessionId = 'guest', ext = 'jpg' }) {
  const safeRole = role || 'thumbnail';
  const path = `guests/${guestSessionId}/drafts/${recipeId}/${safeRole}.${ext}`;
  return { role: safeRole, storageBucket: MEDIA_BUCKET, storagePath: path };
}

function toDurableRecord(record = {}) {
  const copy = { ...record };
  const mediaRefs = [];
  if (copy.frontImagePreviewDataUrl?.startsWith('data:image/')) {
    mediaRefs.push(buildMediaRef({ role: 'front_package', recipeId: copy.id || 'draft' }));
    delete copy.frontImagePreviewDataUrl;
    copy.frontImagePlaceholder = false;
  }
  if (copy.backImagePreviewDataUrl?.startsWith('data:image/')) {
    mediaRefs.push(buildMediaRef({ role: 'back_label', recipeId: copy.id || 'draft' }));
    delete copy.backImagePreviewDataUrl;
    copy.backImagePlaceholder = false;
  }
  if (mediaRefs.length) {
    copy.mediaRefs = mediaRefs;
    copy.syncStatus = 'pending';
  }
  return copy;
}

export function getConfiguredStorageMode() {
  return hasSupabaseConfig() ? 'supabase+indexeddb' : 'indexeddb-only';
}

export async function saveRecipe(record) {
  const usingSupabase = hasSupabaseConfig();
  const payload = usingSupabase ? toDurableRecord(record) : { ...record, syncStatus: 'local_only' };
  const id = await saveMvpRecipe(payload);
  return { id, mode: usingSupabase ? 'indexeddb-fallback-pending-sync' : 'indexeddb-local-only' };
}

export async function getRecipe(id) { return getMvpRecipeById(id); }
export async function listRecipes() { return getMvpHistory(); }
export async function updateRecipeRecord(id, changes) { return updateMvpRecipe(id, changes); }
export async function deleteRecipeRecord(id) { return deleteMvpRecipe(id); }
export async function toggleFavoriteRecipe(id, favorite) { return toggleMvpFavorite(id, favorite); }

export async function saveRecipeMedia({ recipeId, draftId, role, fileOrBlob, thumbnail }) {
  const sizeBytes = fileOrBlob?.size || 0;
  const ref = buildMediaRef({ role, recipeId: recipeId || draftId || 'draft' });
  return {
    id: crypto.randomUUID(),
    recipeId: recipeId || null,
    draftId: draftId || null,
    mediaRole: role,
    storageBucket: ref.storageBucket,
    storagePath: ref.storagePath,
    mimeType: fileOrBlob?.type || null,
    sizeBytes,
    thumbnail: !!thumbnail,
  };
}

export async function getRecipeMedia(recipeId) {
  const row = await getMvpRecipeById(recipeId);
  return Array.isArray(row?.mediaRefs) ? row.mediaRefs : [];
}

export async function deleteRecipeMedia(recipeId) {
  const row = await getMvpRecipeById(recipeId);
  if (!row) return false;
  await updateMvpRecipe(recipeId, { ...row, mediaRefs: [] });
  return true;
}
