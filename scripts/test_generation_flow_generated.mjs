// Generation-flow tests for the "Generate Homemade Version" submit handler.
// These drive the real app/ modules under jsdom with a controllable fetch and
// assert the loading state always resolves: on success, on fallback, on error,
// and on timeout. Also covers staged progress advancing and input preservation.
// Run: node scripts/test_generation_flow_generated.mjs
import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { webcrypto } from "node:crypto";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const html = readFileSync(resolve("app/index.html"), "utf8");
const dom = new JSDOM(html, { url: "http://localhost:8765/", pretendToBeVisual: true });
const { window } = dom;

global.window = window;
global.document = window.document;
global.location = window.location;
global.sessionStorage = window.sessionStorage;
global.HTMLElement = window.HTMLElement;
global.Event = window.Event;
if (!globalThis.crypto?.randomUUID) global.crypto = webcrypto;
window.HTMLElement.prototype.scrollTo = window.HTMLElement.prototype.scrollTo || function () {};

// Controllable fetch: each scenario swaps `fetchImpl`.
let fetchImpl = async () => { throw new Error("no network (default)"); };
global.fetch = (...args) => fetchImpl(...args);
window.fetch = global.fetch;

const consoleErrors = [];
const origError = console.error;
console.error = (...a) => { consoleErrors.push(a.join(" ")); };

// Bootstrap the app, then import scan.js to reach its test hook + handler wiring.
const app = await import(pathToFileURL(resolve("app/js/app.js")).href);
const scan = await import(pathToFileURL(resolve("app/js/scan.js")).href);
await sleep(120);

function $(id) { return document.getElementById(id); }
function loadingHidden() { return $("scan-loading").hidden === true; }

async function gotoManual() {
  window.location.hash = "#manual";
  window.dispatchEvent(new window.Event("hashchange"));
  await sleep(80); // route() -> initScanView() wires the form submit handler
}

function fillForm({ name = "Crunchy Oat Granola Bar", ingredients = "oats, sugar, palm oil", pref = "less sugar" } = {}) {
  $("product-name-input").value = name;
  $("ingredients-input").value = ingredients;
  $("dietary-input").value = pref;
}

function submitForm() {
  $("manual-lookup-form").dispatchEvent(new window.Event("submit", { cancelable: true }));
}

function resetFlowState() {
  window.location.hash = "#manual";
  $("scan-error").hidden = true;
  window.sessionStorage.removeItem("scratchnscan:lastGenerated");
}

let passed = 0;
function ok(name, cond, detail = "") {
  assert.ok(cond, `${name}${detail ? " — " + detail : ""}`);
  passed += 1;
  console.log(`PASS  ${name}`);
}

await gotoManual();

// ---------------------------------------------------------------------------
// 1. SUCCESS: a valid AI response routes to the result and clears loading.
// ---------------------------------------------------------------------------
{
  resetFlowState();
  fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      recipe: {
        product: { name: "Crunchy Oat Granola Bar", category: "granola" },
        plainEnglishExplanation: "A simpler homemade granola bar.",
        homemadeAlternative: {
          title: "Homemade Oat Granola Bars",
          healthGoal: "Less added sugar.",
          whyCleaner: ["No corn syrup."],
          ingredients: [{ item: "2 cups rolled oats" }, { item: "1/4 cup honey" }],
          steps: ["Mix.", "Press into a pan.", "Bake and cool."],
          tips: ["Store airtight."],
        },
      },
    }),
  });
  fillForm();
  submitForm();
  await sleep(200);
  ok("success routes to #result", window.location.hash === "#result", window.location.hash);
  ok("success clears loading state", loadingHidden());
  const saved = JSON.parse(window.sessionStorage.getItem("scratchnscan:lastGenerated"));
  ok("success marks fallbackUsed=false", saved.fallbackUsed === false);
  ok("success uses the AI title", saved.scratchRecipe.title === "Homemade Oat Granola Bars");
}

// ---------------------------------------------------------------------------
// 2. FALLBACK: a network failure still produces a deterministic result.
// ---------------------------------------------------------------------------
{
  resetFlowState();
  fetchImpl = async () => { throw new Error("network down"); };
  fillForm();
  submitForm();
  await sleep(200);
  ok("fallback routes to #result", window.location.hash === "#result", window.location.hash);
  ok("fallback clears loading state", loadingHidden());
  const saved = JSON.parse(window.sessionStorage.getItem("scratchnscan:lastGenerated"));
  ok("fallback marks fallbackUsed=true", saved.fallbackUsed === true);
  const ingText = (saved.scratchRecipe.ingredients || []).join("\n").toLowerCase();
  ok("fallback has no placeholder ingredients", !/(base|flavor|seasoning) ingredient|placeholder/.test(ingText), ingText);
  ok("fallback recipe is granola/oat themed", /oat|granola|cereal/i.test(saved.scratchRecipe.title), saved.scratchRecipe.title);
}

