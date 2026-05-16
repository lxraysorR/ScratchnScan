# Task 001 — Project Audit

## Objective
Audit current repo state versus MVP scope and produce a minimal patch plan.

## Do
- Read: `AGENTS.md`, `CLAUDE.md`, `docs/MVP_SCOPE.md`, `docs/COMPLETION_CHECKLIST.md`.
- Inspect implementation entry points and existing storage/AI modules.
- Map what already works vs missing for MVP.
- Update checklist statuses only if supported by evidence.
- Write a short report to `qa/reports/<date>-001-project-audit.md`.

## Do Not
- Do not implement features in this task.
- Do not expand into non-MVP functionality.
- Do not expose secrets.

## Tests
- `npm run app:status`
- `npm run qa:smoke`

## Output
- Findings summary.
- File-level next patch recommendation.
- Known issues updates.
