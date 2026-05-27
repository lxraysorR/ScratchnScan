# ScratchnScan Demo Script

A ~2 minute live walkthrough of the MVP. Use the mobile-emulated layout
in DevTools (390px width) for the cleanest look.

## Setup

```bash
npm install
npm run build
npx --yes serve dist --listen 3000
```

Open <http://localhost:3000>. For a fresh demo, clear site data so the
free generation meter starts at 10.

## Walkthrough

1. **Open the app.** Show the ScratchnScan brand, the headline, and the
   "10 free homemade creations included on this device" strip.
2. **Pitch:** *ScratchnScan turns packaged foods into homemade
   scratch-made alternatives.*
3. **Tap "Start with a packaged food."** Land on the package entry
   screen.
4. **Show the photo tiles:** "Front package" and "Back label." Mention
   that the photo flow is wired locally today — capture, compress, and
   preview — and that OCR / AI extraction is the next step.
5. **(Optional) Tap a tile** and pick a sample image from the device
   to show the thumbnail with Replace / Remove controls.
6. **Type a product name** such as `mayonnaise`, or tap the
   **Mayonnaise** sample chip below the form to prefill name +
   ingredients + preference in one tap.
7. **Adjust the preference** to something like `less processed`.
8. **Tap "Create Homemade Version."** Highlight the loading state.
9. **Show the result page:** title, ingredients, steps, smart swaps,
   the Starter / AI badge, and the disclaimer. Point out the usage strip
   that now reads "9 free creations left."
10. **Tap "Save to history."** Land on Details. Mention this lives in
    IndexedDB — no account, no cloud.
11. **Go to Saved ideas** (bottom nav). Show the saved card with the
    photo thumbnail if one was captured.
12. **Open Details.** Show the original product context, front/back
    photos if captured, the homemade recipe, and Favorite / Delete.
13. **Favorite the item.** Show the star toggle, then return to Saved
    ideas to confirm it persists.
14. **(Optional) Reload the page.** Show that history, favorites, and
    the usage count survive a refresh.
15. **Explain the upgrade gate:** 10 free creations per device, then a
    polished "Keep creating homemade swaps" upgrade screen. Saved
    history, details, favoriting, and deleting all keep working after
    the limit. No payment is wired in yet.

## Recovery tips

- If the AI provider is unreachable, the result is built from the local
  deterministic recipe library and is labeled "Starter suggestion." The
  flow still demos end-to-end.
- To re-arm the demo without clearing site data, run
  `await scratchnscan.dev.resetUsage()` in DevTools.
- To demo the unlock path, run
  `await scratchnscan.dev.unlockPremium(true)`.

## What you are intentionally **not** showing

- Account / signup screens (deferred).
- Real payment (placeholder pricing only).
- Cloud sync (IndexedDB only today).
- A live native barcode scan (scanner foundation is local-only until
  Capacitor packaging is wired in).
