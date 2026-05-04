# 01 — Repo Inventory and Scope Agent

## Purpose
Map the inherited PantryPulse repo to the Scan-Scratch MVP.

## Inspect
- `package.json`
- `AGENTS.md`
- `CLAUDE.md`
- `public/router.js`
- `public/pages/*`
- `src/app.js`
- `src/productLookupPipeline.js`
- `src/ai/*`
- `src/tests/*`

## Classify files
Create three buckets:

### Keep for MVP
Barcode scanning, provider lookup, photo upload/OCR, API client, routing, styles, result rendering, AI provider abstraction, tests.

### Park for later
Premium gating, subscriptions, pantry inventory, meal planning, Instacart, household consensus, complex account surfaces.

### Remove only with caution
Shared auth/session code, router entries, storage helpers, and provider abstractions. Do not remove if dependencies are unclear.

## Output
- Current repo map
- MVP keep/park/remove recommendation
- high-risk dependencies
- first safe patch plan
