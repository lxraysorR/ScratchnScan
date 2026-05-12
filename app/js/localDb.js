/**
 * Scan-Scratch local IndexedDB service.
 *
 * All UI/storage interaction for the MVP goes through this module so the
 * IndexedDB plumbing stays out of view code. Every function returns a Promise
 * and resolves even when IndexedDB fails — the app must keep running when the
 * browser blocks storage (private mode, quota, etc.).
 *
 * TODO(supabase): the save* helpers are the right hooks for future Supabase
 * sync. Mirror the same payload up when an auth/session is available.
 */

const DB_NAME = "scan_scratch_local_db";
const DB_VERSION = 1;

const STORES = {
  scanHistory: "scan_history",
  productCache: "product_cache",
  productRescue: "product_rescue",
  homemadeRecipes: "homemade_recipes",
  appEvents: "app_events",
  settings: "settings",
};

let dbPromise = null;

// ---------------------------------------------------------------------------
// Open / init
// ---------------------------------------------------------------------------
function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(STORES.scanHistory)) {
        const s = db.createObjectStore(STORES.scanHistory, { keyPath: "id", autoIncrement: true });
        s.createIndex("normalizedBarcode", "normalizedBarcode", { unique: false });
        s.createIndex("createdAt", "createdAt", { unique: false });
        s.createIndex("status", "status", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.productCache)) {
        const s = db.createObjectStore(STORES.productCache, { keyPath: "normalizedBarcode" });
        s.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.productRescue)) {
        const s = db.createObjectStore(STORES.productRescue, { keyPath: "id", autoIncrement: true });
        s.createIndex("normalizedBarcode", "normalizedBarcode", { unique: false });
        s.createIndex("status", "status", { unique: false });
        s.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.homemadeRecipes)) {
        const s = db.createObjectStore(STORES.homemadeRecipes, { keyPath: "id", autoIncrement: true });
        s.createIndex("normalizedBarcode", "normalizedBarcode", { unique: false });
        s.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.appEvents)) {
        const s = db.createObjectStore(STORES.appEvents, { keyPath: "id", autoIncrement: true });
        s.createIndex("eventType", "eventType", { unique: false });
        s.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: "key" });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => {
      dbPromise = null;
      reject(e.target.error ?? new Error("Failed to open IndexedDB."));
    };
    req.onblocked = () => {
      dbPromise = null;
      reject(new Error("IndexedDB open was blocked by another tab."));
    };
  });

  return dbPromise;
}

