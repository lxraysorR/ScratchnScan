import { lastLookupResult } from "./scan.js";

function el(id) { return document.getElementById(id); }

export function initResultView(product) {
  const p = product ?? lastLookupResult;
  if (!p) {
    window.location.hash = "#scan";
    return;
  }

  el("result-name").textContent = p.manualLookup?.productTitle || p.productName || "Unknown product";
  el("result-upc").textContent = p.upc ? `UPC: ${p.upc}` : "Manual entry";
  el("result-source").textContent = `Source: ${p.manualLookup?.source || p.source || "unknown"}`;

  el("result-summary").textContent = p.manualLookup?.productSummary || "Packaged product identified.";
  const concerns = p.manualLookup?.concerns?.length
    ? p.manualLookup.concerns.join(" ")
    : "Packaged versions may include extra additives compared with homemade options.";
  el("result-concerns").textContent = concerns;
  el("result-recipe-title").textContent = p.manualLookup?.homemadeAlternativeTitle || "Simple homemade alternative";

  const ingredients = p.manualLookup?.homemadeIngredients || [];
  const ingList = el("result-homemade-ingredients");
  ingList.innerHTML = "";
  for (const item of ingredients) {
    const li = document.createElement("li");
    li.textContent = item;
    ingList.appendChild(li);
  }

  const steps = p.manualLookup?.homemadeSteps || [];
  const stepsList = el("result-homemade-steps");
  stepsList.innerHTML = "";
  for (const item of steps) {
    const li = document.createElement("li");
    li.textContent = item;
    stepsList.appendChild(li);
  }

  const note = p.manualLookup?.note;
  el("result-confidence").textContent = `Confidence: ${p.manualLookup?.confidenceLevel || "medium"}`;
  el("result-note").textContent = note || "";
  el("result-note").hidden = !note;

  el("result-scan-another-btn").onclick = () => { window.location.hash = "#scan"; };
}
