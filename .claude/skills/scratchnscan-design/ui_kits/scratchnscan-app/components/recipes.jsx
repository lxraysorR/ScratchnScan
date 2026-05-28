// recipes.js — a tiny deterministic recipe library, modeled on the live app's
// fallback generator. Each entry matches the AI JSON contract (lite version).

const RECIPES = {
  "Pink salt potato chips": {
    name: "Crispy Pink Salt Potato Chips",
    original: "Pink salt potato chips",
    summary: "A homemade version inspired by kettle-style pink salt chips — real potatoes, a thin layer of oil, and a single pinch of pink salt. No artificial flavors, no anti-caking agents.",
    badges: [["Homemade version","good"], ["Photo detected","soft"], ["Bake or air fry","gold"]],
    quickFacts: [["Time","35–50 min"],["Method","Air fry / bake"],["Base","Potatoes"]],
    why: [
      "Real potatoes — no dehydrated potato flour or stabilizers.",
      "No artificial flavors, no anti-caking agents, no industrial seed-oil sprays.",
      "Single-ingredient salt: just pink salt, no flavor enhancers.",
      "You control the oil — a light brush instead of a deep coat.",
    ],
    ingredients: [
      "2 large russet or Yukon gold potatoes",
      "1 to 2 tablespoons avocado, olive, or sunflower oil",
      "1/2 teaspoon pink Himalayan salt, plus more to taste",
      "Optional: a pinch of smoked paprika or fresh-cracked black pepper",
      "Cold water for soaking slices",
    ],
    steps: [
      "Wash potatoes well and slice very thin with a mandoline or sharp knife (1–2mm).",
      "Soak slices in cold water for 20 to 30 minutes to remove surface starch.",
      "Drain thoroughly and pat slices completely dry with a clean towel.",
      "Toss with oil and pink salt until lightly and evenly coated.",
      "Bake at 400°F for 15 to 25 minutes, or air-fry at 350°F for 10 to 16 minutes.",
      "Cool for several minutes on a wire rack so the chips crisp fully before serving.",
    ],
    tips: [
      "For extra crunch, finish the chips under the broiler for 30–60 seconds.",
      "Store in an airtight container at room temperature for up to 2 days.",
      "Skip the oil entirely and bake on parchment for a near-zero-fat version.",
    ],
  },

  "default": {
    name: "Clean Homemade Version",
    original: "Packaged food",
    summary: "A homemade version built from real pantry ingredients — no preservatives, artificial colors, or industrial by-products. You control the oil, the salt, and the seasoning.",
    badges: [["Homemade version","good"], ["Photo detected","soft"], ["Clean ingredients","gold"]],
    quickFacts: [["Time","30–40 min"],["Additives","None"],["Ingredients","6 real items"]],
    why: [
      "No preservatives, stabilizers, or artificial colors.",
      "No high-fructose corn syrup, partially-hydrogenated oils, or industrial by-products.",
      "Whole-food base — you can name every ingredient.",
      "Salt and seasoning level is yours to decide.",
    ],
    ingredients: [
      "2 cups of your whole-food base (potatoes, oats, flour, or chickpeas)",
      "1–2 tbsp cold-pressed olive, avocado, or sunflower oil",
      "1/2 tsp fine sea salt, plus more to taste",
      "1 clove garlic, fresh, finely minced (optional)",
      "1 tsp dried herb of choice — rosemary, oregano, or thyme",
      "1 tbsp fresh citrus or vinegar for brightness",
    ],
    steps: [
      "Prep your whole-food base — wash, slice, mix, or shape as the dish needs.",
      "Toss lightly with oil, salt, garlic, and herbs until evenly coated.",
      "Bake at 400°F (200°C) for 20–25 minutes, turning once at the midpoint.",
      "Finish with a squeeze of citrus or splash of vinegar right before serving.",
      "Cool a few minutes so the texture sets.",
    ],
    tips: [
      "Store leftovers in an airtight glass container for up to 3 days.",
      "Want extra crispness? Finish under the broiler for 60 seconds, watching closely.",
      "Skip the oil entirely and steam-bake on parchment for an even lighter version.",
    ],
  },

  "Oreos": {
    name: "Homemade Chocolate Sandwich Cookies",
    original: "Oreos · packaged chocolate sandwich cookies",
    summary: "A small-batch homemade version of a classic chocolate sandwich cookie with a simple vanilla filling.",
    badges: [["Homemade version","good"], ["From package details","soft"], ["Bake","gold"]],
    quickFacts: [["Time","45 min"],["Method","Bake"],["Base","Flour"]],
    why: [
      "Real butter and vanilla instead of shortening and artificial flavors.",
      "No high-fructose corn syrup or palm-oil filling.",
    ],
    ingredients: [
      "1 cup all-purpose flour",
      "1/2 cup unsweetened cocoa powder",
      "3/4 tsp baking soda",
      "1/4 tsp salt",
      "1/2 cup unsalted butter, softened",
      "3/4 cup sugar",
      "1 large egg",
      "1 tsp vanilla extract",
      "Filling: 1/2 cup butter + 1.5 cups powdered sugar + 1 tsp vanilla",
    ],
    steps: [
      "Whisk dry ingredients in one bowl.",
      "Cream butter and sugar, then beat in egg and vanilla.",
      "Combine wet and dry; chill the dough 20 minutes.",
      "Scoop, flatten slightly, and bake at 350°F for 10–12 min.",
      "Cool completely, then sandwich with vanilla filling.",
    ],
    tips: [
      "For a cleaner filling, swap powdered sugar for maple syrup + butter.",
      "Skip the chill if you want chewier cookies.",
    ],
  },

  "Doritos Cool Ranch": {
    name: "Homemade Ranch-Style Tortilla Chips",
    original: "Doritos Cool Ranch · seasoned tortilla chips",
    summary: "Crisp baked tortilla chips with a homemade ranch seasoning — no artificial flavors or seed-oil sprays.",
    badges: [["Homemade version","good"], ["From package details","soft"], ["Bake or air fry","gold"]],
    quickFacts: [["Time","20 min"],["Method","Bake or air fry"],["Base","Tortillas"]],
    why: [
      "No artificial flavors or anti-caking agents.",
      "You control the oil — a light brush instead of a coating.",
    ],
    ingredients: [
      "8 small corn tortillas, cut into wedges",
      "1 tbsp avocado or olive oil",
      "1 tsp dried dill",
      "1 tsp onion powder",
      "1 tsp garlic powder",
      "1/2 tsp salt",
      "1/4 tsp dried parsley",
      "1/4 tsp ground black pepper",
    ],
    steps: [
      "Brush tortilla wedges lightly with oil on both sides.",
      "Mix all seasonings together in a small bowl.",
      "Bake at 375°F for 8–12 minutes until crisp, flipping halfway.",
      "Toss hot chips with the seasoning blend right out of the oven.",
    ],
    tips: [
      "Air fryer? 350°F for 6–8 minutes works equally well.",
      "Use sour-cream powder for an even closer ranch flavor.",
    ],
  },
};

function recipeFor(name) {
  return RECIPES[name] || RECIPES["default"];
}

window.RECIPES = RECIPES;
window.recipeFor = recipeFor;
