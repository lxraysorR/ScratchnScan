# Claude QA Prompt — Accessibility & Mobile

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Responsive and accessibility checks across key viewport widths and core interaction patterns.

## Do-not-change instructions
- QA only; do not redesign UI in this pass.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
- `npm test`
- Any a11y/responsive scripts if available.
- Browser/devtools checks if environment supports them.

## Required widths
- 360px
- 375px
- 390px
- 414px
- tablet
- desktop

## Checklist
- [ ] No horizontal scrolling at required widths.
- [ ] Sticky bars do not cover critical content.
- [ ] Interactive buttons are at least 44px height.
- [ ] Forms are readable and usable.
- [ ] Accordions use real button elements.
- [ ] `aria-expanded` updates correctly.
- [ ] Text/background contrast is readable.
- [ ] Keyboard focus states are visible.
- [ ] Labels are programmatically associated with inputs.
- [ ] Destructive actions are not visually primary.

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` and include a **Viewport Findings Matrix**.

## Acceptance criteria
PASS only if mobile-first usability and baseline accessibility behaviors are verified as acceptable.
