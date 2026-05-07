import { lastLookupResult } from "./scan.js";

function el(id) {
  return document.getElementById(id);
}

export function initResultView(product) {
  const p = product ?? lastLookupResult;
  if (!p) {
    // No product in memory — send user back to scan.
    window.location.hash = "#scan";
    return;
  }

  el("result-name").textContent = p.productName ?? "Unknown product";
  el("result-brand").textContent = p.brand ? `by ${p.brand}` : "";
  el("result-upc").textContent = `UPC: ${p.upc}`;

  const img = el("result-image");
  if (p.imageUrl) {
    img.src = p.imageUrl;
    img.alt = p.productName ?? "Product image";
    img.hidden = false;
  } else {
    img.hidden = true;
  }

  const ingredientsSection = el("result-ingredients-section");
  if (p.ingredients) {
    el("result-ingredients").textContent = p.ingredients;
    ingredientsSection.hidden = false;
  } else {
    ingredientsSection.hidden = true;
  }

  el("result-source").textContent = p.source ? `Source: ${p.source}` : "";

  // "Make from scratch" stores the product on the window so the recipe
  // flow can pick it up when that route is built.
  el("result-scratch-btn").addEventListener("click", () => {
    window._pendingProduct = p;
    // Recipe route is not built yet — show a placeholder message.
    el("result-scratch-note").hidden = false;
  });

  el("result-scan-another-btn").addEventListener("click", () => {
    window.location.hash = "#scan";
  });
}
