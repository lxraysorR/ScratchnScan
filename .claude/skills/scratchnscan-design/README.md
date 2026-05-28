# ScratchnScan Design System

> Scan it. Scratch-make it.

ScratchnScan is a **mobile-first, on-device** food companion that turns packaged foods into **simple homemade alternatives**. A user scans a UPC barcode (or, when scanning is unavailable, types the product name or uploads front/back package photos), and the app produces a clean recipe with real ingredients, step-by-step instructions, and "why this is cleaner" reasoning.

No accounts. No cloud. No payment. Ten free homemade creations are stored locally per device, then a gentle upgrade screen appears.

This design system contains the foundations needed to design **for ScratchnScan**: the warm, kitchen-counter visual language; the green-and-gold color palette; the product copy voice; and a UI kit that recreates the live mobile app surfaces.

## Source material

This design system was distilled from the live MVP codebase. If you have access, explore it directly:

- **GitHub repo:** <https://github.com/lxraysorR/ScratchnScan>
- **Live app shell:** `app/index.html` and `app/styles.css` on `main`
- **UI roadmap:** `docs/UI_ROADMAP.md` (explains why the home/start-flow screen and the result/details screen are intentionally kept separate)
- **Approved UI preview:** `docs/ui/scratch-n-scan-home-flow-preview.html` (a standalone static reference)
- **AI output contract:** `docs/AI_JSON_CONTRACT.md` (what the result screen renders)
- **Demo script:** `docs/DEMO_SCRIPT.md` (a 2-minute walkthrough that doubles as a vocabulary guide)

Note: there are **two visual directions** in the source — the **live app** uses a deep-green-and-cream palette with gold accents (warm, calm, kitchen-counter feeling), while the **standalone preview file** in `docs/ui/` explores a warmer orange-accent version. The live app is the production track and is the primary direction documented here.

## Product context

ScratchnScan was forked from a larger pantry/nutrition project (PantryPulse / NutraPlate) but is **intentionally smaller in scope**. Out of scope for the MVP: accounts, cloud sync, real payment, OCR, native packaging, n8n flows. In scope: the UPC/photo/manual → identify → homemade recipe → save loop.

Surfaces that exist today:
- **Home / start flow** — hero, four start cards (Scan, Upload Photos, Type Details, Popular), popular starters
- **Scan** — camera frame preview with manual-entry fallback
- **Manual entry** — tabbed input (typed / photos / barcode), advanced details, popular starters
- **Generation progress** — staged checklist (Reading → Identifying → Creating ingredients → Writing steps → Finalizing)
- **Result** — homemade recipe with badges, ingredients, steps, why-it-is-cleaner, tips
- **History / Saved ideas** — local list with photo thumbs
- **Details** — saved recipe view with favorite/delete
- **Upgrade** — friendly paywall after 10 free creations

## Index

- `README.md` — this file (you are here)
- `colors_and_type.css` — design tokens (color, type, spacing, radius, shadow) as CSS custom properties
- `fonts/` — webfont source (Inter via Google Fonts CDN; no local files needed)
- `assets/` — logos, brand marks, icon SVGs, sample illustrations
- `preview/` — small HTML cards that populate the Design System tab
- `ui_kits/scratchnscan-app/` — pixel-accurate React/JSX recreation of the mobile app
- `SKILL.md` — Claude Code-compatible skill definition

## Content fundamentals

The voice is **plain-English, useful, and a little homespun**. Read it aloud and it sounds like a friend with a kitchen, not a marketing team or a doctor.

### Tone

- **Second person, conversational.** "Pick how you want to start." "Type a product name." "Add front and back label photos."
- **Imperative for actions, indicative for status.** Buttons say "Create Homemade Version," "Save Recipe," "Try again." Status reads "Captured barcode:," "Building your natural recipe…"
- **Honest about limits.** "Camera scanner beta. Manual entry is always available." "Placeholder pricing. No payment is collected today."
- **Never medical.** Plain-English health language. The system says "cleaner," "real ingredients," "less processed" — never "healthier than" or "good for you." A disclaimer at the bottom of every result reads: *"General food information only. Not medical or dietary advice."*

