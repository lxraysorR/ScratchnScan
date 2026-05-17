function el(id) { return document.getElementById(id); }

export function initResultView(product) {
  if (!product) {
    window.location.hash = "#scan";
    return;
  }

  el("result-name").textContent =
    product.manualLookup?.productTitle || product.productName || "Unknown product";
  el("result-upc").textContent = product.upc ? `UPC: ${product.upc}` : "Manual entry";
  el("result-source").textContent =
    `Source: ${product.manualLookup?.source || product.source || "unknown"}`;

  el("result-summary").textContent =
    product.manualLookup?.productSummary || "Packaged product identified.";

  const concerns = product.manualLookup?.concerns?.length
    ? product.manualLookup.concerns.join(" ")
    : "Packaged versions may include extra additives compared with homemade options.";
  el("result-concerns").textContent = concerns;

  el("result-recipe-title").textContent =
    product.manualLookup?.homemadeAlternativeTitle || "Simple homemade alternative";

  const ingredients = product.manualLookup?.homemadeIngredients || [];
  const ingList = el("result-homemade-ingredients");
  ingList.innerHTML = "";
  for (const item of ingredients) {
    const li = document.createElement("li");
    li.textContent = item;
    ingList.appendChild(li);
  }

  const steps = product.manualLookup?.homemadeSteps || [];
  const stepsList = el("result-homemade-steps");
  stepsList.innerHTML = "";
  for (const item of steps) {
    const li = document.createElement("li");
    li.textContent = item;
    stepsList.appendChild(li);
  }

  const note = product.manualLookup?.note;
  el("result-confidence").textContent =
    `Confidence: ${product.manualLookup?.confidenceLevel || "medium"}`;
  el("result-note").textContent = note || "";
  el("result-note").hidden = !note;

  el("result-scan-another-btn").onclick = () => {
    window.location.hash = "#scan";
  };
}
