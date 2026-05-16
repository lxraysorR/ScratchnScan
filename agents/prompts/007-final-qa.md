# Task 007 — Final QA

## Objective
Run final smoke verification and produce completion report.

## Do
- Run all defined lightweight checks.
- Verify checklist statuses and blocker notes.
- Produce final QA report in `qa/reports/<date>-007-final-qa.md`.
- Recommend next actions for unresolved items.

## Do Not
- No new feature implementation.
- No hidden scope expansion.

## Tests
- `npm run app:status`
- `npm run qa:smoke`
- existing app shell tests if stable in environment
