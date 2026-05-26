import { getMvpRecipeById, toggleMvpFavorite, deleteMvpRecipe } from "./localDb.js";
import { renderRecipeRecord } from "./recipeRender.js";

function el(id) { return document.getElementById(id); }

let busy = false;

export async function initDetailsView(id) {
  const record = await getMvpRecipeById(id);
  if (!record) { window.location.hash = "#history"; return; }

  const fav = !!(record.favorite ?? record.isFavorite);
  el("details-date").textContent = `Saved: ${new Date(record.createdAt).toLocaleString()}`;
  renderRecipeRecord(el("details-content"), record, { fallbackUsed: !!record.fallbackUsed });

  const favBtn = el("details-favorite-btn");
  favBtn.textContent = fav ? "★ Unfavorite" : "☆ Favorite";
  favBtn.disabled = false;
  favBtn.onclick = async () => {
    if (busy) return;
    busy = true;
    favBtn.disabled = true;
    try {
      await toggleMvpFavorite(id, !fav);
      await initDetailsView(id);
    } finally {
      busy = false;
    }
  };

  const delBtn = el("details-delete-btn");
  delBtn.disabled = false;
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
