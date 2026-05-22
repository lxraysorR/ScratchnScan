import { getMvpHistory, toggleMvpFavorite, deleteMvpRecipe } from "./localDb.js";

function el(id) { return document.getElementById(id); }

let busy = false;

function formatMeta(r) {
  const bits = [];
  if (r.brand) bits.push(r.brand);
  if (r.category) bits.push(r.category);
  if (r.dietaryPreference) bits.push(r.dietaryPreference);
  return bits.join(" - ");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function initHistoryView() {
  const records = await getMvpHistory();
  const list = el("history-list");
  const empty = el("history-empty");
  list.innerHTML = "";
  if (!records.length) {
    empty.hidden = false;
    empty.textContent = "No saved recipes yet. Use Manual Entry to create one.";
    return;
  }
  empty.hidden = true;

  for (const r of records) {
    const li = document.createElement("li");
    li.className = "history-item";
    const fav = !!(r.favorite ?? r.isFavorite);
    const meta = formatMeta(r);
    const recipeTitle = r.recipeTitle || r.scratchRecipe?.title || "Untitled recipe";
    li.innerHTML = `
      <div class="history-head">
        <button class="link-btn history-name" type="button">${escapeHtml(r.productName || "Untitled")}</button>
        <button class="fav-star ${fav ? "fav-on" : ""}" type="button" aria-pressed="${fav}" aria-label="${fav ? "Unfavorite" : "Favorite"}">${fav ? "★" : "☆"}</button>
      </div>
      <div class="history-sub">${escapeHtml(recipeTitle)}</div>
      ${meta ? `<div class="history-sub">${escapeHtml(meta)}</div>` : ""}
      <div class="history-sub">Saved: ${new Date(r.createdAt).toLocaleString()}</div>
      ${r.fallbackUsed ? `<div class="history-sub hint">Starter (no AI)</div>` : ""}
    `;
    li.querySelector(".history-name").addEventListener("click", () => {
      window.location.hash = `#details/${r.id}`;
    });
    li.querySelector(".fav-star").addEventListener("click", async (event) => {
      if (busy) return;
      busy = true;
      event.currentTarget.disabled = true;
      try {
        await toggleMvpFavorite(r.id, !fav);
        await initHistoryView();
      } finally {
        busy = false;
      }
    });

    const actions = document.createElement("div");
    actions.className = "result-actions";
    const view = document.createElement("button");
    view.className = "btn btn-secondary btn-small";
    view.textContent = "View details";
    view.addEventListener("click", () => { window.location.hash = `#details/${r.id}`; });
    const del = document.createElement("button");
    del.className = "btn btn-danger btn-small";
    del.textContent = "Delete";
    del.addEventListener("click", async () => {
      if (busy) return;
      if (!confirm(`Delete "${r.productName || "this recipe"}"? This cannot be undone.`)) return;
      busy = true;
      del.disabled = true;
      try {
        await deleteMvpRecipe(r.id);
        await initHistoryView();
      } finally {
        busy = false;
      }
    });
    actions.appendChild(view);
    actions.appendChild(del);
    li.appendChild(actions);
    list.appendChild(li);
  }
}
