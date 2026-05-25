# ScratchnScan QA Report

## 1. Run metadata

- Date: 2026-05-23 (second pass, same day — adds live execution evidence)
- Branch: `claude/friendly-meitner-0nLSX` (PR #27)
- OS: Linux 6.18.5 x86_64 (Claude Code on-the-web sandbox)
- Node: v22.22.2
- Browser: No Chromium/Firefox binary is available in this remote-execution
  sandbox. **This pass added a real-DOM execution harness** using `jsdom`
  + `fake-indexeddb` (`npm run qa:flow` → `scripts/qa-browser-flow.mjs`)
  that imports the actual `app/js/*` module graph against the real
  `app/index.html`, drives every nav tab and CTA, completes the manual
  entry → generate → save → details → history → delete flow, and reads
  IndexedDB directly to confirm persistence. **33/33 checks pass.** This
  closes the persistence and console-error items that were "Not Tested
  Here" in the prior pass. The only thing still genuinely untestable
  without real hardware is on-device camera capture and pixel-level
  mobile layout (see §6 / §16).

## 2. App start command used

- `npm run qa:flow` &nbsp;— **NEW** real-DOM execution harness
  (jsdom + fake-indexeddb). Drives the full MVP flow end to end.
  Result: **PASS, 33/33 checks.**
- `npm test` &nbsp;— full Node-side test suite (app shell, usage meter,
  manual MVP fallback, manual MVP generated behavior). PASS.
- `npm run qa:smoke` &nbsp;— required-files / required-scripts check. PASS.
- `npm run build` &nbsp;— writes `dist/` (static copy of `app/`). PASS.
- Static host attempt: `python3 -m http.server 8765 --directory app` and
  `curl` against `/index.html` and `/js/app.js` &nbsp;— HTTP 200 on both.
  `npm start` itself is a hint script (`scripts/serve_hint.mjs`) that
  prints "Open app/index.html in a browser"; there is no bundled dev
  server, so this is expected.

## 3. Browser / environment used

- Static-analysis pass only (no Chromium / Firefox available in the
  sandbox). Manual browser smoke must still be run by Lamar before the
  demo using the checklist at the bottom of this report.

## 4. Files inspected

- `app/index.html`
- `app/js/app.js`
- `app/js/scan.js`
- `app/js/packageEntry.js`
- `app/js/scannerService.js`
- `app/js/result.js`
- `app/js/history.js`
- `app/js/details.js`
- `app/js/localDb.js`
- `app/js/usage.js`
- `app/js/manualRecipe.js`
- `app/js/api.js`
- `scripts/test_app_shell.mjs`
- `scripts/qa-smoke.js`
- `scripts/serve_hint.mjs`
- `scripts/build_app_shell.mjs`
- `docs/QA_REPORT.md` (previous)
- `docs/KNOWN_ISSUES.md`
- `scripts/qa-browser-flow.mjs` (added this pass — the execution harness)

## 5. Summary status

**PASS.** The 3 critical/high bugs from the first pass remain fixed, and
this pass adds live execution evidence: `npm run qa:flow` drives the real
module graph through every acceptance-criteria path and reports 33/33.

| Acceptance criterion | Result |
| --- | --- |
| 1. App starts locally | PASS (static host returns 200 on index, JS, CSS; module graph imports clean under qa:flow) |
| 2. No visible button silently fails | PASS — **executed**: every nav tab + scan button + manual CTAs drive their views with no thrown errors |
| 3. Manual entry can be completed | PASS — **executed**: granola-bar sample → generate → result rendered |
| 4. Saved item appears in history | PASS — **executed**: 1 history card present after save |
| 5. Details can be opened from history | PASS — **executed**: details render name/meta/ingredients/steps; back-nav works |
| 6. Refreshing the page does not lose saved MVP data | PASS — **executed**: record read back directly from IndexedDB after save, and via a fresh `getMvpHistory()` call simulating a reload |
| 7. Console errors fixed or documented | PASS — **executed**: zero `console.error` and zero uncaught rejections captured during the full flow (after a jsdom-only `scrollTo` shim, see §10) |
| 8. 304 responses confirmed harmless | PASS — no service worker is registered; `index.html` references `./styles.css` and `./js/app.js` with relative paths and no version query strings. Any 304 from a static host is browser-cache revalidation and is harmless. No stale-script risk. |

### 5a. Executed-flow checks (`npm run qa:flow`, 33/33 PASS)

Live run against the real module graph + IndexedDB. Each line below was
asserted by the harness, not by inspection:

```
PASS  App modules import without throwing
PASS  scratchnscan global exposed
PASS  Home view visible / hero CTA present
PASS  Nav -> #scan / #manual / #history / #home each show their view
PASS  Scan start button present
PASS  Scan shows clear web-fallback status ("Scanning isn't available… Enter manually")
PASS  Manual view visible
PASS  Empty name shows validation error
PASS  Generate routed to result view
PASS  Result shows title "Simple homemade granola" + ingredients + steps
PASS  Fallback title is oat/granola-based for granola input
PASS  Save routed to #details/<id>
PASS  Details shows name + meta "Based on: Packaged Chocolate Chip Granola Bar" + ingredients + steps
PASS  Saved item appears in history (1 card)
PASS  Back-to-history from details works
PASS  Saved record persisted in IndexedDB (direct read)
PASS  History survives simulated reload (fresh getMvpHistory read)
PASS  Delete removes the record from IndexedDB
PASS  Empty state shown when no items remain
PASS  No console.error during flow
PASS  No uncaught rejections / window errors
```

## 6. Button / navigation test results

| Element | Wiring source | Result |
| --- | --- | --- |
| Top brand link (`a.brand` → `#home`) | href anchor | PASS |
| Top "More options" 3-dot button (`#topbar-action`) | `app.js wireGlobalActions` | PASS — shows toast "More options coming after MVP polish" (documented placeholder) |
| Home: "Start with a packaged food" | `data-go="manual"` → `goto("manual")` | PASS |
| Home: "View saved ideas" | `data-go="history"` | PASS |
| Home: sample chips (Mayonnaise / Ranch / Ketchup / Mac & cheese / Granola bar) | `data-sample=…` → gate check → `goto("manual")` → `applySample` | PASS |
| Bottom-nav: Home / Scan / Enter / Saved | `.nav-item` listener → `goto(target)` | PASS — was broken before Bug A fix (clicking Scan threw `ReferenceError: initPackageEntry is not defined`) |
| Scan view: "Scan package" (`#scan-start-btn`) | `packageEntry.js` → `scannerService.startScan` | PASS (web fallback returns `unsupported`, surface message "Scanning isn't available on this device yet. Enter the package manually below." — clear user-facing copy) |
| Scan view: "Enter manually instead" | `data-go="manual"` | PASS |
| Manual: "Create Homemade Version" submit | `scan.js handleSubmit` | PASS — was broken before Bug B fix (`barcode is not defined`); now derives via `getDraftBarcode()` |
| Manual: "Clear form" | `scan.js initScanView` listener | PASS |
| Manual: photo tile / Replace / Remove | `scan.js wirePhotoControls` | PASS (web file-picker fallback) |
| Manual: sample chips | shared `data-sample` handler | PASS |
| Result: "Save to history" | `result.js initResultView` | PASS — calls `saveMvpRecipe`, then routes to `#details/<id>` |
| Result: "Edit input" | `data-go="manual"` | PASS |
| History: per-card "View details" | `history.js` listener | PASS |
| History: per-card favorite star | `history.js` → `toggleMvpFavorite` | PASS |
| History empty state: "Create first recipe" | `data-go="manual"` | PASS |
| Details: "Mark/Remove favorite" | `details.js` | PASS |
| Details: "Delete recipe" | `window.confirm` + `deleteMvpRecipe` → `#history` | PASS |
| Details: "Back to saved ideas" | `data-go="history"` | PASS |
| Upgrade: "Upgrade coming soon" | toast placeholder | PASS (clearly labeled placeholder) |
| Upgrade: "View saved ideas" / "Edit existing recipes" | `data-go=…` | PASS |
| Draft-barcode banner "Clear" | `packageEntry.js` | PASS (newly available because DOM was missing) |

## 7. Manual-entry test results

Sample data drove by reading scan.js + manualRecipe.js (the AI worker
is not reachable from the sandbox, so the deterministic fallback branch
is the codepath under test):

Inputs:
- Product name: `Packaged Chocolate Chip Granola Bar`
- Ingredients: `oats, sugar, chocolate chips, palm oil, corn syrup, natural flavor`
- Preference: `less sugar`

Result through `buildDeterministicScratchRecipe` (verified by re-reading
`manualRecipe.js`):
- Title: `Simple homemade granola` (matches the `granola|cereal` template)
- Ingredients include rolled oats, nuts/seeds, maple syrup or honey,
  neutral or coconut oil, cinnamon, salt — matches the spec's "Expected
  cleaner alternative" (oats, peanut butter, honey/maple syrup, dark
  chocolate chips, pinch of salt). Peanut butter and chocolate chips are
  not in the template but the template family is correct ("oat-based
  cleaner snack"). Acceptable for the MVP.
- Steps: 3 baked-granola steps from the template.
- Tips: `Start with small seasoning adjustments and taste as you go.`
  (Note: the dietary tip table is keyed on `vegetarian / vegan /
  gluten-free / dairy-free / low-sugar`; the free-text `less sugar`
  does not match `low-sugar`. Minor copy-mismatch — see §12 Low.)

PASS — generated record is well-formed; result view renders title,
summary, ingredients, steps, tips block, and "Save to history" button.

## 8. Save / history / details test results

Traced statically:

1. `Save to history` calls `saveMvpRecipe(record)` → returns id from
   IndexedDB store `mvp_history` (`localDb.js:140`).
2. On success the result-view clears `sessionStorage` and navigates to
   `#details/<id>`.
3. `route()` calls `initDetailsView(id)` which calls
   `getMvpRecipeById(id)` and populates badges, name, meta, date,
   ingredient list, step list, tips block, source-text block,
   fallback-note, favorite button, delete button. PASS.
4. Navigating to `#history` calls `getMvpHistory()` which uses a
   `createdAt` index opened in reverse, so the newest item appears
   first. PASS.

## 9. Persistence test results

- IndexedDB store name `scan_scratch_local_db`, version `4`, store
  `mvp_history` with `keyPath: "id"` and indexes on `createdAt` and
  `favorite`. Single source of truth. PASS.
- No in-memory cache is used to serve history. PASS.
- **Executed** in `qa:flow`: after saving the granola-bar sample, the
  harness opened the IndexedDB store directly (independent of any
  in-memory JS state) and found the row with the correct `id` and
  `productName`. It then performed a fresh `getMvpHistory()` read
  (the same call the app makes on load) and the row was still present —
  this is the functional equivalent of a page reload for persistence.
  After delete, the store returned 0 rows and the empty state showed.
  PASS.
- Remaining real-hardware-only check: confirming persistence survives an
  actual browser process restart on a phone. The storage layer has no
  in-memory dependency, so this is expected to pass, but it has not been
  run on physical hardware.

## 10. Console errors found

Before fixes (would have fired in a real browser):

1. `ReferenceError: initPackageEntry is not defined`
   - Source: `app.js:52` (route → "scan" branch)
   - Trigger: clicking the bottom-nav "Scan" tab, or `window.location.hash = "#scan"`.
   - Impact: Critical. The Scan tab silently does nothing visible (the view does change because `showView` runs first, but the wiring throws so the Scan button on that view is never wired).

2. `ReferenceError: refreshBarcodeBanner is not defined`
   - Source: `app.js:47` (route → "manual" branch)
   - Trigger: any navigation to `#manual` (home CTA, sample chip, "Enter manually instead", bottom-nav "Enter").
   - Impact: Critical. After `initScanView()` finishes, the route handler throws, aborting later side effects. The form *did* finish wiring though, because `initScanView` is awaited first.

3. `ReferenceError: barcode is not defined`
   - Source: `scan.js:233` (inside `handleSubmit`, building `lastGeneratedRecord`).
   - Trigger: every `Create Homemade Version` submit.
   - Impact: Critical. Submit always fell into the `catch` branch and
     rendered the red "Could not generate a homemade version" alert.
     Counter is correctly NOT incremented, so users were not silently
     burning their free quota — but they could not produce any recipe.

After fixes (this QA pass):

- No remaining `ReferenceError`. `node --check` passes on every module.
- The `qa:flow` harness captured **zero `console.error`** and **zero
  uncaught rejections** across the entire manual → save → details →
  history → delete flow.
- Intentional `console.warn` in `localDb.js` only fires on IDB failure
  paths and is documented.

**Environment note (not an app bug):** under `jsdom`, `Element.scrollTo`
is not implemented, so `app.js showView()`'s `main.scrollTo(...)` throws
*in jsdom only*. Real browsers implement `scrollTo`, so this is a test
harness gap, not a product defect — the harness installs a one-line
`scrollTo` no-op shim to match real-browser behavior. No app change was
made for this.

## 11. Network / caching notes (304s)

- The app does not register a service worker.
- `index.html` references `./styles.css` and `./js/app.js` with relative
  paths and no `?v=…` cache-busters.
- Any 304 response from a static host (Python `http.server`, Wrangler,
  Cloudflare CDN) is a normal browser-cache revalidation. There is no
  module-graph divergence risk because none of the JS files are inlined
  and none are referenced from more than one location.
- **Recommendation**: when iterating quickly during the hackathon, do a
  Shift-Reload to bypass the cache. 304 itself is not a bug.

## 12. Bugs found

### Bug A — Missing imports in `app.js` route handler &nbsp; **[CRITICAL — FIXED]**

`app.js` called `initPackageEntry()` (line 52) and `refreshBarcodeBanner()`
(line 47) but did not import them, throwing `ReferenceError` on every
navigation to `#scan` or `#manual`.

**Fix applied:** added
`import { initPackageEntry, refreshBarcodeBanner } from "./packageEntry.js";`
to `app/js/app.js`.

### Bug B — `scan.js handleSubmit` references undefined symbols &nbsp; **[CRITICAL — FIXED]**

`handleSubmit` referenced `barcode`, `clearDraftBarcode`, and
`refreshBarcodeBanner` without importing or declaring them, so every
form submission threw `ReferenceError: barcode is not defined` and the
user saw the generic red error alert with no recipe rendered.

**Fix applied:**
- Added `import { getDraftBarcode, clearDraftBarcode } from "./scannerService.js";`
- Added `import { refreshBarcodeBanner } from "./packageEntry.js";`
- Added `const barcode = getDraftBarcode();` near the top of `handleSubmit`,
  before the record is built.

### Bug C — Missing `draft-barcode` banner DOM &nbsp; **[HIGH — FIXED]**

`packageEntry.js` reads `#draft-barcode`, `#draft-barcode-value`, and
`#draft-barcode-clear`, but `index.html` had no such markup. The
existing test `scripts/test_app_shell.mjs` failed on the
`draft-barcode` token check.

**Fix applied:** added a minimal `#draft-barcode` banner block to the
manual view in `app/index.html` (hidden by default, populated only after
a successful native scan). `npm test` is green again.

### Bug D — Free-text preference does not match dietary-tip keys &nbsp; **[LOW — NOT FIXED]**

`DIETARY_TIPS` in `manualRecipe.js` is keyed on canonical slugs
(`vegan`, `gluten-free`, `dairy-free`, `low-sugar`, `vegetarian`). The
manual form accepts arbitrary free text such as `dairy-free, less
sugar, no seed oils`. Anything that is not an exact key falls through
to the generic "Start with small seasoning adjustments…" tip. Not a
correctness bug — the fallback is safe — but the personalization
intent is mostly lost. **Recommend** a small normalization helper
(`/dairy[\s-]?free/i` → `dairy-free`, etc.) in a follow-up task.

### Bug E — Tag confusion between bottom-nav "Scan" and the manual route &nbsp; **[LOW — NOT FIXED]**

The bottom-nav `Scan` button routes to `#scan` (placeholder preview),
while `Enter` routes to `#manual` (actual form). Today's MVP demo path
runs through `#manual`. The Scan view's "Scan package" button on web
goes to the `unsupported` branch and surfaces the correct fallback
copy, so this is acceptable for the hackathon — but on a touch device
users will naturally tap "Scan" first. **Recommend** copy on the Scan
view eyebrow such as *"Scanning is coming next — use Enter to try the
demo path today"* in a future polish pass.

### Bug F — `manual-clear-btn` has two click listeners &nbsp; **[LOW — NOT FIXED]**

`manual-clear-btn` is bound in both `scan.js initScanView` (resets the
form + toasts "Form cleared") and `packageEntry.js initPackageEntry`
(clears the draft barcode + refreshes the banner). Both fire on a single
click. The combined effect is benign (and the qa:flow run showed no
error), but it is a duplicate-listener smell flagged by review item 17.
**Recommend** consolidating the clear handler into one module in a future
tidy-up. No functional bug today.

## 13. Severity table

| ID | Severity | Status |
| --- | --- | --- |
| A | Critical | Fixed (first pass) — re-verified by qa:flow |
| B | Critical | Fixed (first pass) — re-verified by qa:flow |
| C | High | Fixed (first pass) — re-verified by qa:flow |
| D | Low | Open — minor copy follow-up |
| E | Low | Open — minor copy follow-up |
| F | Low | Open — duplicate listener tidy-up |

## 14. Recommended next fixes

1. (Codex) Normalize dietary preference text so common phrases like
   `dairy free`, `dairy-free`, `less sugar`, `low sugar` map to the
   `DIETARY_TIPS` keys in `manualRecipe.js`. Keep the user's raw
   string in the saved record (already happens) but pass a normalized
   slug into the tip lookup.
2. (Codex) Tighten the Scan-tab copy and add a one-line nudge toward
   the manual path while real scanning is still placeholder.
3. (Codex) Consolidate the duplicate `manual-clear-btn` click handler
   (Bug F) into a single module.
4. (Done this pass) `scripts/qa-browser-flow.mjs` (`npm run qa:flow`)
   now exercises the whole flow under jsdom + fake-indexeddb. Bugs A
   and B would have been caught instantly by it. Consider adding it to
   the `test` script once a browser/jsdom is guaranteed in CI.

## 15. Is the MVP ready for the next implementation task?

**Yes — with the 3 fixes applied in this pass.** All eight acceptance
criteria are satisfied:

1. App starts (static host returns 200 on every asset).
2. No visible button silently fails (after Bug A fix the bottom-nav
   Scan tab now works; after Bug B fix the primary submit works).
3. Manual entry can be completed end-to-end against the deterministic
   fallback recipe builder.
4. A saved item is persisted via `saveMvpRecipe` and read back by
   `getMvpHistory`.
5. Details can be opened from history via `#details/<id>`.
6. Refresh-persistence has no in-memory dependency; the only source
   of truth is IndexedDB.
7. The three `ReferenceError`s have been removed; remaining
   `console.warn` lines are explicit, documented error paths.
8. 304 responses are confirmed harmless (no SW, relative URLs, no
   versioned bundles).

The single Browser-Live check (opening the static site in a real
phone-sized browser, saving a record, refreshing, confirming it is
still there) still needs to be done by Lamar before the demo —
documented as "Not Tested Here" above.

## 16. Manual browser checklist for Lamar

Run these on a real device (Safari on iPhone, Chrome on Android, or
desktop Chrome at 390 × 844). The Node-side suite cannot exercise these.

| # | Step | Pass criterion |
| --- | --- | --- |
| 1 | Open the static site / `dist/index.html` | Home view renders with hero, samples, How-it-works |
| 2 | Tap "Start with a packaged food" | Lands on manual view, no console errors |
| 3 | Tap a sample chip (e.g. Granola bar) | Form prefilled, toast shown |
| 4 | Submit with empty name | Red alert: "Add a product name or quick note…" |
| 5 | Submit with valid name | Spinner appears, then result view with title/ingredients/steps |
| 6 | Tap "Save to history" | Toast "Saved to your ideas", lands on details |
| 7 | Navigate "Saved" tab | New record appears at the top of the list |
| 8 | Reload the page (hard refresh) | Saved record still appears under "Saved" |
| 9 | Open the record from history | All fields render including any photo thumbs |
| 10 | Tap Favorite | Star fills; reopen card → still favorited |
| 11 | Tap Delete → confirm | Item disappears, returns to history; empty-state shows when last item removed |
| 12 | Tap bottom-nav "Scan" | Scan preview view renders; tap "Scan package" → fallback message visible |
| 13 | DevTools console | No `ReferenceError`, no uncaught promise rejection during normal flow |

If any row fails, capture a screenshot and the console output and file
it back into this report under §12 with severity.
