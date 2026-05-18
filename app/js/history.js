import { getMvpHistory } from "./localDb.js";

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

    const nameBtn = document.createElement("button");
    nameBtn.className = "link-btn history-name";
    nameBtn.textContent = r.productName || "(no product name)";
    nameBtn.addEventListener("click", () => {
      selectedId = r.id;
      window.location.hash = "#details";
    });

    const favMark = document.createElement("span");
    favMark.className = r.favorite ? "fav-star fav-on" : "fav-star";
    favMark.textContent = r.favorite ? "★" : "☆";
    favMark.setAttribute("aria-label", r.favorite ? "Favorited" : "Not favorited");

    head.appendChild(nameBtn);
    head.appendChild(favMark);

    const sub = document.createElement("div");
    sub.className = "history-sub";
    sub.textContent = r.upc ? `UPC: ${r.upc}` : "Manual entry";

    const date = document.createElement("div");
    date.className = "history-sub";
    date.textContent = new Date(r.createdAt).toLocaleDateString();

    li.appendChild(head);
    li.appendChild(sub);
    li.appendChild(date);
    listEl.appendChild(li);
  }
}
