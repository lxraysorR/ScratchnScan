function nowIso() { return new Date().toISOString(); }
function cleanText(v) { return String(v || "").trim(); }

function buildProductContext(input = {}) {
  const productName = cleanText(input.productName || input.name);
  const brand = cleanText(input.brand);
  const flavor = cleanText(input.flavor);
  const category = cleanText(input.category);
  const packageText = cleanText(input.packageText);
  const ingredientsText = cleanText(input.ingredientsText || input.inputIngredients);
  const detectedIngredients = Array.isArray(input.detectedIngredients) ? input.detectedIngredients.map((x) => cleanText(x)).filter(Boolean) : [];
  const nutritionFacts = input.nutritionFacts || null;
  const claims = Array.isArray(input.claims) ? input.claims.map((x) => cleanText(x)).filter(Boolean) : [];
  const confidence = typeof input.confidence === "number" ? input.confidence : null;
  const source = cleanText(input.source || "manual");
  return { productName, brand, flavor, category, packageText, ingredientsText, detectedIngredients, nutritionFacts, claims, confidence, source };
}

function baseRecipe(originalProductName) {
  return {
    title: `Healthier Homemade Version of ${originalProductName}`,
    originalProductName,
    summary: `A homemade alternative inspired by ${originalProductName} using simpler pantry ingredients.`,
    healthGoal: "Use simpler, less processed ingredients while keeping familiar flavor.",
    whyHealthier: [
      "Uses recognizable ingredients instead of long additive lists.",
      "Lets you control sweetness, salt, and fat.",
      "Keeps ingredient choices simple and easy to understand.",
    ],
    ingredients: [
      "1 to 2 cups of the main whole food this product is based on (such as oats, potatoes, flour, or fruit)",
      "1 tablespoon olive oil, butter, or a neutral oil",
      "Salt, pepper, and simple spices to taste",
      "Optional: a little honey, lemon, or vinegar to balance flavor",
    ],
    steps: [
      "Prep ingredients and preheat the oven or stovetop as needed.",
      "Combine ingredients until evenly mixed.",
      "Cook or bake until done, then cool slightly and serve.",
    ],
    tips: ["Start with less salt and sweetness, then adjust to taste.", "Store leftovers in an airtight container."],
    tags: ["homemade", "less processed", "simple ingredients"],
    createdAt: nowIso(),
  };
}

