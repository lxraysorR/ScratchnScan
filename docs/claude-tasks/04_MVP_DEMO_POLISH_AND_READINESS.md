# Task 04 — MVP Demo Polish, Docs, and Readiness Report

You are working in the ScratchnScan repository.

## Primary Task

Finish MVP demo polish, update docs/tests, and produce a readiness report.

## Important

Do not add:

- new large features
- accounts
- payment integration
- Supabase
- n8n

Do not break:

- scanner/manual/photo-placeholder flow
- IndexedDB local history
- free generation meter
- result/details/history
- favorite/delete

## Expected Application State

The application should now include:

- premium mobile-first UI
- package entry screen
- PantryPulse-style scanner foundation if already implemented
- manual fallback entry
- optional front/back package image placeholders or local image previews
- homemade recipe generation
- 10 free successful generations per device
- upgrade placeholder after free limit
- IndexedDB local history
- result/details/history
- favorite/delete

## A. QA Cleanup

Run and fix:

```bash
npm test
npm run qa:smoke
npm run build
```

Also run any available tests:

```bash
node scripts/test_manual_mvp.mjs
node scripts/test_manual_mvp_generated.mjs
node scripts/test_n8n_repo_access_generated.mjs
```

If tests are stale because the UI changed, update them to match the current customer-facing copy:

- Start with a packaged food
- Show us the package
- Front package
- Back label
- Product name or quick note
- Ingredients from package
- Preference
- Create Homemade Version
- Save to history
- Saved ideas

Do not keep tests expecting removed brand/category-first fields.

## B. Demo Script

Update `docs/DEMO_SCRIPT.md`.

The demo should show:

1. Open app.
2. Explain: “ScratchnScan turns packaged foods into homemade scratch-made alternatives.”
3. Tap “Start with a packaged food.”
4. Show front/back package tiles.
5. Explain photo capture is the future flow/currently demo-ready as placeholder or local preview.
6. Enter “mayonnaise” or use sample chip.
7. Paste ingredients if available.
8. Add preference such as “less processed.”
9. Tap “Create Homemade Version.”
10. Show result.
11. Save to history.
12. Open saved ideas.
13. Open details.
14. Favorite/delete.
15. Explain 10 free creations per device and upgrade coming later.

## C. README Update

Update `README.md` with:

- purpose of app
- current MVP features
- how to run locally with Node/NPM only:

```bash
npm install
npm run build
npx --yes serve dist --listen 3000
```

- how to test
- current storage: IndexedDB
- free generation policy: 10 successful creations per device
- what is not built yet:
  - accounts
  - cloud database
  - payment integration
  - real OCR/AI extraction
  - full native packaging
  - production scanner testing

## D. Completion Checklist

Update `docs/COMPLETION_CHECKLIST.md`.

Mark done/in progress accurately:

- front-end polish
- manual entry
- package entry photo-first layout
- scanner foundation
- local history
- free generation meter
- upgrade placeholder
- docs
- tests
- remaining native/mobile work

## E. Final App Polish

Check:

- no PantryPulse/NutraPlate user-facing names remain
- no brand/category required fields in the primary visible form
- no duplicate scan buttons
- no broken navigation
- no cramped mobile layout
- no console errors during normal flow
- buttons have clear touch targets
- image placeholders/thumbnails are sharp
- IndexedDB data persists after reload
- free generation meter persists after reload

## F. Readiness Report

Create or update:

```text
docs/MVP_READINESS_REPORT.md
```

Include:

1. What works now.
2. What was tested.
3. What is demo-ready.
4. What is still mocked/placeholder.
5. What remains for mobile/native.
6. What remains for paid upgrade.
7. Recommended next milestone.

Recommended next milestone:

```text
Native mobile packaging and scanner device testing
→ payment integration
→ optional accounts/cloud sync
```

## Validation

Run:

```bash
npm test
npm run qa:smoke
npm run build
```

## Deliverables

Report:

1. Files changed.
2. Validation command results.
3. Demo path.
4. Free generation limit behavior.
5. Confirmation no accounts were added.
6. Confirmation IndexedDB is used for now.
7. Confirmation scanner foundation uses the PantryPulse-style Capacitor ML Kit approach if scanner task is already complete.
8. Final local demo instructions.
