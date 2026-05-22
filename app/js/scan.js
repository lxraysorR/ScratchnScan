import { generateScratchRecipe } from "./api.js";
import { buildDeterministicScratchRecipe } from "./manualRecipe.js";

export let lastGeneratedRecord = null;
let initialized = false;
let submitting = false;

function el(id) { return document.getElementById(id); }

export async function initScanView() {
  if (initialized) return;
  el("manual-lookup-form")?.addEventListener("submit", handleSubmit);
  el("manual-clear-btn")?.addEventListener("click", () => {
    el("manual-lookup-form")?.reset();
    el("scan-error").hidden = true;
  });
  initialized = true;
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
  const brand = (el("brand-input")?.value || "").trim();
  const category = (el("category-input")?.value || "").trim();
  const inputIngredients = (el("ingredients-input")?.value || "").trim();
  const dietaryPreference = (el("dietary-input")?.value || "").trim();
  const notes = (el("notes-input")?.value || "").trim();

  if (!productName) {
    showError("Please enter a packaged product name to generate a scratch version.");
    el("product-name-input")?.focus();
    return;
  }

  submitting = true;
  const submitBtn = el("scan-submit-btn");
  if (submitBtn) submitBtn.disabled = true;
  el("scan-loading").hidden = false;

  let scratchRecipe;
  let fallbackUsed = false;
  try {
    let aiRecipe = null;
    try {
      const ai = await generateScratchRecipe({
        productName,
        brand,
        category,
        ingredients: inputIngredients,
        dietaryPreference,
        notes,
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
        brand,
        category,
        inputIngredients,
        dietaryPreference,
        notes,
      });
    }

    lastGeneratedRecord = {
      source: "manual",
      productName,
      brand,
      category,
      ingredientsText: inputIngredients,
      inputIngredients,
      dietaryPreference,
      notes,
      scratchRecipe,
      recipeTitle: scratchRecipe.title,
      recipeIngredients: scratchRecipe.ingredients,
      recipeSteps: scratchRecipe.steps,
      fallbackUsed,
      favorite: false,
      isFavorite: false,
    };

    sessionStorage.setItem(
      "scratchnscan:lastGenerated",
      JSON.stringify({ ...lastGeneratedRecord, fallbackUsed }),
    );
    window.location.hash = "#result";
  } catch (err) {
    showError(err?.message || "Could not generate a scratch version. Please try again.");
  } finally {
    el("scan-loading").hidden = true;
    if (submitBtn) submitBtn.disabled = false;
    submitting = false;
  }
}
