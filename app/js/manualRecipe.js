function inferTitleFromText(text) {
  if (!text) return "";
  const first = text.split(/[\n,.]/).map((v) => v.trim()).find(Boolean);
  return first ? first.slice(0, 60) : "";
}

function inferIngredients(text) {
  const cleaned = (text || "").replace(/ingredients:?/i, "");
  const parts = cleaned.split(/[\n,;]/).map((v) => v.trim()).filter(Boolean);
  return parts.slice(0, 8);
}

const PRODUCT_TEMPLATES = [
  {
    match: /\b(mayo|mayonnaise|aioli)\b/i,
    label: "mayonnaise",
    ingredients: [
      "1 egg yolk (or 3 tbsp aquafaba for vegan)",
      "1 tsp Dijon mustard",
      "1 tsp vinegar or lemon juice",
      "3/4 cup neutral oil (avocado or sunflower)",
      "1/4 tsp salt",
      "Optional: 1 small garlic clove or pinch of paprika",
    ],
    steps: [
      "Whisk the egg yolk (or aquafaba), mustard, vinegar, and salt in a bowl until smooth.",
      "Add the oil one slow drizzle at a time, whisking constantly until thick and creamy.",
      "Taste and adjust salt, acidity, or seasonings. Chill before serving; use within a week.",
    ],
  },
  {
    match: /\b(ranch|dressing|vinaigrette)\b/i,
    label: "dressing",
    ingredients: [
      "1/2 cup plain yogurt or sour cream (or cashew cream for dairy-free)",
      "2 tbsp olive oil",
      "1 tbsp lemon juice or vinegar",
      "1 small garlic clove, grated",
      "1 tbsp fresh herbs (dill, chives, parsley)",
      "Salt and pepper to taste",
    ],
    steps: [
      "Whisk yogurt, oil, and acid together until smooth.",
      "Stir in garlic, herbs, salt, and pepper.",
      "Thin with a splash of water or milk to desired consistency. Refrigerate.",
    ],
  },
  {
    match: /\b(ketchup|tomato sauce)\b/i,
    label: "ketchup",
    ingredients: [
      "1 (15 oz) can tomato sauce or 2 cups crushed tomatoes",
      "2 tbsp apple cider vinegar",
      "2 tbsp honey or maple syrup",
      "1/2 tsp onion powder",
      "1/4 tsp garlic powder",
      "Pinch of salt and ground cloves",
    ],
    steps: [
      "Combine all ingredients in a saucepan.",
      "Simmer over low heat for 20-30 minutes, stirring often, until thickened.",
      "Cool, blend smooth if needed, and refrigerate in a clean jar.",
    ],
  },
  {
    match: /\b(granola|cereal)\b/i,
    label: "granola",
    ingredients: [
      "3 cups rolled oats",
      "1 cup nuts or seeds (almonds, pecans, sunflower)",
      "1/3 cup maple syrup or honey",
      "1/4 cup neutral oil or melted coconut oil",
      "1 tsp vanilla extract",
      "1/2 tsp cinnamon and a pinch of salt",
    ],
    steps: [
      "Heat oven to 300F (150C). Mix oats, nuts, cinnamon, and salt in a bowl.",
      "Whisk syrup, oil, and vanilla, then stir into the oats until evenly coated.",
      "Spread on a lined sheet pan and bake 25-30 min, stirring once, until golden. Cool before storing.",
    ],
  },
  {
    match: /\b(bread|loaf|sandwich bread)\b/i,
    label: "sandwich bread",
    ingredients: [
      "3 cups bread flour (or 1:1 gluten-free blend)",
      "1 tsp salt",
      "1 tbsp sugar or honey",
      "2 1/4 tsp instant yeast",
      "1 cup warm water",
      "2 tbsp neutral oil or softened butter",
    ],
    steps: [
      "Mix dry ingredients, then add water and oil. Knead 8-10 minutes until smooth.",
      "Cover and let rise until doubled, about 1 hour. Shape into a loaf in a greased pan.",
      "Rise again 30-40 min, then bake at 375F (190C) for 30-35 min until golden.",
    ],
  },
  {
    match: /\b(mac.*cheese|macaroni|cheese pasta)\b/i,
    label: "mac and cheese",
    ingredients: [
      "8 oz dried pasta",
      "2 tbsp butter (or olive oil)",
      "2 tbsp flour (or 1 tbsp cornstarch)",
      "1 1/2 cups milk (any kind)",
      "1 1/2 cups shredded cheese (cheddar or blend)",
      "1/2 tsp mustard powder, salt, and pepper",
    ],
    steps: [
      "Cook pasta in salted water until al dente, then drain.",
      "Melt butter, whisk in flour, then slowly add milk until thickened.",
      "Off heat, stir in cheese, mustard, salt, and pepper. Fold in pasta and serve.",
    ],
  },
  {
    match: /\b(yogurt|yoghurt)\b/i,
    label: "yogurt",
    ingredients: [
      "4 cups whole milk (or oat milk + 1 tbsp starch)",
      "2 tbsp plain yogurt with live cultures (starter)",
    ],
    steps: [
      "Heat milk to 180F (82C), then cool to 110F (43C).",
      "Whisk in the starter yogurt.",
      "Hold at ~110F in a warm oven or insulated container for 6-10 hours until set. Chill before serving.",
    ],
  },
];

