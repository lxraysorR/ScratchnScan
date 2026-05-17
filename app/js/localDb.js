const DB_NAME = "scan_scratch_local_db";
const DB_VERSION = 2;

const STORES = {
  mvpHistory: "mvp_history",
  scanHistory: "scan_history",
  productCache: "product_cache",
  productRescue: "product_rescue",
  homemadeRecipes: "homemade_recipes",
  appEvents: "app_events",
};

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
  const payload = {
    id,
    createdAt,
    updatedAt: nowIso(),
    upc: normalizeBarcode(input.upc),
    productName: normalizeText(input.productName),
    brand: normalizeText(input.brand),
    category: normalizeText(input.category),
    ingredients: normalizeText(input.ingredients),
    nutritionNotes: normalizeText(input.nutritionNotes),
    userNotes: normalizeText(input.userNotes),
    generatedResult: input.generatedResult || null,
    favorite: !!input.favorite,
  };
  return safe(withStore(STORES.mvpHistory, "readwrite", (store) => runRequest(store.put(payload)).then(() => payload.id)), null, "saveMvpRecipe");
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
export const saveProductCache = async () => null;
export const getProductByBarcode = async () => null;
export const saveProductRescueDraft = async () => null;
export const getProductRescueDrafts = async () => [];
export const saveHomemadeRecipe = async () => null;
export const getHomemadeRecipes = async () => [];
export const logAppEvent = async () => null;
export async function clearLocalData() {
  return safe(withStore(STORES.mvpHistory, "readwrite", (store) => runRequest(store.clear()).then(() => true)), false, "clearLocalData");
}
