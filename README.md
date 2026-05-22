# ScratchNScan MVP

ScratchNScan helps users manually enter packaged food information and get a homemade alternative, then save results locally.

## Run locally

```bash
npm install
npm run preview
```

Open `http://localhost:8787`.

## MVP flow implemented

- Manual product entry (product name + ingredients required, UPC optional, notes optional)
- Homemade version generation via `/api/generate-scratch-recipe`
- Graceful local fallback recipe when AI is unavailable
- Save results to IndexedDB
- History list from IndexedDB
- Details view
- Favorite/unfavorite persistence
- Delete with confirmation

## IndexedDB usage

Data is stored in `app/js/localDb.js` under store `mvp_history` with these fields:
- `id`
- `productName`
- `upc`
- `ingredients`
- `generatedResult` (generated homemade recipe payload)
- `createdAt`
- `favorite`
- `userNotes`

The UI uses the local DB abstraction functions (`saveMvpRecipe`, `getMvpHistory`, `getMvpRecipeById`, `toggleMvpFavorite`, `deleteMvpRecipe`) so a future Supabase adapter can be added without rewriting view logic.

## What is intentionally postponed

- Supabase/cloud persistence
- Login/auth
- Billing/payments
- Camera scanning as primary path
- Non-MVP PantryPulse feature expansions

## Checks

```bash
npm test
npm run build
node scripts/test_manual_mvp_generated.mjs
```
