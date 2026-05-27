# Task 05 — Claude QA Test Prompt for ScratchnScan

You are working in the ScratchnScan repository.

## Primary Task

Perform a full QA test of the current ScratchnScan MVP after the implementation tasks are complete.

This is a QA-only pass.

## Important

Do **not** add new features unless a tiny fix is required to make an existing feature work.

Do **not** add:

- accounts
- Supabase
- Stripe
- RevenueCat
- n8n
- new backend architecture
- large redesigns

Do not fake results. If something cannot be tested, say why.

## Product Purpose to Validate

ScratchnScan should clearly help users:

```text
Turn packaged foods into homemade scratch-made alternatives.
```

The main demo flow should be:

```text
Home
→ Start with a packaged food
→ Package entry
→ Front package / back label placeholders or image previews
→ Product name or quick note
→ Ingredients from package
→ Preference
→ Create Homemade Version
→ Result
→ Save to history
→ Saved ideas
→ Details
→ Favorite / delete
```

## QA Scope

Test these areas:

1. App startup
2. Home screen clarity
3. Package entry flow
4. Photo-first UX placeholders or image previews
5. Manual product entry
6. Ingredients/preference fields
7. Sample chips
8. Homemade generation
9. Free generation counter
10. Upgrade gate after 10 successful generations
11. Save to IndexedDB history
12. History screen
13. Details screen
14. Favorite/unfavorite
15. Delete
16. Reload persistence
17. Mobile layout
18. Desktop preview layout
19. Console errors
20. Build/test scripts
21. Documentation accuracy

## Required Commands

Run:

```bash
npm install
npm test
npm run qa:smoke
npm run build
```

Also run if present:

```bash
node scripts/test_manual_mvp.mjs
node scripts/test_manual_mvp_generated.mjs
node scripts/test_n8n_repo_access_generated.mjs
```

If a command fails:

- capture the exact failure
- explain whether it is a real app issue or stale test issue
- fix stale tests only if they no longer match intentional current UI
- do not hide failures

## Manual Browser QA

Serve the built app:

```bash
npx --yes serve dist --listen 3000
```

Open:

```text
http://localhost:3000
```

### Manual Test 1 — Home Screen

Verify:

- ScratchnScan branding is visible.
- Purpose is clear within 5 seconds.
- Home copy explains packaged food to homemade alternative.
- Primary CTA is obvious.
- UI looks premium and mobile-first.
- No PantryPulse/NutraPlate user-facing text appears.

### Manual Test 2 — Package Entry

Verify:

- “Start with a packaged food” opens the entry flow.
- Front package tile appears.
- Back label tile appears.
- Product name or quick note field appears.
- Ingredients from package field appears.
- Preference field appears.
- Brand/category are not required primary fields.
- Buttons are large and easy to tap.
- Bottom navigation does not overlap content.

### Manual Test 3 — Required Product Name

Verify:

- Leave product name empty.
- Tap “Create Homemade Version.”
- App shows a clear validation message.
- No generation count is used.
- No broken state occurs.

### Manual Test 4 — Sample Chip

Verify:

- Tap sample such as “Mayonnaise.”
- Product name is filled.
- Ingredients are filled if sample supports it.
- Preference may be filled if sample supports it.
- User can edit the sample fields before generating.

### Manual Test 5 — Generation

Verify:

- Generate a homemade version.
- Result page loads.
- Recipe title is visible.
- Ingredients are visible.
- Steps are visible.
- Starter/fallback badge appears if applicable.
- Disclaimer appears but is not overwhelming.
- No console errors.
- Successful generation count increases by exactly 1.

### Manual Test 6 — Save and Details

Verify:

- Save to history works.
- Saved ideas page shows the item.
- View details opens.
- Details page shows:
  - original product context
  - recipe title
  - ingredients
  - steps
  - favorite/delete/back actions

### Manual Test 7 — Favorite

Verify:

- Favorite an item.
- Favorite state is visible.
- Unfavorite works.
- State persists after navigating away and back.
- Reload the page and confirm persistence if expected by IndexedDB implementation.

### Manual Test 8 — Delete

Verify:

- Delete an item.
- Item is removed from history.
- Empty state appears if no items remain.
- Delete does not corrupt other saved items.

### Manual Test 9 — Free Generation Limit

Clear browser storage or use a fresh profile.

Verify:

- Starting usage shows 10 free creations or equivalent copy.
- Generate 1 item.
- Remaining count becomes 9.
- Continue until 10 successful generations are used.
- Attempt an 11th generation.
- Upgrade gate appears.
- No new result is generated after limit.
- History remains accessible.
- Details remain accessible.
- Favorite/delete remain accessible.
- No signup/account is required.
- No payment is actually charged.

### Manual Test 10 — Reload Persistence

Verify after page reload:

- saved history remains
- favorite state remains
- usage count remains
- current UI does not crash
- no duplicate saved cards appear

### Manual Test 11 — Mobile Layout

Use browser dev tools or responsive mode.

Test widths:

```text
360px
375px
390px
414px
```

Verify:

- no horizontal scrolling
- no overlapping buttons
- bottom nav does not cover primary actions
- text is readable
- cards are not cramped
- image placeholders/thumbnails are sharp
- touch targets are at least about 44px tall

### Manual Test 12 — Desktop Preview

Verify:

- app still looks acceptable on desktop browser
- mobile app shell or centered layout looks intentional
- no stretched low-quality icons/images

### Manual Test 13 — Scanner Behavior If Present

If scanner foundation exists:

Verify:

- scanner button does not crash in browser
- unavailable scanner path gives friendly fallback copy
- manual entry remains available
- no duplicate scan button appears
- no infinite scan retry loop occurs
- canceled/failed scan does not count as a free generation

If native scanner cannot be tested in this environment, state that native device testing is still required.

## Documentation QA

Check:

- `README.md`
- `docs/DEMO_SCRIPT.md`
- `docs/COMPLETION_CHECKLIST.md`
- `docs/MVP_READINESS_REPORT.md`

Verify docs match current reality.

Docs should not claim production features that are still placeholders.

## Required QA Report

Create or update:

```text
docs/QA_REPORT.md
```

Include:

1. Date/time of QA run.
2. Environment:
   - OS if known
   - Node version
   - browser if known
3. Commands run and results.
4. Manual test results.
5. Bugs found.
6. Fixes applied during QA, if any.
7. Blockers.
8. Remaining risks.
9. Final recommendation:
   - Demo-ready
   - Demo-ready with caveats
   - Not demo-ready

## Acceptance Criteria

The MVP is acceptable for a front-end demo if:

- Home clearly explains the product.
- User can create a homemade version from manual/sample input.
- User can save/view/details/favorite/delete.
- Free limit works.
- Upgrade gate appears after 10 successful generations.
- IndexedDB/local persistence works.
- Build passes.
- No major console errors occur in normal flow.
- Mobile layout is clean.

The MVP is **not** acceptable if:

- generation fails
- save/history/details fail
- free limit blocks users incorrectly before 10 successful generations
- upgrade gate blocks history/details
- app crashes on reload
- mobile layout is badly broken
- docs claim features that are not built

## Final Response

Report back with:

1. Overall QA verdict.
2. Commands run.
3. Pass/fail table for each manual test.
4. Bugs fixed.
5. Bugs remaining.
6. Whether the app is ready for Lamar to demo.
7. Next recommended task.
