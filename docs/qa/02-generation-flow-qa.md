# Claude QA Prompt — Generation Flow

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Generation initiation, progress behavior, fallback behavior, correction flow, and output quality.

## Do-not-change instructions
- QA only; do not modify generation logic in this pass.
- Do not add features.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
- `npm test`
- `npm run qa:flow` (if available)
- `npm run qa:smoke` (if available)
- Targeted generation-related tests if present.

## Checklist
- [ ] “Generate Homemade Version” action is clickable when inputs are valid.
- [ ] Progress stages update during generation.
- [ ] No endless spinner state.
- [ ] Loading state clears on success.
- [ ] Loading state clears on deterministic fallback.
- [ ] Loading state clears on server/API error.
- [ ] Loading state clears on timeout path.
- [ ] Deterministic fallback works when AI key/provider is unavailable.
- [ ] Low-confidence correction state appears when applicable.
- [ ] User input is preserved after correction or error retry.
- [ ] Generated output avoids generic placeholder content.

### Forbidden output checks
Flag as issue if shown in user-visible result when specific product context exists:
- `packaged food`
- `Main base ingredient`
- `Whole-food flavor ingredient`
- repeated `Health goal`

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` with explicit section: **Generation State Matrix** (success/fallback/error/timeout).

## Acceptance criteria
PASS only if loading-state handling is reliable across all paths and output quality avoids forbidden placeholders.
