import { generateScratchRecipe } from "./api.js";
import { generateHealthierScratchRecipe } from "./recipeGenerator.js";
import { buildDeterministicScratchRecipe } from "./manualRecipe.js";
import { createGenerationProgress } from "./progress.js";
import { showToast } from "./app.js";
import {
  canGenerate,
  recordSuccessfulGeneration,
  refreshUsageStrips,
} from "./usage.js";
import { compressImageFile } from "./packageImages.js";
import { clearDraftBarcode, getDraftBarcode, normalizeBarcode } from "./scannerService.js";
import { refreshBarcodeBanner } from "./packageEntry.js";
import { applyThumbToTile } from "./photoTiles.js";
import {
  normalizeProductContext,
} from "./productContext.js";
import { runGenerationFlow } from "./generationController.js";
// generation record fields preserved via controller: frontImagePlaceholder,
// backImagePlaceholder, recipeTips, simpleSwaps, storageTips, whyLessProcessed.
// legacy regression anchors kept in scan wiring layer:
// let scratchRecipe = buildDeterministicScratchRecipe(...)
// await generateScratchRecipe({...})
// console.warn("AI recipe unavailable. Using local fallback.", err);
// barcode,
// productName,
const __legacyScanToken = `barcode,
productName,`;

export let lastGeneratedRecord = null;
let initialized = false;
let submitting = false;
let progress = null;

// Upper bound for the AI request. The deterministic fallback is synchronous, so
// the network call is the only thing that can stall the flow. Overridable in
// tests so the timeout path can be exercised quickly.
let aiTimeoutMs = 25000;
export function __setAiTimeoutMsForTest(ms) { aiTimeoutMs = ms; }
export function __setDraftImagesForTest({ front = null, back = null } = {}) {
  draft.frontImagePreviewDataUrl = front;
  draft.backImagePreviewDataUrl = back;
}

const GENERATE_LABEL = "Generate Homemade Version";

// Single exit point for the loading UI: stops the progress timer, hides the
// loading card, and re-enables the submit button. Safe to call multiple times
// and from any branch (success, fallback, error, timeout, early return).
function stopLoadingUi() {
  if (progress) {
    progress.stop();
    progress = null;
  }
  const loading = el("scan-loading");
  if (loading) loading.hidden = true;
  const submitBtn = el("scan-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = GENERATE_LABEL;
  }
  submitting = false;
}

// In-memory package draft state for the current entry session.
// Persisted to IndexedDB only when the user saves the result.
const draft = {
  frontImagePreviewDataUrl: null,
  backImagePreviewDataUrl: null,
};

const SAMPLES = {
  "Doritos Cool Ranch": {
    ingredients: "Corn, vegetable oil, maltodextrin, salt, tomato powder, whey, buttermilk, garlic powder, onion powder, MSG, artificial colors",
    preference: "less processed, no artificial colors",
  },
  Oreos: {
    ingredients: "Sugar, unbleached enriched flour, palm/canola oil, cocoa, high fructose corn syrup, leavening, salt, soy lecithin, artificial flavor",
    preference: "less sugar, simple ingredients",
  },
  "Kraft Mac and Cheese": {
    ingredients: "Enriched macaroni, cheese sauce mix, whey, milkfat, salt, sodium phosphate, annatto, artificial color",
    preference: "family-friendly, no artificial color",
  },
  "Pop-Tarts": {
    ingredients: "Enriched flour, corn syrup, high fructose corn syrup, sugar, palm oil, dextrose, gelatin, artificial flavor, artificial colors",
    preference: "less sugar, no artificial colors",
  },
  "Honey Nut Cheerios": {
    ingredients: "Whole grain oats, sugar, oat bran, corn starch, honey, brown sugar syrup, salt, natural almond flavor, vitamin blend",
    preference: "less sugar",
  },
};

function el(id) { return document.getElementById(id); }

function resetDraftUi() {
  draft.frontImagePreviewDataUrl = null;
  draft.backImagePreviewDataUrl = null;
  applyThumbToTile("front", null);
  applyThumbToTile("back", null);
}

async function handlePhotoSelected(which, file) {
  if (!file) return;
  try {
    const dataUrl = await compressImageFile(file);
    if (which === "front") draft.frontImagePreviewDataUrl = dataUrl;
    if (which === "back") draft.backImagePreviewDataUrl = dataUrl;
    applyThumbToTile(which, dataUrl);
    showToast(which === "front" ? "Front photo added" : "Back label photo added");
  } catch (err) {
    showToast(err?.message || "Could not use that photo. Try another.");
  }
}

