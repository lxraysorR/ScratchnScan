# ScratchnScan — UX Improvement Backlog

**Reviewed by:** Senior UX + front-end perspective (40-year practitioner lens applied to codebase)
**Date:** 2026-05-28
**Branch target:** each item is a self-contained prompt, run one at a time

Status values: `[ ]` Not Started · `[~]` In Progress · `[x]` Done · `[!]` Blocked

---

## Executive UX assessment

### What is working well
- Clear, focused product idea: packaged food → homemade version.
- Warm cream / green / gold visual system feels more premium than plain white.
- Multiple entry paths already exist: barcode, photos, typed, popular.
- Progress component (`progress.js`) with 5 stages is already built.
- Result screen has good structural bones: badges, product summary, understood panel, quick facts, recipe, tips, sticky action bar.
- Local persistence works; history renders thumbnails.
- Mobile-first shell is solid.

### What still reads as MVP
| Issue | Where |
|-------|--------|
| Hero says "Pick how you want to start." — developer-speak, not aspirational | `index.html` line 50 |
| Section header copy is planning language, not user language | `index.html` line 60–61 |
| "Saved ideas" vs "Saved recipes" inconsistency | `index.html` lines 309, 317–320 |
| "homemade swaps" vs "homemade version" inconsistency | `index.html` lines 304, 320 |
| Typed mode has no visible ingredients field (textarea is `hidden`) | `index.html` line 211 |
| Low-confidence state reads as an error, not guided correction | `index.html` lines 215–221 |
| "Why this is healthier" risks medical/liability implication | `result.js` line 134, `index.html` line 266 |
| `result.js` quick-fact Time still hardcoded "35–50 min" | `result.js` line 119 (missed from U-02) |
| Result screen shows Product/Understood panels **before** the recipe | `index.html` lines 255–258 vs 270–278 |
| History card shows product name as title, recipe as subtitle — backwards | `history.js` lines 79–80 |
| Delete button is same prominence as View / Favorite in history | `history.js` line 91 |
| Desktop breakpoint renders phone-in-frame only; no two-column layout | `styles.css` lines 1282–1292 |
| `window.scratchnscan.dev` exposed on production hostname | `app.js` |
| Upgrade screen ghost buttons say "View saved ideas" | `index.html` line 309 |
| "Saved ideas" in upgrade ghost CTA and aria-label | `index.html` lines 309, 317 |

---

## Prompt-ready improvement items

Work through **one item per session** in the order shown. Each prompt is labeled with the files it touches and a `[RISK]` tag (LOW = no behavior change / MEDIUM = UI change / HIGH = logic change).

---

### VIS-00 `[QUICK FIX]` `result.js` time still hardcoded — missed from U-02
- **Files:** `app/js/result.js` line 119
- **Problem:** `details.js` was fixed in U-02 to compute time from `prepTimeMinutes + cookTimeMinutes`, but `result.js` still uses `"35–50 min"`.
- **Fix:** Apply the identical IIFE pattern: `${(() => { const t = (record.scratchRecipe?.prepTimeMinutes || 0) + (record.scratchRecipe?.cookTimeMinutes || 0); return t > 0 ? \`${t} min\` : "Varies"; })()}`
- **Risk:** LOW — pure display fix, no logic change.
- **Status:** `[ ]`

---

### VIS-01 `[COPY]` Brand name and user-facing copy consistency pass
- **Files:** `app/index.html`, `app/js/usage.js`, `app/js/history.js`
- **Problem:** The app mixes naming styles:
  - "Saved ideas" (history h2, aria-label, upgrade ghost CTA) vs. intended "Saved recipes"
  - "homemade swaps" (upgrade title, history subtext) vs. "homemade version" / "homemade recipes"
  - "ScratchnScan Plus" eyebrow on upgrade screen — fine, but redundant next to a hidden button
  - "Your local recipe playbook for cleaner homemade swaps." — sounds rough
  - usage.js line 101: "Free creations used. Upgrade coming soon." — not encouraging
  - Upgrade screen ghost buttons: "View saved ideas" → "View saved recipes"; "Edit existing recipes" → "Start another recipe"
