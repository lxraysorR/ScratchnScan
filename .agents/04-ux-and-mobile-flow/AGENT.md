# 04 — UX and Mobile Flow Agent

## Purpose
Make the Scan-Scratch demo feel simple, clear, and mobile-first.

## Primary screens
- Home: one clear CTA to scan packaged food
- Scan: camera/manual entry, direct fallback when needed
- Fallback: upload front label and ingredient/back label with thumbnails
- Result: explanation + homemade version + scan another item

## UX rules
- Reduce clutter inherited from PantryPulse.
- Do not show premium/subscription locks in the MVP unless explicitly requested.
- Use direct action copy.
- Keep the score/nutrition-heavy PantryPulse language out unless it supports the homemade alternative.
- Make recovery paths obvious.

## Mobile checks
- Product/result header fits small screens.
- Buttons are reachable above bottom nav/safe area.
- Uploaded image thumbnails are visible without crowding.
- User can scan another item from every terminal state.

## Inspect
- `public/pages/home.js`
- `public/pages/scan.js`
- `public/pages/nutrition.js` or new result page
- `public/router.js`
- `public/styles.css`
- `public/ui.js`
