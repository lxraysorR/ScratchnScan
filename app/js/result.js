import { lastGeneratedRecord } from "./scan.js";
import { saveMvpRecipe } from "./localDb.js";
import { renderRecipeRecord } from "./recipeRender.js";

function el(id) { return document.getElementById(id); }

let saving = false;

function uniqNonEmpty(items = []) {
  const out = [];
  const seen = new Set();
  for (const raw of items) {
    const val = String(raw || '').trim();
    if (!val) continue;
    const key = val.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(val);
  }
  return out;
}

function sanitizePlaceholders(items = []) {
  return uniqNonEmpty(items).filter(
    (x) => !/(?:base|flavor|seasoning) ingredient|placeholder/i.test(x),
  );
}

function renderBadges(fallbackUsed) {
  const row = el("result-badges");
  if (!row) return;
  row.innerHTML = "";
  const primary = document.createElement("span");
  primary.className = "badge";
  primary.textContent = fallbackUsed ? "Starter suggestion" : "AI generated";
  row.appendChild(primary);

  const second = document.createElement("span");
  second.className = "badge warm";
  second.textContent = fallbackUsed ? "MVP fallback" : "Local MVP";
  row.appendChild(second);
}

export function initResultView() {
  const sessionRecord = sessionStorage.getItem("scratchnscan:lastGenerated");
  const parsed = sessionRecord ? JSON.parse(sessionRecord) : null;
  const record = parsed || lastGeneratedRecord;
  if (!record || !record.scratchRecipe) {
    window.location.hash = "#manual";
    return;
  }
  refreshUsageStrips();

  const fallbackUsed = !!(parsed?.fallbackUsed ?? record.fallbackUsed);
  renderRecipeRecord(el("result-content"), record, { fallbackUsed });

  const tips = uniqNonEmpty(record.scratchRecipe.tips || record.recipeTips || []);
  const tipsBlock = el("result-tips-block");
  const tipsList = el("result-tips");
  if (tipsList && tipsBlock) {
    tipsList.innerHTML = "";
    if (tips.length) {
      for (const tip of tips) {
        const li = document.createElement("li"); li.textContent = tip; tipsList.appendChild(li);
      }
      tipsBlock.hidden = false;
    } else {
      tipsBlock.hidden = true;
    }
  }

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
        showToast("Recipe saved.");
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
