# ScratchnScan MVP Readiness Report

## 1) What works now

- App boots from `dist/` with no runtime errors.
- Home, package entry, result, upgrade, history, and details routes
  render and navigate cleanly via hash routing and the bottom nav.
- Package entry supports front / back package photos with capture,
  replace, and remove. Images are compressed in-browser (~720px longest
  edge, JPEG ~0.78 quality) and stored as data URLs in IndexedDB so the
  database stays small.
- Manual product name remains the only required text field; ingredients
  and preference are optional. UPC/barcode is optional and now resolves
  safely from captured barcode or manual entry. Brand and category are
  no longer primary required fields.
- Sample chips prefill name + ingredients + preference (Mayonnaise,
  Ranch, Ketchup, Mac & cheese, Granola bar).
- Homemade generation calls the AI worker if reachable, otherwise falls
  back to the deterministic local recipe builder. Both paths render the
  same result UI with a clear Starter / AI badge and useful tips mapped
  from either `tips` or (`simpleSwaps` + `whyLessProcessed` +
  `storageTips`).
- Saved ideas persist in IndexedDB, survive a reload, support favorite
  toggling and confirmed delete, and show package photo thumbnails when
  available.
- Free generation meter persists per-device in IndexedDB and gates new
  generations after 10 successful runs. The upgrade screen is reachable
  but does not block any of: history, details, favorite, delete,
  editing existing form input.

## 2) What was tested

- `npm test` — app shell tokens, localDb exports, usage-meter helpers,
  manual fallback recipe builder.
- `npm run qa:smoke` — required-files and required-script presence.
- `npm run build` — copies `app/` to `dist/` cleanly.
- `node scripts/test_manual_mvp.mjs`
- `node scripts/test_manual_mvp_generated.mjs`
- `node scripts/test_n8n_repo_access_generated.mjs`
- Manual mobile-emulated click-through at 390px width.

## 3) What is demo-ready

- Pitch + Home screen.
- Package entry with placeholder or real-photo previews.
- Sample chips and manual entry.
- AI-or-fallback recipe generation.
- Save / view / favorite / delete saved ideas.
- Free generation counter and upgrade gate behavior.
- Reload persistence of history, favorites, and usage count.

## 4) What is still mocked / placeholder

- Photo OCR / AI extraction: photos are local previews only; the
  generator still reads typed text. The data model already carries the
  preview data URLs and is ready for an OCR step.
- Upgrade pricing: $4.99/mo and $29.99/yr are display-only; no payment
  provider is wired in.
- "Open scanner" button on the `#scan` view shows a friendly toast
  rather than running a real barcode reader (the native flow is the
  next milestone).
- Scanner foundation does not yet ship Capacitor ML Kit; the manual
  path covers the demo.

## 5) What remains for mobile / native

- Capacitor packaging for iOS and Android (web view, ML Kit barcode
  plugin, camera permissions, app icons / splash).
- Real device QA on at least one iOS and one Android phone.
- App-store / TestFlight artifacts and store listings.

## 6) What remains for paid upgrade

- Stripe web checkout for the web flow.
- RevenueCat mobile subscriptions for the native flow.
- A real entitlements check that flips `isLocalPremiumUnlocked` (or its
  cloud equivalent) on successful purchase.
- Optional accounts / Supabase so entitlements travel across devices.

## 7) Recommended next milestone

```
Native mobile packaging and scanner device testing
  → payment integration (Stripe web + RevenueCat mobile)
  → optional accounts / cloud sync
```
