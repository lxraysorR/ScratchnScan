# ScratchnScan — Production Readiness Tracker

Work through items **one at a time** in priority order.
Status values: `[ ]` Not Started · `[~]` In Progress · `[x]` Done · `[!]` Blocked

---

## LEGEND — CATEGORIES

| Tag | Meaning |
|-----|---------|
| `[REMOVE]` | Redundant or dead code / UI to delete |
| `[UX]` | User-facing experience improvement |
| `[REFACTOR]` | Code quality / maintainability |
| `[SECURITY]` | Security vulnerability or hardening |
| `[PEER]` | Needs a second human eye before merging |
| `[DOCS]` | Documentation correction or gap |

---

## PRIORITY 1 — CRITICAL (Ship blockers)

### S-01 `[SECURITY]` Rate limiting is completely absent
- **Files:** `src/worker.js` (all endpoints)
- **Risk:** Every route — `/api/lookup-upc`, `/api/generate-scratch-recipe`,
  `/api/popular-items` — is wide open to abuse and quota exhaustion.
  Gemini API calls cost money and can hit daily caps.
- **Fix:** Implement per-IP rate limiting via Cloudflare Durable Objects or
  Workers KV. Recommended limits: 20 req/min for lookups, 5 req/min for
  generation.
- **Status:** `[x]` Done — sliding-window in-memory limiter added to
  `src/worker.js`. Limits: generate 5/min, lookup 20/min, popular 60/min.
  12 new tests in `scripts/test_worker_rate_limiting.mjs`.
  Note: state is per-isolate; upgrade to Durable Objects for globally
  consistent enforcement (tracked in BACKLOG.md).

### S-02 `[SECURITY]` Free generation cap is disabled in production code
- **File:** `app/js/localDb.js` line 239
- **Risk:** `canGenerate()` has an unconditional `return true` that bypasses
  the 10-generation cap entirely. The cap logic below it is dead code.
- **Fix:** Remove the early return, restore the real guard, and re-run
  `node scripts/test_usage_meter.mjs`.
- **Status:** `[x]` Done — early return and dev comment removed; real gate
  restored. 8 new tests in `scripts/test_generation_cap.mjs` covering
  fresh device, at-limit, over-limit, premium unlock, unlock revocation,
  and dev reset. All pass.

### S-03 `[SECURITY]` CORS fallback accepts unknown origins
- **File:** `src/worker.js` line 31
- **Risk:** When an unknown origin sends a request, the current fallback
  passes an empty string instead of rejecting, effectively allowing
  cross-origin reads from unregistered domains.
- **Fix:** Reject outright: `const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : null;`
  and return `403` if `allowed` is null.
- **Status:** `[ ]`

### S-04 `[SECURITY]` SearchUPCData API key exposed in URL query param
- **File:** `src/worker.js` line 255
- **Risk:** The key appears in Cloudflare access logs, browser referrer
  headers, and any caching layer.
- **Fix:** Move to an `Authorization` header, or wrap the call in a proxy
  function that injects the key without leaking it in the URL.
- **Status:** `[ ]`

---

## PRIORITY 2 — HIGH (UX / correctness)

### U-01 `[REMOVE]` Redundant "Try again" button shown alongside specific recovery actions ⬅ screenshot item
- **Files:** `app/js/scan.js` line 258, `app/index.html` lines 223–226
- **Problem:** When `correction-needed` fires, `scan.js` calls
  `showError(message, { allowRetry: true })` which shows the pink
  `#scan-error` div with a generic "Try again" button. The green
  `#manual-friendly-error` card is already visible with two specific actions:
  "Enter product name" and "Try photos again". The generic "Try again" button
  is confusing and redundant.
- **Fix:** In `scan.js` line 258 change to `showError(flowResult.message)`
  (drop `allowRetry: true`) so the "Try again" button stays hidden. The
  friendly card's targeted CTAs are the right recovery UX.
- **Status:** `[ ]`

### U-02 `[UX]` Hardcoded "35–50 min" quick fact shown for every recipe
- **File:** `app/js/details.js` line 119
- **Problem:** Every result card shows the same prep/cook time regardless of
  the actual recipe data.
- **Fix:** Compute from `record.scratchRecipe.prepTimeMinutes +
  record.scratchRecipe.cookTimeMinutes`; fall back to the static string
  only when both are absent.
- **Status:** `[ ]`

