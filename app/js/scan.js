import { validateAndNormalizeUpc } from "./upc.js";
import { lookupUpc } from "./api.js";
import { saveScan } from "./storage.js";

// Published to app.js so the result view can read it.
export let lastLookupResult = null;

// Prevents concurrent requests from the same form.
let requestInFlight = false;

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

function clearStates() {
  el("scan-loading").hidden = true;
  el("scan-error").hidden = true;
  el("scan-not-found").hidden = true;
}

// ---------------------------------------------------------------------------
// Init — called exactly once by app.js
// ---------------------------------------------------------------------------
export async function initScanView() {
  const scannerSupported = await isScannerAvailable();
  const cameraSection = el("scan-camera-section");
  const manualSection = el("scan-manual-section");

  if (scannerSupported) {
    cameraSection.hidden = false;
    manualSection.hidden = true;
    el("scan-use-manual-btn").addEventListener("click", () => {
      cameraSection.hidden = true;
      manualSection.hidden = false;
      el("upc-input").focus();
    });
  } else {
    cameraSection.hidden = true;
    manualSection.hidden = false;
  }

  el("upc-form").addEventListener("submit", handleManualSubmit);
  el("upc-input").addEventListener("input", clearStates);
}

// ---------------------------------------------------------------------------
// Manual UPC submission
// ---------------------------------------------------------------------------
async function handleManualSubmit(e) {
  e.preventDefault();

  // Hard guard: ignore if a request is already in flight.
  if (requestInFlight) return;

  clearStates();

  const raw = el("upc-input").value;
  const validation = validateAndNormalizeUpc(raw);
  if (!validation.ok) {
    showError(validation.error);
    return;
  }

  const { upc } = validation;
  const submitBtn = el("scan-submit-btn");

  requestInFlight = true;
  submitBtn.disabled = true;
  el("scan-loading").hidden = false;

  try {
    const product = await lookupUpc(upc);

    // Persist before navigating so the result view always has data.
    await saveScan({ ...product, inputMethod: "manual" }).catch(() => {});

    lastLookupResult = product;
    window.location.hash = "#result";
  } catch (err) {
    if (err.notFound) {
      el("scan-not-found").hidden = false;
      el("scan-not-found-upc").textContent = upc;
    } else {
      showError(userMessage(err));
    }
  } finally {
    requestInFlight = false;
    submitBtn.disabled = false;
    el("scan-loading").hidden = true;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function userMessage(err) {
  // Translate provider/config failures into a single clean sentence.
  if (err.status === 502 || err.status === 500) {
    return "Product lookup is temporarily unavailable. Please try again.";
  }
  return err.message ?? "Something went wrong. Please try again.";
}

function showError(message) {
  el("scan-error-msg").textContent = message;
  el("scan-error").hidden = false;
}
