# Scan-Scratch Build Skill

## When to use this skill
Use this skill for every Scan-Scratch planning, coding, QA, or review task.

## Product definition
ScratchnScan turns packaged foods into simple homemade alternatives.
The app starts with a UPC scan or a product name. If UPC data is incomplete
or unavailable, it reads front-label and ingredient-label photos. AI then
identifies the food, explains the packaged product, and creates a cleaner
homemade version using everyday ingredients.

## Core workflow
```text
Open app
  -> scan UPC or enter product name / ingredient text
  -> if UPC entered: provider lookup (SearchUPCData)
  -> if found, build product snapshot
  -> if missing/incomplete: request front + back label photos
  -> AI (Gemini via Cloudflare Worker) identifies product and ingredients
  -> AI generates homemade alternative JSON (docs/AI_JSON_CONTRACT.md)
  -> UI renders explanation + recipe + swaps + safety notes
  -> User saves to local history (IndexedDB)
```

## Current architecture (post-PantryPulse rewrite)

```
app/                     — static frontend (Cloudflare Assets)
  index.html             — SPA shell; all views as <section> elements
  js/
    api.js               — fetch wrapper for /api/* endpoints
    scan.js              — scan screen controller (states: entry/confirm/creating)
    scanCoordinator.js   — barcode cooldown guard
    generationController.js — orchestrates AI generation flow
    generationPayload.js — builds request body for /api/generate-scratch-recipe
    packageEntry.js      — package entry form (name, UPC, photos, preferences)
    packageImages.js     — image compression (canvas resize → JPEG)
    productContext.js    — normalizes product data across scan + AI sources
    recipeGenerator.js   — deterministic offline fallback recipe builder
    recipeStorage.js     — storage adapter (IndexedDB + optional Supabase)
    localDb.js           — IndexedDB CRUD (DB_VERSION 4)
    result.js            — result screen renderer
    details.js           — saved details screen renderer
    history.js           — history list renderer
    usage.js             — free generation meter (10 limit, dev unlock)
    platform.js          — Capacitor/browser platform detection
    photoTiles.js        — front/back photo tile components
    labelTip.js          — photo label hint bar
    popularChips.js      — popular product starter chips
    manualRecipe.js      — manual wizard step controller
    progress.js          — generation progress UI
    upc.js               — UPC barcode formatting/validation
    app.js               — app bootstrap, view routing, bottom nav
    router.js            — hash-based view router

src/
  worker.js              — Cloudflare Worker (all backend routes)

design-system/           — canonical design tokens, components, previews
  SKILL.md               — invoke for any design work
  ui_kits/scratchnscan-app/  — React/JSX component prototypes (not shipped)

docs/
  AI_JSON_CONTRACT.md    — required AI response shape and validation rules
  MVP_SCOPE.md           — in-scope / out-of-scope boundaries
  PRODUCTION_READINESS.md — numbered production checklist (work here)
  COMPLETION_CHECKLIST.md — MVP acceptance criteria
  KNOWN_ISSUES.md        — tracked blockers and known gaps
  BACKLOG.md             — out-of-scope work for future phases
```

## Engineering principles
- Keep the version small and demo-ready.
- Never rebuild PantryPulse features that do not serve the MVP workflow.
- Validate AI output before rendering — use the contract in `docs/AI_JSON_CONTRACT.md`.
- Fail gracefully: every error state must be recoverable without a reload.
- Use mobile-first design; test at 360–414 px viewport width.
- Keep medical and health claims cautious; never guarantee safety or diagnose.
- Reuse before creating. Three similar lines is better than a premature abstraction.
- No comments except where the WHY is non-obvious.

## Worker endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/lookup-upc` | POST | SearchUPCData lookup by barcode |
| `/api/generate-scratch-recipe` | POST | Gemini-backed recipe generation |
| `/api/popular-items` | GET | Seed list for popular starters |

All routes are unauthenticated in MVP. Rate limiting is a P1 production gap
(see `docs/PRODUCTION_READINESS.md` item S-01).

## MVP business rules
- UPC scan is the first path; manual product name is always available.
- Label-photo fallback (front + back) must be reachable from not-found state.
- Users must see selected image thumbnails before generating.
- Low-confidence AI identification shows the `#manual-friendly-error` card
  with two specific CTAs: "Enter product name" and "Try photos again".
  Do NOT show a generic "Try again" button alongside those two CTAs.
- Homemade recipe output must be structured JSON, validated before display.
- 10 free generations per device; only successful completions count.
- No login required for the free tier MVP.
- No payment provider is wired in — upgrade screen is a placeholder.

## AI prompt requirements
The backend prompt must ask the model to:
- identify the product type
- summarize what the packaged item is in plain English
- identify notable ingredient patterns (sweeteners, oils, preservatives, etc.)
- create a homemade alternative using common ingredients
- explain why it is less processed (not "healthier")
- state taste/texture expectations honestly
- include safety/disclaimer text
- return **only** JSON matching `docs/AI_JSON_CONTRACT.md`

## Testing expectations
Add or update tests for:
- successful UPC product snapshot
- UPC not-found state
- correction-needed / low-confidence path
- photo fallback request path
- AI JSON parsing and validation against contract
- unsafe or low-confidence AI output
- generation cap enforcement (canGenerate returns false at limit)
- mobile result rendering where practical

Run before every commit:
```bash
npm run check:syntax
npm test
npm run qa:smoke
```

## Anti-scope-drift checklist
Before finishing any task, confirm you did not add or expand:
- [ ] Household consensus features
- [ ] Paid subscription flows (Stripe / RevenueCat)
- [ ] Pantry inventory tracking
- [ ] Shopping cart / Instacart integrations
- [ ] Meal planning calendar
- [ ] Broad nutrition scoring rebuild
- [ ] Complex account / auth system
- [ ] Native app packaging (Capacitor — Phase 2)
- [ ] Design system rewrite
- [ ] Design system files outside `design-system/` (the `.claude/skills/scratchnscan-design/` copy is redundant — do not update it; see D-01 in PRODUCTION_READINESS.md)

## Production readiness reference
All known gaps are tracked in `docs/PRODUCTION_READINESS.md`.
Work through items in priority order, one at a time.
Critical blockers before any public launch: S-01, S-02, S-03, S-04, U-01.
