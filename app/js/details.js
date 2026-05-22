import { getMvpRecipeById, toggleMvpFavorite, deleteMvpRecipe } from "./localDb.js";

function el(id) { return document.getElementById(id); }

export async function initDetailsView(id) {
  const record = await getMvpRecipeById(id);
  if (!record) { window.location.hash = "#history"; return; }

  el("details-name").textContent = record.productName;
  el("details-date").textContent = `Saved: ${new Date(record.createdAt).toLocaleString()}`;
  el("details-input").textContent = `Ingredients/notes: ${record.inputIngredients || "none"}${record.notes ? ` | ${record.notes}` : ""}`;
  el("details-summary").textContent = record.scratchRecipe?.summary || "";

  const ing = el("details-ingredients"); ing.innerHTML = "";
  (record.scratchRecipe?.ingredients || []).forEach((v) => { const li = document.createElement("li"); li.textContent = v; ing.appendChild(li); });
  const steps = el("details-steps"); steps.innerHTML = "";
  (record.scratchRecipe?.steps || []).forEach((v) => { const li = document.createElement("li"); li.textContent = v; steps.appendChild(li); });

  const favBtn = el("details-favorite-btn");
  favBtn.textContent = record.favorite ? "★ Unfavorite" : "☆ Favorite";
  favBtn.onclick = async () => { await toggleMvpFavorite(id, !record.favorite); await initDetailsView(id); };
  el("details-delete-btn").onclick = async () => { await deleteMvpRecipe(id); window.location.hash = "#history"; };
}
