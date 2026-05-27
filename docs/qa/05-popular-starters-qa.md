# Claude QA Prompt — Popular Starters

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Validate shared starter source usage, prefill behavior, editability, and fallback generation.

## Do-not-change instructions
- QA only; do not replace or redesign starter logic during this pass.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
- `npm test`
- Search code paths for starter data source usage.

## Checklist
- [ ] One shared popular starter source exists.
- [ ] Home “Popular Right Now” uses shared source.
- [ ] Manual “Popular Starters” uses shared source.
- [ ] Duplicate hardcoded starter lists are removed where practical.
- [ ] Clicking starter pre-fills product name.
- [ ] Clicking starter pre-fills category.
- [ ] Clicking starter pre-fills ingredients/package text.
- [ ] Clicking starter pre-fills preference/health goal.
- [ ] Starter selection can create ProductContext with source `popular`.
- [ ] Manual edits after prefill still work.
- [ ] Fallback generation from starter path works.

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` with a **Starter Source Consistency** subsection.

## Acceptance criteria
PASS only if starter source is shared and both UI surfaces behave consistently.