const CATEGORY_TEMPLATES = {
  condiment: {
    label: "condiment",
    ingredients: [
      "Base (yogurt, mayo, tomato, mustard, or oil)",
      "Acid (vinegar or lemon juice)",
      "Aromatic (garlic, shallot, or onion)",
      "Sweetener (small amount, optional)",
      "Salt and spices to taste",
    ],
    steps: [
      "Combine the base and acid in a bowl.",
      "Stir in aromatics, sweetener, salt, and spices.",
      "Rest for 10 minutes to let flavors blend, then taste and adjust.",
    ],
  },
  dressing: {
    label: "dressing",
    ingredients: [
      "3 parts oil",
      "1 part vinegar or lemon juice",
      "1 tsp mustard or honey (emulsifier)",
      "Salt and pepper",
      "Optional herbs or garlic",
    ],
    steps: [
      "Whisk acid, mustard, salt, and pepper together.",
      "Slowly drizzle in oil while whisking until emulsified.",
      "Stir in herbs or garlic. Use immediately or refrigerate up to a week.",
    ],
  },
  snack: {
    label: "snack",
    ingredients: [
      "Whole-grain base (popcorn, oats, nuts)",
      "Light oil or butter",
      "Salt or spices (paprika, cinnamon, garlic)",
      "Optional: small amount of cheese or maple syrup",
    ],
    steps: [
      "Toss base with oil and your seasoning mix.",
      "Toast in a pan or oven until crisp and aromatic.",
      "Cool fully before storing in an airtight container.",
    ],
  },
  bakery: {
    label: "bakery item",
    ingredients: [
      "Flour (or gluten-free blend)",
      "Leavening (yeast or baking powder)",
      "Salt",
      "Liquid (water, milk, or plant milk)",
      "Fat (butter or oil)",
      "Optional sweetener",
    ],
    steps: [
      "Combine dry ingredients in a bowl.",
      "Add liquid and fat, then mix or knead until a dough forms.",
      "Let rest/rise as needed, then bake until golden and cooked through.",
    ],
  },
  cereal: {
    label: "cereal",
    ingredients: [
      "Rolled oats or puffed grains",
      "Nuts or seeds",
      "A little maple syrup or honey",
      "Neutral oil or coconut oil",
      "Cinnamon, vanilla, and a pinch of salt",
    ],
    steps: [
      "Mix dry ingredients in a bowl.",
      "Stir in sweetener and oil until coated.",
      "Bake at 300F (150C) for 25-30 min, stirring once, until golden. Cool before storing.",
    ],
  },
  dairy: {
    label: "dairy item",
    ingredients: [
      "Milk (dairy or plant-based)",
      "Acid or starter culture (lemon, vinegar, or yogurt)",
      "Salt or sweetener to taste",
    ],
    steps: [
      "Gently warm the milk.",
      "Add acid or starter and let it set or curdle as the recipe requires.",
      "Strain, season, and chill before serving.",
    ],
  },
  "frozen-meal": {
    label: "frozen meal replacement",
    ingredients: [
      "Cooked grain or pasta",
      "Protein (beans, tofu, chicken, or eggs)",
      "Vegetables (fresh or frozen)",
      "Simple sauce (broth, tomato, or yogurt-based)",
      "Salt, pepper, and herbs",
    ],
    steps: [
      "Cook the grain or pasta and set aside.",
      "Saute the protein and vegetables in a little oil.",
      "Combine with sauce, season, and warm through. Portion and refrigerate or freeze.",
    ],
  },
  beverage: {
    label: "beverage",
    ingredients: [
      "Filtered water or unsweetened tea",
      "Fresh fruit or fruit juice",
      "Optional sweetener (honey, maple, or fruit)",
      "Optional herb or citrus zest",
    ],
    steps: [
      "Combine fruit, sweetener, and aromatics in a pitcher.",
      "Top with water or tea and stir well.",
      "Chill and serve over ice.",
    ],
  },
  soup: {
    label: "soup",
    ingredients: [
      "1 tbsp oil or butter",
      "1 onion, diced; 2 garlic cloves",
      "Vegetables of choice (carrot, celery, greens)",
      "4 cups stock or water",
      "Protein or beans (optional)",
      "Salt, pepper, herbs",
    ],
    steps: [
      "Saute onion and garlic in oil until soft.",
      "Add remaining vegetables, stock, and any protein. Simmer 20-30 minutes.",
      "Season to taste and finish with fresh herbs or a squeeze of lemon.",
    ],
  },
  pasta: {
    label: "pasta dish",
    ingredients: [
      "8 oz dried pasta",
      "2 tbsp olive oil or butter",
      "2 garlic cloves, minced",
      "1 cup simple sauce (tomato, cream, or pesto)",
      "Salt, pepper, herbs, optional cheese",
    ],
    steps: [
      "Cook pasta in salted water until al dente; reserve 1/2 cup pasta water.",
      "Warm oil and garlic, add sauce, then toss in the pasta with a splash of pasta water.",
      "Season, add cheese or herbs, and serve immediately.",
    ],
  },
  dessert: {
    label: "dessert",
    ingredients: [
      "Fruit or chocolate base",
      "Sweetener (honey, maple, or sugar)",
      "Fat (butter, coconut oil, or cream)",
      "Flour, oats, or nuts for texture",
      "Vanilla, cinnamon, or salt to balance",
    ],
    steps: [
      "Combine the base with sweetener and fat.",
      "Mix in dry ingredients until just combined.",
      "Bake, chill, or assemble as the format requires, then taste and adjust sweetness.",
    ],
  },
};