// ---------------------------------------------------------------------------
// 3. ERROR: a failure after the AI step shows a friendly retry + preserves input.
// ---------------------------------------------------------------------------
{
  resetFlowState();
  fetchImpl = async () => { throw new Error("network down"); }; // fall back, then...
  // Force a failure in the persist step (after the AI/fallback step) by swapping
  // the global sessionStorage scan.js reads. getItem still delegates so other
  // reads keep working; setItem throws to drive the outer error handler.
  const realSS = global.sessionStorage;
  global.sessionStorage = {
    getItem: (k) => realSS.getItem(k),
    setItem: () => { throw new Error("storage blew up"); },
    removeItem: (k) => realSS.removeItem(k),
    clear: () => realSS.clear(),
  };
  fillForm({ name: "Toaster Pastry", ingredients: "flour, sugar", pref: "less sugar" });
  submitForm();
  await sleep(200);
  global.sessionStorage = realSS; // restore
  ok("error clears loading state", loadingHidden());
  ok("error shows a friendly message", !$("scan-error").hidden && $("scan-error-msg").textContent.length > 0, $("scan-error-msg").textContent);
  ok("error offers a retry button", $("scan-retry-btn").hidden === false);
  ok("error preserves user input", $("product-name-input").value === "Toaster Pastry");
  ok("error did not route to result", window.location.hash !== "#result", window.location.hash);
  ok("error path logs a diagnostic", consoleErrors.some((e) => /manual generation failed/.test(e)));
  consoleErrors.length = 0; // this scenario's console.error is expected; clear it
}

// ---------------------------------------------------------------------------
// 4. TIMEOUT: a hung request exits loading with the "taking longer" message.
// ---------------------------------------------------------------------------
{
  resetFlowState();
  scan.__setAiTimeoutMsForTest(60); // abort quickly so the test stays fast
  fetchImpl = (url, opts) => new Promise((_, reject) => {
    const signal = opts?.signal;
    if (signal) {
      signal.addEventListener("abort", () => {
        const e = new Error("aborted");
        e.name = "AbortError";
        reject(e);
      });
    }
  });
  fillForm({ name: "Slow Snack", ingredients: "stuff", pref: "" });
  submitForm();
  await sleep(300);
  ok("timeout clears loading state", loadingHidden());
  ok("timeout shows the 'taking longer' message", /taking longer/i.test($("scan-error-msg").textContent), $("scan-error-msg").textContent);
  ok("timeout offers a retry button", $("scan-retry-btn").hidden === false);
  ok("timeout preserves user input", $("product-name-input").value === "Slow Snack");
  ok("timeout did not route to result", window.location.hash !== "#result", window.location.hash);
  scan.__setAiTimeoutMsForTest(25000); // restore default
}

// ---------------------------------------------------------------------------
// 5. PROGRESS COMPONENT: stages advance, completed/active markers update.
// ---------------------------------------------------------------------------
{
  const { createGenerationProgress, GENERATION_STAGES } =
    await import(pathToFileURL(resolve("app/js/progress.js")).href);
  const host = document.createElement("div");
  const p = createGenerationProgress(host, { intervalMs: 100000 }); // manual advance only
  p.start();
  const stagesEls = () => [...host.querySelectorAll(".gp-stage")];
  ok("progress renders one row per stage", stagesEls().length === GENERATION_STAGES.length);
  ok("progress starts on stage 1 active", stagesEls()[0].classList.contains("is-active"));
  ok("progress title reflects stage 1", host.querySelector(".gp-title").textContent === GENERATION_STAGES[0].title);
  p.advance();
  ok("progress advanced to stage 2", stagesEls()[1].classList.contains("is-active"));
  ok("progress marks stage 1 done", stagesEls()[0].classList.contains("is-done"));
  ok("progress title reflects stage 2", host.querySelector(".gp-title").textContent === GENERATION_STAGES[1].title);
  // Advancing past the end holds on the final stage (no wrap, no crash).
  for (let i = 0; i < 20; i += 1) p.advance();
  const last = stagesEls()[GENERATION_STAGES.length - 1];
  ok("progress holds on the final stage", last.classList.contains("is-active"));
  p.stop();
  assert.doesNotThrow(() => p.stop()); // idempotent cleanup
  passed += 1;
  console.log("PASS  progress stop is idempotent");
}

ok("no unexpected console.error during flow", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

console.error = origError;
console.log(`\nGeneration flow tests passed (${passed} checks).`);
process.exit(0);
