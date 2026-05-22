import { generateScratchRecipe } from "./api.js";
import { buildDeterministicScratchRecipe } from "./manualRecipe.js";

export let lastGeneratedRecord = null;
let initialized = false;

function el(id) { return document.getElementById(id); }

export async function initScanView() {
  if (initialized) return;
  el("manual-lookup-form")?.addEventListener("submit", handleSubmit);
  el("manual-clear-btn")?.addEventListener("click", () => el("manual-lookup-form")?.reset());
  initialized = true;
}

async function handleSubmit(event) {
  event.preventDefault();
  el("scan-error").hidden = true;
  el("scan-loading").hidden = false;
  const productName = (el("product-name-input")?.value || "").trim();
  const inputIngredients = (el("ingredients-input")?.value || "").trim();
  const notes = (el("notes-input")?.value || "").trim();

  if (!productName && !inputIngredients && !notes) {
    el("scan-loading").hidden = true;
    el("scan-error-msg").textContent = "Enter at least product name, ingredients, or notes.";
    el("scan-error").hidden = false;
    return;
  }

  let scratchRecipe;
  let fallbackUsed = false;
  try {
    const ai = await generateScratchRecipe({ productName, ingredients: inputIngredients, notes });
    const aiRecipe = ai?.recipe?.homemadeAlternative;
    scratchRecipe = aiRecipe ? {
      title: aiRecipe.title || `Simple homemade ${productName || "alternative"}`,
      summary: ai?.recipe?.plainEnglishExplanation || "AI-assisted scratch recipe.",
      ingredients: (aiRecipe.ingredients || []).map((x) => x.item || x),
      steps: aiRecipe.steps || [],
      tips: aiRecipe.tips || [],
    } : buildDeterministicScratchRecipe({ productName, inputIngredients, notes });
  } catch {
    fallbackUsed = true;
    scratchRecipe = buildDeterministicScratchRecipe({ productName, inputIngredients, notes });
  }

  lastGeneratedRecord = {
    source: "manual",
    productName: productName || "Manual packaged item",
    inputIngredients,
    notes,
    scratchRecipe,
    favorite: false,
  };

  sessionStorage.setItem("scratchnscan:lastGenerated", JSON.stringify({ ...lastGeneratedRecord, fallbackUsed }));
  el("scan-loading").hidden = true;
  window.location.hash = "#result";
}
