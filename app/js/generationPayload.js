// Pure helper: shape the request body sent to the Worker's
// /api/generate-scratch-recipe endpoint. Kept free of DOM/network imports so
// it can be unit-tested directly and reused by the manual-entry submit flow.

export function buildGenerationPayload({
  productName = "",
  ingredients = "",
  dietaryPreference = "",
  barcode = null,
  hasFrontImage = false,
  hasBackImage = false,
} = {}) {
  return {
    productName: String(productName || "").trim(),
    ingredients: String(ingredients || "").trim(),
    dietaryPreference: String(dietaryPreference || "").trim(),
    // The Worker reads `goals`; mirror the user's dietary preference so the AI
    // honors it without a second field.
    goals: String(dietaryPreference || "").trim(),
    upc: barcode || undefined,
    hasFrontImage: !!hasFrontImage,
    hasBackImage: !!hasBackImage,
  };
}
