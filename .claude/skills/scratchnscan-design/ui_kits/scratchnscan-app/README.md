# ScratchnScan App — UI Kit

An interactive, click-thru recreation of the ScratchnScan mobile app shell, factored into small reusable React components. Styles are lifted from the live codebase (`app/styles.css`) so this kit stays pixel-faithful as the product evolves.

## Run it

Open `index.html` directly in a browser, or via your preview pane.

## Files

- `index.html` — root document, loads React + Babel + components
- `styles.css` — verbatim copy of `app/styles.css` from the live app
- `App.jsx` — top-level stateful shell with view-routing
- `components/Topbar.jsx`
- `components/BottomNav.jsx`
- `components/Hero.jsx`
- `components/StartCard.jsx`
- `components/Button.jsx`
- `components/Chip.jsx`
- `components/Badge.jsx`
- `components/Icon.jsx` — every icon used by the app
- `components/HomeScreen.jsx`
- `components/ScanScreen.jsx`
- `components/ManualScreen.jsx`
- `components/GenerationProgress.jsx`
- `components/ResultScreen.jsx`
- `components/HistoryScreen.jsx`
- `components/UpgradeScreen.jsx`

## What's clickable

- Home → tap any start card → routes to scan / manual / popular section
- Manual → switch tabs (Type / Photos / Barcode) → tap chip to prefill → Generate
- Generate → 4-stage progress runs → result screen
- Result → Save Recipe → routes to History
- History → tap saved card → details (today: routes back to Result with the same data)
- Upgrade screen is reachable via the More menu in the top bar

## What's intentionally fake

- No real AI call; one deterministic homemade recipe is hard-coded
- No real camera; the scanner screen is the static preview frame from the live app
- No persistence; refreshing the page resets state
- No real photo capture; tiles render the empty state

## Vocabulary cheatsheet (lifted from real app copy)

- "Pick how you want to start."
- "Create Homemade Version" / "Make Another" / "Save Recipe"
- "10 free homemade creations included on this device."
- "Reading package details" → "Identifying food type" → "Creating real ingredients" → "Writing step-by-step instructions" → "Finalizing your homemade version"
- Disclaimer: "General food information only. Not medical or dietary advice."
