/**
 * ScratchNScan Cloudflare Worker
 *
 * Secrets (set via `wrangler secret put`):
 *   APP_ADMIN_TOKEN       - bearer token for /api/admin/status
 *   SEARCHUPCDATA_API_KEY - SearchUPCData.com API key
 *   GEMINI_API_KEY        - Google Gemini API key
 *
 * Routes:
 *   GET  /api/health
 *   GET  /api/admin/status          (requires Authorization: Bearer <APP_ADMIN_TOKEN>)
 *   POST /api/lookup-upc            { "upc": "012000001772" }
 *   POST /api/generate-scratch-recipe
 */

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8787",
  "https://scratchnscan.layr-sor.workers.dev",
];

function corsHeaders(request) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[2];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(request, response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request))) {
    headers.set(k, v);
  }
  return new Response(response.body, { status: response.status, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
    return json({ error: "Unauthorized" }, 401);
  }
  return json({
    ok: true,
    service: "scratchnscan",
    timestamp: new Date().toISOString(),
    secrets: {
      APP_ADMIN_TOKEN: "set",
      SEARCHUPCDATA_API_KEY: env.SEARCHUPCDATA_API_KEY ? "set" : "missing",
      GEMINI_API_KEY: env.GEMINI_API_KEY ? "set" : "missing",
    },
  });
}

async function handleLookupUpc(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON" }, 400);
  }

  const upc = (body?.upc ?? "").toString().trim();
  if (!upc || !/^\d{6,14}$/.test(upc)) {
    return json({ error: "Invalid UPC. Must be 6–14 digits." }, 400);
  }

  if (!env.SEARCHUPCDATA_API_KEY) {
    return json({ error: "UPC lookup service not configured" }, 502);
  }

  let apiRes;
  try {
    apiRes = await fetch(
      `https://api.searchupcdata.com/api/v1?upc=${encodeURIComponent(upc)}&apikey=${env.SEARCHUPCDATA_API_KEY}`,
      { headers: { Accept: "application/json" } }
    );
  } catch (err) {
    console.error("SearchUPCData network error:", err);
    return json({ error: "UPC lookup provider unavailable" }, 502);
  }

  if (!apiRes.ok) {
    console.error("SearchUPCData error status:", apiRes.status);
    return json({ error: "UPC lookup provider returned an error" }, 502);
  }

  let raw;
  try {
    raw = await apiRes.json();
  } catch {
    return json({ error: "UPC lookup provider returned invalid data" }, 502);
  }

  // Normalize only the fields the frontend needs — never forward the raw key.
  const product = normalizeUpcData(raw, upc);
  return json({ ok: true, product });
}

function normalizeUpcData(raw, upc) {
  // SearchUPCData returns an object at the top level; field names may vary.
  const item = Array.isArray(raw) ? raw[0] : raw;
  return {
    upc,
    name: item?.product_name ?? item?.title ?? item?.name ?? null,
    brand: item?.brand ?? item?.manufacturer ?? null,
    category: item?.category ?? null,
    ingredients: item?.ingredients ?? null,
    nutrition: item?.nutrition ?? item?.nutritional_info ?? null,
    imageUrl: item?.image ?? item?.images?.[0] ?? null,
    found: !!(item?.product_name ?? item?.title ?? item?.name),
  };
}

async function handleGenerateScratchRecipe(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON" }, 400);
  }

  const productName = (body?.productName ?? "").trim();
  if (!productName) {
    return json({ error: "productName is required" }, 400);
  }

  const brand = (body?.brand ?? "").trim();
  const ingredients = (body?.ingredients ?? "").trim();
  const nutrition = body?.nutrition ?? null;

  if (!env.GEMINI_API_KEY) {
    return json({ error: "AI recipe service not configured" }, 502);
  }

  const prompt = buildRecipePrompt({ productName, brand, ingredients, nutrition });

  let geminiRes;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      }
    );
  } catch (err) {
    console.error("Gemini network error:", err);
    return json({ error: "AI provider unavailable" }, 502);
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => "");
    console.error("Gemini error status:", geminiRes.status, errText);
    return json({ error: "AI provider returned an error" }, 502);
  }

  let geminiBody;
  try {
    geminiBody = await geminiRes.json();
  } catch {
    return json({ error: "AI provider returned invalid data" }, 502);
  }

  const rawText = geminiBody?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  let recipe;
  try {
    recipe = JSON.parse(rawText);
  } catch {
    console.error("Gemini JSON parse failed. Raw:", rawText.slice(0, 300));
    return json({ error: "AI provider returned malformed JSON" }, 502);
  }

  const validated = validateAiContract(recipe);
  if (!validated.ok) {
    return json({ error: "AI response failed validation", details: validated.errors }, 502);
  }

  return json({ ok: true, recipe: validated.recipe });
}

