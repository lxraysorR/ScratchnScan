# Claude Master Execution Prompt — ScratchnScan

You are working in the ScratchnScan repository.

## Mission

Read and execute the task files in this folder in order:

1. `02_FREE_GENERATION_METER_AND_UPGRADE_GATE.md`
2. `03_PACKAGE_DRAFT_FRONT_BACK_IMAGES.md`
3. `04_MVP_DEMO_POLISH_AND_READINESS.md`
4. `05_QA_TEST_APPLICATION.md`

Complete the tasks carefully, one file at a time.

## Important Rules

- Do **not** add login/auth yet.
- Do **not** add Supabase or any cloud database yet.
- Do **not** add Stripe or RevenueCat yet.
- Do **not** add n8n.
- Do **not** expose or hardcode secrets.
- Do **not** break the existing manual-entry MVP.
- Do **not** remove IndexedDB local history.
- Do **not** rename the product away from ScratchnScan.
- Keep customer-facing language clean, simple, and premium.
- Keep the app mobile-first.
- Keep this focused on finishing a demo-ready MVP.

## Product Position

ScratchnScan helps users turn packaged foods into homemade scratch-made alternatives.

Target user flow:

```text
Home
→ Start with a packaged food
→ Package entry / scan / photo-first screen
→ Front package photo placeholder or local preview
→ Back label photo placeholder or local preview
→ Product name or quick note
→ Ingredients from package
→ Preference
→ Create Homemade Version
→ Result
→ Save to local history
→ Saved ideas
→ Details
→ Favorite / delete
```

## Current Product Decision

Accounts are intentionally deferred.

For now:

```text
Storage: IndexedDB / local browser storage
Free usage: 10 successful homemade creations per device
Upgrade: polished placeholder only
Payment: later
Cloud sync: later
```

## Execution Process

For each task file:

1. Read the file fully.
2. Inspect the current repo before changing code.
3. Identify the smallest safe changes needed.
4. Make the changes.
5. Run the validation commands requested by that file.
6. Fix failures caused by your changes.
7. Document what changed.

## Required Final Response

When all task files are complete, report:

1. Files changed.
2. Features implemented.
3. Validation commands run and results.
4. Manual test results.
5. Whether the app is demo-ready.
6. Remaining gaps for the next phase.
7. Any risk or issue that still needs Lamar’s review.

## Validation Commands

Run these whenever practical:

```bash
npm test
npm run qa:smoke
npm run build
```

Also run these if present:

```bash
node scripts/test_manual_mvp.mjs
node scripts/test_manual_mvp_generated.mjs
node scripts/test_n8n_repo_access_generated.mjs
```

If a test is stale because the UI has changed, update the test to match the new current UI. Do not fake test results.

## Local Demo Instructions

Use Node/NPM only:

```bash
npm install
npm run build
npx --yes serve dist --listen 3000
```

Then open:

```text
http://localhost:3000
```
