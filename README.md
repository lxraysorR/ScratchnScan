# ScratchNScan MVP (Manual Entry First)

## Run locally
- `npm install`
- `npm start` (local serve hint)
- `npm run preview` (Cloudflare worker preview, if needed)

## Manual-entry MVP flow
1. Open the app and click **Start Manual Entry**.
2. Enter a packaged product name (ingredients and notes are optional).
3. Click **Generate scratch recipe**.
4. On the result screen, click **Save to history**.
5. Open **History** to view saved recipes.
6. Open any item for **Details**, then favorite/unfavorite or delete.

## No AI key behavior
If no AI provider/key is configured or API is unavailable, the app uses a deterministic local fallback recipe generator so the manual-entry flow still works.

## Local persistence
Saved MVP recipes are persisted locally in browser IndexedDB (`scan_scratch_local_db`, `mvp_history` store).
