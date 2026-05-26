import { lastGeneratedRecord } from "./scan.js";
import { saveMvpRecipe } from "./localDb.js";
import { showToast } from "./app.js";
import { refreshUsageStrips } from "./usage.js";

function el(id) { return document.getElementById(id); }

let saving = false;

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
  renderBadges(fallbackUsed);
  el("result-name").textContent = record.scratchRecipe.title;
  const originalName = record.scratchRecipe.originalProductName || record.productName || "";
  const originalEl = el("result-original");
  if (originalEl) {
    originalEl.textContent = originalName ? `Inspired by: ${originalName}` : "";
    originalEl.hidden = !originalName;
  }
  el("result-summary").textContent = record.scratchRecipe.summary;
  const healthGoalEl = el("result-health-goal");
  if (healthGoalEl) healthGoalEl.textContent = record.scratchRecipe.healthGoal || "Use simpler ingredients and keep flavor familiar.";

  const healthGoal = record.scratchRecipe.healthGoal || "";
  const goalEl = el("result-healthgoal");
  if (goalEl) {
    goalEl.textContent = healthGoal ? `Health goal: ${healthGoal}` : "";
    goalEl.hidden = !healthGoal;
  }

  const why = record.scratchRecipe.whyHealthier || record.scratchRecipe.whyCleaner || [];
  const whyBlock = el("result-why-block");
  const whyList = el("result-why");
  if (whyList && whyBlock) {
    whyList.innerHTML = "";
    if (why.length) {
      for (const item of why) {
        const li = document.createElement("li"); li.textContent = item; whyList.appendChild(li);
      }
      whyBlock.hidden = false;
    } else {
      whyBlock.hidden = true;
    }
  }
  el("result-note").textContent = fallbackUsed
    ? "This is a starter suggestion built from common ingredients. Tweak to taste. General food info only, not medical advice."
    : "Generated from the configured AI provider. Tweak to taste. General food info only, not medical advice.";

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

  const tips = record.scratchRecipe.tips || record.recipeTips || [];
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
  saveBtn.disabled = false;
  saveBtn.textContent = "Save Recipe";
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
        showToast("Recipe could not be saved. Please try again.");
        saveBtn.textContent = "Save Recipe";
        saveBtn.disabled = false;
        saving = false;
      }
    } catch (err) {
      console.error("save recipe failed", err);
      showToast("Recipe could not be saved. Please try again.");
      saveBtn.textContent = "Save Recipe";
      saveBtn.disabled = false;
      saving = false;
    }
  };
}
