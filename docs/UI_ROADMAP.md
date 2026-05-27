# Scratch-N-Scan UI Roadmap

This document exists to **prevent the two approved UI concepts from being
smashed together into one confusing page.** They are distinct screens that the
app moves *between*, not a single combined layout.

The home/start-flow screen should **route or transition into** the
result/details screen after a homemade version is generated.

---

## A. Home / start-flow UI

**Purpose:** let the user choose how they want to start, then collect the input
needed to generate a homemade version.

**Includes:**
- Top brand bar (warm cream Scratch-N-Scan theme)
- Hero: "Pick how you want to start."
- Start cards:
  - **Scan barcode** (not implemented yet — see note below)
  - **Upload package photos** (separate front package + back label areas)
  - **Type product details** (separate manual product-name / ingredients /
    preference fields)
  - **Popular right now**
- Unified **Popular right now / Popular Starters** section (one shared source
  powers both the home chips and the starters list)
- Staged generation progress:
  1. Reading package details
  2. Identifying food type
  3. Creating real ingredients
  4. Writing step-by-step instructions
  5. Finalizing your homemade version

**Reference file:**
`docs/ui/scratch-n-scan-home-flow-preview.html` (static, open directly in a
browser).

**Current implementation status:** The live MVP already implements the working
parts of this track in `app/` — manual product entry, front/back photo tiles,
popular chips, and the staged generation progress (`app/js/progress.js`,
wired in `app/js/scan.js`). The HTML preview is the visual target for further
polish; it is **not** the production code.

---

## B. Result / details UI

**Purpose:** show the generated homemade recipe clearly and let the user act on
it.

**Includes:**
- Product detected summary
- "What the app understood" panel
- Homemade recipe title
- Ingredients
- Steps
- Why cleaner / why healthier
- Tips
- Save / edit actions

**Current implementation:** `#view-result` in `app/index.html`, rendered by
`app/js/result.js`; saved recipes are shown by `#view-details` /
`app/js/details.js`.

---

## How the two tracks connect

```
Home / start-flow  ──(generate)──►  staged progress  ──(success)──►  Result / details
       │                                                                    │
       └── choose: scan / photos / type / popular                          └── save ► history ► details
```

- The two UIs are **separate screens**. Do not merge the result/details layout
  into the home/start-flow page or vice versa.
- After generation completes successfully, the app transitions from the
  start-flow screen to the result/details screen (today via the hash route
  `#result`).
- On generation failure or timeout, the user stays on the start-flow screen
  with their input preserved and a retry affordance — they are **not** pushed
  to the result screen.

## Out of scope (do not add as part of UI work)

- Barcode scanner implementation (deferred)
- Supabase / cloud database
- Auth / accounts
- Billing / payments
- n8n automation

These remain deferred per the project scope; the UI preview must not imply they
are built.