- **Fix:**
  - `index.html` line 309: `View saved ideas` → `View saved recipes`
  - `index.html` line 317: `aria-label="Saved ideas"` → `aria-label="Saved recipes"`
  - `index.html` line 319: `<h2>Saved ideas</h2>` → `<h2>Saved recipes</h2>`
  - `index.html` line 320: `"Your local recipe playbook for cleaner homemade swaps."` → `"Your homemade versions, saved locally on this device."`
  - `index.html` line 304: `"Keep creating homemade swaps"` → `"Keep creating homemade versions"`
  - `index.html` line 310: `"Edit existing recipes"` → `"Start another recipe"`
  - `usage.js` line 101: `"Free creations used. Upgrade coming soon."` → `"You've used your 10 free recipes. More coming."`
- **Risk:** LOW — copy only, zero behavior change.
- **Status:** `[ ]`

---

### VIS-02 `[COPY]` Home screen hero is developer-speak, not customer language
- **Files:** `app/index.html` lines 49–62
- **Problem:**
  - `eyebrow`: "Homemade alternatives in seconds" — decent but passive
  - `h1`: "Pick how you want to start." — internal planning language
  - Section header: "Start with one clear path" — sounds like a UX spec doc
  - Section sub: "Separate scanner, photos, and manual details so it never feels like one crowded form." — developer rationale, not user benefit
- **Recommended replacement:**
  ```
  eyebrow:  "Real ingredients. No packaged shortcuts."
  h1:       "Turn packaged snacks into homemade recipes."
  section:  "Choose how to add your packaged food"
  sub:      "Start with a barcode, package photos, typed details, or a popular example."
  ```
- **Risk:** LOW — copy only, zero behavior change.
- **Status:** `[ ]`

---

### VIS-03 `[UX]` Expose ingredients field in typed mode
- **Files:** `app/index.html` lines 166–176, 209–212
- **Problem:** Typed mode only shows `Product name` and `Preference`. The ingredients textarea (`#ingredients-input`) is present in the HTML but has `hidden` and zero visibility to the user. Users who want to paste the ingredient list from the back of a package have no way to do so in typed mode — they have to switch to photos mode.
- **Fix:**
  - Add a visible `<textarea>` to the typed-mode panel (between Preference and the existing hidden `#ingredients-input`)
  - Label: `Ingredients or package text` with `(optional)` suffix
  - Placeholder: `Paste the ingredients list from the back of the package.`
  - Helper: `More detail = more accurate homemade version.`
  - Wire the visible textarea to keep `#ingredients-input` in sync (or replace the hidden input with this one)
  - Do NOT change generation logic — the field feeds the existing `ingredientsText` pipeline
- **Risk:** MEDIUM — adds visible UI, but the underlying field already exists and is already read by `productContext.js`.
- **Status:** `[ ]`

---

### VIS-04 `[UX]` Low-confidence correction: reframe as guided step, not error
- **Files:** `app/index.html` lines 215–221
- **Problem:** The `#manual-friendly-error` div reads as a failure:
  > "We could not identify this product with confidence. You can still continue by entering the product name."
  
  This makes the user feel the app broke. In reality, a photo was read successfully but needs more detail — a normal, recoverable state.
- **Recommended copy:**
  ```
  <strong>Help us confirm this package</strong>
  <p>We found some label details but need a little more to create the best homemade version. Add the product name or ingredient list below.</p>
  ```
- **Fix:** Update heading and body copy in the `#manual-friendly-error` div. Keep the two action buttons unchanged — they are already correct.
- **Risk:** LOW — copy only.
- **Status:** `[ ]`

---

