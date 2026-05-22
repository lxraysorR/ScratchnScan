# ScratchNScan MVP (Manual Entry First)

Turn packaged foods into simple homemade alternatives. This first cut is a
local-only manual-entry MVP: enter a product, generate a "scratch version"
of it, and save the result in your browser. No login, no cloud, no payments.

## Run locally

```
npm install
npm run build    # copies app/ -> dist/
npm start        # prints how to open the static shell
npm test         # smoke checks app/index.html + localDb + fallback recipe
```

For local development you can open `app/index.html` directly in a browser,
or serve the `app/` directory with any static file server (the app does not
require the Cloudflare Worker to run). The worker preview is available via
`npm run preview` if you want to exercise the AI proxy.

## MVP workflow

1. **Home** -> tap **Start Manual Entry** (or use the header nav).
2. **Manual Entry** -> enter a packaged product name (required). Optional:
   brand, category, ingredients text, dietary preference, notes.
3. Tap **Generate Scratch Version**.
4. **Result** -> the app shows a homemade alternative. Tap **Save to history**
   to persist it locally; you'll land on the saved record's Details page.
5. **History** -> review saved recipes, favorite/unfavorite, or delete
   (with confirmation).
6. **Details** -> see the full saved scratch recipe; favorite or delete.

## Fallback (no AI provider configured)

If the Cloudflare Worker AI endpoint is unreachable or returns no recipe,
the app uses a deterministic local fallback in `app/js/manualRecipe.js`.
The fallback:

- matches common product names (mayonnaise, ketchup, ranch, granola, bread,
  mac and cheese, yogurt, ...) to category-aware templates;
- falls back further to a category template (condiment, dressing, snack,
  bakery, ...) when no specific match is found;
- otherwise emits a generic ingredient/step skeleton;
- adds a dietary tip when a preference is selected.

Fallback recipes are clearly labeled in the Result and Details views as a
starter suggestion, not an exact copy of the packaged product.

## Local storage

Saved recipes live in IndexedDB:

- **DB**: `scan_scratch_local_db`
- **Store**: `mvp_history` (keyed by `id`, indexed by `createdAt` and
  `favorite`)

Each saved record has:

```
id, source, createdAt, updatedAt,
productName, brand, category, ingredientsText, dietaryPreference, notes,
recipeTitle, recipeIngredients, recipeSteps, scratchRecipe (full object),
fallbackUsed, favorite (alias: isFavorite),
upc (reserved for the barcode flow; empty for manual entries)
```

You can clear everything with `clearLocalData()` from the dev console.

## Configuration

The app reads no secrets in the browser. Optional environment values:

- `VITE_SCAN_SCRATCH_API_BASE` - base URL for the AI worker when serving the
  frontend from a different origin (defaults to same origin / empty).

The Cloudflare Worker side (see `src/worker.js`, `wrangler.jsonc`) takes its
provider keys from worker secrets (`wrangler secret put OPENROUTER_API_KEY`,
etc.). **Do not commit `.dev.vars`** - put any local keys there and rely on
`.gitignore`. If `.dev.vars` does not exist yet, create it as needed; the
MVP works without it via the deterministic fallback.

## What this MVP does **not** include

Held back per `docs/MVP_SCOPE.md`:

- Login / accounts
- Supabase or any cloud sync
- n8n automation
- Barcode scanning (manual UPC entry only, via a future task)
- Subscriptions / paid gating
- Design-system rewrite

These will be picked up in later tasks once the manual MVP is stable.
