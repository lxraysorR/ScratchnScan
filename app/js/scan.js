import { generateScratchRecipe } from "./api.js";
import { generateHealthierScratchRecipe } from "./recipeGenerator.js";
import { showToast } from "./app.js";
import {
  canGenerate,
  recordSuccessfulGeneration,
  refreshUsageStrips,
} from "./usage.js";
import { compressImageFile } from "./packageImages.js";

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

function applyThumbToTile(which, dataUrl) {
  const slot = document.querySelector(`.photo-slot[data-photo="${which}"]`);
  if (!slot) return;
  const tile = slot.querySelector(".photo-tile");
  const img = slot.querySelector(".photo-thumb");
  const actions = slot.querySelector(`[data-photo-actions="${which}"]`);
  if (dataUrl) {
    if (img) {
      img.src = dataUrl;
      img.alt = which === "front" ? "Front package preview" : "Back label preview";
      img.hidden = false;
    }
    tile?.classList.add("has-photo");
    tile?.setAttribute("aria-label", which === "front" ? "Replace front package photo" : "Replace back label photo");
    if (actions) actions.hidden = false;
  } else {
    if (img) {
      img.removeAttribute("src");
      img.alt = "";
      img.hidden = true;
    }
    tile?.classList.remove("has-photo");
    tile?.setAttribute("aria-label", which === "front" ? "Add front package photo" : "Add back label photo");
    if (actions) actions.hidden = true;
  }
}

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
      const which = event.currentTarget.dataset.photoInput;
      const file = event.currentTarget.files?.[0];
      await handlePhotoSelected(which, file);
      event.currentTarget.value = "";
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

async function handleSubmit(event) {
  event.preventDefault();
  if (submitting) return;

  el("scan-error").hidden = true;
  const productName = (el("product-name-input")?.value || "").trim();
  const inputIngredients = (el("ingredients-input")?.value || "").trim();
  const dietaryPreference = (el("dietary-input")?.value || "").trim();

  if (!productName) {
    showError("Add a product name or quick note so we know what to scratch-make.");
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

  // Always build a deterministic healthier recipe first. This guarantees a
  // result even when there is no AI key, the network is down, the API call
  // fails, the barcode is empty, or the scanner never ran.
  let scratchRecipe = generateHealthierScratchRecipe({
    productName,
    inputIngredients,
    dietaryPreference,
  });
  let fallbackUsed = true;

  try {
    // Optionally upgrade the deterministic recipe with an AI result if a
    // provider happens to be configured. Any failure keeps the fallback.
    try {
      const ai = await generateScratchRecipe({
        productName,
        ingredients: inputIngredients,
        dietaryPreference,
      });
      const aiRecipe = ai?.recipe?.homemadeAlternative;
      if (aiRecipe) {
        scratchRecipe = {
          title: aiRecipe.title || scratchRecipe.title,
          originalProductName: productName,
          summary: ai?.recipe?.plainEnglishExplanation || scratchRecipe.summary,
          healthGoal: aiRecipe.healthGoal || scratchRecipe.healthGoal,
          whyHealthier: Array.isArray(aiRecipe.whyHealthier)
            ? aiRecipe.whyHealthier
            : (Array.isArray(aiRecipe.whyCleaner) ? aiRecipe.whyCleaner : scratchRecipe.whyHealthier),
          ingredients: (aiRecipe.ingredients || []).map((x) => x.item || x),
          steps: aiRecipe.steps || [],
          tips: aiRecipe.tips || scratchRecipe.tips,
          tags: Array.isArray(aiRecipe.tags) ? aiRecipe.tags : scratchRecipe.tags,
          createdAt: scratchRecipe.createdAt,
        };
        fallbackUsed = false;
      }
    } catch (aiErr) {
      // Expected when no AI provider is configured. Keep the fallback recipe.
      console.warn("AI recipe unavailable, using local fallback.", aiErr);
    }

    const frontImagePreviewDataUrl = draft.frontImagePreviewDataUrl;
    const backImagePreviewDataUrl = draft.backImagePreviewDataUrl;

    lastGeneratedRecord = {
      source: "manual",
      barcode: null,
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

    sessionStorage.setItem(
      "scratchnscan:lastGenerated",
      JSON.stringify({ ...lastGeneratedRecord, fallbackUsed }),
    );

    // Only count this generation now that we have a real result.
    await recordSuccessfulGeneration();
    await refreshUsageStrips();

    window.location.hash = "#result";
  } catch (err) {
    recipeError = err;
    showError(err?.message || "Could not generate a homemade version. Please try again.");
  } finally {
    el("scan-loading").hidden = true;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Generate Homemade Version";
    }
    submitting = false;
  }
  // Unused but kept for clarity; thrown errors are surfaced above.
  void recipeError;
}
