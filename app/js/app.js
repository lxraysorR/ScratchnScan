import { initScanView, lastLookupResult } from "./scan.js";
import { initResultView } from "./result.js";

const VIEWS = ["home", "scan", "result"];

// Guards: each view is initialised at most once per page load.
let scanViewReady = false;
let resultViewReady = false;

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
route();
