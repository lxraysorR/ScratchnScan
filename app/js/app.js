import { initScanView } from "./scan.js";
import * as scanModule from "./scan.js";
import { initResultView } from "./result.js";
import { initHistoryView } from "./history.js";
import * as historyModule from "./history.js";
import { initDetailsView } from "./details.js";
import { initDatabase } from "./localDb.js";

const views = ["home", "scan", "result", "history", "details"];

let scanViewReady = false;

function showView(name) {
  const view = views.includes(name) ? name : "home";
  for (const id of views) {
    const el = document.getElementById(`view-${id}`);
    if (el) el.hidden = id !== view;
  }
}

async function route() {
  const hash = window.location.hash.replace(/^#\/?/, "") || "home";

  if (hash === "scan") {
    showView("scan");
    if (!scanViewReady) {
      await initScanView();
      scanViewReady = true;
    }
    return;
  }

  if (hash === "result") {
    if (!scanModule.lastLookupResult) {
      window.location.hash = "#scan";
      return;
    }
    showView("result");
    initResultView(scanModule.lastLookupResult);
    return;
  }

  if (hash === "history") {
    showView("history");
    await initHistoryView();
    return;
  }

  if (hash === "details") {
    if (!historyModule.selectedId) {
      window.location.hash = "#history";
      return;
    }
    showView("details");
    await initDetailsView(historyModule.selectedId);
    return;
  }

  showView("home");
}

document.getElementById("home-scan-btn")?.addEventListener("click", () => {
  window.location.hash = "#scan";
});

window.addEventListener("hashchange", route);

await initDatabase();
route();
