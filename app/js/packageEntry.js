/**
 * UI glue for the Scan / Package Entry screen.
 *
 * Owns:
 *   - the Scan package button (kicks off scannerService.startScan)
 *   - the scan-status area on the scan view
 *   - the captured-barcode banner on the manual entry view
 *   - the "Clear barcode" affordance on that banner
 */
import {
  startScan,
  isScannerAvailable,
  getDraftBarcode,
  clearDraftBarcode,
} from "./scannerService.js";
import { isNativePlatform } from "./platform.js";
import { showToast } from "./app.js";

let wired = false;

function el(id) { return document.getElementById(id); }

const STATUS_COPY = {
  scanning: { tone: "info", text: "Opening scanner…" },
  success: { tone: "success", text: "Barcode captured" },
  duplicate: { tone: "info", text: "Same barcode already captured" },
  cancelled: { tone: "info", text: "Scan cancelled. You can try again or enter manually." },
  busy: { tone: "info", text: "A scan is already in progress." },
  "permission-denied": {
    tone: "warn",
    text: "Camera access is needed to scan a package. You can still enter the item manually.",
  },
  preparing: {
    tone: "info",
    text: "Scanner is getting ready on this device. Please try again in a moment.",
  },
  unsupported: {
    tone: "warn",
    text: "Scanning isn't available on this device yet. Enter the package manually below.",
  },
  error: {
    tone: "warn",
    text: "We couldn't start the scanner. Enter the package manually below.",
  },
};

function setStatus(kind) {
  const status = el("scan-status");
  if (!status) return;
  const config = STATUS_COPY[kind];
  if (!config) {
    status.hidden = true;
    status.textContent = "";
    return;
  }
  status.dataset.tone = config.tone;
  status.textContent = config.text;
  status.hidden = false;
}

function clearStatus() {
  const status = el("scan-status");
  if (!status) return;
  status.hidden = true;
  status.textContent = "";
  delete status.dataset.tone;
}

export function refreshBarcodeBanner() {
  const banner = el("draft-barcode");
  const value = el("draft-barcode-value");
  if (!banner || !value) return;
  const barcode = typeof getDraftBarcode === "function" ? getDraftBarcode() : "";
  if (barcode) {
    value.textContent = barcode;
    banner.hidden = false;
  } else {
    value.textContent = "";
    banner.hidden = true;
  }
}

async function handleScanClick() {
  const button = el("scan-start-btn");
  if (!button || button.disabled) return;
  button.disabled = true;
  setStatus("scanning");
  try {
    const result = await startScan();
    setStatus(result.status);

    if (result.status === "success") {
      refreshBarcodeBanner();
      showToast("Barcode captured");
      // Move user into the manual context screen so they can add details.
      setTimeout(() => {
        window.location.hash = "#manual";
      }, 350);
      return;
    }

    if (result.status === "duplicate") {
      refreshBarcodeBanner();
      return;
    }

    if (
      result.status === "unsupported" ||
      result.status === "permission-denied" ||
      result.status === "error"
    ) {
      // Native scanning is not available here. Show the honest fallback
      // message, then route into manual/photo entry so Scan is never a dead
      // action. No barcode was captured, so nothing counts as a generation.
      showToast("Scanner unavailable — switching to manual entry");
      setTimeout(() => {
        window.location.hash = "#manual";
      }, 700);
    }
  } finally {
    button.disabled = false;
  }
}

async function applyAvailabilityHint() {
  const button = el("scan-start-btn");
  if (!button) return;
  if (isNativePlatform()) {
    button.textContent = "Scan package";
    return;
  }
  const available = await isScannerAvailable();
  if (!available) {
    button.textContent = "Scan package";
    setStatus("unsupported");
  }
}

export function initPackageEntry() {
  if (wired) {
    refreshBarcodeBanner();
    return;
  }
  wired = true;

  el("scan-start-btn")?.addEventListener("click", handleScanClick);

  el("draft-barcode-clear")?.addEventListener("click", () => {
    clearDraftBarcode();
    refreshBarcodeBanner();
    showToast("Barcode cleared");
  });

  el("manual-clear-btn")?.addEventListener("click", () => {
    clearDraftBarcode();
    refreshBarcodeBanner();
  });

  clearStatus();
  applyAvailabilityHint();
  refreshBarcodeBanner();
}
