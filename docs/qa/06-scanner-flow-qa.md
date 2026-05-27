# Claude QA Prompt — Scanner Flow (Beta vs Coming Next)

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Validate scanner-state honesty, UI consistency, and fallback behavior.

## Do-not-change instructions
- QA only; do not implement scanner features in this pass.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
- `npm test`
- Search scanner-related handlers and UI states.

## Checklist
- [ ] Scanner state is explicit: **Beta enabled** or **Coming Next**.
- [ ] No mismatch between `scan-coming-soon` and `scan-start-btn` behavior/state.
- [ ] Visible scan button behavior is honest to current implementation.

### If scanner is Beta-enabled
- [ ] Visible scan button invokes scanner handler / `scannerService.startScan` path.
- [ ] Unsupported device gracefully falls back to manual/photo entry.
- [ ] Permission denied gracefully falls back to manual/photo entry.
- [ ] Captured barcode is preserved in context/session.

### If scanner is Coming Next
- [ ] UI clearly states “Coming Next”.
- [ ] No fake active scanning button appears.
- [ ] Manual/photo alternatives are clearly presented.

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` and include a **Scanner Mode Verdict** section.

## Acceptance criteria
PASS only if scanner messaging and behavior are consistent and user-safe.
