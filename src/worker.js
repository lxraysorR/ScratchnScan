/**
 * ScratchNScan Cloudflare Worker
 *
 * Local secrets:
 *   Put GEMINI_API_KEY in .dev.vars
 *
 * Deployed secrets:
 *   wrangler secret put APP_ADMIN_TOKEN
 *   wrangler secret put SEARCHUPCDATA_API_KEY
 *   wrangler secret put GEMINI_API_KEY
 *
 * Routes:
 *   GET  /api/health
 *   GET  /api/admin/status
 *   POST /api/lookup-upc
 *   POST /api/generate-scratch-recipe
 *   POST /api/generate-homemade-version   (alias)
 */

// ---------------------------------------------------------------------------
// Rate limiting — in-memory sliding window per IP per route key.
//
// Scope: single Worker isolate. State is not shared across Cloudflare edge
// nodes or across isolate restarts. This is sufficient to block accidental
// hammering and single-origin abuse; replace with Durable Objects for
// globally consistent enforcement.
// ---------------------------------------------------------------------------

const RATE_LIMITS = {
  generate: { maxRequests: 5,  windowMs: 60_000 },
  lookup:   { maxRequests: 20, windowMs: 60_000 },
  popular:  { maxRequests: 60, windowMs: 60_000 },
};

// Map<"ip:routeKey", { count: number, windowStart: number }>
const _rateBuckets = new Map();

// Exported so tests can reset state between cases.
export function resetRateLimits() {
  _rateBuckets.clear();
}

function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "unknown"
  );
}

/**
 * Returns null when the request is allowed, or a 429 Response when limited.
 * @param {string} ip
 * @param {"generate"|"lookup"|"popular"} routeKey
 */
