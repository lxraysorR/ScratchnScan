# ScratchnScan MVP Readiness Report

## 1) What works now

- App boots from `dist/` with no runtime errors.
- Home, package entry, result, upgrade, history, and details routes
  render and navigate cleanly via hash routing and the bottom nav.
- The **Scan package** button is wired and is never a dead action. On a
  native Capacitor build it opens the ML Kit camera barcode scanner; in a
  plain browser it shows an honest "scanner unavailable" message and routes
  into manual / photo entry. A captured barcode appears in a banner on the
  entry screen and is passed into generation context. Cancelled or
  unavailable scans do not count as a free generation.
- Package entry supports front / back package photos with capture,
  replace, and remove. Images are compressed in-browser (~720px longest
  edge, JPEG ~0.78 quality) and stored as data URLs in IndexedDB so the
  database stays small. Tapping a tile opens the file/camera picker and a
  thumbnail preview appears immediately.
- Manual product name remains the only required text field; ingredients
  and preference are optional. Brand and category are no longer primary
  required fields.
- Sample chips prefill name + ingredients + preference (Mayonnaise,
  Ranch, Ketchup, Mac & cheese, Granola bar).
- Homemade generation calls the AI worker if reachable, otherwise falls
  back to the deterministic local recipe builder. Both paths render the
  same result UI with a clear Starter / AI badge.
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
- Manual mobile-emulated click-through at 390px width: tapped Scan and
  confirmed the browser fallback routes into manual entry; added front and
  back photos and confirmed thumbnails, Replace, and Remove; ran Create
  Homemade Version with no images and again after adding images.

## 3) What is demo-ready

- Pitch + Home screen.
- Scan package button with honest browser fallback into manual entry.
- Package entry with real-photo front / back previews (capture, replace,
  remove).
- Sample chips and manual entry.
- AI-or-fallback recipe generation.
- Save / view / favorite / delete saved ideas.
- Free generation counter and upgrade gate behavior.
- Reload persistence of history, favorites, and usage count.

## 4) What is still mocked / placeholder

- Photo OCR / AI extraction: photos are local previews only; the
  generator still reads typed text plus a flag noting which photos were
  attached. The data model already carries the preview data URLs and is
  ready for an OCR step.
- Upgrade pricing: $4.99/mo and $29.99/yr are display-only; no payment
  provider is wired in.
- Native barcode scanning is wired through `scannerService.js` and the
  Capacitor ML Kit adapter but has **not** been tested on real hardware;
  it only runs inside a native build. In the browser demo, scanning is an
  honest fallback to manual entry, not a real reader.

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
