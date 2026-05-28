import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "app");
const PORT = 5000;
const HOST = "0.0.0.0";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function jsonRes(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(data);
}

function cleanText(v) {
  return String(v ?? "").trim();
}

function buildRecipePrompt({ productName, brand, ingredients, goals, hasFrontImage, hasBackImage }) {
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
- User goals: ${goals || "none provided"}
- Front package photo provided: ${hasFrontImage ? "yes" : "no"}
- Ingredients/back label photo provided: ${hasBackImage ? "yes" : "no"}

Rules:
- If package text is incomplete, still create the best reasonable homemade version.
- If package photos are provided, read them carefully to identify the product and its ingredient list.
- When the user did not type a product name, set product.name from what the photo shows.
- Prefer common grocery-store ingredients.
- Keep instructions practical for a normal home cook.
- Do not claim medical benefits.
- Use cautious language such as "may be simpler" or "uses fewer packaged additives".
- If there is not enough information for a confident replica, still provide a reasonable homemade interpretation.
- Do not include markdown fences.
`.trim();
}

function parseInlineImage(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function handleGenerateRecipe(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonRes(res, 502, { ok: false, error: "AI recipe service not configured. Add a GEMINI_API_KEY secret." });
  }

  let body;
  try {
    const raw = await new Promise((resolve, reject) => {
      let chunks = "";
      req.on("data", (d) => { chunks += d; });
      req.on("end", () => resolve(chunks));
      req.on("error", reject);
    });
    body = JSON.parse(raw);
  } catch {
    return jsonRes(res, 400, { ok: false, error: "Request body must be valid JSON" });
  }

  const productName = cleanText(body?.productName);
  const brand = cleanText(body?.brand);
  const ingredients = cleanText(body?.ingredients);
  const goals = cleanText(body?.goals ?? body?.dietaryPreference);
  const frontImage = parseInlineImage(body?.frontImage);
  const backImage = parseInlineImage(body?.backImage);

  const hasInput = productName || ingredients || frontImage || backImage;
  if (!hasInput) {
    return jsonRes(res, 400, { ok: false, error: "Provide a product name, ingredients, or a package photo." });
  }

  const prompt = buildRecipePrompt({
    productName, brand, ingredients, goals,
    hasFrontImage: !!frontImage,
    hasBackImage: !!backImage,
  });

  const userParts = [{ text: prompt }];
  if (frontImage) userParts.push({ inlineData: { mimeType: frontImage.mimeType, data: frontImage.data } });
  if (backImage) userParts.push({ inlineData: { mimeType: backImage.mimeType, data: backImage.data } });

  let geminiRes;
  try {
    geminiRes = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: userParts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 2048 },
      }),
    });
  } catch (err) {
    console.error("Gemini network error:", err.message);
    return jsonRes(res, 502, { ok: false, error: "AI provider unavailable" });
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => "");
    console.error("Gemini error response:", geminiRes.status, errText.slice(0, 300));
    return jsonRes(res, 502, { ok: false, error: "AI provider returned an error" });
  }

  let geminiBody;
  try {
    geminiBody = await geminiRes.json();
  } catch {
    return jsonRes(res, 502, { ok: false, error: "AI provider returned invalid data" });
  }

  const parts = geminiBody?.candidates?.[0]?.content?.parts ?? [];
  const rawText = parts.map((p) => p.text ?? "").join("").trim();
  if (!rawText) {
    return jsonRes(res, 502, { ok: false, error: "AI provider returned an empty response" });
  }

  let recipe;
  try {
    recipe = JSON.parse(rawText);
  } catch {
    return jsonRes(res, 502, { ok: false, error: "AI provider returned malformed JSON" });
  }

  if (!recipe?.homemadeAlternative?.ingredients?.length || !recipe?.homemadeAlternative?.steps?.length) {
    return jsonRes(res, 502, { ok: false, error: "AI response failed validation" });
  }

  return jsonRes(res, 200, { ok: true, recipe });
}

createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }

  const urlPath = req.url.split("?")[0];

  if ((req.method === "POST") && (urlPath === "/api/generate-scratch-recipe" || urlPath === "/api/generate-homemade-version")) {
    return handleGenerateRecipe(req, res);
  }

  if (urlPath === "/api/popular-items") {
    return jsonRes(res, 200, { ok: true, items: [] });
  }

  let filePath = urlPath === "/" || urlPath === "" ? "/index.html" : urlPath;
  const fullPath = join(ROOT, filePath);

  try {
    const data = await readFile(fullPath);
    const ext = extname(fullPath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    try {
      const data = await readFile(join(ROOT, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  }
}).listen(PORT, HOST, () => {
  console.log(`ScratchnScan serving on http://${HOST}:${PORT}`);
});
