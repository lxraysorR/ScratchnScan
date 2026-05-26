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