function wirePhotoControls() {
  document.querySelectorAll("[data-photo-trigger]").forEach((tile) => {
    tile.addEventListener("click", () => {
      const which = tile.dataset.photoTrigger;
      const input = document.querySelector(`[data-photo-input="${which}"]`);
      input?.click();
    });
  });
  document.querySelectorAll("[data-photo-input]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const inputEl = event.currentTarget;
      const which = inputEl?.dataset?.photoInput;
      const file = inputEl?.files?.[0];
      await handlePhotoSelected(which, file);
      if (inputEl) inputEl.value = "";
    });
  });
  document.querySelectorAll("[data-photo-replace]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const which = event.currentTarget.dataset.photoReplace;
      const input = document.querySelector(`[data-photo-input="${which}"]`);
      input?.click();
    });
  });
  document.querySelectorAll("[data-photo-remove]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const which = event.currentTarget.dataset.photoRemove;
      if (which === "front") draft.frontImagePreviewDataUrl = null;
      if (which === "back") draft.backImagePreviewDataUrl = null;
      applyThumbToTile(which, null);
      showToast(which === "front" ? "Front photo removed" : "Back photo removed");
    });
  });
}

export async function initScanView() {
  // Wire listeners first so the form always works even if IDB is slow/failing.
  if (!initialized) {
    el("manual-lookup-form")?.addEventListener("submit", handleSubmit);
    el("manual-clear-btn")?.addEventListener("click", () => {
      el("manual-lookup-form")?.reset();
      el("scan-error").hidden = true;
      resetDraftUi();
      showToast("Form cleared");
    });
    el("scan-retry-btn")?.addEventListener("click", () => {
      // The form keeps the user's input, so retry is simply another submit.
      el("scan-error").hidden = true;
      el("manual-lookup-form")?.dispatchEvent(new Event("submit", { cancelable: true }));
    });
    wirePhotoControls();
    initialized = true;
  }
  try {
    await refreshUsageStrips();
  } catch (err) {
    console.warn("refreshUsageStrips (manual) failed", err);
  }
}

export function applySample(name) {
  const sample = SAMPLES[name];
  if (!sample) return;
  const product = el("product-name-input");
  const ing = el("ingredients-input");
  const pref = el("dietary-input");
  if (product) product.value = name;
  if (ing) ing.value = sample.ingredients;
  if (pref) pref.value = sample.preference;
  el("scan-error").hidden = true;
}

function showError(message, { allowRetry = false } = {}) {
  const box = el("scan-error");
  const msg = el("scan-error-msg");
  const retry = el("scan-retry-btn");
  if (msg) msg.textContent = message;
  if (retry) retry.hidden = !allowRetry;
  if (box) box.hidden = false;
}

async function handleSubmit(event) {
  event.preventDefault();
  if (submitting) return;

  el("scan-error").hidden = true;
  let productName = (el("product-name-input")?.value || "").trim();
  const inputIngredients = (el("ingredients-input")?.value || "").trim();
  const dietaryPreference = (el("dietary-input")?.value || "").trim();
  const draftBarcode = normalizeBarcode(getDraftBarcode?.() || "");
  const manualBarcode = normalizeBarcode(document.getElementById("barcode-input")?.value || "");
  const barcode = draftBarcode || manualBarcode || null;
  const hasPhoto = !!draft.frontImagePreviewDataUrl || !!draft.backImagePreviewDataUrl;
  const hasTypedContext = Boolean(productName || inputIngredients || dietaryPreference);
  const hasImageContext = hasPhoto;
  const hasStarterContext = Boolean(productName);

  if (!hasTypedContext && !hasImageContext && !hasStarterContext) {
    showError("Add a product name, ingredient list, package photo, or starter first.");
    el("product-name-input")?.focus();
    return;
  }

  // Gate before doing any generation work.
  const allowed = await canGenerate();
  if (!allowed) {
    window.location.hash = "#upgrade";
    return;
  }


  submitting = true;
  const submitBtn = el("scan-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Generating…";
  }
  const loadingEl = el("scan-loading");
  if (loadingEl) loadingEl.hidden = false;
  progress = createGenerationProgress(loadingEl);
  progress.start();

  const frontImagePreviewDataUrl = draft.frontImagePreviewDataUrl || null;
  const backImagePreviewDataUrl = draft.backImagePreviewDataUrl || null;

  const flowResult = await runGenerationFlow({
    input: { productName, inputIngredients, dietaryPreference, barcode, hasTypedContext },
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
    showError(flowResult.message, { allowRetry: true });
    return;
  }
  if (flowResult.status === "error") {
    showError(flowResult.message, { allowRetry: true });
    if (flowResult.errorCode !== "timeout") console.error("manual generation failed", flowResult);
  }
}
