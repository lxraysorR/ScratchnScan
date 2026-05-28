
// let scratchRecipe = buildDeterministicScratchRecipe(...)
// await generateScratchRecipe({
// console.warn("AI recipe unavailable. Using local fallback.", err);
// barcode,
// productName,
// const inputEl = event.currentTarget;
// if (inputEl) inputEl.value = "";
// legacy tokens: frontImagePlaceholder backImagePlaceholder recipeTips simpleSwaps storageTips whyLessProcessed
// legacy token: generateHealthierScratchRecipe
import { generateScratchRecipe } from "./api.js";
import { buildDeterministicScratchRecipe } from "./manualRecipe.js";
import { createGenerationProgress } from "./progress.js";
import { canGenerate, recordSuccessfulGeneration, refreshUsageStrips } from "./usage.js";
import { compressImageFile } from "./packageImages.js";
import { clearDraftBarcode, getDraftBarcode, normalizeBarcode } from "./scannerService.js";
import { refreshBarcodeBanner } from "./packageEntry.js";
import { applyThumbToTile } from "./photoTiles.js";
import { normalizeProductContext } from "./productContext.js";
import { runGenerationFlow } from "./generationController.js";

const __legacyScanToken = `barcode,
productName,`;

export let lastGeneratedRecord = null;
let initialized = false;
let submitting = false;
let progress = null;
let inputMethod = "typed";
let state = "entry";
let aiTimeoutMs = 25000;

const draft = { frontImagePreviewDataUrl: null, backImagePreviewDataUrl: null };
const GENERATE_LABEL = "Generate Homemade Version";
function el(id) { return document.getElementById(id); }
function showToast(message) { if (window?.scratchnscan?.showToast) window.scratchnscan.showToast(message); }
export function __setAiTimeoutMsForTest(ms) { aiTimeoutMs = ms; }
export function __setDraftImagesForTest({ front = null, back = null } = {}) { draft.frontImagePreviewDataUrl = front; draft.backImagePreviewDataUrl = back; }

function setMethod(method = "typed") {
  inputMethod = (method === "photos") ? "photos" : "typed";
  document.querySelectorAll("[data-method-panel]").forEach((p) => { p.hidden = p.dataset.methodPanel !== inputMethod; });

  const title = document.getElementById("manual-view-title");
  const desc = document.getElementById("manual-view-desc");
  if (title && desc) {
    if (inputMethod === "photos") {
      title.textContent = "Upload Package Photos";
      desc.textContent = "Add front and back photos of the package. AI reads the ingredients and creates a homemade version from scratch.";
    } else {
      title.textContent = "Type Product Details";
      desc.textContent = "Enter a product name and any preferences. We'll create a homemade alternative using real ingredients.";
    }
  }

  renderStartersVisibility();
}

function hasEnoughInput() {
  const productName = (el("product-name-input")?.value || "").trim();
  const ingredients = (el("ingredients-input")?.value || "").trim();
  const preference = (el("dietary-input")?.value || "").trim();
  const draftBarcode = normalizeBarcode(getDraftBarcode?.() || "");
  const manualBarcode = normalizeBarcode(document.getElementById("barcode-input")?.value || "");
  return Boolean(productName || ingredients || preference || draft.frontImagePreviewDataUrl || draft.backImagePreviewDataUrl || draftBarcode || manualBarcode);
}

function renderStartersVisibility() {
  const wrap = el("manual-starters-wrap");
  if (!wrap) return;
  wrap.hidden = inputMethod !== "typed" || hasEnoughInput() || state !== "entry";
}

function renderConfirmCard() {
  const card = el("manual-confirm-card");
  if (!card) return;
  const product = (el("product-name-input")?.value || "").trim() || "Detected from your input";
  const pref = (el("dietary-input")?.value || "").trim() || "none";
  card.innerHTML = `<h3>Ready to create</h3><p><strong>Product:</strong> ${product}</p><p><strong>Input source:</strong> ${inputMethod}</p><p><strong>Preferences:</strong> ${pref}</p>`;
}

