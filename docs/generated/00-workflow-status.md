# Workflow Status

## Task
Simplify the Generate Homemade Version page into a guided, mobile-first single-method flow with clear states for input selection, confirmation, generation progress, and friendly recovery.

## File-level patch plan
1. Update `app/index.html` manual section to add header copy, input method selector, method-specific sections, advanced/help accordions, compact confirmation card, and friendly recovery UI.
2. Update `app/js/scan.js` to manage selected input method, conditional visibility, single-CTA step behavior, confirmation state, friendly recovery actions, and popular starters empty-state visibility.
3. Update `app/styles.css` with card/tab/accordion/confirmation/progress and method-state styles while preserving existing theme and button hierarchy.
4. Update/add generated tests for visibility/state rules and friendly error recovery behavior.
5. Run targeted generated scripts plus full `npm test`.
