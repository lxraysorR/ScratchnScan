// QA browser-flow harness: drives the real app/ modules under jsdom with a
// working IndexedDB (fake-indexeddb). Exercises manual entry -> generate ->
// save -> history -> details -> persistence -> delete, and captures any
// console errors / uncaught rejections. Run: node scripts/qa-browser-flow.mjs
import "fake-indexeddb/auto";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { webcrypto } from "node:crypto";

const results = [];
const consoleErrors = [];
const rejections = [];
let failed = false;

function check(name, cond, detail = "") {
  results.push({ name, pass: !!cond, detail });
  if (!cond) failed = true;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const html = readFileSync(resolve("app/index.html"), "utf8");
const dom = new JSDOM(html, { url: "http://localhost:8765/", pretendToBeVisual: true });
const { window } = dom;

// Wire globals the app modules expect, BEFORE importing app.js.
global.window = window;
global.document = window.document;
global.location = window.location;
global.sessionStorage = window.sessionStorage;
global.HTMLElement = window.HTMLElement;
global.Event = window.Event;
if (!globalThis.crypto?.randomUUID) global.crypto = webcrypto; // localDb uses crypto.randomUUID
window.confirm = () => true; // auto-confirm delete dialog
// jsdom does not implement Element.scrollTo (real browsers do). app.js calls
// main.scrollTo on every view change; without this polyfill route() throws
// inside jsdom only. This is an environment shim, not an app fix.
window.HTMLElement.prototype.scrollTo = window.HTMLElement.prototype.scrollTo || function () {};

// Force the AI path to fail so the deterministic fallback runs (matches the
// sandbox, which has no worker). scan.js catches this and falls back.
global.fetch = async () => { throw new Error("no network in QA sandbox"); };
window.fetch = global.fetch;

// Capture diagnostics.
const origError = console.error;
console.error = (...args) => { consoleErrors.push(args.join(" ")); origError(...args); };
process.on("unhandledRejection", (err) => { rejections.push(String(err)); });
window.addEventListener("error", (e) => { rejections.push("window error: " + e.message); });

async function goto(view, arg) {
  window.location.hash = arg ? `#${view}/${arg}` : `#${view}`;
  window.dispatchEvent(new window.Event("hashchange"));
  await sleep(60);
}

const appUrl = pathToFileURL(resolve("app/js/app.js")).href;
const app = await import(appUrl);
await sleep(120); // let top-level route() + initDatabase() settle

// 1. App startup / module graph
check("App modules import without throwing", true);
check("scratchnscan global exposed", typeof window.scratchnscan?.goto === "function");

// 2. Home screen
await goto("home");
check("Home view visible", !document.getElementById("view-home").hidden);
check("Home hero CTA present", !!document.querySelector('[data-go="manual"]'));

// 3. Navigation: every nav tab toggles its view without throwing
for (const target of ["scan", "manual", "history", "home"]) {
  await goto(target);
  check(`Nav -> #${target} shows its view`, !document.getElementById(`view-${target}`).hidden);
}

// 10. Scanner entry point: the scan view's primary action must never be a dead
// button. In the browser/MVP build it routes the user to manual entry with a
// clear "scanner unavailable" message (no native scanner is wired in yet).
await goto("scan");
const scanBtn = document.getElementById("scan-start-btn");
check("Scan view action button present", !!scanBtn);
if (scanBtn) {
  scanBtn.click();
  await sleep(80);
  const toast = document.getElementById("toast");
  check(
    "Scan routes to manual with a friendly fallback",
    window.location.hash === "#manual" && /could not start the scanner/i.test(toast.textContent),
    `${window.location.hash} | ${toast.textContent.trim()}`,
  );
}

// 4. Manual entry flow with the spec sample data
await goto("manual");
check("Manual view visible", !document.getElementById("view-manual").hidden);
document.getElementById("product-name-input").value = "Crunchy Oat Granola Bar";
document.getElementById("ingredients-input").value = "oats, sugar, palm oil, corn syrup, natural flavor";
document.getElementById("dietary-input").value = "less sugar";

// 12. Error handling: empty name should block with a visible message
const savedName = document.getElementById("product-name-input").value;
document.getElementById("product-name-input").value = "";
document.getElementById("manual-lookup-form").dispatchEvent(new window.Event("submit", { cancelable: true }));
await sleep(40);
const errBox = document.getElementById("scan-error");
check("Empty name shows validation error", !errBox.hidden && /name/i.test(document.getElementById("scan-error-msg").textContent), document.getElementById("scan-error-msg").textContent.trim());
document.getElementById("product-name-input").value = savedName;

// 11. Generate/analyze flow (fallback branch)
document.getElementById("manual-lookup-form").dispatchEvent(new window.Event("submit", { cancelable: true }));
await sleep(150);
check("Generate routed to result view", window.location.hash === "#result");
check("Generation persisted lastGenerated payload to sessionStorage", !!window.sessionStorage.getItem("scratchnscan:lastGenerated"));
await goto("result"); // ensure result view initialized from sessionStorage
const resultName = document.getElementById("result-name").textContent;
check("Result shows a recipe title", resultName.length > 0, resultName);
check("Result has ingredients", document.getElementById("result-homemade-ingredients").children.length > 0);
check("Result has steps", document.getElementById("result-homemade-steps").children.length > 0);
check("Fallback title is oat/granola-based for granola input", /granola|oat/i.test(resultName), resultName);
check("Generation completes without leaving the button stuck in loading", document.getElementById("scan-loading").hidden);

// 5. Save flow
const saveBtn = document.getElementById("result-save-btn");
check("Save button present", !!saveBtn);
saveBtn.click();
await sleep(150);
check("Save routed to details view", window.location.hash.startsWith("#details/"), window.location.hash);
const savedId = window.location.hash.split("/")[1];

// 7 + 12. Details flow displays saved data
await goto("details", savedId);
check("Details shows recipe name", document.getElementById("details-name").textContent.length > 0, document.getElementById("details-name").textContent);
check("Details meta references the product", /granola bar/i.test(document.getElementById("details-meta").textContent), document.getElementById("details-meta").textContent);
check("Details lists ingredients", document.getElementById("details-ingredients").children.length > 0);
check("Details lists steps", document.getElementById("details-steps").children.length > 0);

// 6. History flow: saved item appears
await goto("history");
const historyCards = document.querySelectorAll(".history-card");
check("Saved item appears in history", historyCards.length >= 1, `${historyCards.length} card(s)`);
const viewBtn = document.querySelector('.history-card [data-action="view"]');
check("History 'View details' button present", !!viewBtn);

// 8. Back navigation from details
await goto("details", savedId);
document.querySelector('#view-details [data-go="history"]').click();
await sleep(60);
check("Back-to-history from details works", !document.getElementById("view-history").hidden);

// 15. Persistence: read IndexedDB directly (independent of in-memory JS)
async function readHistoryFromIdb() {
  return new Promise((res, rej) => {
    const req = indexedDB.open("scan_scratch_local_db");
    req.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction("mvp_history", "readonly");
      const all = tx.objectStore("mvp_history").getAll();
      all.onsuccess = () => res(all.result);
      all.onerror = () => rej(all.error);
    };
    req.onerror = (e) => rej(e.target.error);
  });
}
const persisted = await readHistoryFromIdb();
check("Saved record persisted in IndexedDB", persisted.length >= 1 && persisted.some((r) => r.id === savedId), `${persisted.length} row(s)`);
check("Persisted record keeps product name", persisted.some((r) => /granola bar/i.test(r.productName || "")));

