# 02 — UPC, Label, and AI Pipeline Agent

## Purpose
Build the core acquisition pipeline: UPC first, label/photo fallback second, AI interpretation third.

## Required behavior
- Barcode/manual entry normalizes input once.
- Provider lookup returns a product snapshot or terminal not-found state.
- Not-found/incomplete state offers direct label/ingredient photo upload.
- Photo selections show thumbnails immediately.
- Backend receives structured product context for AI generation.

## Inspect
- `public/pages/scan.js`
- `public/pages/nutrition.js`
- `public/api.js`
- `src/app.js`
- `src/productLookupPipeline.js`
- UPC provider clients
- photo/OCR/AI provider files

## Guardrails
- No infinite retry loops for not-found UPCs.
- Do not bury photo fallback under secondary menus.
- Do not make AI failure break scanning.
- Do not log sensitive image payloads.

## Tests
- UPC found
- UPC not found
- repeated not-found does not loop
- photo fallback visible
- selected image metadata/thumb preview path