// ---------------------------------------------------------------------------
// AI prompt and contract validation
// ---------------------------------------------------------------------------

function buildRecipePrompt({ productName, brand, ingredients, nutrition }) {
  const brandLine = brand ? `Brand: ${brand}` : "";
  const ingredientsLine = ingredients ? `Ingredients list: ${ingredients}` : "Ingredients list: unknown";
  const nutritionLine = nutrition ? `Nutrition snapshot: ${JSON.stringify(nutrition)}` : "";

  return `You are a helpful cooking assistant. A user scanned a packaged food item and wants a cleaner homemade alternative.

Product: ${productName}
${brandLine}
${ingredientsLine}
${nutritionLine}

Return ONLY a JSON object matching this exact structure. Do not include markdown fences or extra text.

{
  "product": {
    "name": "string",
    "foodType": "string",
    "confidence": "high | medium | low",
    "sourceBasis": ["upc", "front_label", "ingredients_label", "user_text"]
  },
  "plainEnglishExplanation": "string",
  "ingredientSignals": [
    { "name": "string", "reason": "string", "category": "sweetener | oil | preservative | stabilizer | flavor | color | flour | dairy | protein | other" }
  ],
  "homemadeAlternative": {
    "title": "string",
    "positioning": "string",
    "prepTimeMinutes": 0,
    "cookTimeMinutes": 0,
    "difficulty": "easy | moderate",
    "servings": "string",
    "ingredients": [{ "item": "string", "amount": "string", "notes": "string" }],
    "steps": ["string"],
    "simpleSwaps": [{ "insteadOf": "string", "use": "string", "why": "string" }],
    "whyLessProcessed": ["string"],
    "tasteAndTextureExpectation": "string",
    "storageTips": "string"
  },
  "safetyNotes": ["string"],
  "disclaimer": "This is general cooking and ingredient information, not medical advice. Check labels and consult a qualified professional for allergies, medical conditions, or dietary restrictions."
}

Rules:
- Do not claim medical benefits or diagnose allergies.
- Use cautious language such as "may be simpler" or "uses fewer packaged additives".
- If the product is unsafe or impossible to replicate at home, return a safe explanation and no recipe steps.
- Keep instructions simple enough for a home cook.`;
}

function validateAiContract(recipe) {
  const errors = [];

  if (!recipe?.product?.name) errors.push("product.name is required");
  if (!recipe?.homemadeAlternative?.title) errors.push("homemadeAlternative.title is required");
  if (!Array.isArray(recipe?.homemadeAlternative?.ingredients) || recipe.homemadeAlternative.ingredients.length === 0) {
    errors.push("homemadeAlternative.ingredients must be a non-empty array");
  }
  if (!Array.isArray(recipe?.homemadeAlternative?.steps) || recipe.homemadeAlternative.steps.length === 0) {
    errors.push("homemadeAlternative.steps must be a non-empty array");
  }

  if (errors.length > 0) return { ok: false, errors };

  // Ensure disclaimer is always present.
  if (!recipe.disclaimer) {
    recipe.disclaimer =
      "This is general cooking and ingredient information, not medical advice. Check labels and consult a qualified professional for allergies, medical conditions, or dietary restrictions.";
  }

  return { ok: true, recipe };
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    // Handle preflight.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    let response;
    try {
      if (pathname === "/api/health" && method === "GET") {
        response = handleHealth();
      } else if (pathname === "/api/admin/status" && method === "GET") {
        response = handleAdminStatus(request, env);
      } else if (pathname === "/api/lookup-upc" && method === "POST") {
        response = await handleLookupUpc(request, env);
      } else if (pathname === "/api/generate-scratch-recipe" && method === "POST") {
        response = await handleGenerateScratchRecipe(request, env);
      } else if (pathname.startsWith("/api/")) {
        response = json({ error: "Not found" }, 404);
      } else {
        // Pass non-API requests through to static assets.
        return fetch(request);
      }
    } catch (err) {
      console.error("Unhandled worker error:", err);
      response = json({ error: "Internal server error" }, 500);
    }

    return withCors(request, response);
  },
};
