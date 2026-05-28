const DB_NAME = "scan_scratch_local_db";
const DB_VERSION = 4;

const STORES = {
  mvpHistory: "mvp_history",
  scanHistory: "scan_history",
  productCache: "product_cache",
  productRescue: "product_rescue",
  homemadeRecipes: "homemade_recipes",
  appEvents: "app_events",
  usageMeter: "scratchnscan_usage_meter",
};

export const FREE_GENERATION_LIMIT = 10;
const USAGE_KEY = "singleton";

let dbPromise;

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeBarcode(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\D/g, "");
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORES.mvpHistory)) {
        const s = db.createObjectStore(STORES.mvpHistory, { keyPath: "id" });
        s.createIndex("createdAt", "createdAt", { unique: false });
        s.createIndex("favorite", "favorite", { unique: false });
      }
      for (const name of [STORES.scanHistory, STORES.productCache, STORES.productRescue, STORES.homemadeRecipes, STORES.appEvents]) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.usageMeter)) {
        db.createObjectStore(STORES.usageMeter, { keyPath: "id" });
      }
    };
    req.onsuccess = (event) => resolve(event.target.result);
    req.onerror = (event) => reject(event.target.error || new Error("IndexedDB open failed."));
  });
  return dbPromise;
}

export async function initDatabase() {
  try {
    await openDb();
    return true;
  } catch (err) {
    console.warn("initDatabase failed", err);
    return false;
  }
}

function runRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = (event) => resolve(event.target.result);
    req.onerror = (event) => reject(event.target.error);
  });
}

async function withStore(storeName, mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    Promise.resolve(callback(store)).then((value) => {
      result = value;
    }).catch(reject);
    tx.oncomplete = () => resolve(result);
    tx.onerror = (event) => reject(event.target.error);
  });
}

function safe(promise, fallback, context) {
  return promise.catch((err) => {
    console.warn(`${context} failed`, err);
    return fallback;
  });
}

export function saveMvpRecipe(input) {
  const createdAt = input.createdAt || nowIso();
  const id = input.id || crypto.randomUUID();
  const scratchRecipe = input.scratchRecipe || input.generatedResult || null;
  const favorite = !!(input.favorite ?? input.isFavorite);
  const ingredientsText = normalizeText(
    input.ingredientsText || input.inputIngredients || input.ingredients,
  );
  // Barcode is optional. Manual entries store null; a future scanner can
  // pass a real barcode. We keep `upc` too for backward compatibility.
  const barcode = input.barcode ? normalizeBarcode(input.barcode) || null
    : (normalizeBarcode(input.upc) || null);
  const payload = {
    id,
    source: input.source || "manual",
    createdAt,
    updatedAt: nowIso(),
    barcode,
    upc: normalizeBarcode(input.upc),
    productName: normalizeText(input.productName),
    originalProductName: normalizeText(input.originalProductName || scratchRecipe?.originalProductName || input.productName),
    brand: normalizeText(input.brand),
    category: normalizeText(input.category),
    ingredientsText,
    inputIngredients: ingredientsText,
    dietaryPreference: normalizeText(input.dietaryPreference),
    notes: normalizeText(input.notes || input.userNotes),
    frontImagePlaceholder: !!input.frontImagePlaceholder,
    backImagePlaceholder: !!input.backImagePlaceholder,
    frontImageLocalRef: input.frontImageLocalRef || null,
    backImageLocalRef: input.backImageLocalRef || null,
    frontImagePreviewDataUrl: input.frontImagePreviewDataUrl || null,
    backImagePreviewDataUrl: input.backImagePreviewDataUrl || null,
    scratchRecipe,
    recipeTitle: normalizeText(input.recipeTitle || scratchRecipe?.title),
    recipeIngredients: Array.isArray(input.recipeIngredients)
      ? input.recipeIngredients
      : (scratchRecipe?.ingredients || []),
    recipeSteps: Array.isArray(input.recipeSteps)
      ? input.recipeSteps
      : (scratchRecipe?.steps || []),
    recipeTips: Array.isArray(input.recipeTips)
      ? input.recipeTips
      : (scratchRecipe?.tips || []),
    mediaRefs: Array.isArray(input.mediaRefs) ? input.mediaRefs : [],
    syncStatus: normalizeText(input.syncStatus) || "local_only",
    remoteId: normalizeText(input.remoteId) || "",
    lastSyncError: normalizeText(input.lastSyncError) || "",
    fallbackUsed: !!input.fallbackUsed,
    favorite,
    isFavorite: favorite,
  };
  return safe(withStore(STORES.mvpHistory, "readwrite", (store) => runRequest(store.put(payload)).then(() => payload.id)), null, "saveMvpRecipe");
}

