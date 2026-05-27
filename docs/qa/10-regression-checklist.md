# Claude QA Prompt — Regression Checklist

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Concise final regression sweep across core MVP paths and recent changes.

## Do-not-change instructions
- QA only; do not implement fixes in this pass.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
- `npm test`
- `npm run qa:smoke` (if available)
- Optional targeted scripts tied to failing regressions.

## Core flow regression checklist
- [ ] Manual entry
- [ ] Generate
- [ ] Fallback generation
- [ ] Save
- [ ] History
- [ ] Details
- [ ] Favorite
- [ ] Delete
- [ ] Refresh persistence

## Newer-flow regression checklist
- [ ] Label literacy
- [ ] Photo-only generation
- [ ] ProductContext normalization
- [ ] Popular starters
- [ ] Scanner beta/coming-next state
- [ ] Result/details UI polish
- [ ] Storage fallback behavior

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` with explicit pass/fail for each checklist line.

## Acceptance criteria
PASS only if no blocker regressions are found in core flow and recent-change flows.
