import { initScanView, applySample } from "./scan.js";
import { getPopularItems } from "./api.js";
import { initPackageEntry, refreshBarcodeBanner } from "./packageEntry.js";
import { initResultView } from "./result.js";
import { initHistoryView } from "./history.js";
import { initDetailsView } from "./details.js";
import { initDatabase } from "./localDb.js";
import { renderPopularChips } from "./popularChips.js";
import {
  refreshUsageStrips,
  resetUsageForDev,
  setLocalPremiumUnlockedForDev,
  getUsageState,
  canGenerate,
} from "./usage.js";

const VIEWS = ["home", "scan", "manual", "result", "upgrade", "history", "details"];
const NAV_TARGETS = new Set(["home", "scan", "manual", "history"]);

async function loadPopularItems() {
  try {
    const payload = await getPopularItems();
    renderPopularChips(payload?.ok ? payload.items : []);
  } catch {
    renderPopularChips([]);
  }
}


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
  if (name === "upgrade") {
    showView("upgrade");
    await refreshUsageStrips();
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
  await refreshUsageStrips();
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

  document.body.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-sample]");
    if (!btn) return;
    const name = btn.dataset.sample;
    if (!name) return;
    if (!(await canGenerate())) {
      goto("upgrade");
      return;
    }
    goto("manual");
    await initScanView();
    applySample(name);
    showToast(`${name} sample loaded`);
  });

  document.getElementById("upgrade-coming-soon-btn")?.addEventListener("click", () => {
    showToast("Upgrade is coming soon. No payment is collected today.");
  });

  document.getElementById("topbar-action")?.addEventListener("click", () => {
    showToast("More options coming after MVP polish");
  });

  document.getElementById("scan-coming-soon")?.addEventListener("click", () => {
    // Scanner is optional for the MVP. There is no native scanner wired in
    // yet, so always guide the user to the working manual path.
    showToast("Scanner unavailable. Type the product name to continue.");
    goto("manual");
  });
}

// Dev-only helpers — intentionally not surfaced in the customer UI.
// Use in DevTools: scratchnscan.dev.resetUsage() / scratchnscan.dev.unlockPremium(true)
window.scratchnscan = {
  goto,
  showToast,
  dev: {
    async resetUsage() {
      const state = await resetUsageForDev();
      await refreshUsageStrips();
      console.log("ScratchnScan usage reset", state);
      return state;
    },
    async unlockPremium(unlocked = true) {
      const state = await setLocalPremiumUnlockedForDev(unlocked);
      await refreshUsageStrips();
      console.log("ScratchnScan dev premium unlocked:", state);
      return state;
    },
    async getUsage() {
      return getUsageState();
    },
  },
};

window.addEventListener("hashchange", route);

// Wire up UI listeners synchronously, before any async work. Buttons must
// always respond even if IndexedDB init is slow, fails, or is blocked by
// another open tab during an upgrade.
wireGlobalActions();
renderPopularChips([]);
route();
void loadPopularItems();

// Kick off async setup; if it fails we log it but the app stays usable.
(async () => {
  try {
    await initDatabase();
  } catch (err) {
    console.warn("initDatabase rejected", err);
  }
  try {
    await refreshUsageStrips();
  } catch (err) {
    console.warn("refreshUsageStrips rejected", err);
  }
})();
