function inferTitleFromText(text) {
  if (!text) return "";
  const first = text.split(/[\n,.]/).map((v) => v.trim()).find(Boolean);
  return first ? first.slice(0, 60) : "";
}

function inferIngredients(text) {
  const cleaned = (text || "").replace(/ingredients:?/i, "");
  const parts = cleaned.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
  return parts.slice(0, 8);
}

export function buildDeterministicScratchRecipe({ productName, inputIngredients, notes }) {
  const titleBase = productName?.trim() || inferTitleFromText(inputIngredients) || "packaged food";
  const parsedIngredients = inferIngredients(inputIngredients);
  const recipeIngredients = parsedIngredients.length
    ? parsedIngredients
    : ["Main base ingredient", "Simple fat", "Salt", "Water or milk", "Optional seasoning"];

  return {
    title: `Simple homemade ${titleBase}`,
    summary: `A straightforward homemade version of ${titleBase} using common ingredients and fewer additives.`,
    ingredients: recipeIngredients,
    steps: [
      "Combine dry/base ingredients in a bowl.",
      "Add liquid and mix until texture is even.",
      "Cook, bake, or chill based on the product style, then taste and adjust seasoning."
    ],
    tips: notes?.trim() ? [`Personal note: ${notes.trim()}`] : ["Start with small seasoning adjustments and taste as you go."],
  };
}
