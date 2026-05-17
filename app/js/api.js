const WORKER_BASE = "https://scratchnscan.layr-sor.workers.dev";

async function postJson(path, payload, networkMessage) {
  let res;
  try {
    res = await fetch(`${WORKER_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(networkMessage);
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error("Server returned an unexpected response. Please try again.");
  }

  if (!res.ok) throw new Error(body?.error ?? `Server error (${res.status}). Please try again.`);
  return body;
}

export async function generateHomemadeAlternative(productInput) {
  try {
    const body = await postJson(
      "/api/generate-scratch-recipe",
      productInput,
      "Could not reach the AI service. Check your internet connection and try again."
    );
    if (!body?.recipe) throw new Error("AI service returned an incomplete recipe.");
    return { recipe: body.recipe, source: "ai" };
  } catch (err) {
    console.warn("AI generation failed, using temporary local fallback.", err);
    return { recipe: buildTemporaryFallback(productInput), source: "fallback" };
  }
}

function buildTemporaryFallback(input) {
  const name = input.productName || "Packaged product";
  const baseIngredients = (input.ingredients || "simple pantry ingredients").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 6);
  const fallbackIngredients = baseIngredients.length ? baseIngredients : ["whole grain flour", "olive oil", "salt", "water"];

  return {
    product: { name, foodType: input.category || "prepared food", confidence: "low", sourceBasis: ["user_text"] },
    plainEnglishExplanation: `${name} may include extra additives for shelf life. This homemade version uses simpler kitchen ingredients.`,
    ingredientSignals: [],
    homemadeAlternative: {
      title: `Simple Homemade ${name}`,
      positioning: "Small-batch home version",
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      difficulty: "easy",
      servings: "4 servings",
      ingredients: fallbackIngredients.map((item) => ({ item, amount: "to taste", notes: "" })),
      steps: [
        "Combine core ingredients in a mixing bowl until evenly blended.",
        "Cook using a method that matches the product type (bake, simmer, or pan-cook) until done.",
        "Cool slightly, taste, and adjust seasoning before serving.",
      ],
      simpleSwaps: [{ insteadOf: "refined sugar", use: "fruit puree", why: "Adds sweetness with less added sugar." }],
      whyLessProcessed: ["Made from recognizable pantry ingredients.", "No packaging stabilizers needed for same-day use."],
      tasteAndTextureExpectation: "Expect a fresher flavor with possible texture differences from factory-made versions.",
      storageTips: "Refrigerate in an airtight container and use within 3 days.",
    },
    safetyNotes: ["Confirm ingredients for allergens before cooking."],
    disclaimer: "This is general cooking and ingredient information, not medical advice. Check labels and consult a qualified professional for allergies, medical conditions, or dietary restrictions.",
  };
}
