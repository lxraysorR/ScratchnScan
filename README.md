# ScratchNScan

## Manual MVP Flow

### Install
- `npm install`

### Run locally
- `npm run preview`
- Open `http://localhost:8787`

### Test manual product entry flow
1. Open app and click **Start Manual Entry**.
2. Leave Product name empty and submit. Expected: `Please enter a product name.`
3. Fill Product name, leave Ingredients empty, submit. Expected: `Please add ingredients so we can create a homemade version.`
4. Fill Product name + Ingredients (+ optional UPC/brand/category/notes) and click **Create Homemade Version**.
5. Confirm result card shows summary, processed note, homemade name, ingredients, steps, swaps, storage tips, and confidence note.
6. Click **Save to History**. Expected: `Saved to History.`
7. Go to **Back to History**. Confirm newest saved item appears first.
8. Open saved item, toggle favorite, and delete item.

### Environment variables
Required for real worker AI/API behavior:
- `GEMINI_API_KEY`
- `SEARCHUPCDATA_API_KEY`
- `APP_ADMIN_TOKEN`

Optional for MVP local manual flow:
- None. The app uses a temporary local fallback generator when the AI endpoint fails or is unavailable.