export async function initDatabase() {
  try {
    await openDb();
    return true;
  } catch (err) {
    console.warn("localDb: initDatabase failed", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function normalizeBarcode(barcode) {
  if (barcode === null || barcode === undefined) return "";
  return String(barcode).replace(/\D/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function runRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    let result;
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    Promise.resolve(fn(store))
      .then((value) => {
        result = value;
      })
      .catch(reject);
    tx.oncomplete = () => resolve(result);
    tx.onerror = (e) => reject(e.target.error);
    tx.onabort = (e) => reject(e.target.error ?? new Error("Transaction aborted."));
  });
}

function getAllFromIndex(store, indexName, limit, descending = true) {
  return new Promise((resolve, reject) => {
    const out = [];
    const idx = store.index(indexName);
    const req = idx.openCursor(null, descending ? "prev" : "next");
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor || (limit && out.length >= limit)) {
        resolve(out);
        return;
      }
      out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function safe(promise, fallback) {
  return promise.catch((err) => {
    console.warn("localDb operation failed:", err);
    return fallback;
  });
}

// ---------------------------------------------------------------------------
// scan_history
// ---------------------------------------------------------------------------
export function saveScanHistory(record) {
  const normalized = normalizeBarcode(record?.normalizedBarcode ?? record?.barcode);
  const payload = {
    barcode: record?.barcode ?? normalized,
    normalizedBarcode: normalized,
    source: record?.source ?? null,
    status: record?.status ?? "unknown",
    productName: record?.productName ?? null,
    brand: record?.brand ?? null,
    message: record?.message ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  // TODO(supabase): mirror this row to a remote scans table when auth exists.
  return safe(
    withStore(STORES.scanHistory, "readwrite", (store) => runRequest(store.add(payload))),
    null
  );
}

export function getScanHistory(limit = 20) {
  return safe(
    withStore(STORES.scanHistory, "readonly", (store) =>
      getAllFromIndex(store, "createdAt", limit, true)
    ),
    []
  );
}

// ---------------------------------------------------------------------------
// product_cache
// ---------------------------------------------------------------------------
export function saveProductCache(product) {
  const normalized = normalizeBarcode(product?.normalizedBarcode ?? product?.barcode ?? product?.upc);
  if (!normalized) return Promise.resolve(null);
  const payload = {
    barcode: product?.barcode ?? product?.upc ?? normalized,
    normalizedBarcode: normalized,
    productName: product?.productName ?? product?.name ?? null,
    brand: product?.brand ?? null,
    ingredients: product?.ingredients ?? null,
    nutrition: product?.nutrition ?? null,
    imageUrl: product?.imageUrl ?? product?.image ?? null,
    source: product?.source ?? null,
    raw: product?.raw ?? null,
    createdAt: product?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  // TODO(supabase): upsert to a remote product_cache when auth exists.
  return safe(
    withStore(STORES.productCache, "readwrite", (store) => runRequest(store.put(payload))),
    null
  );
}

export function getProductByBarcode(barcode) {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) return Promise.resolve(null);
  return safe(
    withStore(STORES.productCache, "readonly", (store) =>
      runRequest(store.get(normalized))
    ),
    null
  );
}

// ---------------------------------------------------------------------------
// product_rescue
// ---------------------------------------------------------------------------
export function saveProductRescueDraft(record) {
  const normalized = normalizeBarcode(record?.normalizedBarcode ?? record?.barcode);
  const payload = {
    barcode: record?.barcode ?? normalized,
    normalizedBarcode: normalized,
    status: record?.status ?? "draft",
    productName: record?.productName ?? null,
    brand: record?.brand ?? null,
    ingredientsText: record?.ingredientsText ?? null,
    nutritionText: record?.nutritionText ?? null,
    notes: record?.notes ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  // TODO(supabase): submit completed rescue drafts to a remote queue.
  return safe(
    withStore(STORES.productRescue, "readwrite", async (store) => {
      // Prevent duplicate drafts for the same barcode while still in draft.
      const existing = await new Promise((resolve, reject) => {
        const idx = store.index("normalizedBarcode");
        const req = idx.getAll(normalized);
        req.onsuccess = (e) => resolve(e.target.result ?? []);
        req.onerror = (e) => reject(e.target.error);
      });
      const openDraft = existing.find((r) => r.status === "draft");
      if (openDraft) {
        const merged = { ...openDraft, ...payload, id: openDraft.id, createdAt: openDraft.createdAt };
        return runRequest(store.put(merged));
      }
      return runRequest(store.add(payload));
    }),
    null
  );
}

export function getProductRescueDrafts(limit = 20) {
  return safe(
    withStore(STORES.productRescue, "readonly", (store) =>
      getAllFromIndex(store, "createdAt", limit, true)
    ),
    []
  );
}

// ---------------------------------------------------------------------------
// homemade_recipes
// ---------------------------------------------------------------------------
export function saveHomemadeRecipe(recipe) {
  const normalized = normalizeBarcode(recipe?.normalizedBarcode ?? recipe?.barcode);
  const payload = {
    barcode: recipe?.barcode ?? normalized,
    normalizedBarcode: normalized,
    productName: recipe?.productName ?? null,
    recipeTitle: recipe?.recipeTitle ?? recipe?.title ?? null,
    ingredients: recipe?.ingredients ?? [],
    instructions: recipe?.instructions ?? recipe?.steps ?? [],
    notes: recipe?.notes ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  // TODO(supabase): persist generated recipes to a remote table for shareable history.
  return safe(
    withStore(STORES.homemadeRecipes, "readwrite", (store) => runRequest(store.add(payload))),
    null
  );
}

export function getHomemadeRecipes(limit = 20) {
  return safe(
    withStore(STORES.homemadeRecipes, "readonly", (store) =>
      getAllFromIndex(store, "createdAt", limit, true)
    ),
    []
  );
}

// ---------------------------------------------------------------------------
// app_events
// ---------------------------------------------------------------------------
export function logAppEvent(event) {
  const payload = {
    eventType: event?.eventType ?? "unknown",
    barcode: event?.barcode ?? null,
    message: event?.message ?? null,
    details: event?.details ?? null,
    createdAt: nowIso(),
  };
  return safe(
    withStore(STORES.appEvents, "readwrite", (store) => runRequest(store.add(payload))),
    null
  );
}

// ---------------------------------------------------------------------------
// settings
// ---------------------------------------------------------------------------
export function getSetting(key) {
  return safe(
    withStore(STORES.settings, "readonly", (store) => runRequest(store.get(key))),
    null
  );
}

export function setSetting(key, value) {
  return safe(
    withStore(STORES.settings, "readwrite", (store) =>
      runRequest(store.put({ key, value, updatedAt: nowIso() }))
    ),
    null
  );
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------
export async function clearLocalData() {
  const names = Object.values(STORES);
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(names, "readwrite");
      for (const name of names) tx.objectStore(name).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
      tx.onabort = (e) => reject(e.target.error ?? new Error("Clear aborted."));
    });
    return true;
  } catch (err) {
    console.warn("localDb: clearLocalData failed", err);
    return false;
  }
}

export const __STORES__ = STORES;
