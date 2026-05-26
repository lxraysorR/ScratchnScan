import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const worker = await import(pathToFileURL(resolve('src/worker.js')).href);
const {
  normalizeItemName,
  normalizeUpcData,
  validateAiContract,
  buildRecipePrompt,
  extractGeminiText,
  getPopularItems,
  toDisplayName,
} = worker;

// ---------------------------------------------------------------------------
// normalizeItemName
// ---------------------------------------------------------------------------
{
  assert.equal(normalizeItemName('  Cream   Cheese  '), 'cream cheese', 'trim + collapse + lowercase');
  assert.equal(normalizeItemName('KETCHUP'), 'ketchup', 'lowercase');
  assert.equal(normalizeItemName('A\t B\n  C'), 'a b c', 'collapse mixed whitespace');
  assert.equal(normalizeItemName(null), '', 'null -> empty');
  assert.equal(normalizeItemName(undefined), '', 'undefined -> empty');
  assert.equal(normalizeItemName(''), '', 'empty -> empty');
}

// ---------------------------------------------------------------------------
// toDisplayName
// ---------------------------------------------------------------------------
{
  assert.equal(toDisplayName('cream cheese'), 'Cream Cheese', 'title-cases normalized name');
  assert.equal(toDisplayName('anything', 'Raw Label'), 'Raw Label', 'prefers raw fallback when present');
  assert.equal(toDisplayName('', '  '), '', 'blank fallback + blank normalized -> empty');
}

// ---------------------------------------------------------------------------
// normalizeUpcData
// ---------------------------------------------------------------------------
{
  // Object form with product_name + brand + image.
  const a = normalizeUpcData(
    { product_name: 'Test Sauce', brand: 'Acme', category: 'condiment', ingredients: 'water', image: 'http://img/1.png' },
    '012000001772',
  );
  assert.deepEqual(a, {
    upc: '012000001772',
    name: 'Test Sauce',
    brand: 'Acme',
    category: 'condiment',
    ingredients: 'water',
    imageUrl: 'http://img/1.png',
  }, 'object normalization');

  // Array form -> first element used.
  const b = normalizeUpcData([{ title: 'Array Title', manufacturer: 'MFG', images: ['http://img/first.png', 'x'] }], '99999999');
  assert.equal(b.name, 'Array Title', 'falls back to title');
  assert.equal(b.brand, 'MFG', 'falls back to manufacturer');
  assert.equal(b.imageUrl, 'http://img/first.png', 'falls back to images[0]');
  assert.equal(b.upc, '99999999', 'echoes upc');

  // name field fallback order: product_name > title > name.
  assert.equal(normalizeUpcData({ name: 'Plain Name' }, '1').name, 'Plain Name', 'falls back to name');

  // No usable name -> null.
  const c = normalizeUpcData({ brand: 'OnlyBrand' }, '1');
  assert.equal(c.name, null, 'missing name -> null');
  assert.equal(c.brand, 'OnlyBrand');

  // Empty / non-object raw -> null fields, upc preserved.
  const d = normalizeUpcData(null, '1');
  assert.equal(d.name, null);
  assert.equal(d.upc, '1');
}

// ---------------------------------------------------------------------------
// validateAiContract
// ---------------------------------------------------------------------------
function validRecipe() {
  return {
    product: { name: 'Cookies', foodType: 'snack', confidence: 'medium', sourceBasis: ['user_text'] },
    plainEnglishExplanation: 'Packaged sandwich cookies.',
    ingredientSignals: [{ name: 'sugar', reason: 'sweetener', category: 'sweetener' }],
    homemadeAlternative: {
      title: 'Homemade Cookies',
      positioning: 'simpler',
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      difficulty: 'easy',
      servings: '12',
      ingredients: [{ item: 'flour', amount: '1 cup', notes: '' }],
      steps: ['Mix', 'Bake'],
      simpleSwaps: [],
      whyLessProcessed: ['fewer additives'],
      tasteAndTextureExpectation: 'similar',
      storageTips: 'airtight',
    },
    safetyNotes: ['check allergies'],
    disclaimer: 'Provided disclaimer.',
  };
}

