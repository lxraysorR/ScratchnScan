const WORKER_BASE = "https://scratchnscan.layr-sor.workers.dev";

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

export async function generateScratchRecipe(payload) {
  let res;
  try {
    res = await fetch(`${WORKER_BASE}/api/generate-scratch-recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Could not reach the AI service.");
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error("AI service returned an unexpected response.");
  }

  if (!res.ok) {
    throw new Error(body?.error ?? `AI service error (${res.status}).`);
  }

  return body;
}

export function normalizeProduct(raw, upc) {
  const p = raw?.product ?? raw ?? {};
  return {
    upc: String(p.upc ?? upc ?? ""),
    productName: p.name ?? p.productName ?? null,
    brand: p.brand ?? null,
    category: p.category ?? null,
    imageUrl: p.imageUrl ?? p.image ?? null,
    ingredients: p.ingredients ?? null,
    source: p.source ?? "SearchUPCData",
    found: p.found !== false && !!(p.name ?? p.productName),
  };
}
