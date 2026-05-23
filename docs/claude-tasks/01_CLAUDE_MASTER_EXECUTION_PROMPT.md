# Claude Master Execution Prompt

You are working in the ScratchnScan / WinePantry repository.

Read the control files in `docs/` and execute them in order.

## Goal

Finish the MVP in the correct sequence without skipping broken core functionality.

Do not jump ahead to polish or QA signoff if the main user flow is still broken.

## Execution Order

1. `02_FREE_GENERATION_METER_AND_UPGRADE_GATE.md`
2. `03_PACKAGE_DRAFT_FRONT_BACK_IMAGES.md`
3. `06_CRITICAL_FLOW_REPAIR_AND_MVP_COMPLETION.md`
4. `04_MVP_DEMO_POLISH_AND_READINESS.md`
5. `05_QA_TEST_APPLICATION.md`

## Critical Rule

Before continuing past each file:
- inspect the current code
- implement the required work
- run the listed validation steps
- update docs/checklists if required
- report what was completed, what was blocked, and what still needs work

## Do Not Add Yet

Do not add these unless a task file explicitly requires them:
- Supabase
- Stripe
- RevenueCat
- n8n
- full account systems
- production billing
- fake AI provider integrations
- fake OCR / Google Vision / Gemini claims

## Required Engineering Standards

- Keep the code loosely coupled
- Avoid hardcoding provider-specific assumptions
- Keep UI behavior honest
- Never leave dead buttons or silent failures
- Prefer small, production-safe fixes over big rewrites
- Preserve local MVP storage/history behavior
- Make loading, success, empty, and error states visible to the user

## Required Behavior Standards

By the end of execution:
- Scan must either work or clearly fall back
- Create Homemade Version must not silently fail
- Generation must produce usable output from the supported inputs
- Save/history/details must work
- Docs must reflect reality, not hopes
- QA should only run after the MVP is genuinely usable

## Reporting Format For Each Task

For each completed task, report:
1. Root cause(s) found
2. Files changed
3. What was implemented
4. Validation performed
5. Remaining blockers
6. Whether the next task should proceed

## Final Acceptance Standard

The MVP is only considered ready for demo when:
- the core flow works end-to-end
- there are no silent dead actions
- the app can generate a homemade version successfully
- saved results can be reopened
- docs/readiness files accurately reflect the product state

Start with the first file in the list and do not skip `06_CRITICAL_FLOW_REPAIR_AND_MVP_COMPLETION.md`.
