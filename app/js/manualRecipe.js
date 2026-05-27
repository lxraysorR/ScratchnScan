import { generateHealthierScratchRecipe } from './recipeGenerator.js';

export function buildDeterministicScratchRecipe(input = {}) {
  const safeName = (input.productName || '').trim() || 'packaged food';
  return generateHealthierScratchRecipe({
    ...input,
    productName: safeName,
    inputIngredients: input.inputIngredients,
    ingredientsText: input.ingredientsText || input.inputIngredients || '',
    notes: input.notes || input.dietaryPreference || '',
  });
}
