# Claude QA Prompt — Photo Upload & Photo-Only Generation

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Photo-only generation entry paths and reliability of correction/preservation behavior.

## Do-not-change instructions
- QA only; no code changes during validation.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
- `npm test`
- `npm run qa:smoke` (if available)
- Photo/upload-specific tests if present.

## Checklist
- [ ] Front photo only can start generation without product name.
- [ ] Back photo only can start generation without product name.
- [ ] Front + back photos can start generation without product name.
- [ ] No-input state remains blocked.
- [ ] Low-confidence photo interpretation requests manual correction.
- [ ] Uploaded photos remain visible after correction step.
- [ ] Photo metadata/context is preserved through retries.
- [ ] Photo-only failures do not emit fake generic recipe output.

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` and include a **Photo Path Coverage** subsection (front-only, back-only, both, empty).

## Acceptance criteria
PASS only if photo-only paths are valid and empty-input guardrails remain enforced.
