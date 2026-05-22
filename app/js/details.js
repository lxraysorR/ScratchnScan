import { getMvpRecipeById, toggleMvpFavorite, deleteMvpRecipe } from "./localDb.js";

function el(id) { return document.getElementById(id); }

export async function initDetailsView(id) {
  if (!id) {
    window.location.hash = "#history";
    return;
  }

  const record = await getMvpRecipeById(id);
  if (!record) {
    window.location.hash = "#history";
    return;
  }

  renderRecord(record);

  el("details-back-btn").onclick = () => { window.location.hash = "#history"; };
  el("details-new-btn").onclick = () => { window.location.hash = "#scan"; };

  el("details-favorite-btn").onclick = async () => {
    const current = await getMvpRecipeById(id);
    if (!current) return;
    await toggleMvpFavorite(id, !current.favorite);
    const updated = await getMvpRecipeById(id);
    if (updated) renderRecord(updated);
  };

  el("details-delete-btn").onclick = async () => {
    const ok = window.confirm("Delete this saved homemade recipe?");
    if (!ok) return;
    await deleteMvpRecipe(id);
    window.location.hash = "#history";
  };
}

function renderRecord(record) {
  const r = record.generatedResult || {};
  el("details-name").textContent = r.productTitle || record.productName || "Saved item";
  el("details-upc").textContent = record.upc ? `UPC: ${record.upc}` : "Manual entry";
  el("details-date").textContent = `Saved: ${new Date(record.createdAt).toLocaleString()}`;
  el("details-source-ingredients").textContent = record.ingredients || "No ingredients/label text saved.";
  el("details-notes").textContent = record.userNotes || "No notes.";
  el("details-summary").textContent = r.productSummary || "";
  const concerns = Array.isArray(r.concerns) ? r.concerns.join(" ") : (r.concerns || "");
  el("details-concerns").textContent = concerns || "Packaged versions may include extra additives compared with homemade options.";
  el("details-recipe-title").textContent = r.homemadeAlternativeTitle || "Simple homemade alternative";

  const ingList = el("details-ingredients");
  ingList.innerHTML = "";
  for (const item of (r.homemadeIngredients || [])) {
    const li = document.createElement("li");
    li.textContent = item;
    ingList.appendChild(li);
  }

  const stepsList = el("details-steps");
  stepsList.innerHTML = "";
  for (const item of (r.homemadeSteps || [])) {
    const li = document.createElement("li");
    li.textContent = item;
    stepsList.appendChild(li);
  }

  const favBtn = el("details-favorite-btn");
  if (favBtn) favBtn.textContent = record.favorite ? "★ Unfavorite" : "☆ Favorite";
}