### U-03 `[UX]` "Upgrade coming soon" button is dead but visible in production HTML
- **File:** `app/index.html` lines 321–325; `design-system/ui_kits/.../UpgradeScreen.jsx`
- **Problem:** Placeholder pricing ($4.99/mo, $29.99/yr) and a disabled
  button are rendered in the upgrade view. A real user would see this.
- **Fix:** Add `hidden` to the upgrade action button and wrap pricing in a
  `<!-- TODO: Phase 2 -->` comment block until payment is wired.
- **Status:** `[ ]`

### U-04 `[UX]` "MVP fallback" badge text is internal jargon, not user copy
- **File:** `app/js/result.js` lines 79–81
- **Problem:** The badge reads "MVP fallback" which is meaningless to users
  and exposes internal labelling.
- **Fix:** Replace with "Local recipe" or "Offline recipe" to be honest but
  user-friendly.
- **Status:** `[ ]`

### U-05 `[UX]` Missing `aria-hidden` on decorative image placeholders
- **File:** `app/index.html` lines 185, 197, 362, 366
- **Problem:** Hidden placeholder `<img>` elements with empty `alt` stay in
  the accessibility tree and create noise for screen readers.
- **Fix:** Add `aria-hidden="true"` to decorative placeholder images.
- **Status:** `[ ]`

### U-06 `[UX]` Sample product chips hardcoded in HTML instead of data-driven
- **File:** `app/index.html` lines 244–250
- **Problem:** Popular starters are baked into HTML; updating requires a
  deploy.
- **Fix:** Move the list to a JS constant (e.g., `popularChips.js`) and
  render them dynamically. This unblocks A/B testing the list later.
- **Status:** `[ ]`

### U-07 `[UX]` Saving flag never resets on error in result page
- **File:** `app/js/result.js` lines 187–208
- **Problem:** If saving throws, the `saving` flag stays `true` and the user
  can never trigger save again without reloading.
- **Fix:** Wrap the save block in `try/finally { saving = false; }`.
- **Status:** `[ ]`

---

## PRIORITY 3 — MEDIUM (Security hardening)

### S-05 `[SECURITY]` No size limit on base64 image data received by worker
- **File:** `src/worker.js` lines 197–205
- **Risk:** A caller could send a 50 MB base64 string through the regex
  validation.
- **Fix:** After regex match, check `data.length <= 7_500_000` (≈5 MB
  decoded) and reject oversized payloads with 413.
- **Status:** `[ ]`

### S-06 `[SECURITY]` SVG accepted in image upload MIME whitelist
- **File:** `app/js/packageImages.js` line 28
- **Risk:** `file.type.startsWith("image/")` allows `image/svg+xml`. An SVG
  can contain embedded JavaScript that executes when rendered.
- **Fix:** Replace with an explicit allow-list:
  `["image/jpeg","image/png","image/webp","image/heic","image/heif"]`.
- **Status:** `[ ]`

### S-07 `[SECURITY]` Supabase keys read from `globalThis` at runtime
- **File:** `app/js/recipeStorage.js` lines 14–15
- **Risk:** If anything ever sets these keys on `window` at runtime (e.g.,
  a CMS or third-party script), they become globally readable.
- **Fix:** Assert that the values only come from `import.meta.env` at
  build time; remove the `globalThis` fallback.
- **Status:** `[ ]`

### S-08 `[SECURITY]` Hardcoded guest session ID causes storage path collisions
- **File:** `app/js/recipeStorage.js` line 21
- **Problem:** All users write to `guests/guest/drafts/...` in Supabase
  Storage, so anyone with bucket access can read everyone's drafts.
- **Fix:** Generate a per-device UUID on first launch, store in localStorage
  as `guestSessionId`, and use that in the path.
- **Status:** `[ ]`

### S-09 `[SECURITY]` External API calls in worker have no explicit timeout
- **File:** `src/worker.js` lines 254, 625
- **Risk:** A slow or hung upstream (SearchUPCData, Gemini) can block a
  Worker for up to 30 s, consuming CPU and holding the connection.
- **Fix:** Wrap each external `fetch` in an `AbortController` with a 10 s
  timeout, consistent with the frontend's `api.js` pattern (line 54).
- **Status:** `[ ]`

### S-10 `[SECURITY]` Provider error details leaked to API responses
- **File:** `src/worker.js` lines 264–270, 665–667
- **Risk:** Raw upstream HTTP status codes and error text are forwarded to
  the client, revealing which third-party services are in use.
- **Fix:** Log detailed errors to Cloudflare Workers Logs only; return
  `"Service temporarily unavailable"` to callers.
- **Status:** `[ ]`

---

## PRIORITY 4 — MEDIUM (Refactor)

