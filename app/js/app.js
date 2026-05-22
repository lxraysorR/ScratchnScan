import { initScanView } from "./scan.js";
import { initResultView } from "./result.js";
import { initHistoryView } from "./history.js";
import { initDetailsView } from "./details.js";
import { initDatabase } from "./localDb.js";

const views = ["home", "manual", "result", "history", "details"];

function showView(name) {
  const view = views.includes(name) ? name : "home";
  for (const id of views) {
    const el = document.getElementById(`view-${id}`);
    if (el) el.hidden = id !== view;
  }
}

async function route() {
  const hash = window.location.hash.replace(/^#\/?/, "") || "home";
  const [routeName, routeArg] = hash.split("/");

  if (routeName === "manual") {
    showView("manual");
    await initScanView();
    return;
  }
  if (routeName === "result") {
    showView("result");
    initResultView();
    return;
  }
  if (routeName === "history") {
    showView("history");
    await initHistoryView();
    return;
  }
  if (routeName === "details") {
    if (!routeArg) {
      window.location.hash = "#history";
      return;
    }
    showView("details");
    await initDetailsView(routeArg);
    return;
  }

  showView("home");
}

document.getElementById("home-manual-btn")?.addEventListener("click", () => {
  window.location.hash = "#manual";
});

window.addEventListener("hashchange", route);
await initDatabase();
route();