### Casing

- **Title case** for screen titles and primary buttons ("Create Homemade Version," "Save Recipe," "View History").
- **Sentence case** for descriptions, helpers, eyebrows, and chip labels ("Homemade alternatives in seconds", "Use the camera to identify a packaged food.").
- **All caps** sparingly for section labels inside recipe cards (`INGREDIENTS`, `STEPS`) with `0.08em` letter spacing.

### Pronouns and posture

- "You" → the user. "We" → the app/team (rare; mostly used in friendly copy: "We'll create a homemade version using real ingredients.")
- Never "I" from the app.
- No "as an AI…" or "I'm an assistant…" framing — the AI is the silent engine behind a recipe.

### Vocabulary specifics

- **Homemade** (not "DIY," not "scratch recipe alone). The brand word is **scratch-made**.
- **Packaged food** (not "junk food," not "processed food" — those carry judgment the brand avoids).
- **Cleaner** > "healthier" / "better." Says less, promises less.
- **Smart swaps** = the substitutions section.
- **Saved ideas** > "favorites" or "recipes" for history (the lighter word matches the lightweight, throwaway-friendly product).
- **Starter** / **Popular right now** / **Popular starters** = three names for the same chip set (do not invent more).

### Emoji

**Used sparingly inside the standalone preview** (`🥔`, `👨🏾‍🍳`, `🔥`, `📷`) as section bullets, **never in the live app**. Default to "no emoji" in production. If you need a glyph, draw it as an SVG icon in the established stroke style.

### Examples (lift verbatim where useful)

- Hero: *"Pick how you want to start."*
- Hero sub: *"Scan a barcode, upload the front and back of a package, or type the product name and ingredients. ScratchnScan turns it into a cleaner homemade version with real ingredients and clear steps."*
- Usage strip (fresh device): *"10 free homemade creations included on this device."*
- Generation stages: *"Reading package details," "Identifying food type," "Creating real ingredients," "Writing step-by-step instructions," "Finalizing your homemade version."*
- Empty saved state: *"No saved recipes yet. Create your first homemade version."*
- Disclaimer: *"General food information only. Not medical or dietary advice."*

## Visual foundations

### Mood

Warm kitchen counter at golden hour. Deep forest green on creamy off-white, with gold accents that read like brass, honey, or a well-used cutting board. **Not** clinical, **not** glossy SaaS, **not** earnest-startup teal. Tactile, mature, food-first.

### Colors

The palette is anchored by **deep forest green** (`#0B2F27`) as the primary brand color, sitting on a **warm cream** (`#F4EFE5`) page wash. **Gold** (`#CAA85D` → `#FFF3BF`) is the accent for premium / celebratory moments (upgrade cards, brand marks, hover halos). **Orange** (`#D99A32`) is reserved for cautions / warnings, and a **brick red** (`#B94232`) for destructive actions and errors. **Lime cream** (`#E6D79A`) appears as a "fresh sprig" accent inside the dark green brand mark.

Surfaces are **fully off-white** (`#FFFDF7`) — never pure white — to keep the cream-paper feeling. Lines are translucent ink (`rgba(16,25,22,0.10)`) rather than grey hex codes.

See `colors_and_type.css` for the full token list.

### Typography

Single family: **Inter**, loaded from Google Fonts. Weight range used: 400 / 500 / 600 / 700 / 800 / 900.

- **Display titles** (hero, recipe title): `28–34px`, weight **800**, letter-spacing **−0.04em**, tight `1.02` line-height.
- **Section heads:** `21px`, weight 800, `−0.03em`.
- **Body:** `14.5–15px`, weight 400–500, line-height `1.45–1.55`.
- **Card titles:** `15.5px`, weight 800, `−0.02em`.
- **Eyebrows / chips / labels:** `11.5–13px`, weight **700–800**, frequently with light positive letter-spacing (`0.01em` to `0.08em` for all-caps).
- **Mono:** UI-monospace stack for barcode digits and codes.

### Spacing & layout

- **Base radius scale:** `12 / 16 / 22 / 28 px` (sm / md / lg / xl). 14–18px is the default for most card-and-button surfaces; 28px is the soft "hero card" rounding.
- **App width:** `480px` max — the entire shell stays mobile-width even on desktop, where it gets a 28-px-rounded frame on the cream background.
- **Inner padding:** `18px` horizontal on the main column; `16–22px` on cards.
- **Section gap:** `26px` between `section-head` blocks; `12px` between cards in a list.
- **Min hit target:** `44–52px` tall on all interactive controls.

### Backgrounds

The body uses **two soft radial gradients** layered on the cream — a gold wash at the top-left and a faint green wash at the bottom-right — pinned with `background-attachment: fixed`. Hero cards use a different gradient: **160° deep-green linear** with a gold radial sweep coming in from the top-right corner. **No photo backgrounds, no full-bleed imagery, no repeating patterns, no noise/grain textures.** The texture comes entirely from soft color washes and warm shadows.

### Shadows (warm, not grey)

Shadows are tinted toward the brand green so they feel like late-afternoon light, not Material elevation:

- `--shadow-sm: 0 6px 16px rgba(16, 30, 22, 0.06)`
- `--shadow-md: 0 12px 30px rgba(16, 30, 22, 0.08)`
- `--shadow-lg: 0 22px 60px rgba(16, 30, 22, 0.14)` — for the hero and the upgrade card.

Buttons add a colored shadow matching their fill: primary uses `rgba(11, 47, 39, 0.28)`, gold uses `rgba(202, 168, 93, 0.28)`. The brand mark glows `rgba(11, 47, 39, 0.28)`.

### Borders

Hairline borders use translucent ink: `rgba(16, 25, 22, 0.10)` for normal lines, `0.06` for the softest division, `0.18` dashed for photo upload tiles. **Avoid pure-grey hex borders** — they break the warmth.

### Animation

- **Screen lift:** every screen enters with `translateY(8px) → 0` and `opacity 0 → 1` over **240ms ease**. This is the only "page transition."
- **Button press:** `transform: scale(0.985)` on `:active`, transition **140ms ease**.
- **Hover lift:** start cards translate `−2px` and step up from `shadow-sm` to `shadow-md` over **120ms**.
- **Scanner line:** vertical sweep `−40px → 40px → −40px`, **2.2s ease-in-out infinite**.
- **Generation pulse:** the active stage dot pulses a green ring at **1.4s infinite**.
- **Icon-button press:** `scale(0.96)`.
- All of the above honor `prefers-reduced-motion` and collapse to `0.01ms`.

No bouncy springs, no slide-from-the-side panels, no parallax.

### Hover & press states

- **Hover** on cards: lift `−2px`, boost shadow. On chips/ghost buttons: darken background by stepping from `0.06` to `0.10` alpha of the green ink.
- **Press** on any button: scale to `0.985–0.97`. Never darken on press alone — the scale is the signal.
- **Focus** on inputs: border shifts to `rgba(31, 107, 84, 0.55)` and a `4px` green-tinted glow appears.

### Transparency & blur

Used in three specific places, no more:

1. The **topbar** (sticky) uses `backdrop-filter: blur(8px)` over a vertical fade so content scrolls cleanly behind it.
2. The **bottom nav** floats with `backdrop-filter: blur(14px)` over `rgba(255, 253, 248, 0.92)` cream.
3. The **sticky action bar** on the result screen uses a soft top fade to mask scrolling content.

### Cards

The default ScratchnScan card:
- Background: `--surface` (`#FFFDF7`)
- Border: `1px solid rgba(16, 25, 22, 0.10)`
- Radius: `22px` (`--radius-lg`) for content cards, `28px` (`--radius-xl`) for hero / form / upgrade
- Shadow: `--shadow-sm` for chips/list cards; `--shadow-md` for form/scan/result; `--shadow-lg` for hero/upgrade
- Padding: `16px` content cards, `18–22px` large cards

Color cards (alerts, badges, quick-facts) drop the border-and-shadow setup and use **tinted backgrounds** at `0.07–0.16` alpha with matching tinted borders.

### Imagery

The brand uses **almost no photography** in-product. Where placeholders exist (photo upload tiles, history thumbs without a captured photo), the slot is filled with a **soft warm gradient** (`rgba(223, 242, 182, 0.85)` → `rgba(202, 168, 93, 0.22)`) plus a green-on-cream icon. When the user does capture a real package photo, it appears as a `52×52` rounded square thumb in history, and a `132px` tall figure in details — both `object-fit: cover`. **No imagery is shipped with the brand itself;** user content is the only photography ever shown.

### Layout rules

- **Single column** below `720px`. Above that, the entire app shell becomes a centered 480-px frame.
- The **bottom nav floats** with `position: fixed` and `12px` from the bottom — never edge-to-edge.
- **Sticky action bar** on result/details screens sits **above** the bottom nav (`bottom: calc(86px + safe-bottom)`).
- The hero is always the topmost element of the home screen — there is no top banner, search bar, or marketing strip above it.

## Iconography

ScratchnScan uses **inline SVG icons drawn by hand** in a consistent system. There is no icon font, no Lucide/Heroicons dependency, no emoji in the live app. Icons are part of the codebase, not an external library.

### Style rules

- **24×24 viewBox**, drawn at **22×22** in most slots, **20×20** in the icon-button (topbar more-menu) slot.
- **Stroke-based**, `stroke-width: 2`, `stroke-linecap: round`, `stroke-linejoin: round`.
- `fill: none`, `stroke: currentColor` — icons inherit the surrounding text color (typically `--green` `#0B2F27` or `--muted` `#66736D`).
- **No two-tone fills, no gradients, no shadows** on icons. The only exception is the **brand mark** (the bowl-and-utensil logo) which uses a custom gold gradient and lime-cream highlights.

### Icon set (lifted from `app/index.html`)

The app ships with these icons; see `assets/icons/` for SVG copies of each:

- `home` — house silhouette
- `scan` / `camera` — camera body with lens + tab
- `pencil` — pencil over a notepad
- `star` — for Saved/popular
- `search` — magnifier
- `bowl` — bowl with steam
- `image` — photo with mountains
- `dots-vertical` — three vertical dots (more menu)
- `chevron` (used inline as a glyph `›`)

Plus the **brand mark**: a 48×48 SVG with a gold-gradient bowl, lime-cream steam wisp, and a small gold dot above the bowl handle. See `assets/scratchnscan-mark.svg`.

### When to draw a new icon

Stay inside the same stroke vocabulary: `24×24` viewBox, `stroke-width: 2`, no fills. If the icon set genuinely needs to grow, prefer **Lucide** ([lucide.dev](https://lucide.dev)) as the closest visual sibling — same stroke weight, same rounded caps. **Flag any new icon to the user**; do not silently expand the set.

## Caveats / known gaps

- The **brand mark** in the codebase is an SVG drawn directly in the page, not a logo file. We've copied it to `assets/scratchnscan-mark.svg`. There is no separate wordmark, monochrome variant, or alternate lockup — if those are needed they will need to be designed.
- **No font files** are shipped. The brand uses Inter from the Google Fonts CDN. If offline / self-hosted is required, download Inter from <https://rsms.me/inter/> and place under `fonts/`.
- The **orange-accent direction** in `docs/ui/scratch-n-scan-home-flow-preview.html` is preserved as an alternate exploration but is **not** the production direction.
