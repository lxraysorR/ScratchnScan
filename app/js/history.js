import { getMvpHistory, toggleMvpFavorite, deleteMvpRecipe } from "./localDb.js";

function el(id) { return document.getElementById(id); }

export async function initHistoryView() {
  const records = await getMvpHistory();
  const list = el("history-list");
  const empty = el("history-empty");
  list.innerHTML = "";
  if (!records.length) { empty.hidden = false; return; }
  empty.hidden = true;

  for (const r of records) {
    const li = document.createElement("li"); li.className = "history-item";
    li.innerHTML = `<div class="history-head"><button class="link-btn history-name">${r.productName || "Untitled"}</button><span class="fav-star ${r.favorite ? "fav-on" : ""}">${r.favorite ? "★" : "☆"}</span></div>
    <div class="history-sub">Saved: ${new Date(r.createdAt).toLocaleString()}</div>
    <div class="history-summary">${r.scratchRecipe?.summary || "No summary"}</div>`;
    li.querySelector(".history-name").addEventListener("click", () => { window.location.hash = `#details/${r.id}`; });
    li.querySelector(".fav-star").addEventListener("click", async () => { await toggleMvpFavorite(r.id, !r.favorite); await initHistoryView(); });
    const del = document.createElement("button"); del.className = "btn btn-danger btn-small"; del.textContent = "Delete";
    del.addEventListener("click", async () => { await deleteMvpRecipe(r.id); await initHistoryView(); });
    li.appendChild(del);
    list.appendChild(li);
  }
}
