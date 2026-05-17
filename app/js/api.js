// Use VITE_SCAN_SCRATCH_API_BASE when running under Vite (cross-origin dev).
// Falls back to "" (relative URLs) so the same code works when the worker
// serves both the frontend and the API from the same origin.
const WORKER_BASE = import.meta.env?.VITE_SCAN_SCRATCH_API_BASE ?? "";

/**
 * POST /api/lookup-upc
 * upc must be a string to preserve leading zeroes.
 *
 * Returns a normalised product object on success.
 * Throws an Error with:
 *   err.message  — user-facing text (do not expose secrets)
 *   err.status   — HTTP status from the worker
 *   err.notFound — true when the worker returns 404
 */
export async function lookupUpc(upc) {
  let res;
  try {
    res = await fetch(`${WORKER_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    const err = new Error("Could not reach the server. Check your connection and try again.");
    err.status = 0;
    throw err;
  }

  let body;
  try {
    body = await res.json();
  } catch {
    const err = new Error("The server returned an unexpected response. Please try again.");
    err.status = res.status;
    throw err;
  }

  if (res.status === 404) {
    const err = new Error(body?.error ?? "Product not found");
    err.status = 404;
    err.notFound = true;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(body?.error ?? `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return normalizeProduct(body, upc);
}

/**
 * Map the worker's product payload to the app's internal model.
 * All fields are safe to render — no secrets pass through.
 */
function normalizeProduct(raw, upc) {
  const p = raw?.product ?? {};
  return {
    upc: String(p.upc ?? upc),
    productName: p.name ?? null,
    brand: p.brand ?? null,
    category: p.category ?? null,
    imageUrl: p.imageUrl ?? null,
    ingredients: p.ingredients ?? null,
    source: p.source ?? "SearchUPCData",
  };
}
