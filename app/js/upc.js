const VALID_LENGTHS = new Set([8, 12, 13, 14]);

/**
 * Cleans and validates a raw UPC string.
 * Returns { ok: true, upc: string } or { ok: false, error: string }.
 * The returned upc is always a string to preserve leading zeroes.
 */
export function validateAndNormalizeUpc(raw) {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/[\s\-]/g, "");

  if (!cleaned) {
    return { ok: false, error: "Please enter a UPC." };
  }
  if (!/^\d+$/.test(cleaned)) {
    return { ok: false, error: "UPC must contain digits only (spaces and dashes are stripped automatically)." };
  }
  if (!VALID_LENGTHS.has(cleaned.length)) {
    return { ok: false, error: `UPC must be 8, 12, 13, or 14 digits — you entered ${cleaned.length}.` };
  }

  return { ok: true, upc: cleaned };
}
