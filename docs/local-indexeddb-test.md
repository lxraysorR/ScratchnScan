# Scan-Scratch — Local IndexedDB Manual Test Checklist

This is the end-to-end smoke test for the manual UPC + IndexedDB MVP flow.
Run through it in a real browser (Chrome or Edge recommended). DevTools →
Application → IndexedDB → `scan_scratch_local_db` lets you inspect every
store as you go.

## Setup

1. Install once:
   ```
   npm install
   ```
2. Run the shell tests:
   ```
   npm test
   ```
3. Start a local preview against the Cloudflare Worker (uses real
   `/api/lookup-upc`):
   ```
   npm run preview
   ```
   Or serve `app/` with any static server if you only want to test the
   IndexedDB UI behaviour with a fake/blocked network.

## Stores expected after first lookup

Open DevTools → Application → IndexedDB → `scan_scratch_local_db`. You
should see all six object stores created on first init:

- `scan_history`
- `product_cache`
- `product_rescue`
- `homemade_recipes`
- `app_events`
- `settings`

## Manual checklist

1. [ ] Open the app. The home page renders.
2. [ ] Click `Scan / Enter UPC` → the scan view appears with the manual
   UPC form (or the camera hint if `BarcodeDetector` is available).
3. [ ] Enter a valid UPC (e.g. `012000001772`).
4. [ ] The Lookup button disables and a "Looking up product…" state
   shows briefly.
5. [ ] On success, the result view opens with name / brand / barcode.
   - `scan_history` has a row with `status: "found"`.
   - `product_cache` has a row keyed by `normalizedBarcode`.
6. [ ] Return to the scan view and enter the same UPC again.
7. [ ] The result view opens instantly (cache hit).
   - A new `scan_history` row exists with `status: "cached"`.
   - `app_events` has an entry with `eventType: "cache_hit"`.
8. [ ] Enter a fake UPC (e.g. `999999999999`).
9. [ ] No fake nutrition data or fake score is shown anywhere.
10. [ ] The "No product details found for this barcode" panel appears
    with the entered barcode and an `Add Product Info` button.
    - `scan_history` has a row with `status: "not_found"`.
    - `product_rescue` has a `draft` row for that barcode.
11. [ ] Click `Add Product Info`. The rescue form appears.
12. [ ] Fill in product name / brand / ingredients → `Save draft`.
13. [ ] "Draft saved locally." confirmation appears.
    - The `product_rescue` row is updated in place (same barcode →
      no duplicate row).
14. [ ] Recent lookups list shows the latest entries (found, cached,
    not_found) with status pills.
15. [ ] Stop the worker / drop offline. Enter a valid UPC.
    - `scan_history` has a row with `status: "error"`.
    - `app_events` has an entry with `eventType: "lookup_error"`.
    - The app stays usable (no retry loop, no crash).
16. [ ] Hard-refresh the browser. Recent lookups persist (IndexedDB is
    durable).
17. [ ] In DevTools, run from the console:
    ```js
    const m = await import('./js/localDb.js');
    await m.clearLocalData();
    ```
    Refresh — history list returns to the empty state without errors.

## Negative checks (must NOT regress)

- [ ] No `score 0/100` rendered for not-found items.
- [ ] No fake nutrition card with zeros.
- [ ] No infinite retry loop on network failure.
- [ ] No console errors on first load when IndexedDB upgrade runs.
- [ ] Disabling IndexedDB (e.g. private browsing in some browsers) does
  not crash the app — the form still submits and renders results.
