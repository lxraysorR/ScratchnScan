import { getMvpHistory, toggleMvpFavorite, deleteMvpRecipe } from "./localDb.js";
import { showToast } from "./app.js";

function el(id) { return document.getElementById(id); }

let busy = false;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

const THUMB_SVG = `
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 11a7 7 0 1 1 14 0" />
    <path d="M3 11h18l-2 8H5z" />
  </svg>
`;

const STAR_SVG = `
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
    <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />
  </svg>
`;
const STAR_OUTLINE_SVG = `
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />
  </svg>
`;

export async function initHistoryView() {
  const records = await getMvpHistory();
  const list = el("history-list");
  const empty = el("history-empty");
  if (!list || !empty) return;
  list.innerHTML = "";

  if (!records.length) {
    empty.hidden = false;
    list.hidden = true;
    return;
  }
  empty.hidden = true;
  list.hidden = false;

  for (const r of records) {
    const li = document.createElement("li");
    li.className = "history-card";
    const fav = !!(r.favorite ?? r.isFavorite);
    const recipeTitle = r.recipeTitle || r.scratchRecipe?.title || "Homemade alternative";
    const date = formatDate(r.createdAt);
    const preferenceBadge = r.dietaryPreference
      ? `<span class="badge soft">${escapeHtml(r.dietaryPreference)}</span>` : "";
    const fallbackBadge = r.fallbackUsed
      ? `<span class="badge warm">Starter</span>` : `<span class="badge">AI</span>`;

    const photoSrc = r.frontImagePreviewDataUrl || r.backImagePreviewDataUrl || "";
    const thumbInner = photoSrc
      ? `<img src="${escapeHtml(photoSrc)}" alt="" />`
      : THUMB_SVG;
    const thumbClass = photoSrc ? "food-thumb has-photo" : "food-thumb";
    li.innerHTML = `
      <div class="history-top">
        <div class="${thumbClass}" aria-hidden="true">${thumbInner}</div>
        <div style="min-width:0; flex:1;">
          <h3>${escapeHtml(r.productName || "Untitled")}</h3>
          <p>${escapeHtml(recipeTitle)}</p>
          <div class="history-meta-row">
            ${fallbackBadge}
            ${preferenceBadge}
            ${date ? `<span class="badge soft">${escapeHtml(date)}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="history-actions">
        <button class="btn btn-primary btn-small" type="button" data-action="view">View details</button>
        <button class="fav-btn ${fav ? "is-on" : ""}" type="button" data-action="fav" aria-pressed="${fav}" aria-label="${fav ? "Remove from favorites" : "Add to favorites"}">${fav ? STAR_SVG : STAR_OUTLINE_SVG}</button>
      </div>
    `;

    li.querySelector('[data-action="view"]').addEventListener("click", () => {
      window.location.hash = `#details/${r.id}`;
    });

    li.querySelector('[data-action="fav"]').addEventListener("click", async (event) => {
      if (busy) return;
      busy = true;
      event.currentTarget.disabled = true;
      try {
        await toggleMvpFavorite(r.id, !fav);
        showToast(!fav ? "Marked as favorite" : "Removed from favorites");
        await initHistoryView();
      } finally {
        busy = false;
      }
    });

    list.appendChild(li);
  }
}

export async function deleteHistoryItem(id) {
  if (busy) return false;
  busy = true;
  try {
    await deleteMvpRecipe(id);
    return true;
  } finally {
    busy = false;
  }
}
