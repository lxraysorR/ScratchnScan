/**
 * Scanner service: the single API the UI uses to start a barcode scan.
 *
 * Resolves to one of these statuses so the UI can render a single,
 * predictable message for each branch:
 *   success         -> we got a barcode (already normalized)
 *   duplicate       -> same barcode just captured, ignore
 *   cancelled       -> user closed the scanner
 *   permission-denied -> camera permission was refused
 *   preparing       -> Android ML Kit module is still installing
 *   unsupported     -> running in a browser or device without scanner
 *   busy            -> a scan is already in flight
 *   error           -> something unexpected went wrong
 */
import { isNativePlatform, getPlatform } from "./platform.js";
import * as adapter from "./capacitorBarcodeScannerAdapter.js";
import * as coordinator from "./scanCoordinator.js";

export const SCAN_DRAFT_KEY = "scratchnscan:draftBarcode";

export function normalizeBarcode(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\D/g, "");
}

export async function isScannerAvailable() {
  if (!isNativePlatform()) return false;
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

export async function startScan() {
  if (!coordinator.beginScan()) {
    return { status: "busy", barcode: null };
  }
  try {
    if (!isNativePlatform()) {
      return { status: "unsupported", platform: getPlatform(), barcode: null };
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
