function cleanText(v) { return String(v || "").trim(); }

// Maximum character lengths for fields sent to the AI. Prevents oversized
// prompts from exhausting token budgets or being used for prompt injection.
const MAX_LENGTHS = {
  productName: 120,
  brand: 80,
  flavor: 80,
  category: 80,
  packageText: 1000,
  ingredientsText: 1000,
  userPreferences: 300,
};

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) : str;
}
function asArray(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of v) {
    const val = cleanText(raw);
    if (!val) continue;
    const k = val.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(val);
  }
  return out;
}

export function confidenceToNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "high") return 0.9;
    if (v === "medium") return 0.65;
    if (v === "low") return 0.35;
    if (v === "unknown") return null;
    const parsed = Number(v);
    if (!Number.isFinite(parsed)) return null;
    value = parsed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 1 && value <= 100) return Math.max(0, Math.min(1, value / 100));
    if (value >= 0 && value <= 1) return value;
  }
  return null;
}

export function confidenceToLabel(value) {
  const num = confidenceToNumber(value);
  if (num === null) return "unknown";
  if (num >= 0.75) return "high";
  if (num >= 0.45) return "medium";
  if (num > 0) return "low";
  return "unknown";
}

export function normalizeConfidence(value) {
  const confidence = confidenceToNumber(value);
  return { confidence, confidenceLabel: confidenceToLabel(value) };
}

export function normalizeProductContext(input = {}, options = {}) {
  const now = new Date().toISOString();
  const root = input?.product ? { ...input, ...input.product } : input;
  const source = cleanText(options.source || root.source || "unknown").toLowerCase();
  const confidenceRaw = root.confidenceLabel ?? root.confidence;
  const normalized = normalizeConfidence(confidenceRaw);

  const productName = cleanText(root.productName || root.name);
  const category = cleanText(root.category || root.foodType);
  const sourceBasis = asArray(root.sourceBasis || options.sourceBasis || []);

  const ctx = {
    productName: truncate(productName, MAX_LENGTHS.productName),
    brand: truncate(cleanText(root.brand), MAX_LENGTHS.brand),
    flavor: truncate(cleanText(root.flavor), MAX_LENGTHS.flavor),
    category: truncate(category, MAX_LENGTHS.category),
    packageText: truncate(cleanText(root.packageText), MAX_LENGTHS.packageText),
    ingredientsText: truncate(cleanText(root.ingredientsText || root.inputIngredients || root.ingredients), MAX_LENGTHS.ingredientsText),
    detectedIngredients: asArray(root.detectedIngredients),
    nutritionFacts: root.nutritionFacts && typeof root.nutritionFacts === "object" ? root.nutritionFacts : null,
    claims: asArray(root.claims),
    confidence: normalized.confidence,
    confidenceLabel: normalized.confidenceLabel,
    source: ["manual", "photo", "scanner", "ai", "popular", "fallback", "unknown"].includes(source) ? source : "unknown",
    sourceBasis,
    sourceMetadata: (root.sourceMetadata && typeof root.sourceMetadata === "object") ? root.sourceMetadata : {},
    userPreferences: truncate(cleanText(root.userPreferences || root.dietaryPreference || root.notes), MAX_LENGTHS.userPreferences),
    originalInput: input && typeof input === "object" ? input : {},
    createdAt: cleanText(root.createdAt) || now,
    updatedAt: now,
  };

  if (ctx.source === "manual" && !productName && ctx.ingredientsText) {
    ctx.confidence = ctx.confidence ?? 0.65;
    ctx.confidenceLabel = ctx.confidenceLabel === "unknown" ? "medium" : ctx.confidenceLabel;
  }
  if (ctx.source === "manual" && productName && ctx.confidenceLabel === "unknown") {
    ctx.confidence = ctx.confidence ?? 0.65;
    ctx.confidenceLabel = "medium";
  }
  return ctx;
}

export function hasEnoughProductContext(ctxInput = {}) {
  const ctx = normalizeProductContext(ctxInput);
  return Boolean(ctx.productName || ctx.category || ctx.ingredientsText || ctx.detectedIngredients.length);
}

export function needsManualCorrection(ctxInput = {}) {
  const ctx = normalizeProductContext(ctxInput);
  if (ctx.source === "manual" || ctx.source === "popular" || ctx.source === "fallback") return false;
  const weak = ctx.confidenceLabel === "low" || ctx.confidenceLabel === "unknown";
  return !hasEnoughProductContext(ctx) && weak;
}

export function contextToRecipeInput(ctxInput = {}) {
  const ctx = normalizeProductContext(ctxInput);
  return {
    productName: ctx.productName || ctx.category || "",
    category: ctx.category,
    brand: ctx.brand,
    flavor: ctx.flavor,
    ingredientsText: ctx.ingredientsText,
    detectedIngredients: ctx.detectedIngredients,
    userPreferences: ctx.userPreferences,
    claims: ctx.claims,
    nutritionFacts: ctx.nutritionFacts,
    source: ctx.source,
    confidence: ctx.confidence,
    confidenceLabel: ctx.confidenceLabel,
  };
}

export function mergeProductContexts(...contexts) {
  let merged = normalizeProductContext({});
  for (const candidate of contexts) {
    const ctx = normalizeProductContext(candidate || {});
    merged = {
      ...merged,
      ...ctx,
      productName: merged.productName || ctx.productName,
      brand: merged.brand || ctx.brand,
      flavor: merged.flavor || ctx.flavor,
      category: merged.category || ctx.category,
      packageText: merged.packageText || ctx.packageText,
      ingredientsText: merged.ingredientsText || ctx.ingredientsText,
      detectedIngredients: asArray([...(merged.detectedIngredients || []), ...(ctx.detectedIngredients || [])]),
      claims: asArray([...(merged.claims || []), ...(ctx.claims || [])]),
      sourceBasis: asArray([...(merged.sourceBasis || []), ...(ctx.sourceBasis || [])]),
      sourceMetadata: { ...(merged.sourceMetadata || {}), ...(ctx.sourceMetadata || {}) },
      confidence: ctx.confidence ?? merged.confidence,
      confidenceLabel: ctx.confidenceLabel !== "unknown" ? ctx.confidenceLabel : merged.confidenceLabel,
      userPreferences: merged.userPreferences || ctx.userPreferences,
      updatedAt: new Date().toISOString(),
    };
  }
  return merged;
}