### VIS-05 `[UX]` Progress: add a reassurance sub-line below the stage list
- **Files:** `app/index.html` line 234–236, `app/js/progress.js` lines 44–57
- **Problem:** The generation progress is technically solid (5 staged steps) but gives no time expectation. Users staring at a spinner for 5–15 seconds may think the app froze.
- **Fix:**
  - Add a `gp-note` element to the progress component HTML output (after the stage list) with text:
    `"This usually takes a few seconds. Your details stay here if we need you to review anything."`
  - Style as `font-size: 12px; color: var(--text-muted); margin-top: 10px; text-align: center;`
  - No change to timing logic.
- **Risk:** LOW — additive UI only.
- **Status:** `[ ]`

---

### VIS-06 `[UX]` Result screen: recipe-first layout order
- **Files:** `app/index.html` lines 250–298, `app/js/result.js` lines 103–121
- **Problem:** The result screen currently renders in this order:
  1. Badges
  2. Title, original, summary
  3. **Product detected** (card)
  4. **What the app understood** (panel)
  5. **Quick facts** (method / time / base)
  6. Health goal
  7. Why this is healthier (accordion)
  8. **Ingredients** (accordion)
  9. **Steps** (accordion)
  10. Tips (accordion)
  
  The recipe payoff (ingredients + steps) is buried after two trust panels. Users want to see the recipe immediately; the trust panels should support, not precede it.
- **Recommended order:**
  1. Badges
  2. Title, original, summary
  3. Quick facts
  4. **Ingredients** (open)
  5. **Steps** (open)
  6. Health goal
  7. Tips (accordion)
  8. What the app understood (collapsible, closed by default)
  9. Product detected (collapsible, closed by default)
  10. Why this is cleaner (accordion)
- **Fix:** Reorder elements in `index.html` inside `#view-result article`. No JS change needed — `result.js` populates by element ID, not DOM order.
- **Risk:** MEDIUM — DOM reorder. Test that sticky action bar still appears at bottom and that all IDs are present.
- **Status:** `[ ]`

---

### VIS-07 `[UX]` "Why this is healthier" → "Why this is cleaner" + heading case
- **Files:** `app/index.html` line 266, `app/js/result.js` line 134, `app/js/details.js` (search for `whyHealthier`), `src/worker.js` (AI prompt and validation)
- **Problem:**
  - "Why this is healthier" implies medical/nutritional claims the app cannot legally back.
  - The AI contract field is already called `whyCleaner` in newer code (result.js line 133 checks `whyHealthier || whyCleaner`).
  - `index.html` and `result.js` still display the label "Why this is healthier".
  - Section headings use inconsistent casing (`H3` style: "Ingredients", "Steps", but "Why this is healthier" is fine sentence case — just wrong word).
- **Fix:**
  - `index.html` line 266: `Why this is healthier` → `Why this is cleaner`
  - `result.js`: any hardcoded label using "healthier" → "cleaner"
  - `details.js`: same
  - Worker AI prompt: ensure `whyCleaner` is the primary field name (not `whyHealthier`)
- **Risk:** LOW for UI; MEDIUM for worker prompt — verify AI still returns the field correctly.
- **Status:** `[ ]`

---

### VIS-08 `[UX]` History view: "recipe library" polish
- **Files:** `app/js/history.js` lines 59–93, `app/index.html` lines 317–331
- **Problem:**
  - History h3 shows product name, p shows recipe title — this is backwards. The recipe is the value; the original product is the context.
  - "Delete" button (`btn-danger btn-small`) is same size/prominence as "View Details" (`btn-primary btn-small`) — destructive action should not compete with primary action.
  - No source indicator (manual/photo/barcode) on history card.
  - Section heading "Saved ideas" (partially fixed in VIS-01 for copy, this item handles card layout).
- **Fix:**
  - `history.js` lines 79–80: flip — `<h3>` should show recipe title, `<p class="history-product">` should show `From: ${productName}`
  - Replace `btn-danger btn-small` Delete button with a low-emphasis text link or icon-only button with `aria-label="Delete recipe"`. Move below primary action row.
  - Add source badge: if `r.source === "photos"` → "Photo scan"; `"scan"` → "Barcode"; `"manual"` → "Typed"
