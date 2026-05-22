# MVP Completion Checklist

Status values: **Not Started** | **In Progress** | **Done** | **Blocked**

## 1) App shell
- **Status:** Done
- **Acceptance criteria:** App boots locally; all routes (`home`,
  `manual`, `result`, `upgrade`, `history`, `details`) render with no
  runtime crash on first load.
- **Test:** `npm test` plus opening `dist/index.html` in a browser.

## 2) Front-end polish (mobile-first)
- **Status:** Done
- **Acceptance criteria:** Premium mobile layout, photo grid, hero,
  feature list, bottom nav, usage strip, and upgrade card all render
  cleanly at 360–414px. No PantryPulse / NutraPlate user-facing names.
- **Test:** DevTools responsive mode at 360/375/390/414px widths.

## 3) Manual / package entry
- **Status:** Done
- **Acceptance criteria:** Required product name; ingredients-from-
  package text; preference; clear validation copy; sample chips. Brand
  and category are not primary required fields.
- **Test:** `node scripts/test_manual_mvp_generated.mjs` and a manual
  run.

## 4) Package entry photo-first layout
- **Status:** Done
- **Acceptance criteria:** Front / back photo tiles render as the first
  thing in the form. Each tile supports capture, replace, and remove.
  The thumbnail uses `object-fit: cover` and stays sharp.
- **Test:** Manual run; pick an image for front and back.

## 5) Scanner foundation
- **Status:** In Progress (placeholder)
- **Acceptance criteria:** `#scan` view is reachable; "Open scanner"
  shows a friendly fallback toast; manual entry is always available.
  Native Capacitor ML Kit packaging is **not** included in this pass.
- **Test:** Tap "Scan" in the bottom nav.

## 6) Homemade recipe generation
- **Status:** Done
- **Acceptance criteria:** AI-assisted generation when the worker is
  reachable; deterministic local fallback otherwise; result page shows
  title, ingredients, steps, smart swaps, badge, and disclaimer.
- **Test:** `node scripts/test_manual_mvp.mjs` (fallback) plus a manual
  run.

## 7) Local saved history (IndexedDB)
- **Status:** Done
- **Acceptance criteria:** Save from the result page, see saved cards
  in `Saved ideas`, open details, favorite / unfavorite, delete with
  confirmation. Survives reload.
- **Test:** Manual reload after saving two or more items.

## 8) Free generation meter
- **Status:** Done
- **Acceptance criteria:** 10 successful homemade creations per device.
  Only successful generations increment the counter. Cancelled, failed,
  or validation-only attempts do **not** count. Counter persists across
  reload.
- **Test:** `node scripts/test_usage_meter.mjs` plus a manual
  click-through (use `scratchnscan.dev.resetUsage()` to re-arm).

## 9) Upgrade placeholder
- **Status:** Done
- **Acceptance criteria:** Polished `view-upgrade` screen after the
  limit, with placeholder $4.99/mo and $29.99/yr copy and three calm
  buttons. History, details, favorite, and delete still work after the
  limit. No payment provider is wired in.
- **Test:** Manual after exhausting the 10 free creations.

## 10) Docs
- **Status:** Done
- **Acceptance criteria:** `README.md`, `docs/DEMO_SCRIPT.md`,
  `docs/COMPLETION_CHECKLIST.md`, `docs/MVP_READINESS_REPORT.md`, and
  `docs/QA_REPORT.md` match the current reality.

## 11) Tests
- **Status:** Done
- **Acceptance criteria:** `npm test`, `npm run qa:smoke`, and
  `npm run build` succeed. Optional `node scripts/test_manual_mvp*.mjs`
  and `node scripts/test_n8n_repo_access_generated.mjs` also pass.

## 12) Remaining native / mobile work
- **Status:** Not Started
- **Acceptance criteria:** Capacitor packaging for iOS / Android, ML
  Kit barcode scanner, device testing on real hardware, app-store
  artifacts.

## 13) Remaining paid upgrade work
- **Status:** Not Started
- **Acceptance criteria:** Stripe web checkout, RevenueCat mobile
  subscriptions, billing / entitlements surface, optional accounts and
  cloud sync.
