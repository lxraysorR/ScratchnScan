# Scan-Scratch MVP Status

_Last updated: 2026-05-26_

## Working end-to-end (manual-entry MVP)
- Manual product entry (name required; brand, category, ingredients, dietary
  preference, notes optional)
- Recipe generation: AI path when the worker is reachable, deterministic
  product/category-aware fallback otherwise
- Save to IndexedDB (`scan_scratch_local_db` / `mvp_history`)
- History list, open details, favorite/unfavorite, delete (with confirmation)
- Browser-refresh persistence via IndexedDB

## Result UI polish — implemented
- New warm Scan-Scratch theme applied globally (`app/styles.css`): cream
  background, white/cream cards, soft shadows, rounded corners, orange/rust
  accent, green success accents. CSS variables per the approved mockup, with
  legacy `--color-*` aliases so existing markup keeps working.
- Topbar with brand + subtitle ("Turn packaged foods into homemade versions").
- Result and Details pages rebuilt around a shared renderer
  (`app/js/recipeRender.js`):
  - **Product hero** (shown when product context exists) with name, brand,
    category, dietary chip, and summary. Labeled "Product entered" for manual
    entries (honest — no fake "detected").
  - **Detection confidence card** — renders only when a numeric `confidence`
    value exists; never fabricated for manual entries. Meter bar + safe helper
    text (high vs low messaging).
  - **Homemade recipe card** with "Homemade version" badge, title, summary,
    optional quick facts (method/base), and accordion sections: Ingredients,
    Steps, Why this is a cleaner version, Tips. Each section renders once;
    empty/optional sections are omitted.
  - **Detected package details panel** (Product, Brand signal, Ingredients
    read, Claims read, Source, Confidence) reflecting what the app understood.
- **Sticky bottom action bar**: Result → Edit details / Save recipe; Details →
  Back / Favorite / Delete. Existing button behavior preserved.

## Defensive rendering — implemented
- No product context → no hero, no package panel, no fake confidence; shows an
  "add product details" prompt instead.
- Empty ingredients → "Add ingredients to improve this recipe."
- Empty steps → "Recipe steps could not be generated. Please edit the product
  details and try again."
- Removed placeholder ingredient names ("Main base ingredient", etc.) from the
  fallback generator; generic fallback now uses concrete suggestions.

## Accessibility / responsiveness
- 44px+ tap targets on buttons, inputs, accordion heads, favorite star.
- `aria-expanded` on accordion section buttons; keyboard-activatable buttons.
- `overflow-x: hidden` + word-break to prevent horizontal scroll at 360px.
- Sticky CTA has safe-area bottom padding; page has bottom padding so content
  is not hidden behind it.

## Tests / build
- `npm test` — passes (app shell tokens, localDb exports, fallback recipe
  behavior, new theme fields, no banned placeholders, renderer export).
- `npm run build` — passes; copies all JS (incl. `recipeRender.js`) into `dist/`.
- Headless DOM render checks (run during development) confirmed: single Why
  section, hero/panel gating, confidence gating, empty-state notes.

## Remaining UI polish (next)
- Apply the theme's hero/card treatment to the Manual Entry and History pages
  for full visual consistency (currently restyled via shared classes but not
  restructured).
- Wire real detection/confidence/photo data once the scan + OCR pipeline lands
  (the renderer already supports `confidence`, `photoStatus`, and a non-manual
  `source`).
- Optional: persist accordion open/closed state and add subtle skeleton
  loading on the result page.

## Intentionally NOT done (out of scope)
Supabase, auth, billing, n8n, scanner/camera, framework migration,
architecture rewrite.
