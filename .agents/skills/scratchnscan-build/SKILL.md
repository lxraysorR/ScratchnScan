# Scan-Scratch Build Skill

## When to use this skill
Use this skill for every Scan-Scratch planning, coding, QA, or review task.

## Product definition
Scan-Scratch turns packaged foods into simple homemade alternatives. The app starts with a UPC scan. If UPC data is incomplete or unavailable, it reads front-label and ingredient-label photos. AI then identifies the food, explains the packaged product, and creates a cleaner homemade version using everyday ingredients.

## Core workflow
```text
Open app
  -> scan UPC or enter barcode
  -> provider lookup
  -> if found, build product snapshot
  -> if missing/incomplete, request label/ingredient photos
  -> AI identifies product and ingredients
  -> AI generates homemade alternative JSON
  -> UI renders explanation + recipe + swaps + safety notes
```

## Engineering principles
- Keep the first version small and demo-ready.
- Reuse PantryPulse scanning/provider code carefully.
- Remove or hide PantryPulse product complexity that does not serve this MVP.
- Validate AI output before rendering.
- Fail gracefully when UPC lookup, photo reading, or AI generation fails.
- Use mobile-first design.
- Keep medical and health claims cautious.

## Key inherited files to inspect
- `src/server.js`
- `src/app.js`
- `src/productLookupPipeline.js`
- `src/nutritionService.js`
- `src/openFoodFactsApiClient.js`
- `src/goUpcApiClient.js`
- `src/providers/photoOcrClient.js`
- `src/ai/*`
- `public/api.js`
- `public/router.js`
- `public/pages/scan.js`
- `public/pages/nutrition.js`
- `public/pages/home.js`
- `public/styles.css`

## MVP business rules
- UPC scan is the first path.
- Label-photo fallback must be visible from the not-found state.
- Users must see selected image thumbnails before generating.
- The app must explain uncertainty when product identity is unclear.
- Homemade recipe output must be structured and safe.
- Do not require login for first hackathon demo unless code already requires it.
- Do not introduce subscriptions in the MVP.

## AI prompt requirements
The backend prompt should ask the model to:
- identify the product type
- summarize what the packaged item is
- identify notable ingredient patterns
- create a homemade alternative using common ingredients
- explain why it is less processed
- state taste/texture expectations honestly
- include safety/disclaimer text
- return only JSON matching `docs/AI_JSON_CONTRACT.md`

## Testing expectations
Add or update tests for:
- successful UPC product snapshot
- UPC not-found state
- photo fallback request path
- AI JSON parsing/validation
- unsafe or low-confidence AI output
- mobile result rendering where practical

## Anti-scope-drift checklist
Before finishing, confirm you did not add or expand:
- household consensus
- paid subscriptions
- pantry inventory
- shopping checkout
- meal planning calendar
- broad scoring rewrite
- unrelated account logic
