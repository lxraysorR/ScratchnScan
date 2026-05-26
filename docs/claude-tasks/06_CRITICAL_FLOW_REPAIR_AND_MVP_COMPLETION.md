# Task 06 — Critical Flow Repair and MVP Completion

You are working in the ScratchnScan / WinePantry repository.

## Primary Task

Fix the broken core user flow so the MVP is actually usable before any more polish or QA signoff.

## Blocking Issues Reported

1. Tapping **Scan** does nothing.
2. Selecting front/back package photos and then tapping **Create Homemade Version** does nothing.
3. It is unclear whether AI generation is actually implemented.
4. It is unclear whether any Google-based API integration exists or is wired correctly.
5. The app cannot be considered demo-ready until the main generation path works.

## Mission

Inspect the repository and determine exactly:
- what is broken
- what is stubbed
- what is missing
- what is blocked by missing env/secrets
- what is truly implemented versus assumed

Then fix the MVP in the smallest safe way.

## Important Rules

- Do not add Supabase, Stripe, RevenueCat, or n8n.
- Do not fake AI/OCR/image extraction.
- Do not claim Google Vision, Gemini, ML Kit, or any other provider works unless it is actually implemented and verified.
- Do not break IndexedDB/local history.
- Stay focused on finishing a working MVP.

## What Must Work After This Task

### A. Scan button behavior

When the user taps **Scan**:
- If scanner support is implemented and available, open the scanner flow.
- If scanner is not available in the current environment, show a clear fallback message and route the user into manual/package entry.
- The button must never appear dead.
- No silent failures.

### B. Create Homemade Version behavior

When the user taps **Create Homemade Version**:
- Validate required fields clearly.
- If generation logic exists, run it and navigate to results.
- If image inputs are present, include them as optional context when supported.
- If image OCR/AI is not implemented, generation must still work from supported text inputs such as product name, ingredients, and preference fields.
- The button must never do nothing silently.
- Show loading state, success state, and failure state.

### C. AI / generation audit

Inspect and report:
- Is homemade generation real logic, mock logic, fallback logic, or missing?
- Which function/module is responsible?
- What inputs are required?
- What output shape is expected?
- What currently prevents result rendering?

If generation is partially implemented:
- fix the wiring
- fix async handling
- fix navigation/state updates
- fix result rendering

If generation is missing:
- implement a safe local fallback generator so the MVP still works for demo purposes
- label fallback behavior honestly in comments/docs where appropriate

### D. Google / provider audit

Inspect and report:
- whether Google Vision, Gemini, ML Kit, or any Google API is actually wired into this repo
- where env vars or secrets are expected
- whether the current flow depends on missing secrets
- whether a missing API key is causing a silent no-op

If Google-based image extraction is not actually implemented:
- do not pretend it is
- ensure the UI still works without it
- add a TODO in docs for future image intelligence integration

## Required Fix Areas

Inspect at minimum:
- scan button click handler
- package entry component/page
- front/back image selection handlers
- create homemade version submit handler
- validation logic
- loading state handling
- async generation call
- result page navigation/rendering
- console/runtime errors
- local storage / IndexedDB save path
- any feature flags or missing env guards

## UX Requirements

- Buttons must give feedback immediately.
- While generating, show a visible loading state.
- On error, show a human-readable message.
- On success, navigate to the result/details screen.
- Do not let a click fail silently.

## Docs Updates Required

Update these files after fixing:
- `docs/COMPLETION_CHECKLIST.md`
- `docs/MVP_READINESS_REPORT.md`
- `README.md`

Mark accurately:
- scan flow: done / partial / blocked
- photo flow: done / partial / blocked
- homemade generation: done / partial / blocked
- AI extraction: not implemented yet unless truly working
- Google API integration: not implemented yet unless truly working

## Validation Commands

Run:

```bash
npm install
npm test
npm run qa:smoke
npm run build
