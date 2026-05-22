import { lastGeneratedRecord } from "./scan.js";
import { saveMvpRecipe } from "./localDb.js";

function el(id) { return document.getElementById(id); }

let saving = false;

export function initResultView() {
  const sessionRecord = sessionStorage.getItem("scratchnscan:lastGenerated");
  const parsed = sessionRecord ? JSON.parse(sessionRecord) : null;
  const record = parsed || lastGeneratedRecord;
  if (!record || !record.scratchRecipe) {
    window.location.hash = "#manual";
    return;
  }

  const fallbackUsed = !!(parsed?.fallbackUsed ?? record.fallbackUsed);
  el("result-name").textContent = record.scratchRecipe.title;
  el("result-summary").textContent = record.scratchRecipe.summary;
  el("result-note").textContent = fallbackUsed
    ? "No AI provider available - this is a starter suggestion built from common ingredients. Tweak to taste."
    : "Generated from the configured AI provider. Tweak to taste.";

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

  const saveBtn = el("result-save-btn");
  if (!saveBtn) return;
  saveBtn.disabled = false;
  saveBtn.textContent = "Save to history";
  saveBtn.onclick = async () => {
    if (saving) return;
    saving = true;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    try {
      const id = await saveMvpRecipe({ ...record, fallbackUsed });
      sessionStorage.removeItem("scratchnscan:lastGenerated");
      if (id) {
        window.location.hash = `#details/${id}`;
      } else {
        saveBtn.textContent = "Save failed - try again";
        saveBtn.disabled = false;
        saving = false;
      }
    } catch {
      saveBtn.textContent = "Save failed - try again";
      saveBtn.disabled = false;
      saving = false;
    }
  };
}
