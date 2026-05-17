# Task 005 — AI Scratch Recipe

## Objective
Ensure structured packaged-food explanation + homemade alternative generation aligns with contract.

## Do
- Use existing provider abstraction.
- Validate output against `docs/AI_JSON_CONTRACT.md` before UI render.
- Fail gracefully on malformed/low-confidence output.
- Update docs and QA report.

## Do Not
- No hardcoded keys.
- No free-form unvalidated output in UI.

## Tests
- AI contract validation checks.
- `npm run qa:smoke`