- **Risk:** MEDIUM — cosmetic card layout change. Verify click handlers remain on correct elements.
- **Status:** `[ ]`

---

### VIS-09 `[UX]` Desktop layout: two-column home + wider app shell
- **Files:** `app/styles.css` lines 1281–1292
- **Problem:** Desktop breakpoint (`@media min-width: 720px`) renders the app as a phone-shaped frame centered on screen. This is fine for a mobile demo, but if a reviewer opens the app on a laptop, the home screen looks like a narrow prototype.
- **Current behavior:** `body: padding 24px 0; overflow: hidden; .app: border-radius 28px, max-height`.
- **Recommended additions (additive — does not break mobile):**
  - At `min-width: 900px`, render a two-column home layout: left = hero + CTAs; right = app preview frame (the phone shell).
  - Give the outer shell a `max-width: 1100px; margin: auto` desktop wrapper.
  - Keep all inner views mobile-width so the actual app flow still looks native.
  - This is a **desktop landing wrapper**, not a redesign of the app views.
- **Mockup:**
  ```
  ┌──────────────────────────────────────────────────────┐
  │  Left column (400px)            Right column (400px) │
  │  Turn packaged snacks into      ┌──────────────────┐ │
  │  homemade recipes.              │  phone-frame app │ │
  │                                 │  (existing shell)│ │
  │  [Create homemade version]      │                  │ │
  │  [Browse popular starters]      └──────────────────┘ │
  └──────────────────────────────────────────────────────┘
  ```
- **Risk:** LOW — additive CSS only, does not affect mobile or existing screens.
- **Status:** `[ ]`

---

### VIS-10 `[REFACTOR]` Extract shared `resultComponents.js`
- **Files:** `app/js/result.js`, `app/js/details.js`
- **Problem:** Both files duplicate:
  - `escapeHtml()`
  - `confidenceText(productContext)`
  - `renderAccordion(section, openByDefault)`
  - Product summary HTML template
  - "What the app understood" rows HTML template
  - Quick facts HTML template
  - Badge rendering logic
- **Fix:** Create `app/js/resultComponents.js` and export:
  ```js
  export function escapeHtml(str) {}
  export function confidenceText(productContext) {}
  export function renderAccordion(section, openByDefault) {}
  export function renderProductSummary(container, productContext) {}
  export function renderUnderstoodPanel(container, productContext) {}
  export function renderQuickFacts(container, recipe, productContext) {}
  export function renderBadgeRow(container, { fallbackUsed }) {}
  ```
  Both `result.js` and `details.js` import from there.
- **Risk:** MEDIUM — refactor; must not change any rendered output. Write before/after snapshot tests first.
- **Status:** `[ ]`

---

### VIS-11 `[SECURITY/HYGIENE]` Guard `window.scratchnscan.dev` to localhost only
- **Files:** `app/js/app.js` (search for `window.scratchnscan`)
- **Problem:** Dev helper (`resetUsageForDev`, `setLocalPremiumUnlockedForDev`, `getUsageState`) is attached to `window.scratchnscan` unconditionally. Any user who opens DevTools on production can call these.
- **Fix:**
  ```js
  if (location.hostname === "localhost" || location.hostname.includes("127.0.0.1")) {
    window.scratchnscan.dev = { resetUsage: resetUsageForDev, ... };
  }
  ```
  Remove `dev` helpers from the production `window.scratchnscan` object entirely.
- **Risk:** LOW — no user-visible change; dev tools still work on local.
- **Status:** `[ ]`

---

