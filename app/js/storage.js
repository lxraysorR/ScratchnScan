const DB_NAME = "scratchnscan";
const STORE = "scans";
const VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("upc", "upc", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Persist a scan result.
 * Required fields: upc, productName, brand, imageUrl, ingredients, source, inputMethod.
 * createdAt is stamped here.
 */
export async function saveScan(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add({
      upc: record.upc,
      productName: record.productName ?? null,
      brand: record.brand ?? null,
      imageUrl: record.imageUrl ?? null,
      ingredients: record.ingredients ?? null,
      source: record.source ?? null,
      inputMethod: record.inputMethod ?? "manual",
      createdAt: new Date().toISOString(),
    });
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Return recent scans, newest first, up to `limit`.
 */
export async function getRecentScans(limit = 20) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = (e) => {
      const all = e.target.result ?? [];
      resolve(all.slice(-limit).reverse());
    };
    req.onerror = (e) => reject(e.target.error);
  });
}
