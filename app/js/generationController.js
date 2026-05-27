import {
  normalizeProductContext,
  mergeProductContexts,
  needsManualCorrection,
  contextToRecipeInput,
} from "./productContext.js";

const DEFAULT_TIMEOUT_MESSAGE = "This is taking longer than expected. Please try again or add more product details.";
const DEFAULT_CORRECTION_MESSAGE = "We could not confidently identify this product from the photo. Please confirm the product name or add the ingredient list, then try again.";

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

function createSessionRecord({ input, scratchRecipe, fallbackUsed, productContext, photos }) {
  return {
    source: "manual",
    barcode: input.barcode,
    productName: input.productName,
    originalProductName: scratchRecipe.originalProductName || input.productName,
    ingredientsText: input.inputIngredients,
    inputIngredients: input.inputIngredients,
    notes: "",
    dietaryPreference: input.dietaryPreference,
    scratchRecipe,
    recipeTitle: scratchRecipe.title,
    recipeIngredients: scratchRecipe.ingredients,
    recipeSteps: scratchRecipe.steps,
    recipeTips: scratchRecipe.tips || [],
    frontImagePlaceholder: !photos.frontImagePreviewDataUrl,
    backImagePlaceholder: !photos.backImagePreviewDataUrl,
    frontImagePreviewDataUrl: photos.frontImagePreviewDataUrl || null,
    backImagePreviewDataUrl: photos.backImagePreviewDataUrl || null,
    fallbackUsed,
    productContext,
    favorite: false,
    isFavorite: false,
  };
}

export async function runGenerationFlow({ input, photos, services, callbacks = {}, options = {} }) {
  const {
    generateScratchRecipe,
    buildDeterministicScratchRecipe,
    recordSuccessfulGeneration,
    refreshUsageStrips,
  } = services;
  const {
    onProgressStart,
    onProgressStop,
    onNavigateResult,
    onRefreshBarcode,
    onClearDraftBarcode,
    onSessionRecord,
  } = callbacks;

  const timeoutMs = options.timeoutMs ?? 25000;
  const hasPhoto = !!photos.frontImagePreviewDataUrl || !!photos.backImagePreviewDataUrl;
  const hasTypedContext = Boolean(input.productName || input.inputIngredients || input.dietaryPreference);

  onProgressStart?.();
  let productContext = normalizeProductContext({
    productName: input.productName,
    ingredientsText: input.inputIngredients,
    userPreferences: input.dietaryPreference,
    source: hasPhoto ? "photo" : "manual",
    sourceBasis: [photos.frontImagePreviewDataUrl ? "front_label" : "", photos.backImagePreviewDataUrl ? "back_label" : ""].filter(Boolean),
    sourceMetadata: { barcode: input.barcode || "", flow: "manual_form" },
  });

  let scratchRecipe = buildDeterministicScratchRecipe({
    productName: contextToRecipeInput(productContext).productName,
    inputIngredients: contextToRecipeInput(productContext).ingredientsText,
    notes: input.dietaryPreference,
  });
  let fallbackUsed = true;

  try {
    try {
      const ai = await generateScratchRecipe({
        productName: input.productName,
        ingredients: input.inputIngredients,
        dietaryPreference: input.dietaryPreference,
        goals: input.dietaryPreference,
        upc: input.barcode || undefined,
        hasFrontImage: !!photos.frontImagePreviewDataUrl,
        hasBackImage: !!photos.backImagePreviewDataUrl,
        frontImage: photos.frontImagePreviewDataUrl || undefined,
        backImage: photos.backImagePreviewDataUrl || undefined,
      }, { timeoutMs });

      const aiRecipe = ai?.recipe?.homemadeAlternative;
      const product = ai?.recipe?.product || {};
      const aiContext = normalizeProductContext({
        ...product,
        productName: input.productName || product.name || product.productName,
        category: product.category || product.foodType || "",
        ingredientsText: input.inputIngredients || product.ingredientsText || "",
        source: hasPhoto ? "photo" : "ai",
        sourceBasis: product.sourceBasis || productContext.sourceBasis,
      });
      productContext = mergeProductContexts(productContext, aiContext);

      if (hasPhoto && !hasTypedContext && needsManualCorrection(productContext)) {
        return { status: "correction-needed", message: DEFAULT_CORRECTION_MESSAGE, productContext, inputSnapshot: { input, photos } };
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
      if (err?.timeout) throw err;
      if (hasPhoto && !hasTypedContext) {
        return { status: "correction-needed", message: DEFAULT_CORRECTION_MESSAGE, productContext, inputSnapshot: { input, photos } };
      }
    }

    const record = createSessionRecord({ input, scratchRecipe, fallbackUsed, productContext, photos });
    onSessionRecord?.(record);
    onClearDraftBarcode?.();
    onRefreshBarcode?.();
    sessionStorage.setItem("scratchnscan:lastGenerated", JSON.stringify({ ...record, fallbackUsed }));
    await recordSuccessfulGeneration?.();
    await refreshUsageStrips?.();
    onNavigateResult?.();
    return { status: "success", recipe: scratchRecipe, productContext, sessionRecord: record, source: fallbackUsed ? "fallback" : "ai", warnings: [] };
  } catch (err) {
    if (err?.timeout) {
      return { status: "error", message: DEFAULT_TIMEOUT_MESSAGE, errorCode: "timeout", inputSnapshot: { input, photos } };
    }
    return { status: "error", message: "We could not generate the recipe yet. Try typing the product name again.", errorCode: "generation-failed", inputSnapshot: { input, photos } };
  } finally {
    onProgressStop?.();
  }
}
