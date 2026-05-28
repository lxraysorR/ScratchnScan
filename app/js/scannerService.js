/**
 * Scanner service: the single API the UI uses to start a barcode scan.
 *
 * On native (Capacitor) platforms: uses MLKit barcode scanning.
 * On web: uses BarcodeDetector API with camera stream.
 *
 * Resolves to one of these statuses so the UI can render a single,
 * predictable message for each branch:
 *   success         -> we got a barcode (already normalized)
 *   duplicate       -> same barcode just captured, ignore
 *   cancelled       -> user closed the scanner
 *   permission-denied -> camera permission was refused
 *   preparing       -> Android ML Kit module is still installing
 *   unsupported     -> device lacks required scanner capability
 *   busy            -> a scan is already in flight
 *   error           -> something unexpected went wrong
 */
import { isNativePlatform, getPlatform } from "./platform.js";
import * as adapter from "./capacitorBarcodeScannerAdapter.js";
import * as coordinator from "./scanCoordinator.js";

export const SCAN_DRAFT_KEY = "scratchnscan:draftBarcode";

let activeScanAbort = null;

export function normalizeBarcode(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\D/g, "");
}

export async function isScannerAvailable() {
  if (!isNativePlatform()) {
    return !!(navigator.mediaDevices?.getUserMedia && ("BarcodeDetector" in window));
  }
  try {
    return await adapter.isSupported();
  } catch {
    return false;
  }
}

export function getDraftBarcode() {
  try {
    return sessionStorage.getItem(SCAN_DRAFT_KEY) || "";
  } catch {
    return "";
  }
}

export function setDraftBarcode(barcode) {
  try {
    if (barcode) sessionStorage.setItem(SCAN_DRAFT_KEY, barcode);
    else sessionStorage.removeItem(SCAN_DRAFT_KEY);
  } catch { /* ignore storage failures */ }
}

export function clearDraftBarcode() {
  setDraftBarcode("");
}

export function cancelActiveScan() {
  if (typeof activeScanAbort === "function") {
    activeScanAbort();
    activeScanAbort = null;
  }
}

async function startWebScan(videoEl) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { status: "unsupported", barcode: null };
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
  } catch (err) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return { status: "permission-denied", barcode: null };
    }
    return { status: "error", reason: err.message, barcode: null };
  }

  if (videoEl) {
    videoEl.srcObject = stream;
    videoEl.hidden = false;
    try { await videoEl.play(); } catch { /* autoplay may already be running */ }
  }

  if (!("BarcodeDetector" in window)) {
    stream.getTracks().forEach((t) => t.stop());
    if (videoEl) { videoEl.srcObject = null; videoEl.hidden = true; }
    return { status: "unsupported", barcode: null };
  }

  let detector;
  try {
    detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "codabar"],
    });
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    if (videoEl) { videoEl.srcObject = null; videoEl.hidden = true; }
    return { status: "unsupported", barcode: null };
  }

  const detectionSrc = videoEl || (() => {
    const v = document.createElement("video");
    v.srcObject = stream;
    v.muted = true;
    v.play().catch(() => {});
    return v;
  })();

  return new Promise((resolve) => {
    let done = false;

    const stop = (result) => {
      if (done) return;
      done = true;
      activeScanAbort = null;
      stream.getTracks().forEach((t) => t.stop());
      if (videoEl) { videoEl.srcObject = null; videoEl.hidden = true; }
      resolve(result);
    };

    activeScanAbort = () => stop({ status: "cancelled", barcode: null });

    const tick = async () => {
      if (done) return;
      const ready = (detectionSrc.readyState || 0) >= 2;
      if (ready) {
        try {
          const barcodes = await detector.detect(detectionSrc);
          if (barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            const normalized = normalizeBarcode(raw);
            if (normalized) {
              if (!coordinator.shouldAcceptBarcode(normalized)) {
                stop({ status: "duplicate", barcode: normalized });
              } else {
                setDraftBarcode(normalized);
                stop({ status: "success", barcode: normalized, format: barcodes[0].format || null });
              }
              return;
            }
          }
        } catch { /* ignore per-frame detection errors */ }
      }
      if (!done) requestAnimationFrame(tick);
    };

    if ((detectionSrc.readyState || 0) >= 2) {
      requestAnimationFrame(tick);
    } else {
      detectionSrc.addEventListener("loadeddata", () => requestAnimationFrame(tick), { once: true });
    }

    setTimeout(() => stop({ status: "cancelled", barcode: null }), 30000);
  });
}

export async function startScan({ videoEl = null } = {}) {
  if (!coordinator.beginScan()) {
    return { status: "busy", barcode: null };
  }
  try {
    if (!isNativePlatform()) {
      return await startWebScan(videoEl);
    }

    const supported = await adapter.isSupported();
    if (!supported) {
      return { status: "unsupported", platform: getPlatform(), barcode: null };
    }

    const install = await adapter.ensureModuleInstalled();
    if (!install.ready) {
      return { status: "preparing", reason: install.reason, barcode: null };
    }

    const perm = await adapter.requestPermissions();
    if (!perm.granted) {
      return { status: "permission-denied", reason: perm.reason, barcode: null };
    }

    const result = await adapter.scanOnce();
    if (result.cancelled) {
      return { status: "cancelled", barcode: null };
    }
    if (!result.barcode) {
      return { status: "error", reason: result.reason || "no-barcode", barcode: null };
    }

    const normalized = normalizeBarcode(result.barcode);
    if (!normalized) {
      return { status: "error", reason: "empty-barcode", barcode: null };
    }
    if (!coordinator.shouldAcceptBarcode(normalized)) {
      return { status: "duplicate", barcode: normalized };
    }

    setDraftBarcode(normalized);
    return { status: "success", barcode: normalized, format: result.format || null };
  } catch (err) {
    return { status: "error", reason: "exception", error: err?.message, barcode: null };
  } finally {
    coordinator.endScan();
  }
}

export function resetScannerState() {
  coordinator.resetScanState();
  clearDraftBarcode();
}
