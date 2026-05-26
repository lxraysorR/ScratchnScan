// Deterministic, offline "healthier homemade alternative" generator.
// No AI key, no network, no barcode required. Given a packaged-food name,
// it returns a cleaner homemade recipe. Specific packaged foods get tailored
// recipes; anything else gets a sensible healthier default.
//
// IMPORTANT: keep language practical, never medical. Do not claim the recipe
// cures, treats, prevents, or guarantees any health outcome.

function nowIso() {
  return new Date().toISOString();
}

function parseLabelIngredients(text) {
  const cleaned = (text || "").replace(/ingredients:?/i, "");
  return cleaned.split(/[\n,;]/).map((v) => v.trim()).filter(Boolean).slice(0, 6);
}

const DIETARY_TIPS = {
  vegetarian: "Keep it vegetarian by using beans, eggs, or dairy for protein.",
  vegan: "For a vegan version, swap dairy and eggs for plant milk, aquafaba, or silken tofu.",
  "gluten-free": "Use a 1:1 gluten-free flour blend or naturally gluten-free grains.",
  "dairy-free": "Use plant milk and oils in place of milk, butter, or cheese.",
  "low-sugar": "Cut the sweetener back and lean on vanilla, fruit, or spices for flavor.",
  "less sugar": "Cut the sweetener back and lean on vanilla, fruit, or spices for flavor.",
};

