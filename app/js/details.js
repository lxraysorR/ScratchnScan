import { getMvpRecipeById, toggleMvpFavorite, deleteMvpRecipe } from "./localDb.js";

function el(id) { return document.getElementById(id); }

let busy = false;

function formatMeta(r) {
  const bits = [];
  if (r.brand) bits.push(`Brand: ${r.brand}`);
  if (r.category) bits.push(`Category: ${r.category}`);
  if (r.dietaryPreference) bits.push(`Diet: ${r.dietaryPreference}`);
  return bits.join(" - ");
}

export async function initDetailsView(id) {
  const record = await getMvpRecipeById(id);
  if (!record) { window.location.hash = "#history"; return; }

  const fav = !!(record.favorite ?? record.isFavorite);
  const recipeTitle = record.recipeTitle || record.scratchRecipe?.title || "Scratch recipe";
  const ingredientsList = record.recipeIngredients?.length
    ? record.recipeIngredients
    : (record.scratchRecipe?.ingredients || []);
  const stepsList = record.recipeSteps?.length
    ? record.recipeSteps
    : (record.scratchRecipe?.steps || []);

  el("details-name").textContent = record.productName || "Untitled";
  el("details-meta").textContent = formatMeta(record);
  el("details-date").textContent = `Saved: ${new Date(record.createdAt).toLocaleString()}`;
  el("details-input").textContent = `Original ingredients/notes: ${record.ingredientsText || record.inputIngredients || "none"}${record.notes ? ` | ${record.notes}` : ""}`;
  el("details-summary").textContent = record.scratchRecipe?.summary || "";
  el("details-recipe-title").textContent = recipeTitle;

  const ing = el("details-ingredients"); ing.innerHTML = "";
  ingredientsList.forEach((v) => { const li = document.createElement("li"); li.textContent = v; ing.appendChild(li); });
  const steps = el("details-steps"); steps.innerHTML = "";
  stepsList.forEach((v) => { const li = document.createElement("li"); li.textContent = v; steps.appendChild(li); });

  const fallbackNote = el("details-fallback-note");
  if (fallbackNote) {
    if (record.fallbackUsed) {
      fallbackNote.textContent = "Starter suggestion (no AI provider). Adjust to taste.";
      fallbackNote.hidden = false;
    } else {
      fallbackNote.hidden = true;
    }
  }

  const favBtn = el("details-favorite-btn");
  favBtn.textContent = fav ? "★ Unfavorite" : "☆ Favorite";
  favBtn.onclick = async () => {
    if (busy) return;
    busy = true;
    favBtn.disabled = true;
    try {
      await toggleMvpFavorite(id, !fav);
      await initDetailsView(id);
    } finally {
      busy = false;
      favBtn.disabled = false;
    }
  };
  const delBtn = el("details-delete-btn");
  delBtn.onclick = async () => {
    if (busy) return;
    if (!confirm(`Delete "${record.productName || "this recipe"}"? This cannot be undone.`)) return;
    busy = true;
    delBtn.disabled = true;
    try {
      await deleteMvpRecipe(id);
      window.location.hash = "#history";
    } finally {
      busy = false;
    }
  };
}