// Simulate reload: getMvpHistory should still return the row (fresh read).
const { getMvpHistory } = await import(pathToFileURL(resolve("app/js/localDb.js")).href);
const afterReload = await getMvpHistory();
check("History survives simulated reload (fresh IDB read)", afterReload.some((r) => r.id === savedId));

// 9. Delete flow
await goto("details", savedId);
document.getElementById("details-delete-btn").click();
await sleep(150);
const afterDelete = await readHistoryFromIdb();
check("Delete removes the record from IndexedDB", !afterDelete.some((r) => r.id === savedId));

// 13. Empty state shows after deleting the only item
await goto("history");
check("Empty state shown when no items remain", afterDelete.length === 0 ? !document.getElementById("history-empty").hidden : true);

// 14. Console errors / uncaught rejections
check("No console.error during flow", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
check("No uncaught rejections / window errors", rejections.length === 0, rejections.slice(0, 3).join(" | "));

console.log("\n" + (failed ? "RESULT: FAIL" : "RESULT: PASS") + ` (${results.filter((r) => r.pass).length}/${results.length} checks)`);
if (consoleErrors.length) console.log("console.error captured:\n  " + consoleErrors.join("\n  "));
if (rejections.length) console.log("rejections captured:\n  " + rejections.join("\n  "));
process.exit(failed ? 1 : 0);