// Ordered matchers. The first whose pattern matches the product name wins.
// Doritos is checked before any generic "ranch" handling so "Cool Ranch"
// resolves to chips, not salad dressing.
const TEMPLATES = [
  {
    id: "sandwich-cookie",
    pattern: /\b(oreo|oreos|sandwich cookie|creme cookie|cream cookie)\b/i,
    build: () => ({
      title: "Homemade Chocolate Sandwich Cookies",
      healthGoal: "Less processed, with sweetness you control.",
      whyHealthier: [
        "No high-fructose corn syrup or artificial flavors — just pantry basics.",
        "You decide how much sugar goes into the cookie and the filling.",
        "Made with cocoa and real butter or coconut oil instead of a long additive list.",
      ],
      ingredients: [
        "1 cup flour (or oat flour for a whole-grain option)",
        "1/3 cup unsweetened cocoa powder",
        "1/3 cup butter or coconut oil, softened",
        "1/4 cup maple syrup or sugar (adjust to taste)",
        "1 tsp vanilla extract",
        "1/4 tsp baking soda and a pinch of salt",
        "Filling: 1/2 cup Greek yogurt or whipped cream cheese + 1 tbsp maple syrup",
      ],
      steps: [
        "Heat oven to 350F (175C) and line a baking sheet.",
        "Mix cocoa, flour, baking soda, and salt. Separately beat butter, sweetener, and vanilla.",
        "Combine into a dough, roll thin, and cut into rounds.",
        "Bake 8-10 minutes, then cool completely.",
        "Whisk the filling and sandwich it between two cooled cookies.",
      ],
      tips: [
        "Adjust sweetness in both the cookie and the filling.",
        "Use oat flour for a whole-grain version.",
        "Chill the filling so it pipes cleanly.",
      ],
      tags: ["homemade", "less processed", "lower sugar", "simple ingredients"],
    }),
  },
  {
    id: "tortilla-chips",
    pattern: /\b(dorito|doritos|cool ranch|tortilla chip|chips?|nacho)\b/i,
    build: () => ({
      title: "Baked Ranch-Seasoned Tortilla Chips",
      healthGoal: "Baked instead of fried, with sodium you control.",
      whyHealthier: [
        "Baked rather than deep-fried.",
        "You control the salt and skip artificial colors.",
        "Seasoned with real herbs and spices.",
      ],
      ingredients: [
        "8 corn tortillas",
        "Olive oil spray (or 1 tbsp olive oil)",
        "1 tsp garlic powder",
        "1 tsp onion powder",
        "1 tsp dried dill",
        "1/2 tsp paprika",
        "1/2 tsp salt (adjust to taste)",
        "Optional: 1 tbsp nutritional yeast or dried buttermilk for tang",
      ],
      steps: [
        "Heat oven to 375F (190C).",
        "Cut tortillas into wedges and arrange in a single layer on baking sheets.",
        "Lightly spray or brush with olive oil.",
        "Mix the seasonings and sprinkle evenly over the chips.",
        "Bake 10-12 minutes until crisp, watching the edges, then cool to crisp further.",
      ],
      tips: [
        "Keep chips in a single layer so they bake evenly.",
        "Lower the salt and add more herbs for flavor.",
        "Store in an airtight container once fully cool.",
      ],
      tags: ["homemade", "baked", "less processed", "lower sodium"],
    }),
  },
  {
    id: "mac-and-cheese",
    pattern: /\b(mac and cheese|mac n cheese|mac & cheese|macaroni|mac cheese)\b/i,
    build: () => ({
      title: "Lighter Stovetop Mac and Cheese",
      healthGoal: "Real cheese, with an optional veggie or protein boost.",
      whyHealthier: [
        "Uses real shredded cheese instead of a powdered cheese mix.",
        "Greek yogurt adds creaminess and a little protein.",
        "You can stir in a veggie puree for extra fiber.",
      ],
      ingredients: [
        "8 oz pasta (whole-grain optional)",
        "1 cup shredded real cheddar",
        "1/2 cup milk",
        "1/4 cup plain Greek yogurt",
        "1/2 tsp mustard powder",
        "1/4 tsp paprika",
        "Salt and pepper to taste",
        "Optional: 1/2 cup butternut squash or cauliflower puree",
      ],
      steps: [
        "Cook pasta in salted water until al dente, then drain.",
        "Return pasta to the warm pot over low heat and stir in the milk.",
        "Add cheese a handful at a time until melted and smooth.",
        "Stir in Greek yogurt, mustard powder, paprika, and any veggie puree.",
        "Season with salt and pepper and serve right away.",
      ],
      tips: [
        "Add the cheese off high heat so it stays smooth.",
        "Whole-grain pasta adds fiber.",
        "Stir in peas or broccoli to make it a one-pot meal.",
      ],
      tags: ["homemade", "real cheese", "simple ingredients"],
    }),
  },
  {
    id: "toaster-pastry",
    pattern: /\b(pop[\s-]?tarts?|toaster pastr(?:y|ies)|toaster strudel|breakfast pastr(?:y|ies))\b/i,
    build: () => ({
      title: "Baked Fruit Breakfast Pastries",
      healthGoal: "Real fruit filling with sweetness you control.",
      whyHealthier: [
        "Filled with real fruit jam instead of high-fructose syrup.",
        "You control the sugar in the filling and the glaze.",
        "A whole-wheat flour option adds whole grains.",
      ],
      ingredients: [
        "1 1/2 cups flour (or whole-wheat for whole grain)",
        "1/2 cup cold butter, cubed",
        "3-4 tbsp cold water",
        "1/3 cup fruit jam or mashed fruit",
        "1 egg (for egg wash)",
        "Pinch of cinnamon and salt",
        "Optional light glaze: 1/4 cup powdered sugar + 1 tsp milk",
      ],
      steps: [
        "Heat oven to 375F (190C) and line a baking sheet.",
        "Cut butter into the flour and salt, then add water until a dough forms.",
        "Roll out and cut into equal rectangles.",
        "Spoon jam onto half the rectangles, top with the rest, and seal edges with a fork.",
        "Brush with egg wash and bake 18-22 minutes until golden. Drizzle with light glaze if desired.",
      ],
      tips: [
        "Use a low-sugar or homemade jam to cut sweetness.",
        "Whole-wheat flour makes them heartier.",
        "Seal the edges well so the filling stays inside.",
      ],
      tags: ["homemade", "baked", "lower sugar", "less processed"],
    }),
  },
  {
    id: "cereal-granola",
    pattern: /\b(cheerio|cheerios|cereal|granola|oat cereal|toasted oats)\b/i,
    build: () => ({
      title: "Homemade Honey Oat Granola Bites",
      healthGoal: "Less added sugar with simple whole-grain oats.",
      whyHealthier: [
        "Whole-grain oats as the base.",
        "Sweetened lightly with honey or maple instead of refined sugar.",
        "No artificial flavors or added colors.",
      ],
      ingredients: [
        "2 cups rolled oats",
        "1/4 cup honey or maple syrup",
        "2 tbsp neutral or coconut oil",
        "1/2 tsp cinnamon",
        "1/2 tsp vanilla",
        "Pinch of salt",
        "Optional: 1/4 cup chopped nuts or seeds",
      ],
      steps: [
        "Heat oven to 325F (160C) and line a baking sheet.",
        "Stir oats, cinnamon, salt, and any nuts together.",
        "Warm honey, oil, and vanilla, then stir into the oats until coated.",
        "Press into small clusters on the baking sheet.",
        "Bake 15-18 minutes until golden, then cool fully to crisp.",
      ],
      tips: [
        "Cool completely before breaking into clusters.",
        "Reduce the honey for less sweetness.",
        "Add seeds for extra crunch.",
      ],
      tags: ["homemade", "lower sugar", "whole grain", "simple ingredients"],
    }),
  },
  {
    id: "mayonnaise",
    pattern: /\b(mayo|mayonnaise|aioli)\b/i,
    build: () => ({
      title: "Homemade Mayonnaise",
      healthGoal: "Fewer additives, with the oil, salt, and acidity you control.",
      whyHealthier: [
        "Uses simple pantry ingredients instead of stabilizers and preservatives.",
        "You choose the oil and control the salt and acidity.",
        "No artificial flavors or added colors.",
      ],
      ingredients: [
        "2 egg yolks, room temperature",
        "1 cup neutral oil (light olive, avocado, or sunflower)",
        "1 tbsp lemon juice or vinegar",
        "1 tsp Dijon mustard",
        "1/4 tsp salt (adjust to taste)",
      ],
      steps: [
        "Whisk the egg yolks, mustard, lemon juice, and salt until combined.",
        "Add the oil a few drops at a time at first, whisking constantly.",
        "Once it begins to thicken, pour the oil in a thin, steady stream while whisking.",
        "Taste and adjust salt and acidity, then store in a sealed jar in the fridge.",
      ],
      tips: [
        "Add the oil slowly so the mixture emulsifies and stays thick.",
        "For a vegan mayo, blend aquafaba (chickpea liquid) in place of the egg yolks.",
        "Use a fresh egg, keep it refrigerated, and use within a few days.",
      ],
      tags: ["homemade", "less processed", "simple ingredients"],
    }),
  },
];

