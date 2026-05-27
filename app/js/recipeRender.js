// Shared renderer for the Scan-Scratch result/details theme.
// Builds: product hero, (optional) confidence card, homemade recipe card with
// accordion sections, and a "detected package details" panel.
// Pure DOM; no business logic. Reused by result.js and details.js.

const CATEGORY_ART = {
  condiment: "🥫", dressing: "🥗", snack: "🍟", bakery: "🍞", cereal: "🥣",
  dairy: "🥛", "frozen-meal": "🧊", beverage: "🥤", soup: "🍲", pasta: "🍝",
  dessert: "🍪", other: "🍽️",
};

const DIETARY_LABELS = {
  vegetarian: "Vegetarian", vegan: "Vegan", "gluten-free": "Gluten-free",
  "dairy-free": "Dairy-free", "low-sugar": "Low-sugar",
};

function elt(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function getRecipe(record) {
  const r = record.scratchRecipe || {};
  return {
    title: r.title || record.recipeTitle || "Homemade version",
    summary: r.summary || "",
    ingredients: (Array.isArray(record.recipeIngredients) && record.recipeIngredients.length)
      ? record.recipeIngredients
      : (r.ingredients || []),
    steps: (Array.isArray(record.recipeSteps) && record.recipeSteps.length)
      ? record.recipeSteps
      : (r.steps || []),
    tips: r.tips || [],
    whyCleaner: r.whyCleaner || "",
    quickFacts: r.quickFacts || null,
  };
}

function normalizeConfidence(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  const pct = num <= 1 ? num * 100 : num;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function makeAccordion(title, open, fillContent) {
  const section = elt("div", "section");
  const head = elt("button", "section-head");
  head.type = "button";
  head.setAttribute("aria-expanded", open ? "true" : "false");
  head.appendChild(elt("span", null, title));
  head.appendChild(elt("span", "chev", "▾"));
  const content = elt("div", "section-content");
  fillContent(content);
  head.addEventListener("click", () => {
    const expanded = head.getAttribute("aria-expanded") === "true";
    head.setAttribute("aria-expanded", expanded ? "false" : "true");
  });
  section.appendChild(head);
  section.appendChild(content);
  return section;
}

function renderHero(record, recipe) {
  const hero = elt("div", "hero-card");
  const row = elt("div", "detected-row");
  const art = elt("div", "product-art", CATEGORY_ART[record.category] || "🍽️");
  art.setAttribute("aria-hidden", "true");
  const copy = elt("div", "product-copy");

  // Manual entry is user-provided, so we label it honestly.
  const eyebrow = elt("span", "eyebrow");
  eyebrow.appendChild(elt("span", "dot"));
  eyebrow.appendChild(document.createTextNode(record.source === "manual" || !record.source ? "Product entered" : "Product detected"));
  copy.appendChild(eyebrow);

  copy.appendChild(elt("h2", null, record.productName || "Untitled product"));

  const metaBits = [];
  if (record.brand) metaBits.push(record.brand);
  if (record.category) metaBits.push(record.category);
  if (metaBits.length) copy.appendChild(elt("p", "product-meta", metaBits.join(" · ")));

  const chips = elt("div", "chip-row");
  if (record.dietaryPreference && DIETARY_LABELS[record.dietaryPreference]) {
    chips.appendChild(elt("span", "chip", DIETARY_LABELS[record.dietaryPreference]));
  }
  if (record.photoStatus) chips.appendChild(elt("span", "chip", `Photo: ${record.photoStatus}`));
  if (chips.childElementCount) copy.appendChild(chips);

  if (recipe.summary) copy.appendChild(elt("p", "detected-summary", recipe.summary));

  row.appendChild(art);
  row.appendChild(copy);
  hero.appendChild(row);
  return hero;
}

function renderConfidence(confidence) {
  const pct = normalizeConfidence(confidence);
  if (pct == null) return null; // never fabricate confidence
  const low = pct < 60;
  const card = elt("div", "confidence-card");
  const top = elt("div", "confidence-top");
  top.appendChild(elt("span", "eyebrow", "Detection confidence"));
  top.appendChild(elt("span", "confidence-value", `${pct}%`));
  card.appendChild(top);
  const meter = elt("div", `confidence-meter${low ? " low" : ""}`);
  const fill = elt("span");
  fill.style.width = `${pct}%`;
  meter.appendChild(fill);
  card.appendChild(meter);
  card.appendChild(elt("p", "hint", low
    ? "We could not confidently identify this product. Please edit the product name or ingredients before saving."
    : "We found enough package text to create a product-specific homemade version. Review before saving."));
  return card;
}

function renderRecipeCard(recipe) {
  const card = elt("div", "card");

  const header = elt("div", "card-header");
  const eyebrow = elt("span", "eyebrow green");
  eyebrow.appendChild(elt("span", "dot"));
  eyebrow.appendChild(document.createTextNode("Homemade version"));
  header.appendChild(eyebrow);
  card.appendChild(header);

  card.appendChild(elt("h3", "recipe-title", recipe.title));
  if (recipe.summary) card.appendChild(elt("p", "recipe-summary", recipe.summary));

  // Quick facts (only render facts that exist).
  if (recipe.quickFacts) {
    const facts = elt("div", "quick-facts");
    const order = [["time", "Time"], ["method", "Method"], ["base", "Base"]];
    for (const [key, label] of order) {
      const val = recipe.quickFacts[key];
      if (!val) continue;
      const fact = elt("div", "fact");
      fact.appendChild(elt("span", "fact-label", label));
      fact.appendChild(elt("span", "fact-value", val));
      facts.appendChild(fact);
    }
    if (facts.childElementCount) card.appendChild(facts);
  }

  // Ingredients (open). Defensive empty state, no placeholder names.
  card.appendChild(makeAccordion("Ingredients", true, (content) => {
    if (recipe.ingredients.length) {
      const ul = elt("ul");
      recipe.ingredients.forEach((i) => ul.appendChild(elt("li", null, typeof i === "string" ? i : (i.item || String(i)))));
      content.appendChild(ul);
    } else {
      content.appendChild(elt("p", "empty-note", "Add ingredients to improve this recipe."));
    }
  }));

  // Steps (open). Defensive empty state.
  card.appendChild(makeAccordion("Steps", true, (content) => {
    if (recipe.steps.length) {
      const ol = elt("ol");
      recipe.steps.forEach((s) => ol.appendChild(elt("li", null, s)));
      content.appendChild(ol);
    } else {
      content.appendChild(elt("p", "empty-note", "Recipe steps could not be generated. Please edit the product details and try again."));
    }
  }));

  // Why this is a cleaner version (collapsed) — only if we have copy.
  if (recipe.whyCleaner) {
    card.appendChild(makeAccordion("Why this is a cleaner version", false, (content) => {
      content.appendChild(elt("p", null, recipe.whyCleaner));
    }));
  }

  // Tips (collapsed) — only if present.
  if (recipe.tips.length) {
    card.appendChild(makeAccordion("Tips", false, (content) => {
      const ul = elt("ul");
      recipe.tips.forEach((t) => ul.appendChild(elt("li", null, t)));
      content.appendChild(ul);
    }));
  }

  return card;
}

function renderPackagePanel(record) {
  const ingredientsText = record.ingredientsText || record.inputIngredients || "";
  const claims = record.dietaryPreference && DIETARY_LABELS[record.dietaryPreference]
    ? DIETARY_LABELS[record.dietaryPreference] : "";
  const pct = normalizeConfidence(record.confidence);

  const rows = [
    ["Product", record.productName || "—"],
    ["Brand signal", record.brand || "Not provided"],
    ["Ingredients read", ingredientsText ? ingredientsText : "None entered"],
    ["Claims read", claims || "None entered"],
    ["Source", record.source === "manual" || !record.source ? "Manual entry" : record.source],
    ["Confidence", pct != null ? `${pct}%` : "N/A (manual entry)"],
  ];

  const card = elt("div", "card");
  card.appendChild(elt("span", "eyebrow", "Detected package details"));
  const grid = elt("div", "compare-grid");
  for (const [label, value] of rows) {
    const item = elt("div", "compare-item");
    item.appendChild(elt("div", "ci-label", label));
    item.appendChild(elt("div", "ci-value", value));
    grid.appendChild(item);
  }
  card.appendChild(grid);
  return card;
}

// Render a record into `container`. `opts.fallbackUsed` toggles the safe note.
export function renderRecipeRecord(container, record, opts = {}) {
  container.innerHTML = "";
  const recipe = getRecipe(record);
  const hasProductContext = Boolean((record.productName || "").trim());

  const layout = elt("div", "layout");

  if (hasProductContext) {
    layout.appendChild(renderHero(record, recipe));
  } else {
    const note = elt("div", "safe-note warn");
    note.textContent = "No product details yet. Add a product name and ingredients to generate a homemade version.";
    layout.appendChild(note);
  }

  const confidenceCard = renderConfidence(record.confidence);
  if (confidenceCard) layout.appendChild(confidenceCard);

  layout.appendChild(renderRecipeCard(recipe));

  if (hasProductContext) layout.appendChild(renderPackagePanel(record));

  const safe = elt("div", `safe-note${opts.fallbackUsed ? " warn" : ""}`);
  safe.textContent = opts.fallbackUsed
    ? "No AI provider available — this is a starter suggestion built from common ingredients. Review and adjust before saving. General food information only, not medical advice."
    : "Review the recipe before saving. General food information only, not medical advice.";
  layout.appendChild(safe);

  container.appendChild(layout);
}