const DIETARY_TIPS = {
  vegetarian: "Skip meat-based ingredients; use beans, eggs, or dairy for protein.",
  vegan: "Swap dairy and eggs for plant milks, aquafaba, or silken tofu.",
  "gluten-free": "Use a 1:1 gluten-free flour blend or naturally gluten-free grains.",
  "dairy-free": "Use plant milk and oils in place of milk, butter, or cheese.",
  "low-sugar": "Reduce sweetener to taste; rely on fruit, vanilla, or spices for flavor.",
};

function findTemplate({ productName, category }) {
  const name = (productName || "").trim();
  if (name) {
    for (const t of PRODUCT_TEMPLATES) {
      if (t.match.test(name)) return t;
    }
  }
  if (category && CATEGORY_TEMPLATES[category]) {
    return CATEGORY_TEMPLATES[category];
  }
  return null;
}

export function buildDeterministicScratchRecipe({
  productName,
  inputIngredients,
  notes,
  brand,
  category,
  dietaryPreference,
} = {}) {
  const titleBase = (productName || "").trim() || inferTitleFromText(inputIngredients) || "packaged food";
  const template = findTemplate({ productName, category });
  const parsedIngredients = inferIngredients(inputIngredients);

  let ingredients;
  let steps;
  if (template) {
    ingredients = template.ingredients.slice();
    steps = template.steps.slice();
  } else if (parsedIngredients.length) {
    ingredients = parsedIngredients;
    steps = [
      "Combine your base ingredients in a bowl.",
      "Adjust seasoning and texture with small amounts of fat, acid, and salt.",
      "Cook, bake, or chill to match the style of the packaged version.",
    ];
  } else {
    ingredients = [
      "Main base ingredient (grain, dairy, or vegetable)",
      "Simple fat (oil or butter)",
      "Salt and spices",
      "Liquid (water, milk, or stock)",
      "Optional aromatic (garlic, onion, herbs)",
    ];
    steps = [
      "Combine dry/base ingredients in a bowl.",
      "Add liquid and fat, then mix until texture is even.",
      "Cook, bake, or chill based on the product style, then taste and adjust.",
    ];
  }

  const tips = [];
  if (dietaryPreference && DIETARY_TIPS[dietaryPreference]) {
    tips.push(DIETARY_TIPS[dietaryPreference]);
  }
  if (notes && notes.trim()) tips.push(`Personal note: ${notes.trim()}`);
  if (!tips.length) tips.push("Start with small seasoning adjustments and taste as you go.");

  const brandText = brand && brand.trim() ? ` (similar to ${brand.trim()})` : "";
  const labelText = template?.label || titleBase;

  return {
    title: `Simple homemade ${labelText}`,
    summary: `Starter homemade version of ${titleBase}${brandText} using common ingredients and fewer additives. This is a suggested starting point, not an exact copy.`,
    ingredients,
    steps,
    tips,
  };
}
