import { generateScratchRecipe } from "./api.js";
import { generateHealthierScratchRecipe } from "./recipeGenerator.js";
import { buildDeterministicScratchRecipe } from "./manualRecipe.js";
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
import { buildGenerationPayload } from "./generationPayload.js";

export let lastGeneratedRecord = null;
let initialized = false;
let submitting = false;

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

function showError(message) {
  const box = el("scan-error");
  const msg = el("scan-error-msg");
  if (msg) msg.textContent = message;
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

  // A photo can stand in for a typed product name — the AI reads it to identify
  // the item. Only block when there's nothing at all to work from.
  if (!productName && !hasPhoto) {
    showError("Type a product name or add a package photo first.");
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
  el("scan-loading").hidden = false;

  const frontImagePreviewDataUrl = draft.frontImagePreviewDataUrl || null;
  const backImagePreviewDataUrl = draft.backImagePreviewDataUrl || null;
  const hasFrontImage = !!frontImagePreviewDataUrl;
  const hasBackImage = !!backImagePreviewDataUrl;

  let scratchRecipe = buildDeterministicScratchRecipe({
    productName,
    inputIngredients,
    dietaryPreference,
  });
  let fallbackUsed = true;
  try {
    try {
      const ai = await generateScratchRecipe({
        productName,
        ingredients: inputIngredients,
        dietaryPreference,
        // The worker reads `goals`; map the user preference so the AI honors it.
        goals: dietaryPreference,
        upc: barcode || undefined,
        hasFrontImage,
        hasBackImage,
        // Send the compressed photos so the AI can identify the product and read
        // its ingredients when the user uploaded labels instead of typing a name.
        frontImage: frontImagePreviewDataUrl || undefined,
        backImage: backImagePreviewDataUrl || undefined,
      });
      const aiRecipe = ai?.recipe?.homemadeAlternative;
      if (aiRecipe) {
        // Photo-only entry: adopt the name the AI read from the package.
        const detectedName = (ai?.recipe?.product?.name || "").trim();
        if (!productName && detectedName) productName = detectedName;
        scratchRecipe = {
        title: aiRecipe.title || `Homemade version of ${productName}`,
        originalProductName: productName,
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
      console.warn("AI recipe unavailable. Using local fallback.", err);
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
    showError("We could not generate the recipe yet. Try typing the product name again.");
    console.error("manual generation failed", err);
  } finally {
    el("scan-loading").hidden = true;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Generate Homemade Version";
    }
    submitting = false;
  }
}