const RECIPES = [
  { test: /(mayo|mayonnaise|aioli)/i, build: (p) => ({ ...baseRecipe(p), title: "Healthier Homemade Mayonnaise", summary: "Creamy mayo-style spread from simple ingredients.", healthGoal: "Skip stabilizers and adjust salt and fat to taste.", whyHealthier: ["No artificial preservatives.", "Simple ingredients.", "You control sodium."], ingredients: ["1 egg yolk (or 3 tbsp aquafaba)", "1 tsp Dijon mustard", "1 tsp lemon juice", "3/4 cup neutral oil", "1/4 tsp salt"], steps: ["Whisk yolk (or aquafaba), mustard, and lemon.", "Slowly drizzle in oil while whisking until thick.", "Season and chill."], tips: ["Use aquafaba for an egg-free option."] }) },
  { test: /(oreo|sandwich cookie)/i, build: (p) => ({ ...baseRecipe(p), title: "Healthier Homemade Chocolate Sandwich Cookies", summary: "Cocoa sandwich cookies with a lightly sweet filling made from everyday ingredients.", healthGoal: "Reduce highly processed oils and added sweeteners while keeping the cookie-and-cream style.", whyHealthier: ["Uses pantry staples instead of emulsifiers and artificial flavoring.", "Sweetness is user-controlled.", "No artificial colors."], ingredients: ["1 1/4 cups whole wheat pastry flour", "1/4 cup cocoa powder", "1/3 cup cane sugar or coconut sugar", "1/4 tsp baking soda", "1/4 tsp salt", "5 tbsp butter or coconut oil", "3 tbsp milk", "1/2 cup Greek yogurt + 1 tbsp honey for filling"], steps: ["Heat oven to 350°F and line a tray.", "Mix dry ingredients, then cut in butter/oil and milk to form dough.", "Roll thin, cut rounds, and bake 8–10 minutes.", "Cool cookies, mix filling, and sandwich pairs together."], tips: ["Chill dough 10 minutes for cleaner cookie cuts.", "Use dark cocoa for deeper flavor."] }) },
  { test: /(doritos|chips|cool ranch|cheetos|pringles)/i, build: (p) => ({ ...baseRecipe(p), title: "Baked Cool Ranch Tortilla Chips", summary: "Crunchy baked tortilla chips with a tangy ranch-style seasoning blend.", healthGoal: "Use baked preparation with simple seasonings and lower sodium control.", whyHealthier: ["Baked instead of fried.", "Seasoning uses common spices instead of flavor additives.", "Salt level is adjustable."], ingredients: ["8 corn tortillas", "1 tbsp olive oil", "1 tsp dried dill", "1 tsp onion powder", "1/2 tsp garlic powder", "1/2 tsp paprika", "1/2 tsp fine salt", "1 tbsp nutritional yeast (optional)"], steps: ["Heat oven to 375°F and cut tortillas into triangles.", "Toss with oil and spice blend.", "Arrange in one layer and bake 12–15 minutes until crisp.", "Cool before serving for best crunch."], tips: ["Rotate tray halfway for even browning.", "Add lime zest for brighter ranch flavor."] }) },
  { test: /(mac and cheese|macaroni|kraft|velveeta)/i, build: (p) => ({ ...baseRecipe(p), title: "Lighter Real-Cheese Mac and Cheese", summary: "Creamy macaroni and cheese made with real cheddar and a lighter stovetop sauce.", healthGoal: "Reduce sodium and additives by using a real-cheese sauce you control.", whyHealthier: ["Real cheese replaces powdered sauce packets.", "Lower sodium is easier to manage at home.", "No artificial colors needed."], ingredients: ["8 oz elbow macaroni", "1 tbsp butter", "1 tbsp flour", "1 1/4 cups milk", "1 cup shredded sharp cheddar", "1/4 cup plain Greek yogurt", "1/2 tsp mustard powder", "Salt and pepper to taste"], steps: ["Cook pasta to al dente and drain.", "Make roux with butter/flour, whisk in milk until thick.", "Stir in cheese, yogurt, and seasoning off heat.", "Fold in pasta and serve warm."], tips: ["Reserve pasta water to loosen sauce if needed.", "Add steamed broccoli for extra fiber."] }) },

  { test: /(pop-tart|poptart|toaster pastry|strudel)/i, build: (p) => ({ ...baseRecipe(p), title: "Homemade Fruit Breakfast Pastries", summary: "Whole-grain pastry pockets with fruit filling and moderate sweetness.", healthGoal: "Use whole-grain flour and fruit-forward filling with less added sugar.", whyHealthier: ["Fruit filling is naturally sweetened.", "Whole-grain flour adds more texture and satiety.", "No artificial dyes or flavors."], ingredients: ["1 1/4 cups whole wheat flour", "1/4 tsp salt", "6 tbsp cold butter", "3–4 tbsp cold water", "1/2 cup fruit preserves", "1/4 cup powdered sugar (optional glaze)", "1 tsp milk (for glaze)"], steps: ["Heat oven to 375°F and make dough with flour, salt, butter, and water.", "Roll dough, cut rectangles, add filling, and seal edges.", "Bake 18–22 minutes until lightly golden.", "Cool and drizzle optional light glaze."], tips: ["Chill shaped pastries 10 minutes before baking.", "Use low-sugar jam for less sweetness."] }) },
  { test: /(cheerios|cereal|granola|frosted flakes)/i, build: (p) => ({ ...baseRecipe(p), title: "Lower-Sugar Honey Oat Cereal Bites", summary: "Crunchy oat clusters with light honey sweetness and warm spice.", healthGoal: "Lower added sugar and increase whole grains with a baked cereal-style bite.", whyHealthier: ["Lower added sugar than many boxed cereals.", "Whole oats and nuts provide less processed texture.", "No artificial colors/flavors."], ingredients: ["2 cups rolled oats", "1/2 cup chopped nuts or seeds", "2 tbsp honey", "1 tbsp olive or coconut oil", "1 tsp cinnamon", "1/4 tsp salt", "1 egg white"], steps: ["Heat oven to 325°F and line a tray.", "Mix all ingredients until oats are coated.", "Press small clusters on tray and bake 16–20 minutes.", "Cool fully so bites crisp up."], tips: ["Let cool completely before storing.", "Add freeze-dried fruit after baking for flavor."] }) },
];

