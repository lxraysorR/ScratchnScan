# Claude Master QA Runbook — Scratch-N-Scan

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Run a full, evidence-based QA pass across repo health, MVP behavior, and focused feature checklists.

## Do-not-change instructions
- Do not add features.
- Do not refactor production behavior.
- Do not silently patch defects while QAing.
- Do not hide failures.
- Do not classify missing unrelated scripts as app failures without context.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Execution steps
1. Inspect repository layout and identify app entry points.
2. Install dependencies if needed.
3. Check available npm scripts before running commands.
4. Run available verification commands.
5. Verify main MVP flow end-to-end:
   - manual/product input or scanner path
   - optional label photos
   - generation
   - result/details
   - save/history behavior
6. Run each focused QA checklist in this folder (`01` through `10`).
7. Produce a prioritized QA report.
8. For each blocker/high-priority issue, create a **separate Codex fix prompt**.

## Commands to run (only if script exists)
- `npm install`
- `npm test`
- `npm run build`
- `npm run qa:smoke`
- `npm run qa:flow`

If any command is missing:
- Document it under “Commands Run” as not available.
- Explain whether it affects confidence.

## Focused checklist order
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

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` exactly.

## Acceptance criteria
- All available commands executed and outcomes captured.
- Missing commands clearly documented.
- Main MVP flow verified with evidence.
- Each focused checklist addressed.
- Issues prioritized by severity.
- Separate Codex fix prompts provided for blockers/high issues.