### R-01 `[REFACTOR]` Timeout constant duplicated in three files
- **Files:** `app/js/api.js` line 50, `app/js/scan.js` line 31,
  `app/js/generationController.js` line 79
- **Fix:** Extract to a single `app/js/config.js` that exports
  `AI_TIMEOUT_MS`, `SCANNER_COOLDOWN_MS`, `MAX_IMAGE_EDGE`, and
  `JPEG_QUALITY`.
- **Status:** `[ ]`

### R-02 `[REFACTOR]` Gemini model version hardcoded — cannot change without redeploy
- **File:** `src/worker.js` line 626
- **Fix:** Read from `env.LLM_MODEL` (already declared in wrangler.jsonc
  secrets section). Fall back to the current string.
- **Status:** `[ ]`

### R-03 `[REFACTOR]` `canGenerate()` limit value always overwritten on read
- **File:** `app/js/localDb.js` line 223
- **Problem:** `merged.freeGenerationLimit = FREE_GENERATION_LIMIT` always
  overwrites the stored value, so changing the limit in code silently
  resets all existing users.
- **Fix:** `if (!merged.freeGenerationLimit) merged.freeGenerationLimit = FREE_GENERATION_LIMIT;`
- **Status:** `[ ]`

### R-04 `[REFACTOR]` `JSON.parse(sessionStorage...)` in result.js has no try-catch
- **File:** `app/js/result.js` lines 85–87
- **Risk:** If storage is corrupted (e.g., truncated by browser quota), the
  page crashes with an unhandled `SyntaxError`.
- **Fix:** Wrap in `try/catch` and redirect to home with an error message.
- **Status:** `[ ]`

### R-05 `[REFACTOR]` Ingredient list, steps, and tips rendered with near-identical loops
- **File:** `app/js/result.js` lines 152–160
- **Fix:** Extract a shared `renderList(items, container)` helper.
- **Status:** `[ ]`

### R-06 `[REFACTOR]` Scan state managed by scattered `hidden` toggling
- **File:** `app/js/scan.js` lines 68–94
- **Problem:** `showState("entry" | "confirm" | "creating")` sets/hides ~6
  elements independently. Adding a new state requires updating multiple
  arrays.
- **Fix:** Drive all visibility from a single `STATES` map keyed by state
  name to visible element IDs.
- **Status:** `[ ]`

### R-07 `[REFACTOR]` No input length guard before sending to AI
- **Files:** `app/js/productContext.js` lines 67–68,
  `app/js/recipeGenerator.js` lines 74–81
- **Problem:** Extremely long ingredient dumps pass through without
  truncation, potentially sending multi-KB payloads to Gemini and causing
  slow or failed generations.
- **Fix:** `.slice(0, 5000)` on `ingredientsText`; `combined.slice(0, 5000)`
  before regex matching.
- **Status:** `[ ]`

### R-08 `[REFACTOR]` Usage strip rendering duplicates copy calculation
- **File:** `app/js/usage.js` lines 92–106
- **Fix:** Compute copy once and pass to both strips instead of
  recalculating inline.
- **Status:** `[ ]`

### R-09 `[REFACTOR]` History delete error leaves `busy` flag stuck on exception
- **File:** `app/js/history.js` line 108
- **Fix:** `try { await deleteMvpRecipe(r.id); } finally { busy = false; }`
- **Status:** `[ ]`

### R-10 `[REFACTOR]` `buildTipsFromAiRecipe()` duplicates tip logic in result.js
- **Files:** `app/js/generationController.js` lines 11–34,
  `app/js/result.js` lines 162–175
- **Fix:** Move canonical tip extraction to `productContext.js` or a shared
  `recipeHelpers.js`; both callers import from there.
- **Status:** `[ ]`

---

## PRIORITY 5 — DESIGN SYSTEM CLEANUP

### D-01 `[REMOVE]` Design system duplicated verbatim in `.claude/skills/`
- **Directories:** `design-system/` (canonical) and
  `.claude/skills/scratchnscan-design/` (exact copy)
- **Risk:** Any change to tokens, components, or skill rules must be
  made in two places. They will inevitably drift.
- **Fix:** Delete `.claude/skills/scratchnscan-design/`. The skill entry
  in `.claude/settings.json` should reference `design-system/` directly,
  or a build step should copy on commit.
- **Status:** `[ ]`

### D-02 `[REFACTOR]` CSS orphan rules appended at end of styles.css
- **File:** `app/styles.css` lines 1358–1378
- **Problem:** Manual wizard and method tab rules are appended without a
  section header, breaking the established organizational pattern.