export async function updateMvpRecipe(id, updates) {
  const existing = await getMvpRecipeById(id);
  if (!existing) return null;
  return saveMvpRecipe({ ...existing, ...updates, id });
}

export function getMvpHistory() {
  return safe(withStore(STORES.mvpHistory, "readonly", (store) => new Promise((resolve, reject) => {
    const rows = [];
    const req = store.index("createdAt").openCursor(null, "prev");
    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) {
        resolve(rows);
        return;
      }
      rows.push(cursor.value);
      cursor.continue();
    };
    req.onerror = (event) => reject(event.target.error);
  })), [], "getMvpHistory");
}

export function getMvpRecipeById(id) {
  return safe(withStore(STORES.mvpHistory, "readonly", (store) => runRequest(store.get(id))), null, "getMvpRecipeById");
}

export function deleteMvpRecipe(id) {
  return safe(withStore(STORES.mvpHistory, "readwrite", (store) => runRequest(store.delete(id)).then(() => true)), false, "deleteMvpRecipe");
}

export async function toggleMvpFavorite(id, favorite) {
  const existing = await getMvpRecipeById(id);
  if (!existing) return null;
  return saveMvpRecipe({ ...existing, favorite });
}

export const saveScanHistory = async () => null;
export const getScanHistory = async () => [];
export const saveProductCache = async (row) => row || null;
export const getProductByBarcode = async () => null;
export const saveProductRescueDraft = async (row) => row || null;
export const getProductRescueDrafts = async () => [];
export const saveHomemadeRecipe = async (row) => row || null;
export const getHomemadeRecipes = async () => [];
export const logAppEvent = async () => true;
export async function clearLocalData() {
  return safe(withStore(STORES.mvpHistory, "readwrite", (store) => runRequest(store.clear()).then(() => true)), false, "clearLocalData");
}

function defaultUsageState() {
  return {
    id: USAGE_KEY,
    freeGenerationLimit: FREE_GENERATION_LIMIT,
    successfulGenerationCount: 0,
    firstUsedAt: null,
    lastGeneratedAt: null,
    isLocalPremiumUnlocked: false,
    updatedAt: null,
  };
}

export async function getUsageState() {
  const stored = await safe(
    withStore(STORES.usageMeter, "readonly", (store) => runRequest(store.get(USAGE_KEY))),
    null,
    "getUsageState",
  );
  const merged = { ...defaultUsageState(), ...(stored || {}) };
  // Always enforce the canonical limit if it drifts.
  merged.freeGenerationLimit = FREE_GENERATION_LIMIT;
  return merged;
}

async function putUsageState(state) {
  return safe(
    withStore(STORES.usageMeter, "readwrite", (store) => runRequest(store.put(state)).then(() => state)),
    state,
    "putUsageState",
  );
}

export async function canGenerate() {
  // DEV: free-creation cap disabled. Generation is never blocked while this
  // early return is in place. To re-enable the 10-creation limit, delete the
  // line below and restore the gate logic that follows it.
  return true;
  // eslint-disable-next-line no-unreachable
  const state = await getUsageState();
  if (state.isLocalPremiumUnlocked) return true;
  return state.successfulGenerationCount < state.freeGenerationLimit;
}

export async function recordSuccessfulGeneration() {
  const state = await getUsageState();
  const now = nowIso();
  const next = {
    ...state,
    successfulGenerationCount: state.successfulGenerationCount + 1,
    firstUsedAt: state.firstUsedAt || now,
    lastGeneratedAt: now,
    updatedAt: now,
  };
  await putUsageState(next);
  return next;
}

export async function resetUsageForDev() {
  const fresh = defaultUsageState();
  fresh.updatedAt = nowIso();
  await putUsageState(fresh);
  return fresh;
}

export async function setLocalPremiumUnlockedForDev(unlocked) {
  const state = await getUsageState();
  const next = { ...state, isLocalPremiumUnlocked: !!unlocked, updatedAt: nowIso() };
  await putUsageState(next);
  return next;
}
