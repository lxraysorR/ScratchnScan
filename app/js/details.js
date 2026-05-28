import { getMvpRecipeById, toggleMvpFavorite, deleteMvpRecipe } from "./localDb.js";
import { showToast } from "./app.js";
import { normalizeProductContext } from "./productContext.js";
import { escapeHtml, renderAccordion, renderProductSummaryInto, renderUnderstoodPanelInto, renderQuickFactsInto } from "./resultComponents.js";

function el(id) { return document.getElementById(id); }

let busy = false;

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function renderBadges(container, { favorite, fallbackUsed }) {
  if (!container) return;
  container.innerHTML = "";
  const first = document.createElement("span");
  first.className = favorite ? "badge gold" : "badge";
  first.textContent = favorite ? "Favorite" : "Saved idea";
  container.appendChild(first);

  const second = document.createElement("span");
  second.className = "badge warm";
  second.textContent = fallbackUsed ? "Starter suggestion" : "AI generated";
  container.appendChild(second);
}

function renderMetrics(container, { ingredients, steps }) {
  if (!container) return;
  container.innerHTML = `
    <div class="metric"><strong>${ingredients.length}</strong><span>Ingredients</span></div>
    <div class="metric"><strong>${steps.length}</strong><span>Steps</span></div>
    <div class="metric"><strong>10m</strong><span>Estimate</span></div>
  `;
}
export async function initDetailsView(id) {
  const record = await getMvpRecipeById(id);
  if (!record) { window.location.hash = "#history"; return; }

  const fav = !!(record.favorite ?? record.isFavorite);
  const productContext = normalizeProductContext(
    record.productContext || {
      productName: record.productName || record.scratchRecipe?.originalProductName || "",
      ingredientsText: record.ingredientsText || record.inputIngredients || "",
      source: record.source || "manual",
    },
  );
  const recipeTitle = record.recipeTitle || record.scratchRecipe?.title || "Homemade alternative";
  const ingredientsList = record.recipeIngredients?.length
    ? record.recipeIngredients
    : (record.scratchRecipe?.ingredients || []);
  const stepsList = record.recipeSteps?.length
    ? record.recipeSteps
    : (record.scratchRecipe?.steps || []);
  const tipsList = record.recipeTips?.length
    ? record.recipeTips
    : (record.scratchRecipe?.tips || []);

  renderBadges(el("details-badges"), { favorite: fav, fallbackUsed: !!record.fallbackUsed });
  renderProductSummaryInto(el("details-product-summary"), productContext, "Saved homemade target");
  renderUnderstoodPanelInto(el("details-understood-panel"), productContext);
  renderQuickFactsInto(el("details-quick-facts"), record.scratchRecipe, productContext);

  el("details-name").textContent = recipeTitle;
  const metaBits = [
    `Based on: ${productContext.productName || "untitled product"}`,
    productContext.category ? `Category: ${productContext.category}` : "",
    productContext.confidenceLabel !== "unknown" ? `Confidence: ${productContext.confidenceLabel}` : "",
  ].filter(Boolean);
  el("details-meta").textContent = metaBits.join(" • ");
  el("details-date").textContent = record.createdAt ? `Saved ${formatDate(record.createdAt)}` : "";

  const photoRow = el("details-photo-row");
  const frontFig = el("details-front-photo");
  const backFig = el("details-back-photo");
  const frontImg = frontFig?.querySelector("img");
  const backImg = backFig?.querySelector("img");
  const frontSrc = record.frontImagePreviewDataUrl;
  const backSrc = record.backImagePreviewDataUrl;
  if (frontImg && frontFig) {
    if (frontSrc) {
      frontImg.src = frontSrc;
      frontFig.hidden = false;
    } else {
      frontImg.removeAttribute("src");
      frontFig.hidden = true;
    }
  }
  if (backImg && backFig) {
    if (backSrc) {
      backImg.src = backSrc;
      backFig.hidden = false;
    } else {
      backImg.removeAttribute("src");
      backFig.hidden = true;
    }
  }
  if (photoRow) photoRow.hidden = !(frontSrc || backSrc);

  renderMetrics(el("details-metrics"), { ingredients: ingredientsList, steps: stepsList });

  el("details-summary").textContent = record.scratchRecipe?.summary || "";

  const healthGoal = record.scratchRecipe?.healthGoal || "";
  const goalEl = el("details-healthgoal");
  if (goalEl) {
    goalEl.textContent = healthGoal ? `Health goal: ${healthGoal}` : "";
    goalEl.hidden = !healthGoal;
  }

  const whyList = record.scratchRecipe?.whyHealthier || record.scratchRecipe?.whyCleaner || [];
  const whyBlock = el("details-why-block");
  const whyEl = el("details-why");
  if (whyEl && whyBlock) {
    whyEl.innerHTML = "";
    if (whyList.length) {
      whyList.forEach((v) => { const li = document.createElement("li"); li.textContent = v; whyEl.appendChild(li); });
      whyBlock.hidden = false;
    } else {
      whyBlock.hidden = true;
    }
  }

  const ing = el("details-ingredients"); ing.innerHTML = "";
  ingredientsList.forEach((v) => { const li = document.createElement("li"); li.textContent = v; ing.appendChild(li); });
  const steps = el("details-steps"); steps.innerHTML = "";
  stepsList.forEach((v) => { const li = document.createElement("li"); li.textContent = v; steps.appendChild(li); });

  const tipsBlock = el("details-tips-block");
  const tipsEl = el("details-tips");
  if (tipsEl && tipsBlock) {
    tipsEl.innerHTML = "";
    if (tipsList.length) {
      tipsList.forEach((v) => { const li = document.createElement("li"); li.textContent = v; tipsEl.appendChild(li); });
      tipsBlock.hidden = false;
    } else {
      tipsBlock.hidden = true;
    }
  }
  renderAccordion(el("details-ingredients")?.closest(".recipe-block"), false);
  renderAccordion(el("details-steps")?.closest(".recipe-block"), false);
  renderAccordion(el("details-why-block"), false);
  renderAccordion(el("details-tips-block"), false);

  const sourceText = record.ingredientsText || record.inputIngredients;
  const sourceEl = el("details-input");
  if (sourceEl) {
    if (sourceText) {
      sourceEl.innerHTML = `<strong>Ingredients from package:</strong> ${escapeHtml(sourceText)}`;
      sourceEl.hidden = false;
    } else {
      sourceEl.hidden = true;
    }
  }

  const fallbackNote = el("details-fallback-note");
  if (fallbackNote) {
    if (record.fallbackUsed) {
      fallbackNote.textContent = "Starter suggestion built from common ingredients. Adjust to taste.";
      fallbackNote.hidden = false;
    } else {
      fallbackNote.hidden = true;
    }
  }

  const favBtn = el("details-favorite-btn");
  favBtn.textContent = fav ? "Remove favorite" : "Mark favorite";
  favBtn.onclick = async () => {
    if (busy) return;
    busy = true;
    favBtn.disabled = true;
    try {
      await toggleMvpFavorite(id, !fav);
      showToast(!fav ? "Marked as favorite" : "Removed from favorites");
      await initDetailsView(id);
    } finally {
      busy = false;
      favBtn.disabled = false;
    }
  };

  const delBtn = el("details-delete-btn");
  delBtn.onclick = async () => {
    if (busy) return;
    if (!window.confirm(`Delete "${recipeTitle}"? This cannot be undone.`)) return;
    busy = true;
    delBtn.disabled = true;
    try {
      await deleteMvpRecipe(id);
      showToast("Recipe deleted");
      window.location.hash = "#history";
    } finally {
      busy = false;
    }
  };
}
