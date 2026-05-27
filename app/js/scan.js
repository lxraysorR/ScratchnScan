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
  mergeProductContexts,
  needsManualCorrection,
  contextToRecipeInput,
} from "./productContext.js";

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

function buildTipsFromAiRecipe(aiRecipe) {
  const tips = [];
  for (const tip of aiRecipe?.tips || []) {
    if (tip) tips.push(String(tip));
  }
  for (const swap of aiRecipe?.simpleSwaps || []) {
    const insteadOf = String(swap?.insteadOf || "").trim();
    const use = String(swap?.use || "").trim();
    const why = String(swap?.why || "").trim();
    if (!insteadOf && !use && !why) continue;
    const parts = [];
    if (insteadOf && use) parts.push(`Swap ${insteadOf} for ${use}.`);
    else if (use) parts.push(`Try ${use}.`);
    else if (insteadOf) parts.push(`Adjust from ${insteadOf}.`);
    if (why) parts.push(why);
    tips.push(parts.join(" ").trim());
  }
  for (const reason of aiRecipe?.whyLessProcessed || []) {
    if (reason) tips.push(`Why less processed: ${reason}`);
  }
  if (aiRecipe?.storageTips) {
    tips.push(`Storage: ${String(aiRecipe.storageTips).trim()}`);
  }
  return tips.filter(Boolean);
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
  const hasFrontImage = !!frontImagePreviewDataUrl;
  const hasBackImage = !!backImagePreviewDataUrl;

  let productContext = normalizeProductContext({
    productName,
    ingredientsText: inputIngredients,
    userPreferences: dietaryPreference,
    source: hasPhoto ? "photo" : "manual",
    sourceBasis: [
      hasFrontImage ? "front_label" : "",
      hasBackImage ? "back_label" : "",
    ].filter(Boolean),
    sourceMetadata: { barcode: barcode || "", flow: "manual_form" },
  });
  let scratchRecipe = buildDeterministicScratchRecipe({
    productName: contextToRecipeInput(productContext).productName,
    inputIngredients: contextToRecipeInput(productContext).ingredientsText,
    notes: dietaryPreference,
  });
  let fallbackUsed = true;
  try {
    try {
      const ai = await generateScratchRecipe({
        productName,
        ingredients: inputIngredients,
        dietaryPreference,
        goals: dietaryPreference,
        upc: barcode || undefined,
        hasFrontImage,
        hasBackImage,
        frontImage: frontImagePreviewDataUrl || undefined,
        backImage: backImagePreviewDataUrl || undefined,
      }, { timeoutMs: aiTimeoutMs });
      const aiRecipe = ai?.recipe?.homemadeAlternative;
      const product = ai?.recipe?.product || {};
      const detectedName = (product.name || "").trim();
      if (!productName && detectedName) productName = detectedName;
      const aiContext = normalizeProductContext({
        ...product,
        productName: productName || detectedName || product.productName,
        category: product.category || product.foodType || "",
        ingredientsText: inputIngredients || product.ingredientsText || "",
        source: hasPhoto ? "photo" : "ai",
        sourceBasis: product.sourceBasis || productContext.sourceBasis,
      });
      productContext = mergeProductContexts(productContext, aiContext);
      const photoOnlyInput = hasPhoto && !hasTypedContext;
      if (photoOnlyInput && needsManualCorrection(productContext)) {
        showError(
          "We could not confidently identify this product from the photo. Please confirm the product name or add the ingredient list, then try again.",
          { allowRetry: true },
        );
        return;
      }
      if (aiRecipe) {
        const recipeInput = contextToRecipeInput(productContext);
        scratchRecipe = {
          title: aiRecipe.title || `Homemade version of ${recipeInput.productName}`,
          originalProductName: recipeInput.productName,
          summary: ai?.recipe?.plainEnglishExplanation || "AI-assisted scratch recipe.",
          healthGoal: aiRecipe.healthGoal || "Use simpler, less processed ingredients while keeping familiar flavor.",
          whyHealthier: Array.isArray(aiRecipe.whyCleaner) ? aiRecipe.whyCleaner : [],
          tags: ["homemade", "less processed", "simple ingredients"],
          createdAt: new Date().toISOString(),
          ingredients: (aiRecipe.ingredients || []).map((x) => x.item || x),
          steps: aiRecipe.steps || [],
          tips: buildTipsFromAiRecipe(aiRecipe),
        };
        fallbackUsed = false;
      }
    } catch (err) {
      // A timeout is a distinct, user-actionable outcome: surface it (with a
      // retry) instead of silently falling back so users know to try again or
      // add more detail. Any other AI failure uses the deterministic fallback.
      if (err?.timeout) throw err;
      if (hasPhoto && !hasTypedContext) {
        showError(
          "We could not confidently identify this product from the photo. Please confirm the product name or add the ingredient list, then try again.",
          { allowRetry: true },
        );
        return;
      }
      console.warn("AI recipe unavailable. Using local fallback.", err);
    }

    if (!scratchRecipe) {
      const recipeInput = contextToRecipeInput(productContext);
      scratchRecipe = buildDeterministicScratchRecipe({
        productName: recipeInput.productName,
        inputIngredients: recipeInput.ingredientsText,
        notes: dietaryPreference,
        category: recipeInput.category || "",
        flavor: recipeInput.flavor || "",
        detectedIngredients: recipeInput.detectedIngredients || [],
        claims: recipeInput.claims || [],
        source: recipeInput.source || (hasPhoto ? 'photo' : 'manual'),
      });
    }

    lastGeneratedRecord = {
      source: "manual",
      barcode,
      productName,
      originalProductName: scratchRecipe.originalProductName || productName,
      ingredientsText: inputIngredients,
      inputIngredients,
      notes: "",
      dietaryPreference,
      scratchRecipe,
      recipeTitle: scratchRecipe.title,
      recipeIngredients: scratchRecipe.ingredients,
      recipeSteps: scratchRecipe.steps,
      recipeTips: scratchRecipe.tips || [],
      frontImagePlaceholder: !frontImagePreviewDataUrl,
      backImagePlaceholder: !backImagePreviewDataUrl,
      frontImagePreviewDataUrl: frontImagePreviewDataUrl || null,
      backImagePreviewDataUrl: backImagePreviewDataUrl || null,
      fallbackUsed,
      productContext,
      favorite: false,
      isFavorite: false,
    };
    clearDraftBarcode();
    refreshBarcodeBanner();

    sessionStorage.setItem(
      "scratchnscan:lastGenerated",
      JSON.stringify({ ...lastGeneratedRecord, fallbackUsed }),
    );

    // Only count this generation now that we have a real result.
    await recordSuccessfulGeneration();
    await refreshUsageStrips();

    window.location.hash = "#result";
  } catch (err) {
    if (err?.timeout) {
      showError(
        "This is taking longer than expected. Please try again or add more product details.",
        { allowRetry: true },
      );
    } else {
      showError(
        "We could not generate the recipe yet. Try typing the product name again.",
        { allowRetry: true },
      );
      console.error("manual generation failed", err);
    }
  } finally {
    // Single, guaranteed exit from the loading state for every branch above.
    stopLoadingUi();
  }
}
