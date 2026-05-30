/**
 * UI glue for the Scan screen.
 *
 * Owns:
 *   - the Start/Cancel scanner buttons
 *   - the video element for web camera scanning
 *   - the scan-status area on the scan view
 *   - the captured-barcode banner on the manual entry view
 *   - the "Clear barcode" affordance on that banner
 */
import {
  startScan,
  cancelActiveScan,
  getDraftBarcode,
  clearDraftBarcode,
} from "./scannerService.js";
import { showToast } from "./app.js";

let wired = false;

function el(id) { return document.getElementById(id); }

const STATUS_COPY = {
  scanning: { tone: "info", text: "Opening camera…" },
  success: { tone: "success", text: "Barcode captured" },
  duplicate: { tone: "info", text: "Same barcode already captured" },
  cancelled: { tone: "info", text: "Scan cancelled. You can try again or type the product name." },
  busy: { tone: "info", text: "A scan is already in progress." },
  "permission-denied": {
    tone: "warn",
    text: "Camera access is needed to scan. You can still type the product name.",
  },
  preparing: {
    tone: "info",
    text: "Scanner is getting ready. Please try again in a moment.",
  },
  unsupported: {
    tone: "warn",
    text: "Camera scanning isn't available here. Make sure you're on a secure (https) connection, or type the product name.",
  },
  error: {
    tone: "warn",
    text: "Could not start the scanner. You can still type the product name.",
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

function showScanCamera(active) {
  const video = el("scan-video");
  const placeholder = el("scan-frame-placeholder");
  const scanLine = el("scan-line");
  if (video) video.hidden = !active;
  if (placeholder) placeholder.hidden = active;
  if (scanLine) scanLine.style.display = active ? "" : "";
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
  const cancelBtn = el("scan-cancel-btn");
  if (!button || button.disabled) return;

  button.disabled = true;
  button.textContent = "Scanning…";
  if (cancelBtn) cancelBtn.hidden = false;
  setStatus("scanning");
  showScanCamera(true);

  const videoEl = el("scan-video");

  try {
    const result = await startScan({ videoEl });

    showScanCamera(false);
    setStatus(result.status);

    if (result.status === "success") {
      refreshBarcodeBanner();
      showToast("Barcode captured. Generating homemade recipe…");
      setTimeout(() => { window.location.hash = "#manual"; }, 350);
      return;
    }

    if (result.status === "duplicate") {
      refreshBarcodeBanner();
      setTimeout(() => { window.location.hash = "#manual"; }, 350);
      return;
    }

    if (
      result.status === "unsupported" ||
      result.status === "permission-denied" ||
      result.status === "error"
    ) {
      showToast(STATUS_COPY[result.status]?.text || "Scanner unavailable. Try typing the product name.");
    }
  } finally {
    button.disabled = false;
    button.textContent = "Start scanner";
    if (cancelBtn) cancelBtn.hidden = true;
    showScanCamera(false);
  }
}

function handleCancelClick() {
  cancelActiveScan();
}

export function initPackageEntry() {
  if (wired) {
    refreshBarcodeBanner();
    clearStatus();
    showScanCamera(false);
    return;
  }
  wired = true;

  el("scan-start-btn")?.addEventListener("click", handleScanClick);
  el("scan-cancel-btn")?.addEventListener("click", handleCancelClick);

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
  showScanCamera(false);
  refreshBarcodeBanner();
}