function checkRateLimit(ip, routeKey) {
  const limit = RATE_LIMITS[routeKey];
  if (!limit) return null;

  const key = `${ip}:${routeKey}`;
  const now = Date.now();
  const bucket = _rateBuckets.get(key);

  if (!bucket || now - bucket.windowStart >= limit.windowMs) {
    _rateBuckets.set(key, { count: 1, windowStart: now });
    return null;
  }

  if (bucket.count < limit.maxRequests) {
    bucket.count += 1;
    return null;
  }

  const retryAfter = Math.ceil((limit.windowMs - (now - bucket.windowStart)) / 1000);
  return new Response(
    JSON.stringify({ ok: false, error: "Too many requests. Please wait a moment and try again.", retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8787",
  "https://scratchnscan.layr-sor.workers.dev",
];

// Returns the request's Origin if it is in the allowlist, otherwise null.
// A missing Origin header means same-origin or server-to-server — not a CORS
// request, so null is correct there too.
function getAllowedOrigin(request) {
  const origin = request.headers.get("Origin") ?? "";
  if (!origin) return null;
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

// Builds CORS response headers. Returns an empty object when allowedOrigin is
// null so callers never set Access-Control-Allow-Origin for unknown origins.
function corsHeaders(allowedOrigin) {
  if (!allowedOrigin) return {};
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(request, response) {
  const allowedOrigin = getAllowedOrigin(request);
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(allowedOrigin))) {
    headers.set(k, v);
  }
  // Always vary on Origin so intermediate caches don't serve the wrong headers.
  headers.set("Vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
export function cleanText(value) {
  return String(value ?? "").trim();
}

export function normalizeItemName(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function toDisplayName(normalized, fallbackRaw = "") {
  const raw = cleanText(fallbackRaw);
  if (raw) return raw;
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function supabaseRequest(env, path, options = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const url = `${env.SUPABASE_URL.replace(/\/$/, "")}${path}`;
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
}

async function logRequestEvent(env, { eventType, itemName }) {
  const normalizedItemName = normalizeItemName(itemName);
  if (!normalizedItemName) return false;
  try {
    const res = await supabaseRequest(env, "/rest/v1/sns_request_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify([
        {
          event_type: eventType,
          item_name: cleanText(itemName),
          normalized_item_name: normalizedItemName,
        },
      ]),
    });
    return !!res && res.ok;
  } catch {
    return false;
  }
}

export async function getPopularItems(env, limit = 5) {
  const fallback = ["Cream Cheese", "Mayo", "Mustard", "Ketchup", "Tomato Sauce"]
    .slice(0, limit)
    .map((name) => ({
      name,
      normalizedName: normalizeItemName(name),
      requestCount: 0,
    }));

  try {
    const res = await supabaseRequest(
      env,
      "/rest/v1/sns_request_events?select=item_name,normalized_item_name,created_at&order=created_at.desc&limit=1000",
      { method: "GET" },
    );
    if (!res || !res.ok) return fallback;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return fallback;

    const grouped = new Map();
    for (const row of rows) {
      const normalizedName = normalizeItemName(row?.normalized_item_name || row?.item_name);
      if (!normalizedName) continue;
      const createdAt = row?.created_at || "";
      const current = grouped.get(normalizedName) || {
        name: toDisplayName(normalizedName, row?.item_name),
        normalizedName,
        requestCount: 0,
        latestCreatedAt: "",
      };
      current.requestCount += 1;
      if (!current.latestCreatedAt || createdAt > current.latestCreatedAt) {
        current.latestCreatedAt = createdAt;
        if (cleanText(row?.item_name)) current.name = cleanText(row.item_name);
      }
      grouped.set(normalizedName, current);
    }

    const items = [...grouped.values()]
      .sort(
        (a, b) =>
          b.requestCount - a.requestCount ||
          (b.latestCreatedAt || "").localeCompare(a.latestCreatedAt || ""),
      )
      .slice(0, limit)
      .map(({ name, normalizedName, requestCount }) => ({ name, normalizedName, requestCount }));
    return items.length ? items : fallback;
  } catch {
    return fallback;
  }
}

async function handlePopularItems(env) {
  const items = await getPopularItems(env, 5);
  return json({ ok: true, items });
}

function hasMeaningfulValue(value) {
  return cleanText(value).length > 0;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function extractGeminiText(geminiBody) {
  const parts = geminiBody?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

// 4 MB decoded limit — base64 encoding inflates by ~4/3, so the character
// ceiling is 4 * 1024 * 1024 * (4/3) ≈ 5,592,405 chars.
const MAX_IMAGE_BASE64_CHARS = 5_592_405;

// Accept only well-formed base64 image data URLs (what the frontend sends after
// compressing a captured photo). Returns the mime type + bare base64 payload
// Gemini's inlineData part expects, or null when the value isn't a usable image.
export function parseInlineImage(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  // Reject oversized payloads before running the regex to avoid ReDoS risk.
  if (raw.length > MAX_IMAGE_BASE64_CHARS + 100) return null;
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(raw);
  if (!match) return null;
  const data = match[2].replace(/\s+/g, "");
  if (!data) return null;
  if (data.length > MAX_IMAGE_BASE64_CHARS) return null;
  return { mimeType: match[1].toLowerCase(), data };
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------
function handleHealth() {
  return json({ ok: true, service: "scratchnscan" });
}

function handleAdminStatus(request, env) {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token || token !== env.APP_ADMIN_TOKEN) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  return json({
    ok: true,
    service: "scratchnscan",
    admin: true,
    secrets: {
      APP_ADMIN_TOKEN: env.APP_ADMIN_TOKEN ? "set" : "missing",
      SEARCHUPCDATA_API_KEY: env.SEARCHUPCDATA_API_KEY ? "set" : "missing",
      GEMINI_API_KEY: env.GEMINI_API_KEY ? "set" : "missing",
    },
  });
}

async function handleLookupUpc(request, env) {
  const reqId = request.headers.get("cf-ray") ?? crypto.randomUUID();

  const body = await readJson(request);
  const upc = cleanText(body?.upc).replace(/[\s\-]/g, "");
  const VALID_LENGTHS = new Set([8, 12, 13, 14]);

  if (!upc || !/^\d+$/.test(upc) || !VALID_LENGTHS.has(upc.length)) {
    return json({ ok: false, error: "Invalid UPC" }, 400);
  }

  console.log(JSON.stringify({ reqId, path: "/api/lookup-upc", upc, step: "provider_call" }));

  const providerUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(upc)}.json`;

  let apiRes;
  try {
    apiRes = await fetch(providerUrl, {
      headers: { "User-Agent": "ScratchnScan/1.0 (homemade-recipe-helper)" },
    });
  } catch {
    console.log(JSON.stringify({ reqId, path: "/api/lookup-upc", upc, error: "provider_network_error" }));
    return json({ ok: false, error: "Lookup provider failed", providerStatus: 0 }, 502);
  }

  if (!apiRes.ok) {
    console.log(JSON.stringify({ reqId, path: "/api/lookup-upc", upc, error: "provider_error", providerStatus: apiRes.status }));
    return json({ ok: false, error: "Lookup provider failed", providerStatus: apiRes.status }, 502);
  }

  let raw;
  try {
    raw = await apiRes.json();
  } catch {
    console.log(JSON.stringify({ reqId, path: "/api/lookup-upc", upc, error: "provider_invalid_json" }));
    return json({ ok: false, error: "Lookup provider failed" }, 502);
  }

  if (raw?.status !== 1) {
    console.log(JSON.stringify({ reqId, path: "/api/lookup-upc", upc, result: "not_found" }));
    return json({ ok: false, error: "Product not found" }, 404);
  }

  const product = normalizeUpcData(raw.product, upc);

  if (!product.name) {
    console.log(JSON.stringify({ reqId, path: "/api/lookup-upc", upc, result: "not_found" }));
    return json({ ok: false, error: "Product not found" }, 404);
  }

  console.log(JSON.stringify({ reqId, path: "/api/lookup-upc", upc, result: "found" }));
  void logRequestEvent(env, { eventType: "lookup_success", itemName: product.name || upc });
  return json({ ok: true, product });
}

export function normalizeUpcData(raw, upc) {
  const item = Array.isArray(raw) ? raw[0] : raw;
  const category = item?.categories_tags?.[0]?.replace(/^en:/, "") ?? item?.category ?? null;
  return {
    upc,
    name: item?.product_name_en ?? item?.product_name ?? item?.title ?? item?.name ?? null,
    brand: item?.brands ?? item?.brand ?? item?.manufacturer ?? null,
    category,
    ingredients: item?.ingredients_text_en ?? item?.ingredients_text ?? item?.ingredients ?? null,
    imageUrl: item?.image_front_url ?? item?.image_url ?? item?.image ?? item?.images?.[0] ?? null,
  };
}

export function buildRecipePrompt({
  productName,
  brand,
  ingredients,
  nutrition,
  frontText,
  backText,
  goals,
  hasFrontImage = false,
  hasBackImage = false,
}) {
  return `
You are a careful cooking assistant helping a user create a cleaner homemade version of a packaged food item.

Return ONLY a JSON object that matches this structure exactly:

{
  "product": {
    "name": "string",
    "foodType": "string",
    "confidence": "high | medium | low",
    "sourceBasis": ["upc", "front_label", "ingredients_label", "user_text"]
  },
  "plainEnglishExplanation": "string",
  "ingredientSignals": [
    {
      "name": "string",
      "reason": "string",
      "category": "sweetener | oil | preservative | stabilizer | flavor | color | flour | dairy | protein | other"
    }
  ],
  "homemadeAlternative": {
    "title": "string",
    "positioning": "string",
    "prepTimeMinutes": 0,
    "cookTimeMinutes": 0,
    "difficulty": "easy | moderate",
    "servings": "string",
    "ingredients": [
      {
        "item": "string",
        "amount": "string",
        "notes": "string"
      }
    ],
    "steps": ["string"],
    "simpleSwaps": [
      {
        "insteadOf": "string",
        "use": "string",
        "why": "string"
      }
    ],
    "whyLessProcessed": ["string"],
    "tasteAndTextureExpectation": "string",
    "storageTips": "string"
  },
  "safetyNotes": ["string"],
  "disclaimer": "This is general cooking and ingredient information, not medical advice. Check labels and consult a qualified professional for allergies, medical conditions, or dietary restrictions."
}

User input:
- Product name: ${productName || "unknown"}
- Brand: ${brand || "unknown"}
- Ingredients text: ${ingredients || "unknown"}
- Front label text: ${frontText || "unknown"}
- Back label text: ${backText || "unknown"}
- Nutrition snapshot: ${nutrition ? JSON.stringify(nutrition) : "unknown"}
- User goals: ${goals || "none provided"}
- Front package photo provided: ${hasFrontImage ? "yes" : "no"}
- Ingredients/back label photo provided: ${hasBackImage ? "yes" : "no"}

Rules:
- If package text is incomplete, still create the best reasonable homemade version.
- If package photos are provided, read them carefully to identify the product and its ingredient list.
- When the user did not type a product name, set product.name from what the photo shows.
- Base ingredientSignals on the ingredients you can read from the photos or text. Add "front_label" and/or "ingredients_label" to product.sourceBasis whenever a photo informed your answer.
- If a photo is too blurry or unreadable, lower the confidence and note that a clearer ingredient label would help.
- Prefer common grocery-store ingredients.
- Keep instructions practical for a normal home cook.
- Do not claim medical benefits.
- Use cautious language such as "may be simpler" or "uses fewer packaged additives".
- If there is not enough information for a confident replica, still provide a reasonable homemade interpretation.
- Do not include markdown fences.
`.trim();
}

function getRecipeResponseSchema() {
  return {
    type: "OBJECT",
    required: [
      "product",
      "plainEnglishExplanation",
      "ingredientSignals",
      "homemadeAlternative",
      "safetyNotes",
      "disclaimer",
    ],
    properties: {
      product: {
        type: "OBJECT",
        required: ["name", "foodType", "confidence", "sourceBasis"],
        properties: {
          name: { type: "STRING" },
          foodType: { type: "STRING" },
          confidence: {
            type: "STRING",
            enum: ["high", "medium", "low"],
          },
          sourceBasis: {
            type: "ARRAY",
            items: {
              type: "STRING",
              enum: ["upc", "front_label", "ingredients_label", "user_text"],
            },
          },
        },
      },
      plainEnglishExplanation: { type: "STRING" },
      ingredientSignals: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["name", "reason", "category"],
          properties: {
            name: { type: "STRING" },
            reason: { type: "STRING" },
            category: {
              type: "STRING",
              enum: [
                "sweetener",
                "oil",
                "preservative",
                "stabilizer",
                "flavor",
                "color",
                "flour",
                "dairy",
                "protein",
                "other",
              ],
            },
          },
        },
      },
      homemadeAlternative: {
        type: "OBJECT",
        required: [
          "title",
          "positioning",
          "prepTimeMinutes",
          "cookTimeMinutes",
          "difficulty",
          "servings",
          "ingredients",
          "steps",
          "simpleSwaps",
          "whyLessProcessed",
          "tasteAndTextureExpectation",
          "storageTips",
        ],
        properties: {
          title: { type: "STRING" },
          positioning: { type: "STRING" },
          prepTimeMinutes: { type: "INTEGER" },
          cookTimeMinutes: { type: "INTEGER" },
          difficulty: {
            type: "STRING",
            enum: ["easy", "moderate"],
          },
          servings: { type: "STRING" },
          ingredients: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["item", "amount", "notes"],
              properties: {
                item: { type: "STRING" },
                amount: { type: "STRING" },
                notes: { type: "STRING" },
              },
            },
          },
          steps: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          simpleSwaps: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["insteadOf", "use", "why"],
              properties: {
                insteadOf: { type: "STRING" },
                use: { type: "STRING" },
                why: { type: "STRING" },
              },
            },
          },
          whyLessProcessed: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          tasteAndTextureExpectation: { type: "STRING" },
          storageTips: { type: "STRING" },
        },
      },
      safetyNotes: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
      disclaimer: { type: "STRING" },
    },
  };
}

export function validateAiContract(recipe) {
  const errors = [];

  if (!recipe?.product?.name) errors.push("product.name is required");
  if (!recipe?.homemadeAlternative?.title) errors.push("homemadeAlternative.title is required");

  if (
    !Array.isArray(recipe?.homemadeAlternative?.ingredients) ||
    recipe.homemadeAlternative.ingredients.length === 0
  ) {
    errors.push("homemadeAlternative.ingredients must be a non-empty array");
  }

  if (
    !Array.isArray(recipe?.homemadeAlternative?.steps) ||
    recipe.homemadeAlternative.steps.length === 0
  ) {
    errors.push("homemadeAlternative.steps must be a non-empty array");
  }

  if (!Array.isArray(recipe?.ingredientSignals)) {
    errors.push("ingredientSignals must be an array");
  }

  if (!Array.isArray(recipe?.safetyNotes)) {
    errors.push("safetyNotes must be an array");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (!recipe.disclaimer) {
    recipe.disclaimer =
      "This is general cooking and ingredient information, not medical advice. Check labels and consult a qualified professional for allergies, medical conditions, or dietary restrictions.";
  }

  return { ok: true, recipe };
}

async function handleGenerateScratchRecipe(request, env) {
  const reqId = request.headers.get("cf-ray") ?? crypto.randomUUID();
  const body = await readJson(request);

  if (!body) {
    return json({ ok: false, error: "Request body must be valid JSON" }, 400);
  }

  const productName = cleanText(body?.productName);
  const brand = cleanText(body?.brand);
  const ingredients = cleanText(body?.ingredients);
  const frontText = cleanText(body?.frontText);
  const backText = cleanText(body?.backText);
  const goals = cleanText(body?.goals);
  const nutrition = body?.nutrition ?? null;
  const frontImage = parseInlineImage(body?.frontImage);
  const backImage = parseInlineImage(body?.backImage);

  const hasInput =
    hasMeaningfulValue(productName) ||
    hasMeaningfulValue(ingredients) ||
    hasMeaningfulValue(frontText) ||
    hasMeaningfulValue(backText) ||
    !!frontImage ||
    !!backImage;

  if (!hasInput) {
    return json(
      {
        ok: false,
        error: "Provide a product name, ingredients, label text, or a package photo.",
      },
      400
    );
  }

  if (!env.GEMINI_API_KEY) {
    console.log(JSON.stringify({ reqId, path: "/api/generate-scratch-recipe", error: "missing_key" }));
    return json({ ok: false, error: "AI recipe service not configured" }, 502);
  }

  const prompt = buildRecipePrompt({
    productName,
    brand,
    ingredients,
    nutrition,
    frontText,
    backText,
    goals,
    hasFrontImage: !!frontImage,
    hasBackImage: !!backImage,
  });

  const userParts = [{ text: prompt }];
  if (frontImage) {
    userParts.push({ inlineData: { mimeType: frontImage.mimeType, data: frontImage.data } });
  }
  if (backImage) {
    userParts.push({ inlineData: { mimeType: backImage.mimeType, data: backImage.data } });
  }

  let geminiRes;
  try {
    geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: userParts,
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: getRecipeResponseSchema(),
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      }
    );
  } catch (err) {
    console.log(JSON.stringify({
      reqId,
      path: "/api/generate-scratch-recipe",
      error: "provider_network_error",
      message: err instanceof Error ? err.message : String(err),
    }));
    return json({ ok: false, error: "AI provider unavailable" }, 502);
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => "");
    console.log(JSON.stringify({
      reqId,
      path: "/api/generate-scratch-recipe",
      error: "provider_error",
      providerStatus: geminiRes.status,
      detailPreview: errText.slice(0, 300),
    }));
    return json({ ok: false, error: "AI provider returned an error" }, 502);
  }

  let geminiBody;
  try {
    geminiBody = await geminiRes.json();
  } catch {
    return json({ ok: false, error: "AI provider returned invalid data" }, 502);
  }

  const rawText = extractGeminiText(geminiBody);
  if (!rawText) {
    return json({ ok: false, error: "AI provider returned an empty response" }, 502);
  }

  let recipe;
  try {
    recipe = JSON.parse(rawText);
  } catch {
    console.log(JSON.stringify({
      reqId,
      path: "/api/generate-scratch-recipe",
      error: "json_parse_failed",
      rawPreview: rawText.slice(0, 300),
    }));
    return json({ ok: false, error: "AI provider returned malformed JSON" }, 502);
  }

  const validated = validateAiContract(recipe);
  if (!validated.ok) {
    return json(
      {
        ok: false,
        error: "AI response failed validation",
        details: validated.errors,
      },
      502
    );
  }

  void logRequestEvent(env, {
    eventType: "generation_success",
    itemName:
      productName || validated.recipe?.product?.name || validated.recipe?.homemadeAlternative?.title || "",
  });

  return json({
    ok: true,
    recipe: validated.recipe,
    meta: {
      model: "gemini-2.0-flash",
      usedInputs: {
        productName: hasMeaningfulValue(productName),
        ingredients: hasMeaningfulValue(ingredients),
        frontText: hasMeaningfulValue(frontText),
        backText: hasMeaningfulValue(backText),
        frontImage: !!frontImage,
        backImage: !!backImage,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      const allowedOrigin = getAllowedOrigin(request);
      // Reject preflights from unknown origins explicitly. A missing Origin
      // header is not a CORS preflight, so we let those through unchanged.
      if (request.headers.get("Origin") && !allowedOrigin) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin),
      });
    }

    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;
    const ip = clientIp(request);

    let response;

    try {
      if (pathname === "/api/health" && method === "GET") {
        response = handleHealth();
      } else if (pathname === "/api/popular-items" && method === "GET") {
        response = checkRateLimit(ip, "popular") ?? await handlePopularItems(env);
      } else if (pathname === "/api/admin/status" && method === "GET") {
        response = handleAdminStatus(request, env);
      } else if (pathname === "/api/lookup-upc" && method === "POST") {
        response = checkRateLimit(ip, "lookup") ?? await handleLookupUpc(request, env);
      } else if (
        (pathname === "/api/generate-scratch-recipe" ||
          pathname === "/api/generate-homemade-version") &&
        method === "POST"
      ) {
        response = checkRateLimit(ip, "generate") ?? await handleGenerateScratchRecipe(request, env);
      } else if (pathname.startsWith("/api/")) {
        response = json({ ok: false, error: "Not found" }, 404);
      } else if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        return env.ASSETS.fetch(request);
      } else {
        response = json({ ok: false, error: "Static assets binding is missing" }, 500);
      }
    } catch (err) {
      console.log(JSON.stringify({
        path: pathname,
        error: "unhandled_exception",
        message: err instanceof Error ? err.message : String(err),
      }));
      response = json({ ok: false, error: "Internal server error" }, 500);
    }

    return withCors(request, response);
  },
};
