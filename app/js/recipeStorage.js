import {
  saveMvpRecipe,
  getMvpRecipeById,
  getMvpHistory,
  updateMvpRecipe,
  deleteMvpRecipe,
  toggleMvpFavorite,
} from './localDb.js';

const MEDIA_BUCKET = 'scratch-recipe-media';
const GUEST_SESSION_KEY = 'scratchnscan:guestSessionId';

// Returns a stable per-device guest session ID. Generated once with
// crypto.randomUUID() and persisted in localStorage so it survives page
// reloads. Each device gets its own ID, preventing Supabase Storage path
// collisions between users who all shared the old hardcoded 'guest' default.
function getGuestSessionId() {
  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem(GUEST_SESSION_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (private browsing, SSR, tests) — fall back to
    // a per-call UUID. Not persistent but still unique per path.
    return crypto.randomUUID();
  }
}

function hasSupabaseConfig() {
  // Only read from build-time env vars (Vite). globalThis/window fallbacks are
  // intentionally removed — runtime globals can be read or tampered with by any
  // script on the page, including XSS payloads.
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  const url = env.VITE_SUPABASE_URL;
  const anon = env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && anon);
}

function buildMediaRef({ role, recipeId, guestSessionId, ext = 'jpg' }) {
  const safeRole = role || 'thumbnail';
  const sessionId = guestSessionId || getGuestSessionId();
  const path = `guests/${sessionId}/drafts/${recipeId}/${safeRole}.${ext}`;
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