- **Fix:** Move into a clearly labelled `/* === Manual Wizard === */` section.
- **Status:** `[ ]`

### D-03 `[REMOVE]` `UpgradeScreen.jsx` from `design-system/` is PantryPulse scope
- **File:** `design-system/ui_kits/scratchnscan-app/components/UpgradeScreen.jsx`
- **Problem:** Full subscription/payment screen is out of MVP scope. Its
  presence in the design kit makes it look like an intended feature.
- **Fix:** Move to a `design-system/ui_kits/scratchnscan-app/components/_parked/`
  folder with a comment header: `// Phase 2 — not yet in scope`.
- **Status:** `[ ]`

---

## PRIORITY 6 — DOCUMENTATION & PEER REVIEW

### P-01 `[PEER]` Worker rate limiting implementation needs second review
- **Depends on:** S-01
- **Why:** Rate limiting via Durable Objects requires understanding
  consistency guarantees; the reviewer should confirm the counter can't
  be bypassed by concurrent requests to different colo nodes.
- **Status:** `[ ]`

### P-02 `[PEER]` AI JSON contract validation completeness review
- **File:** `docs/AI_JSON_CONTRACT.md`, `src/worker.js` `validateAiContract()`
- **Why:** Confirm that every required field in the contract is validated
  server-side and that missing fields produce a recoverable error state,
  not a crash.
- **Status:** `[ ]`

### P-03 `[PEER]` IndexedDB schema migration strategy review
- **File:** `app/js/localDb.js` (DB_VERSION = 4)
- **Why:** Confirm that `onupgradeneeded` handles all version transitions
  without data loss, and that the auto-increment / UUID ID inconsistency
  (line 100 vs line 48) is not a correctness issue.
- **Status:** `[ ]`

### P-04 `[DOCS]` KNOWN_ISSUES.md says "No known blockers" — update it
- **File:** `docs/KNOWN_ISSUES.md`
- **Fix:** Document the issues identified in this tracker that are
  deferred: generation cap bypass, CORS fallback, media sync stub, rate
  limiting absence.
- **Status:** `[ ]`

### P-05 `[DOCS]` COMPLETION_CHECKLIST.md item 8 claims "Done" but cap is disabled
- **File:** `docs/COMPLETION_CHECKLIST.md` lines 68–75
- **Fix:** Change status to "In Progress — cap logic written but bypassed;
  re-enable before shipping" until S-02 is resolved.
- **Status:** `[ ]`

### P-06 `[DOCS]` BACKLOG.md is too thin; expand with engineering detail
- **File:** `docs/BACKLOG.md`
- **Fix:** Add concrete items: Supabase media upload, Stripe / RevenueCat
  integration, native Capacitor testing, OCR for ingredient labels, error
  monitoring (Sentry), structured logging, cloud sync.
- **Status:** `[ ]`

### P-07 `[DOCS]` Build SKILL.md references old PantryPulse file paths
- **File:** `.agents/skills/scratchnscan-build/SKILL.md`
- **Problem:** "Key inherited files to inspect" section still lists
  `src/server.js`, `src/app.js`, `public/api.js` — paths that no longer
  exist in the Cloudflare Workers rewrite.
- **Fix:** Update to reflect current structure:
  `src/worker.js`, `app/js/`, `app/index.html`.
- **Status:** `[ ]`

### P-08 `[DOCS]` Add npm audit to CI and lock exact dependency versions
- **File:** `package.json`
- **Fix:** Add `"audit": "npm audit --audit-level=moderate"` script.
  Pin exact versions for `wrangler`, `jsdom`, `fake-indexeddb` to prevent
  silent breakage on minor bumps.
- **Status:** `[ ]`

---

## ITEM COUNT SUMMARY

| Priority | Category | Count |
|----------|----------|-------|
| 1 — Critical | Security | 4 |
| 2 — High | UX / Correctness | 7 |
| 3 — Medium | Security hardening | 6 |
| 4 — Medium | Refactor | 10 |
| 5 — Design | Cleanup | 3 |
| 6 — Docs/Peer | Review | 8 |
| **Total** | | **38** |

---

## HOW TO USE THIS TRACKER

1. Pick the next `[ ]` item by priority number.
2. Do the work on branch `claude/fervent-lamport-EtbCl`.
3. Change `[ ]` → `[x]` (or `[!]` with a blocker note).
4. Commit the status update along with the code change.
5. For `[PEER]` items: open a PR and request review before marking done.
