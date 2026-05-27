# Claude QA Prompt — Result & Details UI

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Validate result and details rendering quality, accordion behavior, and record actions.

## Do-not-change instructions
- QA only; no UI redesign in this pass.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
- `npm test`
- UI/result-details specific tests if present.

## Checklist
- [ ] Approved Scratch-N-Scan theme appears consistently.
- [ ] Product detected summary appears.
- [ ] “What the app understood” panel appears.
- [ ] Confidence display supports high/medium/low/unknown.
- [ ] Quick facts render without placeholder junk.
- [ ] Generated result accordions default state:
  - [ ] Ingredients open
  - [ ] Steps open
  - [ ] Why cleaner closed
  - [ ] Tips closed
- [ ] Saved details accordions default all closed.
- [ ] Sticky mobile actions work and remain accessible.
- [ ] Save/history/favorite/delete behaviors are preserved.
- [ ] No visible `undefined`/`null`.
- [ ] Legacy saved records still render safely.

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` with a **Result UI State Table** section.

## Acceptance criteria
PASS only if both newly generated and saved details views are stable and readable.
