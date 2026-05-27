# MVP Status (Manual-Entry Checkpoint)

## Current status
**Working MVP checkpoint reached** for the manual-entry flow on **May 26, 2026**.

The app currently supports entering packaged food details manually, generating a homemade fallback recipe without an AI key, and managing saved recipes locally.

## Completed MVP features
- Manual packaged-food entry (name required).
- Optional ingredients/notes input.
- Deterministic fallback scratch-recipe generation when AI is unavailable.
- Save generated recipe to local IndexedDB.
- History list view for saved recipes.
- Details view for saved recipes.
- Favorite/unfavorite saved recipes.
- Delete saved recipes.
- Empty history state when no records exist.
- Refresh-safe persistence via IndexedDB (saved data remains after reload).

## Known limitations
- No login/auth.
- No cloud sync; data is browser-local only.
- No Supabase persistence.
- Scanner/camera flow is not part of this checkpoint.
- No billing or subscription flows.
- AI generation may be unavailable without worker/provider config; fallback remains available.
- Scanner is in beta: native-capable devices can attempt barcode scanning; unsupported or denied-permission states route users to manual/photo entry with clear messaging.

## Manual MVP test steps
1. Open the app and go to Manual Entry.
2. Enter a packaged product name (example: "boxed mac and cheese").
3. Optionally enter ingredients/notes.
4. Generate recipe with no AI key configured; confirm a fallback recipe appears.
5. Save recipe.
6. Open History and confirm recipe appears.
7. Open Details from History.
8. Toggle favorite on/off and verify state updates.
9. Delete recipe and confirm it disappears.
10. Confirm empty-state message appears when history has no items.
11. Refresh browser and confirm saved data state remains consistent.


## Photo/product context behavior
- ProductContext normalization layer now standardizes manual, photo, popular starter, AI response, and scanner-ready product data into one shared contract.
- Photo-only upload is valid input: users can submit front photo only, back photo only, or both photos without typing a product name first.
- Photo analysis should produce product-specific recipes when package context is available.
- If photo-only extraction fails or confidence is too low, the app asks for manual product name/ingredients confirmation and retry (instead of generating misleading generic output).
- Manual text entry remains available as fallback for all users.
- Generic placeholder ingredients should never be shown to users.
- Result/details UI now includes a Product detected summary, a What-the-app-understood panel, confidence/source messaging, and sticky mobile actions.
- Generated Result defaults: Ingredients/Steps open, Why cleaner/Tips closed.
- Saved Details defaults: all recipe accordions closed by default.
- Generation orchestration is now handled by `generationController`, while `scan.js` focuses on manual form wiring and event handling.
- Durable storage plan now targets Supabase tables/media refs, with IndexedDB retained as local fallback/cache and pending-sync buffer.
