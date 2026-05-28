# Known Issues

All items below are tracked with full detail and fix guidance in
`docs/PRODUCTION_READINESS.md`. This file provides a quick reference.

---

## Blockers before public production launch

| ID | Description | File(s) | Severity |
|----|-------------|---------|----------|
| S-01 | Zero rate limiting on all Worker endpoints | `src/worker.js` | Critical |
| S-02 | `canGenerate()` always returns `true` — 10-gen cap bypassed | `app/js/localDb.js:239` | Critical |
| S-03 | CORS fallback allows unknown origins instead of rejecting | `src/worker.js:31` | Critical |
| S-04 | SearchUPCData API key passed as URL query param (appears in logs) | `src/worker.js:255` | Critical |

---

## High priority — UX correctness

| ID | Description | File(s) |
|----|-------------|---------|
| U-01 | Redundant "Try again" button shown with specific recovery CTAs | `app/js/scan.js:258`, `app/index.html:225` |
| U-02 | Quick facts time always shows "35–50 min" regardless of recipe | `app/js/details.js:119` |
| U-03 | "Upgrade coming soon" dead button visible in production | `app/index.html:321–325` |
| U-04 | "MVP fallback" badge text shown to end users | `app/js/result.js:79–81` |
| U-05 | Decorative placeholder images not marked `aria-hidden` | `app/index.html:185,197,362,366` |
| U-07 | Save error leaves `saving` flag stuck; user cannot retry | `app/js/result.js:187–208` |

---

## Medium priority — Security hardening

| ID | Description | File(s) |
|----|-------------|---------|
| S-05 | No size limit on base64 image data in Worker | `src/worker.js:197–205` |
| S-06 | `image/svg+xml` accepted in upload MIME check | `app/js/packageImages.js:28` |
| S-07 | Supabase keys read from `globalThis` at runtime | `app/js/recipeStorage.js:14–15` |
| S-08 | Hardcoded `'guest'` session ID causes Supabase path collisions | `app/js/recipeStorage.js:21` |
| S-09 | External API calls in Worker have no explicit timeout | `src/worker.js:254,625` |
| S-10 | Provider error details forwarded to API callers | `src/worker.js:264–270,665–667` |

---

## Medium priority — Refactor debt

| ID | Description |
|----|-------------|
| R-01 | Timeout constant duplicated in three JS files |
| R-02 | Gemini model version hardcoded; requires redeploy to change |
| R-03 | `canGenerate()` limit value silently overwritten on every read |
| R-04 | `JSON.parse(sessionStorage...)` without try-catch in result.js |
| R-05 | Duplicate list-rendering loops in result.js |
| R-06 | Scan state managed by scattered `hidden` toggling instead of a state map |
| R-07 | No input length guard before sending ingredient text to AI |
| R-08 | Usage strip copy calculation duplicated in refreshUsageStrips |
| R-09 | History delete error leaves `busy` flag stuck |
| R-10 | `buildTipsFromAiRecipe()` duplicates tip logic from result.js |

---

## Design / docs debt

| ID | Description |
|----|-------------|
| D-01 | Design system duplicated verbatim in `.claude/skills/scratchnscan-design/` |
| D-02 | CSS orphan rules appended at end of styles.css without section header |
| D-03 | `UpgradeScreen.jsx` in design kit is Phase 2 scope, looks like current feature |
| P-05 | COMPLETION_CHECKLIST.md item 8 claims "Done" but cap is disabled |
| P-06 | BACKLOG.md too thin — does not reflect engineering gaps |
| P-07 | Build SKILL.md lists old PantryPulse file paths |
| P-08 | No `npm audit` in CI; dependency versions unpinned |

---

## Possible future improvements (non-blocking)

- Add explicit in-UI label distinguishing deterministic fallback vs AI-backed recipe.
- Add more recipe templates for niche product categories.
- Add broader manual QA matrix across multiple browsers and devices.
- Supabase media upload implementation (`recipeStorage.js` stubs are present).
- Real OCR for ingredient label photos (currently user must type ingredients).
- Error monitoring integration (Sentry or Cloudflare Analytics Engine).
- Structured server-side logging middleware.
- Cloud sync for history across devices.
