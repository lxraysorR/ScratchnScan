import { initScanView, lastLookupResult } from "./scan.js";
import { initResultView } from "./result.js";

const VIEWS = ["home", "scan", "result"];

function showView(name) {
  const target = VIEWS.includes(name) ? name : "home";
  for (const id of VIEWS) {
    const el = document.getElementById(`view-${id}`);
    if (el) el.hidden = id !== target;
  }
  return target;
}

async function route() {
  const hash = window.location.hash.replace(/^#\/?/, "") || "home";

  if (hash === "scan") {
    showView("scan");
    await initScanView();
    return;
  }

  if (hash === "result") {
    if (!lastLookupResult) {
      window.location.hash = "#scan";
      return;
    }
    showView("result");
    initResultView(lastLookupResult);
    return;
  }

  showView("home");
}

// Wire up home-page CTAs.
document.getElementById("home-scan-btn")?.addEventListener("click", () => {
  window.location.hash = "#scan";
});

window.addEventListener("hashchange", route);
route();
