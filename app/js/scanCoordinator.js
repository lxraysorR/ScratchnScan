/**
 * Lightweight guard rails around scanner activations.
 *
 * - Prevents two scans from running at the same time.
 * - De-dupes the same barcode read twice in a row inside a short
 *   cooldown window (mlkit can fire the same code repeatedly).
 * - Provides a manual reset for tests and edge cases.
 */

const DEFAULT_COOLDOWN_MS = 1500;

const state = {
  active: false,
  lastBarcode: null,
  lastTimestamp: 0,
  cooldownMs: DEFAULT_COOLDOWN_MS,
};

export function isScanInFlight() {
  return state.active;
}

export function beginScan() {
  if (state.active) return false;
  state.active = true;
  return true;
}

export function endScan() {
  state.active = false;
}

export function shouldAcceptBarcode(barcode) {
  if (!barcode) return false;
  const now = Date.now();
  if (
    state.lastBarcode === barcode &&
    now - state.lastTimestamp < state.cooldownMs
  ) {
    return false;
  }
  state.lastBarcode = barcode;
  state.lastTimestamp = now;
  return true;
}

export function resetScanState() {
  state.active = false;
  state.lastBarcode = null;
  state.lastTimestamp = 0;
}

export function setCooldownMs(ms) {
  if (typeof ms === "number" && ms >= 0) state.cooldownMs = ms;
}