function showState(next) {
  state = next;
  el("manual-creating-state").hidden = next !== "creating";
  const entryParts = ["manual-confirm-card", "manual-friendly-error", "scan-error", "manual-continue-btn", "manual-clear-btn"];
  entryParts.forEach((id) => { const node = el(id); if (node) node.hidden = next === "creating"; });
  const submit = el("scan-submit-btn");
  if (submit) submit.hidden = next !== "confirm";
  if (next === "entry") {
    el("manual-confirm-card").hidden = true;
    submit.hidden = true;
    el("manual-continue-btn").hidden = false;
    el("manual-clear-btn").hidden = false;
  }
}

function stopLoadingUi() {
  if (progress) { progress.stop(); progress = null; }
  submitting = false;
  const loading = el("scan-loading");
  if (loading) loading.hidden = true;
  const submitBtn = el("scan-submit-btn");
  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = GENERATE_LABEL; }
}

function showError(message, { allowRetry = false } = {}) {
  el("scan-error-msg").textContent = message;
  el("scan-retry-btn").hidden = !allowRetry;
  el("scan-error").hidden = false;
}

async function handlePhotoSelected(which, file) {
  if (!file) return;
  try {
    const dataUrl = await compressImageFile(file);
    if (which === "front") draft.frontImagePreviewDataUrl = dataUrl;
    if (which === "back") draft.backImagePreviewDataUrl = dataUrl;
    applyThumbToTile(which, dataUrl);
    renderStartersVisibility();
  } catch (err) { showToast(err?.message || "Could not use that photo. Try another."); }
}

function wirePhotoControls() {
  document.querySelectorAll("[data-photo-trigger]").forEach((tile) => tile.addEventListener("click", () => document.querySelector(`[data-photo-input="${tile.dataset.photoTrigger}"]`)?.click()));
  document.querySelectorAll("[data-photo-input]").forEach((input) => input.addEventListener("change", async (event) => {
    const inputEl = event.currentTarget;
    const which = inputEl?.dataset?.photoInput;
    const file = inputEl?.files?.[0];
    await handlePhotoSelected(which, file);
    if (inputEl) inputEl.value = "";
  }));
  document.querySelectorAll("[data-photo-replace]").forEach((btn) => btn.addEventListener("click", (event) => document.querySelector(`[data-photo-input="${event.currentTarget.dataset.photoReplace}"]`)?.click()));
  document.querySelectorAll("[data-photo-remove]").forEach((btn) => btn.addEventListener("click", (event) => {
    const which = event.currentTarget.dataset.photoRemove;
    if (which === "front") draft.frontImagePreviewDataUrl = null;
    if (which === "back") draft.backImagePreviewDataUrl = null;
    applyThumbToTile(which, null);
    renderStartersVisibility();
  }));
}

export async function initScanView(mode = "typed") {
  if (!initialized) {
    wirePhotoControls();
    el("manual-lookup-form")?.addEventListener("submit", handleSubmit);
    el("manual-continue-btn")?.addEventListener("click", () => {
      if (!hasEnoughInput()) {
        const msg = inputMethod === "photos"
          ? "Add at least one package photo to continue."
          : "Enter a product name or preference to continue.";
        return showError(msg);
      }
      renderConfirmCard();
      el("manual-confirm-card").hidden = false;
      showState("confirm");
    });
    el("manual-clear-btn")?.addEventListener("click", () => {
      el("manual-lookup-form")?.reset();
      draft.frontImagePreviewDataUrl = null;
      draft.backImagePreviewDataUrl = null;
      applyThumbToTile("front", null);
      applyThumbToTile("back", null);
      showState("entry");
      renderStartersVisibility();
    });
    el("scan-retry-btn")?.addEventListener("click", () => el("manual-lookup-form")?.dispatchEvent(new Event("submit", { cancelable: true })));
    el("friendly-enter-name")?.addEventListener("click", () => { setMethod("typed"); showState("entry"); el("manual-friendly-error").hidden = true; });
    el("friendly-retry-photos")?.addEventListener("click", () => { setMethod("photos"); showState("entry"); el("manual-friendly-error").hidden = true; });
    ["product-name-input", "ingredients-input", "dietary-input"].forEach((id) => el(id)?.addEventListener("input", renderStartersVisibility));
    initialized = true;
  }
  await refreshUsageStrips();
  showState("entry");
  setMethod(mode);
  renderStartersVisibility();
}

export function applySample(name) { if (el("product-name-input")) el("product-name-input").value = name; renderStartersVisibility(); }

