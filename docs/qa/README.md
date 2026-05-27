# Scratch-N-Scan QA Prompt Pack

This folder contains **Claude-ready QA prompts** for focused validation passes on Scratch-N-Scan.

## How to use this pack
- Run **one QA prompt file at a time**.
- Keep scope limited to the file being executed.
- QA agent should **verify behavior and report findings**, not implement changes.
- QA agent should **not add new features during QA**.
- After issues are found, QA agent should draft **separate Codex fix prompts**.
- Codex should implement fixes in separate tasks/PRs.

> Required note for all QA runs: **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Recommended run sequence
1. `01-smoke-test.md`
2. `02-generation-flow-qa.md`
3. `03-photo-upload-qa.md`
4. `04-product-context-qa.md`
5. `05-popular-starters-qa.md`
6. `06-scanner-flow-qa.md`
7. `07-result-details-ui-qa.md`
8. `08-storage-supabase-indexeddb-qa.md`
9. `09-accessibility-mobile-qa.md`
10. `10-regression-checklist.md`

## Output standard
Use `REPORT_TEMPLATE.md` for every QA pass so results are comparable across runs.
