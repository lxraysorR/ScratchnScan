import { generateScratchRecipe } from "./api.js";
import { buildDeterministicScratchRecipe } from "./manualRecipe.js";
import { showToast } from "./app.js";
import { getDraftBarcode, clearDraftBarcode } from "./scannerService.js";
import { refreshBarcodeBanner } from "./packageEntry.js";

export let lastGeneratedRecord = null;
let initialized = false;
let submitting = false;

const SAMPLES = {
  Mayonnaise: {
    ingredients: "Soybean oil, water, whole eggs, vinegar, salt, sugar, lemon juice, natural flavors",
    preference: "simple ingredients, less processed",
  },
  "Boxed Mac & Cheese": {
    ingredients: "Enriched macaroni, cheese sauce mix, whey, milkfat, salt, sodium phosphate, annatto",
    preference: "family-friendly, less processed",
  },
  "Ranch Dressing": {
    ingredients: "Vegetable oil, water, buttermilk, egg yolk, sugar, salt, garlic, onion, preservatives",
    preference: "higher protein, fresher taste",
  },
  "Granola Bar": {
    ingredients: "Rolled oats, sugar, corn syrup, chocolate chips, palm oil, soy lecithin, natural flavor",
    preference: "less sugar, school snack",
  },
  Ketchup: {
    ingredients: "Tomato concentrate, high fructose corn syrup, vinegar, salt, onion powder, natural flavoring",
    preference: "less sugar",
  },
};

function el(id) { return document.getElementById(id); }

export async function initScanView() {
  if (initialized) return;
  el("manual-lookup-form")?.addEventListener("submit", handleSubmit);
  el("manual-clear-btn")?.addEventListener("click", () => {
    el("manual-lookup-form")?.reset();
    el("scan-error").hidden = true;
    document.querySelectorAll(".photo-tile").forEach((tile) => tile.classList.remove("has-photo"));
    showToast("Form cleared");
  });

  document.querySelectorAll(".photo-tile[data-photo]").forEach((tile) => {
    tile.addEventListener("click", () => {
      const which = tile.dataset.photo === "back" ? "back label" : "front package";
      tile.classList.add("has-photo");
      showToast(`Photo capture coming next. For now, type the ${which} details below.`);
    });
  });

  initialized = true;
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

  submitting = true;
  const submitBtn = el("scan-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating…";
  }
  el("scan-loading").hidden = false;

  let scratchRecipe;
  let fallbackUsed = false;
  try {
    let aiRecipe = null;
    try {
      const ai = await generateScratchRecipe({
        productName,
        ingredients: inputIngredients,
        dietaryPreference,
      });
      aiRecipe = ai?.recipe?.homemadeAlternative;
      scratchRecipe = aiRecipe ? {
        title: aiRecipe.title || `Simple homemade ${productName}`,
        summary: ai?.recipe?.plainEnglishExplanation || "AI-assisted scratch recipe.",
        ingredients: (aiRecipe.ingredients || []).map((x) => x.item || x),
        steps: aiRecipe.steps || [],
        tips: aiRecipe.tips || [],
      } : null;
    } catch {
      aiRecipe = null;
    }

    if (!scratchRecipe) {
      fallbackUsed = true;
      scratchRecipe = buildDeterministicScratchRecipe({
        productName,
        inputIngredients,
        dietaryPreference,
      });
    }

    const barcode = getDraftBarcode();
    lastGeneratedRecord = {
      source: barcode ? "scan+manual" : "manual",
      upc: barcode,
      productName,
      ingredientsText: inputIngredients,
      inputIngredients,
      dietaryPreference,
      scratchRecipe,
      recipeTitle: scratchRecipe.title,
      recipeIngredients: scratchRecipe.ingredients,
      recipeSteps: scratchRecipe.steps,
      recipeTips: scratchRecipe.tips || [],
      frontImagePlaceholder: true,
      backImagePlaceholder: true,
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
    window.location.hash = "#result";
  } catch (err) {
    showError(err?.message || "Could not generate a homemade version. Please try again.");
  } finally {
    el("scan-loading").hidden = true;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Homemade Version";
    }
    submitting = false;
  }
}
