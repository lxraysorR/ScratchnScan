import { generateHealthierScratchRecipe } from './recipeGenerator.js';

export function buildDeterministicScratchRecipe({
  productName,
  inputIngredients,
  notes,
  dietaryPreference,
} = {}) {
  const safeName = (productName || "").trim() || "packaged food";
  return generateHealthierScratchRecipe({
    productName: safeName,
    inputIngredients,
    notes: notes || dietaryPreference || '',
  });
}
