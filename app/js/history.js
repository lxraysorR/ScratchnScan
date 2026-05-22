import { getMvpHistory, toggleMvpFavorite, deleteMvpRecipe } from "./localDb.js";

export let selectedId = null;

function el(id) { return document.getElementById(id); }

export async function initHistoryView() {
  await renderHistoryList();
}

async function renderHistoryList() {
  const listEl = el("history-list");
  const emptyEl = el("history-empty");
  if (!listEl) return;

  const records = await getMvpHistory();
  listEl.innerHTML = "";

  if (!records.length) {
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  for (const r of records) {
    const li = document.createElement("li");
    li.className = "history-item";

    const head = document.createElement("div");
    head.className = "history-head";

    const name = document.createElement("span");
    name.className = "history-name";
    name.textContent = r.productName || "(no product name)";

    const favMark = document.createElement("span");
    favMark.className = r.favorite ? "fav-star fav-on" : "fav-star";
    favMark.textContent = r.favorite ? "★" : "☆";

    const date = new Date(r.createdAt).toLocaleDateString();
    const summary = r.generatedResult?.homemadeAlternativeTitle || "Simple homemade alternative";

    const sub = document.createElement("div");
    sub.className = "history-sub";
    sub.textContent = `${date} • ${summary}`;

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const viewBtn = document.createElement("button");
    viewBtn.className = "btn btn-secondary";
    viewBtn.textContent = "View Details";
    viewBtn.addEventListener("click", () => {
      selectedId = r.id;
      window.location.hash = "#details";
    });

    const favBtn = document.createElement("button");
    favBtn.className = "btn btn-secondary";
    favBtn.textContent = r.favorite ? "Unfavorite" : "Favorite";
    favBtn.addEventListener("click", async () => {
      await toggleMvpFavorite(r.id, !r.favorite);
      await renderHistoryList();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      const ok = window.confirm("Delete this saved homemade recipe?");
      if (!ok) return;
      await deleteMvpRecipe(r.id);
      await renderHistoryList();
    });

    actions.append(viewBtn, favBtn, delBtn);
    head.append(name, favMark);
    li.append(head, sub, actions);
    listEl.appendChild(li);
  }
}
