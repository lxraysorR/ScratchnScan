import { initScanView, applySample } from "./scan.js";
import { initResultView } from "./result.js";
import { initHistoryView } from "./history.js";
import { initDetailsView } from "./details.js";
import { initDatabase } from "./localDb.js";
import { initPackageEntry, refreshBarcodeBanner } from "./packageEntry.js";

const VIEWS = ["home", "scan", "manual", "result", "history", "details"];
const NAV_TARGETS = new Set(["home", "scan", "manual", "history"]);

function showView(name) {
  const view = VIEWS.includes(name) ? name : "home";
  for (const id of VIEWS) {
    const el = document.getElementById(`view-${id}`);
    if (el) el.hidden = id !== view;
  }
  document.querySelectorAll(".nav-item").forEach((btn) => {
    const target = btn.dataset.target;
    btn.classList.toggle("is-active", target && target === view && NAV_TARGETS.has(target));
  });
  const main = document.getElementById("main-content");
  if (main) main.scrollTo({ top: 0, behavior: "smooth" });
}

function goto(view, arg) {
  const hash = arg ? `#${view}/${arg}` : `#${view}`;
  if (window.location.hash === hash) {
    route();
    return;
  }
  window.location.hash = hash;
}

async function route() {
  const raw = window.location.hash.replace(/^#\/?/, "") || "home";
  const [name, arg] = raw.split("/");

  if (name === "manual") {
    showView("manual");
    await initScanView();
    refreshBarcodeBanner();
    return;
  }
  if (name === "scan") {
    showView("scan");
    initPackageEntry();
    return;
  }
  if (name === "result") {
    showView("result");
    initResultView();
    return;
  }
  if (name === "history") {
    showView("history");
    await initHistoryView();
    return;
  }
  if (name === "details") {
    if (!arg) {
      window.location.hash = "#history";
      return;
    }
    showView("details");
    await initDetailsView(arg);
    return;
  }
  showView("home");
}

let toastTimer;
export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-show"), 2000);
}

function wireGlobalActions() {
  document.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = el.dataset.go;
      if (target) goto(target);
    });
  });

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target) goto(target);
    });
  });

  document.querySelectorAll("[data-sample]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const name = btn.dataset.sample;
      if (!name) return;
      goto("manual");
      await initScanView();
      applySample(name);
      showToast(`${name} sample loaded`);
    });
  });

  document.getElementById("topbar-action")?.addEventListener("click", () => {
    showToast("More options coming after MVP polish");
  });
}

window.scratchnscan = { goto, showToast };

window.addEventListener("hashchange", route);
await initDatabase();
wireGlobalActions();
route();
