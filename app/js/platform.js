/**
 * Platform detection helpers.
 * Used by the scanner service to choose between native (Capacitor) and
 * browser/manual code paths. Safe to call in a non-Capacitor browser:
 * Capacitor will simply be undefined and isNativePlatform() returns false.
 */

export function isCapacitorAvailable() {
  return typeof globalThis !== "undefined" && !!globalThis.Capacitor;
}

export function getPlatform() {
  if (!isCapacitorAvailable()) return "web";
  const cap = globalThis.Capacitor;
  if (typeof cap.getPlatform === "function") {
    try { return cap.getPlatform(); } catch { return "web"; }
  }
  return "web";
}

export function isNativePlatform() {
  if (!isCapacitorAvailable()) return false;
  const cap = globalThis.Capacitor;
  if (typeof cap.isNativePlatform === "function") {
    try { return !!cap.isNativePlatform(); } catch { /* fall through */ }
  }
  const p = getPlatform();
  return p === "ios" || p === "android";
}

export function isAndroid() {
  return getPlatform() === "android";
}

export function isIos() {
  return getPlatform() === "ios";
}
