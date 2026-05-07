import { validateAndNormalizeUpc } from "./upc.js";
import { lookupUpc, normalizeProduct } from "./api.js";
import { saveScan } from "./storage.js";

// Published to app.js so the result view can read it.
export let lastLookupResult = null;

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
  element.hidden = hidden;
}

function clearStates() {
  setHidden(el("scan-loading"), true);
  setHidden(el("scan-error"), true);
  setHidden(el("scan-not-found"), true);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
export async function initScanView() {
  // Decide whether to show camera hint or go straight to manual entry.
  const scannerSupported = await isScannerAvailable();
  const cameraSection = el("scan-camera-section");
  const manualSection = el("scan-manual-section");

  if (scannerSupported) {
    setHidden(cameraSection, false);
    setHidden(manualSection, true);
    el("scan-use-manual-btn").addEventListener("click", () => {
      setHidden(cameraSection, true);
      setHidden(manualSection, false);
      el("upc-input").focus();
    });
  } else {
    // Camera/scanner unavailable — show manual entry immediately.
    setHidden(cameraSection, true);
    setHidden(manualSection, false);
  }

  // Wire up the manual lookup form.
  el("upc-form").addEventListener("submit", handleManualSubmit);
  el("upc-input").addEventListener("input", () => {
    clearStates();
  });
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

  const { upc } = validation;
  setHidden(el("scan-loading"), false);
  el("scan-submit-btn").disabled = true;

  try {
    const body = await lookupUpc(upc);
    const product = normalizeProduct(body, upc);

    if (!product.found) {
      setHidden(el("scan-loading"), true);
      setHidden(el("scan-not-found"), false);
      el("scan-not-found-upc").textContent = upc;
      el("scan-submit-btn").disabled = false;
      return;
    }

    // Persist to local cache.
    await saveScan({ ...product, inputMethod: "manual" }).catch(() => {});

    // Hand off to result view.
    lastLookupResult = product;
    setHidden(el("scan-loading"), true);
    el("scan-submit-btn").disabled = false;
    window.location.hash = "#result";
  } catch (err) {
    setHidden(el("scan-loading"), true);
    el("scan-submit-btn").disabled = false;
    showError(err.message);
  }
}

function showError(message) {
  const errEl = el("scan-error");
  el("scan-error-msg").textContent = message;
  setHidden(errEl, false);
}
