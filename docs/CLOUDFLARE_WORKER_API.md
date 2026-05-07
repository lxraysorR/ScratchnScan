# ScratchNScan Cloudflare Worker API

Worker URL: `https://scratchnscan.layr-sor.workers.dev`

---

## Required Cloudflare secrets

Set these once via the Wrangler CLI. They are never committed to the repo.

```bash
wrangler secret put APP_ADMIN_TOKEN
wrangler secret put SEARCHUPCDATA_API_KEY
wrangler secret put GEMINI_API_KEY
```

To verify all three are present after deploying, call `/api/admin/status` with your `APP_ADMIN_TOKEN`.

---

## Routes

### GET /api/health

Public. Returns service status. Use this to confirm the worker is deployed.

**Response 200**
```json
{ "ok": true, "service": "scratchnscan" }
```

**curl**
```bash
curl https://scratchnscan.layr-sor.workers.dev/api/health
```

---

### GET /api/admin/status

Protected. Requires `Authorization: Bearer <APP_ADMIN_TOKEN>`.

Returns the deployment state and which secrets are configured.

**Response 200**
```json
{
  "ok": true,
  "service": "scratchnscan",
  "timestamp": "2026-05-07T00:00:00.000Z",
  "secrets": {
    "APP_ADMIN_TOKEN": "set",
    "SEARCHUPCDATA_API_KEY": "set",
    "GEMINI_API_KEY": "set"
  }
}
```

**Response 401** – missing or wrong token
```json
{ "error": "Unauthorized" }
```

**curl**
```bash
# Fails (no token)
curl https://scratchnscan.layr-sor.workers.dev/api/admin/status

# Succeeds
curl -H "Authorization: Bearer YOUR_APP_ADMIN_TOKEN" \
     https://scratchnscan.layr-sor.workers.dev/api/admin/status
```

---

### POST /api/lookup-upc

Looks up a UPC via SearchUPCData. The API key stays server-side.

**Request body**
```json
{ "upc": "012000001772" }
```

| Field | Type   | Required | Notes                      |
|-------|--------|----------|----------------------------|
| upc   | string | yes      | 6–14 digits, numeric only  |

**Response 200**
```json
{
  "ok": true,
  "product": {
    "upc": "012000001772",
    "name": "Pepsi Cola",
    "brand": "PepsiCo",
    "category": "Beverages",
    "ingredients": "Carbonated water, high fructose corn syrup...",
    "nutrition": { "calories": 150, "sugar": "41g" },
    "imageUrl": "https://example.com/pepsi.jpg",
    "found": true
  }
}
```

**Error responses**
| Status | Cause                                      |
|--------|--------------------------------------------|
| 400    | Invalid or missing UPC                     |
| 502    | SearchUPCData unreachable or error         |

**curl**
```bash
curl -X POST https://scratchnscan.layr-sor.workers.dev/api/lookup-upc \
     -H "Content-Type: application/json" \
     -d '{"upc":"012000001772"}'
```

---

### POST /api/generate-scratch-recipe

Generates a homemade alternative recipe using Gemini AI.  
Returns a validated JSON object matching `docs/AI_JSON_CONTRACT.md`.

**Request body**
```json
{
  "productName": "Pepsi Cola",
  "brand": "PepsiCo",
  "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine",
  "nutrition": { "calories": 150, "sugar": "41g" }
}
```

| Field       | Type   | Required | Notes                                  |
|-------------|--------|----------|----------------------------------------|
| productName | string | yes      | Product display name                   |
| brand       | string | no       | Brand/manufacturer name                |
| ingredients | string | no       | Raw ingredients string from label      |
| nutrition   | object | no       | Nutrition snapshot (any shape is fine) |

**Response 200** – shape defined in `docs/AI_JSON_CONTRACT.md`
```json
{
  "ok": true,
  "recipe": {
    "product": { "name": "Pepsi Cola", "foodType": "Carbonated soft drink", "confidence": "high", "sourceBasis": ["upc"] },
    "plainEnglishExplanation": "A sweetened, caffeinated carbonated drink...",
    "ingredientSignals": [...],
    "homemadeAlternative": {
      "title": "Sparkling Cola Syrup Soda",
      "positioning": "A simpler carbonated drink with no artificial dyes or preservatives",
      "prepTimeMinutes": 10,
      "cookTimeMinutes": 5,
      "difficulty": "easy",
      "servings": "4 glasses",
      "ingredients": [
        { "item": "Sparkling water", "amount": "1 litre", "notes": "Chilled" },
        { "item": "Sugar", "amount": "100g", "notes": "Or to taste" },
        ...
      ],
      "steps": ["Combine sugar and water over medium heat...", ...],
      "simpleSwaps": [...],
      "whyLessProcessed": ["No artificial caramel color", "No phosphoric acid", ...],
      "tasteAndTextureExpectation": "Lighter in colour, slightly less sweet...",
      "storageTips": "Syrup keeps refrigerated for 2 weeks."
    },
    "safetyNotes": [],
    "disclaimer": "This is general cooking and ingredient information, not medical advice..."
  }
}
```

**Error responses**
| Status | Cause                                               |
|--------|-----------------------------------------------------|
| 400    | Missing productName                                 |
| 502    | Gemini unreachable, returned an error, or bad JSON  |

**curl**
```bash
curl -X POST https://scratchnscan.layr-sor.workers.dev/api/generate-scratch-recipe \
     -H "Content-Type: application/json" \
     -d '{
       "productName": "Pepsi Cola",
       "brand": "PepsiCo",
       "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine"
     }'
```

---

## CORS

CORS is enabled for:
- `http://localhost:5173` (Vite dev)
- `http://localhost:8787` (wrangler dev)
- `https://scratchnscan.layr-sor.workers.dev` (production)

Preflight `OPTIONS` requests are handled automatically.

---

## Error shape

All errors follow this shape:
```json
{ "error": "Human-readable message" }
```

| Status | Meaning                                 |
|--------|-----------------------------------------|
| 400    | Bad request (validation failure)        |
| 401    | Unauthorized (admin route, bad token)   |
| 404    | Unknown API route                       |
| 500    | Unexpected internal error               |
| 502    | External provider (UPC lookup or AI) failed |

---

## Local development

```bash
# Install dependencies
npm install

# Start local worker (uses .dev.vars for secrets — see below)
npm run preview

# Deploy to production
npm run deploy
```

Create `.dev.vars` (never commit this file) for local secret injection:
```
APP_ADMIN_TOKEN=your-local-admin-token
SEARCHUPCDATA_API_KEY=your-searchupcdata-key
GEMINI_API_KEY=your-gemini-key
```

`.dev.vars` is already ignored via `.gitignore` if the file is listed there;  
confirm with `git check-ignore -v .dev.vars`.
