import { lastGeneratedRecord } from "./scan.js";
import { saveMvpRecipe } from "./localDb.js";

function el(id) { return document.getElementById(id); }

export function initResultView() {
  const sessionRecord = sessionStorage.getItem("scratchnscan:lastGenerated");
  const parsed = sessionRecord ? JSON.parse(sessionRecord) : null;
  const record = parsed || lastGeneratedRecord;
  if (!record) {
    window.location.hash = "#manual";
    return;
  }

  el("result-name").textContent = record.scratchRecipe.title;
  el("result-summary").textContent = record.scratchRecipe.summary;
  el("result-note").textContent = parsed?.fallbackUsed ? "AI unavailable; deterministic local fallback recipe was used." : "Generated from available provider data.";

  const ingredients = el("result-homemade-ingredients");
  ingredients.innerHTML = "";
  for (const item of record.scratchRecipe.ingredients || []) {
    const li = document.createElement("li"); li.textContent = item; ingredients.appendChild(li);
  }
  const steps = el("result-homemade-steps");
  steps.innerHTML = "";
  for (const item of record.scratchRecipe.steps || []) {
    const li = document.createElement("li"); li.textContent = item; steps.appendChild(li);
  }

  el("result-save-btn").onclick = async () => {
    const id = await saveMvpRecipe(record);
    if (id) window.location.hash = "#history";
  };
}