{
  const ok = validateAiContract(validRecipe());
  assert.equal(ok.ok, true, 'valid recipe passes');
  assert.equal(ok.recipe.disclaimer, 'Provided disclaimer.', 'keeps provided disclaimer');

  // Missing product.name
  let r = validRecipe();
  delete r.product.name;
  assert.equal(validateAiContract(r).ok, false, 'missing product.name fails');

  // Missing homemadeAlternative.title
  r = validRecipe();
  delete r.homemadeAlternative.title;
  assert.equal(validateAiContract(r).ok, false, 'missing title fails');

  // Empty ingredients
  r = validRecipe();
  r.homemadeAlternative.ingredients = [];
  assert.equal(validateAiContract(r).ok, false, 'empty ingredients fails');

  // Empty steps
  r = validRecipe();
  r.homemadeAlternative.steps = [];
  assert.equal(validateAiContract(r).ok, false, 'empty steps fails');

  // Non-array ingredientSignals
  r = validRecipe();
  r.ingredientSignals = 'nope';
  assert.equal(validateAiContract(r).ok, false, 'non-array ingredientSignals fails');

  // Non-array safetyNotes
  r = validRecipe();
  r.safetyNotes = null;
  assert.equal(validateAiContract(r).ok, false, 'non-array safetyNotes fails');

  // Missing disclaimer -> default injected, still ok.
  r = validRecipe();
  delete r.disclaimer;
  const filled = validateAiContract(r);
  assert.equal(filled.ok, true, 'missing disclaimer still passes');
  assert.match(filled.recipe.disclaimer, /not medical advice/i, 'default disclaimer injected');

  // Multiple errors are aggregated.
  const errs = validateAiContract({}).errors;
  assert.ok(Array.isArray(errs) && errs.length >= 2, 'aggregates multiple errors');
}

// ---------------------------------------------------------------------------
// buildRecipePrompt
// ---------------------------------------------------------------------------
{
  const prompt = buildRecipePrompt({
    productName: 'Oreos',
    brand: 'Nabisco',
    ingredients: 'sugar, flour',
    nutrition: { calories: 160 },
    frontText: 'Chocolate Sandwich Cookies',
    backText: 'Nutrition Facts',
    goals: 'less sugar',
  });
  assert.match(prompt, /Oreos/, 'includes product name');
  assert.match(prompt, /Nabisco/, 'includes brand');
  assert.match(prompt, /"homemadeAlternative"/, 'includes contract key');
  assert.match(prompt, /Do not include markdown fences/, 'forbids markdown fences');
  assert.match(prompt, /"calories":160/, 'serializes nutrition snapshot');

  // Unknown inputs degrade gracefully.
  const sparse = buildRecipePrompt({});
  assert.match(sparse, /Product name: unknown/, 'unknown product name placeholder');
  assert.match(sparse, /Nutrition snapshot: unknown/, 'unknown nutrition placeholder');
  assert.match(sparse, /User goals: none provided/, 'no goals placeholder');
}

// ---------------------------------------------------------------------------
// extractGeminiText
// ---------------------------------------------------------------------------
{
  const body = { candidates: [{ content: { parts: [{ text: 'line 1' }, { text: 'line 2' }] } }] };
  assert.equal(extractGeminiText(body), 'line 1\nline 2', 'joins text parts');
  assert.equal(extractGeminiText({}), '', 'missing candidates -> empty');
  assert.equal(extractGeminiText(null), '', 'null body -> empty');
  assert.equal(extractGeminiText({ candidates: [{ content: { parts: [{ foo: 'bar' }] } }] }), '', 'no text fields -> empty');
}

// ---------------------------------------------------------------------------
// getPopularItems fallback (no Supabase configured -> deterministic starters)
// ---------------------------------------------------------------------------
{
  const items = await getPopularItems({}, 5);
  assert.deepEqual(
    items.map((i) => i.name),
    ['Cream Cheese', 'Mayo', 'Mustard', 'Ketchup', 'Tomato Sauce'],
    'fallback starter items in expected order',
  );
  for (const item of items) {
    assert.equal(typeof item.name, 'string');
    assert.equal(typeof item.normalizedName, 'string');
    assert.equal(item.requestCount, 0, 'fallback request counts are 0');
  }

  const limited = await getPopularItems({}, 4);
  assert.deepEqual(limited.map((i) => i.name), ['Cream Cheese', 'Mayo', 'Mustard', 'Ketchup'], 'respects limit');
}

console.log('Worker helper unit tests passed.');
