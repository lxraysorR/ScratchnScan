# Scan-Scratch Codex Agent Instructions

These instructions apply to the entire Scan-Scratch repository.

## Product mission
Scan-Scratch helps people turn packaged foods into simple homemade alternatives. The app scans a UPC or reads product-label photos, identifies the packaged food, explains what it is in plain English, and creates a cleaner homemade version using everyday ingredients.

## Primary build rule
Keep the first version intentionally small. Do not rebuild all of PantryPulse. Reuse PantryPulse foundation only where it directly supports the MVP:

1. barcode/manual UPC entry
2. product lookup/provider fallback
3. label/ingredient photo upload
4. AI product identification and ingredient interpretation
5. homemade alternative generation
6. simple result/history view
7. mobile-friendly UX

Everything else goes to backlog unless explicitly requested.

## Current technical inheritance from PantryPulse
Assume the starting codebase is forked from PantryPulse/NutraPlate unless code proves otherwise:

- backend runtime: Node/CommonJS
- backend entry: `src/server.js`
- main app/router: `src/app.js`
- frontend entry: `public/app.js`
- API client: `public/api.js`
- router: `public/router.js`
- scan page: `public/pages/scan.js`
- nutrition/detail page: `public/pages/nutrition.js`
- styling: `public/styles.css`
- provider pipeline: `src/productLookupPipeline.js`, `src/nutritionService.js`, UPC provider clients
- AI-related files may already exist under `src/ai/` and provider modules
- tests live under `src/tests/` and `test/`

## Non-negotiable MVP boundaries
Codex must not expand scope without being told.

Do not prioritize these in the first pass:

- subscriptions or RevenueCat
- household consensus
- full nutrition scoring rebuild
- Instacart/shopping checkout
- pantry inventory
- meal planning calendar
- complex account system
- store submission polish
- large design-system rewrite

Keep only what supports Scan-Scratch’s main workflow:

`Scan UPC or upload label -> identify product -> explain packaged item -> generate cleaner homemade alternative -> save/share result later.`

## Required workflow before editing
For every non-trivial task:

1. Read this file.
2. Read `CLAUDE.md` if the work will later be reviewed by Claude.
3. Read `.agents/skills/scan-scratch-build/SKILL.md`.
4. Read the most relevant `.agents/*/AGENT.md` file.
5. Inspect the exact implementation files before editing.
6. Create or update `docs/generated/00-workflow-status.md` for larger tasks.
7. Produce a file-level patch plan before changing code.
8. Make the smallest safe patch.
9. Run relevant tests/build checks.
10. Document blockers honestly.

## Implementation discipline
- Reuse before creating new code.
- Keep backend business rules centralized.
- Keep AI output structured and validated before showing it to users.
- Never expose API keys or raw secrets.
- Do not log user-uploaded images or sensitive text labels unnecessarily.
- Make label-photo flows safe, clear, and optional.
- Use plain-English health language. Do not give medical advice or guarantee safety.
- Do not claim a homemade version is healthier unless the reasoning is clearly explained.
- Add tests for new scan, label, AI contract, recipe generation, and error states.

## AI provider rule
Use the existing AI/provider abstraction if present. If adding one, keep it thin and configurable through environment variables. Prefer a provider/model setting such as:

- `LLM_PROVIDER`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `VISION_MODEL`

Never hardcode secrets or model keys.

## Scan-Scratch output contract
AI-generated result objects must be structured, not free-form prose. Use the contract in `docs/AI_JSON_CONTRACT.md`.

## Completion standard
A task is complete only when:

- the MVP workflow still works end-to-end
- barcode/manual entry and label-photo paths behave predictably
- AI output is validated before display
- errors are clear and recoverable
- mobile layout works on narrow screens
- tests/build are run or blockers are documented
- no unrelated PantryPulse feature was accidentally broken or expanded

## Final response handoff format
Codex must end with:

1. Goal completed
2. Files changed
3. Tests/checks run
4. What was intentionally left out of MVP
5. Risks or follow-up items
6. Suggested Claude review prompt, when appropriate
