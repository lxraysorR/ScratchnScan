# Workflow Status

## Task
Add lightweight, free label-literacy guidance across home, manual entry, and result views.

## File-level patch plan
1. **Create reusable UI helper** in `app/js/labelTip.js` to render compact, accessible, collapsible label-tip cards with `aria-expanded` state.
2. **Wire helper into app bootstrap** in `app/js/app.js` so label tips are rendered in designated placeholders.
3. **Add placeholder containers** in `app/index.html` near:
   - Upload Package Photos start card (home)
   - manual photo/ingredient area
   - result “what app understood” context area
4. **Add theme-consistent styles** in `app/styles.css` using `label-tip*` classes.
5. **Add/update tests** in scripts to verify label-literacy copy appears, remains non-premium, and collapsible accessibility behavior exists.

## Constraints honored
- No premium gating.
- No auth/billing/Supabase changes.
- Keep manual-entry MVP behavior intact.