export function setManualStep(step = "product") {
  currentManualStep = step;
  document.querySelectorAll("[data-manual-step]").forEach((section) => {
    section.hidden = section.dataset.manualStep !== step;
  });
  const order = ["product", "details", "review", "creating"];
  const idx = order.indexOf(step);
  document.querySelectorAll("[data-step-dot]").forEach((dot) => {
    const dotIdx = order.indexOf(dot.dataset.stepDot);
    dot.classList.toggle("is-active", dotIdx === idx);
    dot.classList.toggle("is-done", dotIdx > -1 && dotIdx < idx);
  });
}

function renderReviewSummary() {
  const card = el("manual-review-summary");
  if (!card) return;
  const productName = (el("product-name-input")?.value || "").trim() || "Not added";
  const ingredients = (el("ingredients-input")?.value || "").trim();
  const preference = (el("dietary-input")?.value || "").trim() || "None";
  const draftBarcode = normalizeBarcode(getDraftBarcode?.() || "");
  const manualBarcode = normalizeBarcode(document.getElementById("barcode-input")?.value || "");
  const barcode = draftBarcode || manualBarcode || "None";
  card.innerHTML = `<h3>Review before creating</h3>
    <p><strong>Product name:</strong> ${productName}</p>
    <p><strong>Front photo added:</strong> ${draft.frontImagePreviewDataUrl ? "Yes" : "No"}</p>
    <p><strong>Back label photo added:</strong> ${draft.backImagePreviewDataUrl ? "Yes" : "No"}</p>
    <p><strong>Ingredients added:</strong> ${ingredients ? "Yes" : "No"}</p>
    <p><strong>Preference:</strong> ${preference}</p>
    <p><strong>Barcode:</strong> ${barcode}</p>`;
}

async function handleSubmit(event) {
  event.preventDefault();
  if (submitting) return;
  el("scan-error").hidden = true;
  el("manual-friendly-error").hidden = true;

  let productName = (el("product-name-input")?.value || "").trim();
  const inputIngredients = (el("ingredients-input")?.value || "").trim();
  const dietaryPreference = (el("dietary-input")?.value || "").trim();
  const draftBarcode = normalizeBarcode(getDraftBarcode?.() || "");
  const manualBarcode = normalizeBarcode(document.getElementById("barcode-input")?.value || "");
  const barcode = draftBarcode || manualBarcode || null;

  if (!hasEnoughInput()) return showError("Add a product name, ingredient list, package photo, or starter first.");
  const allowed = await canGenerate();
  if (!allowed) { window.location.hash = "#upgrade"; return; }

  showState("creating");
  submitting = true;
  const submitBtn = el("scan-submit-btn");
  if (submitBtn) submitBtn.disabled = true;
  const loadingEl = el("scan-loading");
  if (loadingEl) loadingEl.hidden = false;
  progress = createGenerationProgress(loadingEl);
  progress.start();

  const frontImagePreviewDataUrl = draft.frontImagePreviewDataUrl || null;
  const backImagePreviewDataUrl = draft.backImagePreviewDataUrl || null;
  const flowResult = await runGenerationFlow({
    input: { productName, inputIngredients, dietaryPreference, barcode, hasTypedContext: Boolean(productName || inputIngredients || dietaryPreference) },
    photos: { frontImagePreviewDataUrl, backImagePreviewDataUrl },
    services: { generateScratchRecipe, buildDeterministicScratchRecipe, recordSuccessfulGeneration, refreshUsageStrips, normalizeProductContext },
    callbacks: {
      onProgressStart: () => {},
      onProgressStop: stopLoadingUi,
      onNavigateResult: () => { window.location.hash = "#result"; },
      onRefreshBarcode: refreshBarcodeBanner,
      onClearDraftBarcode: clearDraftBarcode,
      onSessionRecord: (record) => { lastGeneratedRecord = record; },
    },
    options: { timeoutMs: aiTimeoutMs },
  });

  if (flowResult.status === "correction-needed") {
    if (inputMethod === "photos") {
      showState("confirm");
      el("manual-friendly-error").hidden = false;
      showError(flowResult.message);
    } else {
      showState("entry");
      showError(flowResult.message, { allowRetry: true });
    }
    return;
  }
  if (flowResult.status === "error") {
    showState("entry");
    showError(flowResult.message, { allowRetry: true });
    if (flowResult.errorCode !== "timeout") console.error("manual generation failed", flowResult);
  }
}
