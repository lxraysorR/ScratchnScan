import { initManualView, renderHistoryView, openHistoryItem } from "./result.js";
import { initDatabase } from "./localDb.js";

const views = ["home", "manual", "history"];

function showView(name) {
  const view = views.includes(name) ? name : "home";
  for (const id of views) {
    const el = document.getElementById(`view-${id}`);
    if (el) el.hidden = id !== view;
  }
}

async function route() {
  const hash = window.location.hash.replace(/^#\/?/, "") || "home";
  const [page, id] = hash.split("/");

  if (page === "manual") {
    showView("manual");
    initManualView();
    if (id) await openHistoryItem(id);
    return;
  }

  if (page === "history") {
    showView("history");
    await renderHistoryView();
    return;
  }

  showView("home");
}

document.getElementById("home-start-btn")?.addEventListener("click", () => {
  window.location.hash = "#manual";
});

document.getElementById("home-history-btn")?.addEventListener("click", () => {
  window.location.hash = "#history";
});

window.addEventListener("hashchange", route);

await initDatabase();
route();
