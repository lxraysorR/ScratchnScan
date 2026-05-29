// Use VITE_SCAN_SCRATCH_API_BASE when running under Vite (cross-origin dev).
// Falls back to "" (relative URLs) so the same code works when the worker
// serves both the frontend and the API from the same origin.
const WORKER_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SCAN_SCRATCH_API_BASE) || "";

import { AI_TIMEOUT_MS } from "./constants.js";

async function postJson(path, payload) {
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

  return body;
}

export async function lookupUpc(upc) {
  return postJson("/api/lookup-upc", { upc });
}

export async function generateScratchRecipe(payload, { timeoutMs = AI_TIMEOUT_MS } = {}) {
  // Guard the only network call in the generate flow: without a timeout a
  // hung/slow Worker leaves the `await` pending forever and the UI never exits
  // its loading state. AbortController bounds the request (and its body read).
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller && timeoutMs > 0
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    let res;
    try {
      res = await fetch(`${WORKER_BASE}/api/generate-scratch-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller?.signal,
      });
    } catch (err) {
      if (err?.name === "AbortError") {
        const timeoutErr = new Error("The AI service took too long to respond.");
        timeoutErr.timeout = true;
        throw timeoutErr;
      }
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
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function normalizeProduct(raw, upc) {
  const p = raw?.product ?? raw ?? {};
  return {
    upc: String(p.upc ?? upc ?? ""),
    productName: p.name ?? p.productName ?? null,
    brand: p.brand ?? null,
    category: p.category ?? null,
    imageUrl: p.imageUrl ?? null,
    ingredients: p.ingredients ?? null,
    source: p.source ?? "SearchUPCData",
    found: Boolean(p.name ?? p.productName),
  };
}


export async function getPopularItems() {
  let res;
  try {
    res = await fetch(`${WORKER_BASE}/api/popular-items`);
  } catch {
    return { ok: false, items: [] };
  }
  try {
    return await res.json();
  } catch {
    return { ok: false, items: [] };
  }
}
