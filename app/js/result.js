import { lastGeneratedRecord } from "./scan.js";
import { saveRecipe } from "./recipeStorage.js";
import { showToast } from "./app.js";
import { refreshUsageStrips } from "./usage.js";
import { normalizeProductContext } from "./productContext.js";

function el(id) { return document.getElementById(id); }

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
function confidenceText(ctx) {
  if (ctx.confidenceLabel === "high") return "High confidence";
  if (ctx.confidenceLabel === "medium") return "Medium confidence";
  if (ctx.confidenceLabel === "low") return "Low confidence — please review";
  return "Unknown confidence — add details to improve";
}
function renderAccordion(section, openByDefault) {
  if (!section) return;
  const title = section.querySelector("h3");
  if (!title) return;
  const label = title.textContent;
  const content = [...section.children].filter((n) => n !== title);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "accordion-toggle";
  btn.setAttribute("aria-expanded", openByDefault ? "true" : "false");
  btn.textContent = label;
  const body = document.createElement("div");
  body.className = "recipe-accordion-content";
  if (!openByDefault) body.hidden = true;
  content.forEach((n) => body.appendChild(n));
  btn.onclick = () => {
    const next = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(next));
    body.hidden = !next;
  };
  section.innerHTML = "";
  section.append(btn, body);
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
  second.textContent = fallbackUsed ? "Built-in recipe" : "On-device";
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
  const productContext = normalizeProductContext(
    record.productContext || {
      productName: record.productName || record.scratchRecipe?.originalProductName || "",
      ingredientsText: record.ingredientsText || record.inputIngredients || "",
      source: record.source || "manual",
    },
  );
  renderBadges(fallbackUsed);
  el("result-product-summary").innerHTML = `
    <h3>Product detected</h3>
    <p><strong>${productContext.productName || record.scratchRecipe.originalProductName || "Homemade target"}</strong></p>
    <p class="details-meta">${[productContext.brand, productContext.category, productContext.flavor].filter(Boolean).join(" · ")}</p>
    <p class="details-meta">${[productContext.source ? `Detected from ${productContext.source}` : "", confidenceText(productContext)].filter(Boolean).join(" · ")}</p>
  `;
  const understoodRows = [
    productContext.productName ? `<div class="understood-row"><strong>Product:</strong> ${escapeHtml(productContext.productName)}</div>` : "",
    productContext.ingredientsText ? `<div class="understood-row"><strong>Ingredients read:</strong> ${escapeHtml(productContext.ingredientsText)}</div>` : "",
    productContext.claims?.length ? `<div class="understood-row"><strong>Claims read:</strong> ${productContext.claims.map(escapeHtml).join(", ")}</div>` : "",
    `<div class="understood-row"><strong>Source:</strong> ${productContext.source || "unknown"}</div>`,
    `<div class="understood-row"><strong>Confidence:</strong> ${confidenceText(productContext)}</div>`,
  ].filter(Boolean);
  el("result-understood-panel").innerHTML = `<h3>What the app understood</h3>${understoodRows.join("")}<p class="helper">We use these details to make the homemade version more specific. Ingredients matter most because they show what the packaged food is made from.</p>`;
  renderAccordion(el("result-understood-panel"), false);
  renderAccordion(el("result-product-summary"), false);
  el("result-quick-facts").innerHTML = `
    <div class="quick-fact"><span>Method</span><strong>${/(bake|air[- ]?fry)/i.test(record.scratchRecipe.steps?.join(" ")) ? "Bake / air fry" : "Homemade"}</strong></div>
    <div class="quick-fact"><span>Time</span><strong>${(() => { const t = (record.scratchRecipe?.prepTimeMinutes || 0) + (record.scratchRecipe?.cookTimeMinutes || 0); return t > 0 ? `${t} min` : "Varies"; })()}</strong></div>
    <div class="quick-fact"><span>Base</span><strong>${(productContext.detectedIngredients?.[0] || productContext.category || "Pantry staples")}</strong></div>
  `;
  el("result-name").textContent = record.scratchRecipe.title;
  const originalName = productContext.productName || record.scratchRecipe.originalProductName || record.productName || "";
  const originalEl = el("result-original");
  if (originalEl) {
    originalEl.textContent = originalName ? `Inspired by: ${originalName}` : "";
    originalEl.hidden = !originalName;
  }
  el("result-summary").textContent = record.scratchRecipe.summary;
  const healthGoalEl = el("result-health-goal");
  if (healthGoalEl) healthGoalEl.textContent = (record.scratchRecipe.healthGoal || "Use simpler ingredients and keep flavor familiar.").trim();

  const why = uniqNonEmpty(record.scratchRecipe.whyHealthier || record.scratchRecipe.whyCleaner || []);
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
  for (const item of sanitizePlaceholders(record.scratchRecipe.ingredients || [])) {
    const li = document.createElement("li"); li.textContent = item; ingredients.appendChild(li);
  }
  const steps = el("result-homemade-steps");
  steps.innerHTML = "";
  for (const item of uniqNonEmpty(record.scratchRecipe.steps || [])) {
    const li = document.createElement("li"); li.textContent = item; steps.appendChild(li);
  }

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
  renderAccordion(el("result-why-block"), false);
  renderAccordion(el("result-tips-block"), false);
  renderAccordion(el("result-homemade-ingredients")?.closest(".recipe-block"), true);
  renderAccordion(el("result-homemade-steps")?.closest(".recipe-block"), true);

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
      const saved = await saveRecipe({ ...record, fallbackUsed });
      const id = saved?.id;
      sessionStorage.removeItem("scratchnscan:lastGenerated");
      if (id) {
        showToast("Recipe saved.");
        window.location.hash = `#details/${id}`;
        return;
      }
      showToast("Recipe could not be saved. Please try again.");
    } catch (err) {
      console.error("save recipe failed", err);
      showToast("Recipe could not be saved. Please try again.");
    } finally {
      saving = false;
      saveBtn.textContent = "Save Recipe";
      saveBtn.disabled = false;
    }
  };
}
