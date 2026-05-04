# Scan-Scratch Implementation Plan

## Build strategy
Start from the PantryPulse codebase, but do not carry forward the full product. Treat PantryPulse as a foundation for scanning, UPC lookup, mobile layout, and provider wiring. Scan-Scratch should become a separate, focused app with a smaller promise.

## Recommended sequencing

### Phase 0 — Repo fork and safety setup
- Create a new repo or branch named `scan-scratch`.
- Keep PantryPulse private/protected.
- Update project branding only in obvious user-facing places first.
- Add this agent pack to the repo root.
- Run baseline checks before editing:
  - `npm install`
  - `npm test`
  - `npm run build`

### Phase 1 — Product shell cleanup
Goal: make the app feel like Scan-Scratch without breaking inherited code.

Tasks:
- Update app name, title, manifest text, and main home copy.
- Create a simple home page focused on the core CTA: `Scan packaged food`.
- Hide or park PantryPulse pages that are not MVP-critical.
- Keep routes available only if needed to avoid breaking navigation.

Likely files:
- `public/index.html`
- `public/manifest.json`
- `public/app.js`
- `public/router.js`
- `public/pages/home.js`
- `public/styles.css`

### Phase 2 — Core scan and fallback flow
Goal: UPC first, photo fallback second.

Tasks:
- Keep camera scan/manual entry.
- On successful lookup, move user to Scan-Scratch result page.
- On not found/incomplete result, show direct fallback: upload front label + ingredient/back label.
- Show thumbnails immediately after file selection.
- Provide clear buttons: `Generate homemade version`, `Scan another item`.

Likely files:
- `public/pages/scan.js`
- `public/pages/nutrition.js` or new `public/pages/result.js`
- `public/api.js`
- `src/app.js`
- `src/productLookupPipeline.js`

### Phase 3 — AI contract and backend endpoint
Goal: return structured homemade-alternative JSON.

Tasks:
- Add backend endpoint such as `POST /api/scan-scratch/homemade-alternative`.
- Accept barcode, product snapshot, optional product name, optional label OCR/vision payload, and selected images if supported.
- Call AI provider through a thin provider abstraction.
- Validate AI JSON before returning it.
- Return safe fallback error copy if AI fails.

Likely files:
- `src/app.js`
- `src/ai/*`
- `src/services/homemadeAlternativeService.js`
- `src/tests/homemadeAlternative*.test.js`

### Phase 4 — Homemade alternative result UI
Goal: demo-ready result page.

Result page sections:
- Product identified
- What this packaged food is
- Ingredients we noticed
- Homemade version
- Ingredients
- Steps
- Why this is less processed
- Taste/texture expectation
- Time and difficulty
- Scan another item

Likely files:
- `public/pages/result.js` or `public/pages/nutrition.js`
- `public/router.js`
- `public/api.js`
- `public/styles.css`

### Phase 5 — QA/demo hardening
Goal: stable hackathon demo.

Tasks:
- Create demo UPC list and label-photo test list.
- Add unit tests for AI contract parsing and fallback states.
- Add mobile smoke test checklist.
- Test on desktop Chrome and at least one mobile device/browser.
- Create a short demo script.

Likely files:
- `src/tests/*`
- `qa/*`
- `docs/DEMO_SCRIPT.md`

## Implementation rule for Codex first, Claude second
Use Codex for small focused patches. Use Claude after each phase to review scope drift, safety, tests, and UX polish.

Recommended loop:
1. Give Codex one phase prompt.
2. Run checks.
3. Give Claude the changed files and review prompt.
4. Apply only critical Claude fixes.
5. Move to the next phase.

## Current primary task
Do Phase 0 and Phase 1 first. Do not build the AI engine until the project shell and scan flow are stable.