### VIS-12 `[UX]` Demo mode: clean up dead ends for hackathon review
- **Files:** `app/index.html` lines 301–313, `app/js/app.js` line 149, `app/js/usage.js` line 101
- **Problem:** When a reviewer hits the usage cap:
  - They see the Upgrade screen with a `hidden` button (no action available) and two ghost CTAs.
  - The "Upgrade coming soon" toast still fires from `app.js` line 149 even though the button is hidden — if the button is `hidden` this code path is dead.
  - For demo purposes, the upgrade wall should feel warm and informative, not like a dead end.
- **Fix:**
  - Upgrade screen: add a friendly hero line — "You've hit the free limit. Paid tier coming soon."
  - Add a clear "Reset for demo" link (`data-action="dev-reset"`) that only renders when `location.hostname === "localhost"` or `?demo=1` query param present.
  - Remove the dead `#upgrade-coming-soon-btn` click listener from `app.js` line 148–150 (button is `hidden`, listener fires on nothing).
  - For the hackathon/demo URL, add `?demo=1` support that bypasses the cap entirely (dev-only bypass, not production bypass) — one-line guard in `canGenerate()`.
- **Risk:** MEDIUM — touches usage logic. Guard with hostname/param check; no behavior change on production hostname.
- **Status:** `[ ]`

---

## Visual design principles (apply throughout)

These are not separate prompts but guardrails for all changes above.

### Color role map
```
Green   = trusted, detected, saved, success signal
Gold    = primary action, creation, generate
Cream   = calm background surfaces
Red     = destructive action only (delete, error)
```
Do not use red for anything other than irreversible destructive actions.

### Typography
- Section headings: sentence case, no ALL-CAPS labels in user-visible UI
- Badge copy: short (1–3 words), no internal jargon ("MVP", "fallback", "Local")
- Helper text: 12–13px, muted color, always optional/additive — never blocking

### Spacing rhythm
```css
.screen > * + * { margin-top: 20px; }
.card + .card    { margin-top: 14px; }
```
Let cards breathe. Avoid stacked flat boxes with no visual gap.

### Accordions
- **Open by default:** Ingredients, Steps
- **Closed by default:** Why this is cleaner, Tips, What the app understood
- Use `renderAccordion(section, openByDefault)` consistently across result and details screens

---

## Architecture notes (for later, not immediate prompts)

These items are tracked in `PRODUCTION_READINESS.md` under Refactor but included here for UX context.

| Item | Files | UX impact |
|------|-------|-----------|
| R-06 — `scan.js` state via `hidden` toggle | `scan.js` lines 68–94 | Flow bugs when adding new states |
| R-05 — Duplicate render loops | `result.js` lines 152–160 | Should move to `resultComponents.js` (VIS-10) |
| R-09 — History `busy` flag leak | `history.js` line 108 | Stuck UI after failed delete |
| R-04 — `JSON.parse` unguarded in `result.js` | `result.js` lines 85–87 | Crash on corrupted storage |

---

## Execution order (recommended)

```
VIS-00  Quick fix — result.js time hardcode             < 5 min
VIS-01  Copy consistency pass                           < 15 min
VIS-02  Home hero rewrite                               < 10 min
VIS-04  Low-confidence correction reframe               < 10 min
VIS-03  Expose ingredients in typed mode                ~30 min
VIS-06  Result screen recipe-first order                ~20 min
VIS-07  "Why this is cleaner" rename                    ~20 min
VIS-08  History card polish                             ~30 min
VIS-05  Progress reassurance line                       < 15 min
VIS-09  Desktop two-column layout                       ~45 min
VIS-11  Dev helper guard                                < 10 min
VIS-12  Demo mode cleanup                               ~30 min
VIS-10  Shared resultComponents.js (last — riskiest)    ~90 min
```

---

## What is NOT in scope here

These are intentionally deferred to Phase 2 / BACKLOG.md:

- Full "Input → Review → Generate" wizard with progress steps shown above form
- Supabase cloud sync
- RevenueCat / Stripe payment
- Native Capacitor build
- OCR for ingredients (currently manual text entry)
- Share as image card
- i18n / localization