function chipsRecipeFromContext(ctx) {
  const flavor = ctx.flavor || (/pink salt/i.test(`${ctx.productName} ${ctx.ingredientsText}`) ? "pink salt" : "sea salt");
  const oils = ctx.detectedIngredients.find((x) => /oil/i.test(x)) || "1-2 tbsp avocado or olive oil";
  const claimsLine = ctx.claims.length ? `Keeps ${ctx.claims.join(", ")} goals in mind with simple ingredients.` : "Uses simple ingredients with no unnecessary extras.";
  return {
    title: `Baked or Air-Fried ${flavor.replace(/^./, (m) => m.toUpperCase())} Crinkle-Cut Potato Chips`,
    originalProductName: ctx.productName,
    summary: `A homemade ${ctx.category || "potato chip"} version inspired by ${ctx.productName}, focused on potatoes, oil control, and ${flavor} seasoning.`,
    healthGoal: "Keep the same crunchy chip style while controlling oil and salt.",
    whyHealthier: ["Uses real potato slices with simple seasoning.", "Lets you control oil amount and salt level.", claimsLine],
    ingredients: ["2 large russet or Yukon Gold potatoes", oils, `1 tsp ${flavor}`, "Optional: black pepper, garlic powder, or paprika"],
    steps: [
      "Wash potatoes and slice very thin (crinkle slicer if available).",
      "Soak slices in cold water for 20-30 minutes to remove excess starch.",
      "Drain and dry slices very well with a clean towel.",
      "Toss with oil and pink salt seasoning.",
      "Bake at 400°F for 15-25 minutes, flipping once, or air-fry at 350°F for 12-18 minutes until crisp.",
      "Cool 5 minutes so chips crisp fully before serving.",
    ],
    tips: ["Do not overcrowd the tray or basket.", "Watch the final minutes closely to prevent burning."],
    tags: ["chips", "potato", "air-fry", "baked"],
    createdAt: nowIso(),
  };
}

export function generateHealthierScratchRecipe(input = {}) {
  const ctx = buildProductContext(input);
  const normalizedName = ctx.productName;
  if (!normalizedName) throw new Error("Type a packaged food name first.");

  const combined = `${normalizedName} ${ctx.category} ${ctx.flavor} ${ctx.ingredientsText} ${ctx.detectedIngredients.join(" ")}`;
  if (/potato\s*chips?|kettle|krinkle|crinkle|pink salt/i.test(combined)) {
    return chipsRecipeFromContext({ ...ctx, category: ctx.category || "potato chips" });
  }

  const match = RECIPES.find((r) => r.test.test(normalizedName));
  const recipe = match ? match.build(normalizedName) : baseRecipe(normalizedName);
  if (ctx.ingredientsText) recipe.tips = [...recipe.tips, `Ingredient note used: ${ctx.ingredientsText.slice(0, 120)}`];
  const notes = cleanText(input.notes);
  if (notes) recipe.tips = [...recipe.tips, `Preference note: ${notes.slice(0, 120)}`];
  if (/vegan/i.test(notes)) recipe.tips = [...recipe.tips, "Use aquafaba or plant-based alternatives where needed."];
  return recipe;
}
