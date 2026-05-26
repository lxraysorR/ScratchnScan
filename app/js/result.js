import { lastGeneratedRecord } from "./scan.js";
import { saveMvpRecipe } from "./localDb.js";
import { renderRecipeRecord } from "./recipeRender.js";

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
  renderRecipeRecord(el("result-content"), record, { fallbackUsed });

  const saveBtn = el("result-save-btn");
  if (!saveBtn) return;
  saving = false;
  saveBtn.disabled = false;
  saveBtn.textContent = "Save recipe";
  saveBtn.onclick = async () => {
    if (saving) return;
    saving = true;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    try {
      const id = await saveMvpRecipe({ ...record, fallbackUsed });
      sessionStorage.removeItem("scratchnscan:lastGenerated");
      if (id) {
        window.location.hash = `#details/${id}`;
      } else {
        saveBtn.textContent = "Save failed — try again";
        saveBtn.disabled = false;
        saving = false;
      }
    } catch {
      saveBtn.textContent = "Save failed — try again";
      saveBtn.disabled = false;
      saving = false;
    }
  };
}
