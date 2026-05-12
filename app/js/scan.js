import { validateAndNormalizeUpc } from "./upc.js";
import { lookupUpc, normalizeProduct } from "./api.js";
import {
  initDatabase,
  normalizeBarcode,
  saveScanHistory,
  getScanHistory,
  saveProductCache,
  getProductByBarcode,
  saveProductRescueDraft,
  logAppEvent,
} from "./localDb.js";

// Published to app.js so the result view can read it.
export let lastLookupResult = null;

let viewInitialized = false;

// ---------------------------------------------------------------------------
// Camera / BarcodeDetector support check
// ---------------------------------------------------------------------------
async function isScannerAvailable() {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  if (!window.BarcodeDetector) return false;
  try {
    const formats = await BarcodeDetector.getSupportedFormats();
    return formats.some((f) => ["ean_13", "ean_8", "upc_a", "upc_e"].includes(f));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------
function el(id) {
  return document.getElementById(id);
}

function setHidden(element, hidden) {
  if (element) element.hidden = hidden;
}

function clearStates() {
  setHidden(el("scan-loading"), true);
  setHidden(el("scan-error"), true);
  setHidden(el("scan-not-found"), true);
  setHidden(el("scan-rescue-form"), true);
  setHidden(el("scan-rescue-saved"), true);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export async function initScanView() {
  await initDatabase();

  if (!viewInitialized) {
    const scannerSupported = await isScannerAvailable();
    const cameraSection = el("scan-camera-section");
    const manualSection = el("scan-manual-section");

    if (scannerSupported) {
      setHidden(cameraSection, false);
      setHidden(manualSection, true);
      el("scan-use-manual-btn")?.addEventListener("click", () => {
        setHidden(cameraSection, true);
        setHidden(manualSection, false);
        el("upc-input")?.focus();
      });
    } else {
      setHidden(cameraSection, true);
      setHidden(manualSection, false);
    }

    el("upc-form")?.addEventListener("submit", handleManualSubmit);
    el("upc-input")?.addEventListener("input", clearStates);
    el("scan-rescue-open-btn")?.addEventListener("click", openRescueForm);
    el("scan-rescue-form")?.addEventListener("submit", handleRescueSubmit);
    el("scan-rescue-cancel-btn")?.addEventListener("click", () => {
      setHidden(el("scan-rescue-form"), true);
    });

    viewInitialized = true;
  }

  await renderHistory();
}

// ---------------------------------------------------------------------------
// Manual UPC submission
// ---------------------------------------------------------------------------
async function handleManualSubmit(e) {
  e.preventDefault();
  clearStates();

  const raw = el("upc-input").value;
  const validation = validateAndNormalizeUpc(raw);
  if (!validation.ok) {
    showError(validation.error);
    return;
  }

  const upc = validation.upc;
  const normalized = normalizeBarcode(upc);
  const submitBtn = el("scan-submit-btn");

  setHidden(el("scan-loading"), false);
  if (submitBtn) submitBtn.disabled = true;

  try {
    // 1. Cache first.
    const cached = await getProductByBarcode(normalized);
    if (cached?.productName) {
      await saveScanHistory({
        barcode: upc,
        normalizedBarcode: normalized,
        source: cached.source ?? "cache",
        status: "cached",
        productName: cached.productName,
        brand: cached.brand,
      });
      await logAppEvent({
        eventType: "cache_hit",
        barcode: normalized,
        message: "Served from local product_cache.",
      });

      lastLookupResult = {
        upc,
        productName: cached.productName,
        brand: cached.brand,
        category: cached.category ?? null,
        imageUrl: cached.imageUrl,
        ingredients: cached.ingredients,
        nutrition: cached.nutrition,
        source: cached.source ?? "cache",
        found: true,
      };
      finishLookup(submitBtn);
      window.location.hash = "#result";
      return;
    }

    // 2. Remote lookup.
    const body = await lookupUpc(upc);
    const product = normalizeProduct(body, upc);

    if (!product.found) {
      await saveScanHistory({
        barcode: upc,
        normalizedBarcode: normalized,
        source: product.source ?? "remote",
        status: "not_found",
        message: "No product details returned by lookup.",
      });
      await saveProductRescueDraft({
        barcode: upc,
        normalizedBarcode: normalized,
        status: "draft",
      });
      await logAppEvent({
        eventType: "product_not_found",
        barcode: normalized,
      });

      showNotFound(upc);
      finishLookup(submitBtn);
      await renderHistory();
      return;
    }

    // 3. Found — cache and continue.
    await saveProductCache({
      barcode: upc,
      normalizedBarcode: normalized,
      productName: product.productName,
      brand: product.brand,
      ingredients: product.ingredients,
      nutrition: product.nutrition ?? null,
      imageUrl: product.imageUrl,
      source: product.source,
      raw: body?.product ?? null,
    });
    await saveScanHistory({
      barcode: upc,
      normalizedBarcode: normalized,
      source: product.source,
      status: "found",
      productName: product.productName,
      brand: product.brand,
    });

    lastLookupResult = product;
    finishLookup(submitBtn);
    window.location.hash = "#result";
  } catch (err) {
    await saveScanHistory({
      barcode: upc,
      normalizedBarcode: normalized,
      source: "remote",
      status: "error",
      message: err?.message ?? "Lookup failed.",
    });
    await logAppEvent({
      eventType: "lookup_error",
      barcode: normalized,
      message: err?.message ?? "Lookup failed.",
    });
    finishLookup(submitBtn);
    showError(err?.message ?? "Lookup failed. Please try again.");
    await renderHistory();
  }
}

function finishLookup(submitBtn) {
  setHidden(el("scan-loading"), true);
  if (submitBtn) submitBtn.disabled = false;
}

function showError(message) {
  el("scan-error-msg").textContent = message;
  setHidden(el("scan-error"), false);
}

function showNotFound(upc) {
  el("scan-not-found-upc").textContent = upc;
  setHidden(el("scan-not-found"), false);
}

// ---------------------------------------------------------------------------
// Product Rescue form
// ---------------------------------------------------------------------------
function openRescueForm() {
  setHidden(el("scan-rescue-saved"), true);
  const form = el("scan-rescue-form");
  if (!form) return;
  const upc = el("scan-not-found-upc")?.textContent ?? "";
  form.dataset.barcode = upc;
  el("rescue-barcode-readout").textContent = upc;
  form.reset();
  setHidden(form, false);
}

async function handleRescueSubmit(e) {
  e.preventDefault();
  const form = el("scan-rescue-form");
  const upc = form.dataset.barcode ?? "";
  const normalized = normalizeBarcode(upc);
  if (!normalized) return;

  await saveProductRescueDraft({
    barcode: upc,
    normalizedBarcode: normalized,
    status: "draft",
    productName: el("rescue-name").value.trim() || null,
    brand: el("rescue-brand").value.trim() || null,
    ingredientsText: el("rescue-ingredients").value.trim() || null,
    nutritionText: el("rescue-nutrition").value.trim() || null,
    notes: el("rescue-notes").value.trim() || null,
  });
  await logAppEvent({
    eventType: "rescue_draft_saved",
    barcode: normalized,
  });

  setHidden(form, true);
  setHidden(el("scan-rescue-saved"), false);
  await renderHistory();
}

// ---------------------------------------------------------------------------
// Local history rendering
// ---------------------------------------------------------------------------
async function renderHistory() {
  const listEl = el("scan-history-list");
  const emptyEl = el("scan-history-empty");
  if (!listEl) return;

  const records = await getScanHistory(10);
  listEl.innerHTML = "";

  if (!records.length) {
    setHidden(emptyEl, false);
    return;
  }
  setHidden(emptyEl, true);

  for (const r of records) {
    const li = document.createElement("li");
    li.className = "history-item";

    const top = document.createElement("div");
    top.className = "history-top";
    const name = document.createElement("span");
    name.className = "history-name";
    name.textContent = r.productName ?? "(no product name)";
    const status = document.createElement("span");
    status.className = `history-status history-status-${r.status}`;
    status.textContent = r.status;
    top.appendChild(name);
    top.appendChild(status);

    const meta = document.createElement("div");
    meta.className = "history-meta";
    const code = document.createElement("code");
    code.textContent = r.barcode ?? r.normalizedBarcode ?? "";
    const when = document.createElement("time");
    when.dateTime = r.createdAt ?? "";
    when.textContent = formatTime(r.createdAt);
    meta.appendChild(code);
    meta.appendChild(when);

    li.appendChild(top);
    li.appendChild(meta);
    listEl.appendChild(li);
  }
}

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
