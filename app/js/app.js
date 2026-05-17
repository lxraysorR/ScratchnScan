import { initManualView, renderHistoryView, openHistoryItem } from "./result.js";
import { initDatabase } from "./localDb.js";

const views = ["home", "manual", "history"];

// Guards: each view is initialised at most once per page load.
let scanViewReady = false;
let resultViewReady = false;

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

  if (hash === "scan") {
    showView("scan");
    if (!scanViewReady) {
      await initScanView();
      scanViewReady = true;
    }
    return;
  }

  if (hash === "result") {
    if (!lastLookupResult) {
      window.location.hash = "#scan";
      return;
    }
    showView("result");
    if (!resultViewReady) {
      initResultView(lastLookupResult);
      resultViewReady = true;
    }
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
