# ScratchnScan MVP

**ScratchnScan turns packaged foods into homemade scratch-made alternatives.**
Snap (or describe) a packaged food, and the app produces a simple
scratch-made recipe with ingredients, steps, and smart swaps. It runs
fully on-device — no account, no cloud, no payment.

## Run locally (Node / NPM only)

```bash
npm install
npm run build
npx --yes serve dist --listen 3000
```

Then open: <http://localhost:3000>

For quick checks you can also open `app/index.html` directly in a browser.

## UI design previews

The approved **home / start-flow** UI concept lives as a standalone, static
HTML preview — no npm, build step, or dev server required:

```
docs/ui/scratch-n-scan-home-flow-preview.html
```

To view it, just open that file directly in any browser (double-click it, or
drag it into a browser tab). It is a design reference only and is **not** wired
into the production app.

See `docs/UI_ROADMAP.md` for how the two UI tracks (home/start-flow vs.
result/details) fit together and why they are kept as separate screens.

## Test

```bash
npm test           # app shell + localDb + usage meter + manual fallback
npm run qa:smoke   # required-files / scripts smoke check
npm run build      # writes app/ -> dist/
npm start          # prints local start hint
```

Optional integration probes:

```bash
node scripts/test_manual_mvp.mjs
node scripts/test_manual_mvp_generated.mjs
node scripts/test_n8n_repo_access_generated.mjs
```

## Current MVP features

- Mobile-first home, package entry, result, history, and details screens.
- Package entry with **front package** and **back label** photo tiles
  (capture/replace/remove, compressed local preview thumbnails).
- **Scan a package** button that opens the native camera barcode scanner
  on installed (Capacitor) builds, and falls back honestly to manual/photo
  entry in a plain browser instead of pretending to scan.
- Manual product name, ingredients-from-package text, and preference fields.
- Optional UPC/barcode input with a visible captured-barcode banner that
  carries scan context into manual entry.
- Sample chips that prefill a known packaged food (Mayonnaise, Ranch,
  Ketchup, Mac & cheese, Granola bar).
- AI-assisted homemade recipe with a deterministic fallback when the AI
  provider is unreachable.
- Save / view / favorite / delete saved ideas, persisted locally in
  IndexedDB.
- **10 free successful homemade creations per device.** After the limit,
  a polished upgrade screen appears and new generation is blocked, but
  history, details, favorite, and delete keep working.


## Manual-entry MVP quick test

1. Run `npm install` then `npm run build`.
2. Start locally with `npm start` (prints the recommended static serve command).
3. Open the app and enter a product name in Manual Entry.
4. (Optional) Add ingredients/notes and generate.
5. If no AI key/provider is configured, a deterministic fallback recipe is generated so the flow still works.
6. Save the result, then verify History, Details, Favorite toggle, Delete, and Empty state.
7. Refresh the browser and confirm saved data is still present (IndexedDB local persistence).

## Storage

All persistence is local to the browser via IndexedDB.

- DB name: `scan_scratch_local_db` (version `4`)
- Saved ideas store: `mvp_history`
- Usage meter store: `scratchnscan_usage_meter`
  (singleton row keyed by `"singleton"`)

The usage meter row matches:

```js
{
  id: "singleton",
  freeGenerationLimit: 10,
  successfulGenerationCount: 0,
  firstUsedAt: null,
  lastGeneratedAt: null,
  isLocalPremiumUnlocked: false,
  updatedAt: null,
}
```

Only successful homemade generations count. Opening the app, opening the
scanner view, cancelled scans, failed scans, viewing history, opening
details, editing a saved idea, and favorite/delete actions are **not**
counted.

### Dev-only console helpers

These exist for development only and are not surfaced in the customer UI.
Run them in DevTools:

```js
await scratchnscan.dev.resetUsage();      // clears the meter
await scratchnscan.dev.unlockPremium();   // bypasses the limit
await scratchnscan.dev.getUsage();        // inspects current state
```

## Free generation policy

- 10 successful homemade creations per device.
- The counter only increments after a generated result actually exists.
- AI-provider errors fall back to the deterministic recipe builder and
  still count (the user did receive a result). Validation failures
  (missing product name) do **not** count.
- Pricing displayed on the upgrade screen ($4.99/mo, $29.99/yr) is a
  placeholder. No payment provider is wired in.

## Configuration

The app reads no secrets in the browser. The optional Cloudflare worker
(see `src/worker.js`, `wrangler.jsonc`) proxies an AI provider; keys are
worker secrets only.

- `VITE_SCAN_SCRATCH_API_BASE` — base URL for the AI worker when the
  frontend is served from a different origin (defaults to same origin).

## What is not built yet

- Accounts / login / signup.
- Cloud database or sync (Supabase, etc.).
- Real payment integration (Stripe, RevenueCat).
- Real OCR / AI extraction from the photos (today they live as local
  previews only — the generator still uses typed text plus a flag noting
  which photos were attached).
- Native mobile packaging / app-store builds. The Capacitor barcode
  scanner is wired (`scannerService.js` + `capacitorBarcodeScannerAdapter.js`)
  and works inside a native build; a plain browser cannot scan and routes
  to manual entry.
- Production-grade scanner device testing.
- n8n automation flows.

These are deferred to the next milestone:

```
Native mobile packaging and scanner device testing
  → payment integration
  → optional accounts / cloud sync
```
