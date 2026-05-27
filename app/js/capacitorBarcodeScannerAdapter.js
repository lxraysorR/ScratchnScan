/**
 * Thin wrapper around @capacitor-mlkit/barcode-scanning.
 *
 * Why a wrapper: the rest of the app should never have to know about the
 * underlying plugin shape, error formats, or Android module-install dance.
 * This file is the only place that talks to the plugin directly.
 *
 * Loading strategy:
 *   1. Prefer the globally registered Capacitor plugin (works on native
 *      builds that have already bridged the plugin into the webview).
 *   2. Fall back to a dynamic import of the npm package (works when the
 *      app is bundled with the dependency available).
 *   3. If neither resolves, every call short-circuits to a clear
 *      "unavailable" status so the UI can fall back to manual entry.
 */
import { isNativePlatform, isAndroid } from "./platform.js";

let cachedScanner = null;
let resolveAttempted = false;

async function resolveScanner() {
  if (cachedScanner) return cachedScanner;
  if (resolveAttempted) return null;
  resolveAttempted = true;

  const cap = globalThis.Capacitor;
  const fromGlobal = cap?.Plugins?.BarcodeScanner;
  if (fromGlobal && typeof fromGlobal.scan === "function") {
    cachedScanner = fromGlobal;
    return cachedScanner;
  }

  if (!isNativePlatform()) return null;

  try {
    const mod = await import("@capacitor-mlkit/barcode-scanning");
    if (mod?.BarcodeScanner) {
      cachedScanner = mod.BarcodeScanner;
      return cachedScanner;
    }
  } catch (err) {
    console.warn("Barcode scanner module not available:", err?.message || err);
  }
  return null;
}

export async function isSupported() {
  if (!isNativePlatform()) return false;
  const scanner = await resolveScanner();
  if (!scanner) return false;
  if (typeof scanner.isSupported !== "function") return true;
  try {
    const res = await scanner.isSupported();
    return !!res?.supported;
  } catch {
    return false;
  }
}

/**
 * Android's ML Kit barcode module ships as an on-demand Play Services
 * module. Trigger an install when it is not yet present.
 */
export async function ensureModuleInstalled() {
  if (!isNativePlatform() || !isAndroid()) return { ready: true };
  const scanner = await resolveScanner();
  if (!scanner) return { ready: false, reason: "unavailable" };
  if (typeof scanner.isGoogleBarcodeScannerModuleAvailable !== "function") {
    return { ready: true };
  }
  try {
    const installed = await scanner.isGoogleBarcodeScannerModuleAvailable();
    if (installed?.available) return { ready: true };
    if (typeof scanner.installGoogleBarcodeScannerModule === "function") {
      await scanner.installGoogleBarcodeScannerModule();
      return { ready: true, installed: true };
    }
    return { ready: false, reason: "module-install-required" };
  } catch (err) {
    return { ready: false, reason: "module-install-failed", error: err?.message };
  }
}

export async function checkPermissions() {
  const scanner = await resolveScanner();
  if (!scanner || typeof scanner.checkPermissions !== "function") {
    return { camera: "unsupported" };
  }
  try {
    const status = await scanner.checkPermissions();
    return { camera: status?.camera || "unknown" };
  } catch (err) {
    return { camera: "error", error: err?.message };
  }
}

export async function requestPermissions() {
  const scanner = await resolveScanner();
  if (!scanner) return { granted: false, reason: "unavailable" };
  try {
    const status = typeof scanner.checkPermissions === "function"
      ? await scanner.checkPermissions()
      : null;
    if (status?.camera === "granted") return { granted: true };
    if (typeof scanner.requestPermissions !== "function") {
      return { granted: false, reason: "unsupported" };
    }
    const req = await scanner.requestPermissions();
    return {
      granted: req?.camera === "granted",
      reason: req?.camera || "unknown",
    };
  } catch (err) {
    return { granted: false, reason: "error", error: err?.message };
  }
}

export async function scanOnce() {
  const scanner = await resolveScanner();
  if (!scanner || typeof scanner.scan !== "function") {
    return { cancelled: false, barcode: null, reason: "unavailable" };
  }
  try {
    const result = await scanner.scan({ formats: [] });
    const barcodes = Array.isArray(result?.barcodes) ? result.barcodes : [];
    if (!barcodes.length) {
      return { cancelled: true, barcode: null };
    }
    const first = barcodes[0];
    return {
      cancelled: false,
      barcode: first?.rawValue || first?.displayValue || null,
      format: first?.format || null,
    };
  } catch (err) {
    const msg = String(err?.message || err || "").toLowerCase();
    if (msg.includes("cancel")) return { cancelled: true, barcode: null };
    return { cancelled: false, barcode: null, reason: "error", error: err?.message };
  }
}
