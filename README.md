# ScratchNScan

Turn packaged foods into simple homemade alternatives.

Worker URL: `https://scratchnscan.layr-sor.workers.dev`

---

## Testing manual UPC entry (frontend)

1. Open the app: `https://scratchnscan.layr-sor.workers.dev` (or `http://localhost:8787` locally)
2. Click **Scan / Enter UPC** on the home screen.
3. If your device has no camera or `BarcodeDetector` support, manual entry appears automatically.
4. Enter one of these test UPCs in the input field:
   - `049000028904` — Coca-Cola Classic (12 fl oz can)
   - `012000001772` — Pepsi Cola
   - `028400064057` — Lay's Classic Potato Chips
5. Click **Look up product**.
6. On success, the product name, brand, UPC, and ingredients appear.
7. A record is saved to browser IndexedDB with `inputMethod: "manual"`.
8. Click **Make from scratch** — a placeholder note appears (recipe generation is the next phase).
9. Click **Scan another item** to return to the scan view.

### What to check
| Scenario | Expected result |
|---|---|
| Valid 12-digit UPC | Product card shown |
| UPC with spaces/dashes (e.g. `049000 028904`) | Stripped and accepted |
| Letters in input (e.g. `abc123`) | Validation error before any API call |
| Wrong digit count (e.g. `12345`) | Validation error before any API call |
| UPC not in database | "Product not found" message with the UPC shown |
| Network error | Error message with instructions to retry |

---

## Testing the API

### /api/health — open in any browser

```
https://scratchnscan.layr-sor.workers.dev/api/health
```

Expected response:
```json
{ "ok": true, "service": "scratchnscan" }
```

---

### /api/admin/status — without a token (should fail)

```bash
curl https://scratchnscan.layr-sor.workers.dev/api/admin/status
```

Expected response (HTTP 401):
```json
{ "ok": false, "error": "Unauthorized" }
```

### /api/admin/status — with the correct token (should succeed)

```bash
curl -H "Authorization: Bearer YOUR_APP_ADMIN_TOKEN" \
     https://scratchnscan.layr-sor.workers.dev/api/admin/status
```

Expected response (HTTP 200):
```json
{
  "ok": true,
  "service": "scratchnscan",
  "admin": true,
  "secrets": {
    "APP_ADMIN_TOKEN": "set",
    "SEARCHUPCDATA_API_KEY": "set",
    "GEMINI_API_KEY": "set"
  }
}
```

### /api/lookup-upc — valid UPC

```bash
curl -X POST https://scratchnscan.layr-sor.workers.dev/api/lookup-upc \
     -H "Content-Type: application/json" \
     -d '{"upc":"049000028904"}'
```

Expected response (HTTP 200):
```json
{
  "ok": true,
  "product": {
    "upc": "049000028904",
    "name": "Coca-Cola Classic",
    "brand": "Coca-Cola",
    "category": "...",
    "ingredients": "...",
    "imageUrl": "..."
  }
}
```

### /api/lookup-upc — invalid UPC (wrong digit count)

```bash
curl -X POST https://scratchnscan.layr-sor.workers.dev/api/lookup-upc \
     -H "Content-Type: application/json" \
     -d '{"upc":"12345"}'
```

Expected response (HTTP 400):
```json
{ "ok": false, "error": "Invalid UPC" }
```

### /api/lookup-upc — UPC not in database

Expected response (HTTP 404):
```json
{ "ok": false, "error": "Product not found" }
```

### /api/lookup-upc — provider key missing (misconfiguration)

Expected response (HTTP 500):
```json
{ "ok": false, "error": "Search provider is not configured" }
```

### /api/lookup-upc — provider unreachable or error

Expected response (HTTP 502):
```json
{ "ok": false, "error": "Lookup provider failed", "providerStatus": 503 }
```

---

## Required Cloudflare secrets

Set once via Wrangler CLI — never committed to the repo:

```bash
wrangler secret put APP_ADMIN_TOKEN
wrangler secret put SEARCHUPCDATA_API_KEY
wrangler secret put GEMINI_API_KEY
```

## Local development

Create `.dev.vars` in the repo root (already gitignored):

```
APP_ADMIN_TOKEN=your-local-token
SEARCHUPCDATA_API_KEY=your-key
GEMINI_API_KEY=your-key
```

The frontend API client uses relative URLs by default (`/api/...`), so it works with `wrangler dev` at `localhost:8787` without any extra configuration.

If you run the frontend on a separate port (e.g. Vite on `:5173`), create a Vite `.env.local` file pointing at the deployed worker:
```
VITE_SCAN_SCRATCH_API_BASE=https://scratchnscan.layr-sor.workers.dev
```

```bash
npm install
npm run preview   # starts local worker at http://localhost:8787
npm run deploy    # deploys to Cloudflare
```

---

## Codex bootstrap note

Upload `SCRATCHNSCAN_CODEX_BOOTSTRAP_PROMPT.md` into Codex and attach the Scan-Scratch Agent Pack zip if you want Codex to reuse the earlier agent files.
