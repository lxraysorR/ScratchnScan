const WORKER_BASE = "https://scratchnscan.layr-sor.workers.dev";

/**
 * POST /api/lookup-upc
 * upc must be a string to preserve leading zeroes.
 * Returns the worker's { ok, product } payload on success.
 * Throws an Error with a user-facing .message on failure.
 */
export async function lookupUpc(upc) {
  let res;
  try {
    res = await fetch(`${WORKER_BASE}/api/lookup-upc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upc: String(upc) }),
    });
  } catch {
    throw new Error("Could not reach the server. Check your internet connection and try again.");
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error("Server returned an unexpected response. Please try again.");
  }

  if (!res.ok) {
    throw new Error(body?.error ?? `Server error (${res.status}). Please try again.`);
  }

  return body;
}

/**
 * Normalise the raw product object from the worker into the app's
 * internal product result model.
 */
export function normalizeProduct(raw, upc) {
  const p = raw?.product ?? raw ?? {};
  return {
    upc: String(p.upc ?? upc),
    productName: p.name ?? p.productName ?? null,
    brand: p.brand ?? null,
    category: p.category ?? null,
    imageUrl: p.imageUrl ?? p.image ?? null,
    ingredients: p.ingredients ?? null,
    source: p.source ?? "SearchUPCData",
    found: p.found !== false && !!(p.name ?? p.productName),
  };
}
