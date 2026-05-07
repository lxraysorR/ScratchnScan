# ScratchNScan

Turn packaged foods into simple homemade alternatives.

Worker URL: `https://scratchnscan.layr-sor.workers.dev`

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

```bash
npm install
npm run preview   # starts local worker at http://localhost:8787
npm run deploy    # deploys to Cloudflare
```

---

## Codex bootstrap note

Upload `SCRATCHNSCAN_CODEX_BOOTSTRAP_PROMPT.md` into Codex and attach the Scan-Scratch Agent Pack zip if you want Codex to reuse the earlier agent files.
