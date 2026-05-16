# Automation Workflow

## Purpose
Complete the MVP in small, testable, non-expanding tasks.

## Rules
- One task at a time.
- No hardcoded secrets or API keys.
- No broad refactors.
- No non-MVP feature expansion.
- Update `docs/KNOWN_ISSUES.md` for any blocker.
- Write a short task report into `qa/reports/` after each task.

## Suggested Task Sequence
1. `agents/prompts/001-project-audit.md`
2. `agents/prompts/002-mvp-completion-plan.md`
3. `agents/prompts/003-manual-lookup-flow.md`
4. `agents/prompts/004-indexeddb-history.md`
5. `agents/prompts/005-ai-scratch-recipe.md`
6. `agents/prompts/006-mobile-polish.md`
7. `agents/prompts/007-final-qa.md`

## Daily Loop
1. Run `npm run app:status`.
2. Run `npm run agent:next`.
3. Execute only the recommended prompt task.
4. Run targeted tests + `npm run qa:smoke`.
5. Update:
   - `qa/state/daily-qa-state.json`
   - `docs/KNOWN_ISSUES.md`
   - `qa/reports/<date>-<task>.md`

## Completion Rule
Do not mark MVP complete until checklist items are Done or documented as Blocked with mitigation.