function buildDefault(displayName) {
  return {
    title: `Healthier Homemade Version of ${displayName}`,
    healthGoal: "Fewer additives, with the salt, sugar, and fat you control.",
    whyHealthier: [
      "Uses recognizable, everyday ingredients.",
      "No artificial colors or flavors.",
      "You control the salt, sugar, and fat.",
    ],
    ingredients: [
      "Homemade base (whole grain, dairy, or vegetable)",
      "Simple fat (olive oil or butter)",
      "Flavor and seasoning (herbs, spices, garlic, citrus)",
      "Liquid (water, milk, or stock)",
      "Optional natural sweetener or real cheese",
    ],
    steps: [
      "Prepare the base ingredient: cook the grain, blend the base, or mix the dough.",
      "Build flavor with seasoning, aromatics, and a little fat.",
      "Cook, bake, or chill to match the style of the packaged version.",
      "Taste and adjust salt, sweetness, and texture.",
    ],
    tips: [
      "Start with less salt and sugar — you can always add more.",
      "Bake instead of fry where it makes sense.",
      "Swap in whole-grain or fresh ingredients where you can.",
    ],
    tags: ["homemade", "less processed", "simple ingredients"],
  };
}

function findTemplate(productName) {
  const name = (productName || "").trim();
  if (!name) return null;
  for (const t of TEMPLATES) {
    if (t.pattern.test(name)) return t;
  }
  return null;
}

/**
 * Generate a healthier homemade alternative recipe for a packaged food.
 * Works with productName alone. ingredients/notes/dietaryPreference are
 * optional and only refine the tips.
 */
export function generateHealthierScratchRecipe({
  productName,
  inputIngredients,
  notes,
  dietaryPreference,
} = {}) {
  const trimmedName = (productName || "").trim();
  const displayName = trimmedName || "this packaged food";

  const template = findTemplate(trimmedName);
  const base = template ? template.build() : buildDefault(displayName);

  const tips = base.tips.slice();
  const pref = (dietaryPreference || "").trim().toLowerCase();
  if (pref && DIETARY_TIPS[pref]) tips.push(DIETARY_TIPS[pref]);
  if (notes && String(notes).trim()) tips.push(`Personal note: ${String(notes).trim()}`);

  const labelItems = parseLabelIngredients(inputIngredients);
  if (labelItems.length) {
    tips.push(`Aim to simplify or swap the most processed items from the label, such as: ${labelItems.slice(0, 3).join(", ")}.`);
  }

  return {
    title: base.title,
    originalProductName: trimmedName,
    summary: `A simpler, less-processed homemade take on ${displayName}, using everyday ingredients you can adjust to taste. This is a starting point, not an exact copy.`,
    healthGoal: base.healthGoal,
    whyHealthier: base.whyHealthier.slice(),
    ingredients: base.ingredients.slice(),
    steps: base.steps.slice(),
    tips,
    tags: base.tags.slice(),
    createdAt: nowIso(),
  };
}
