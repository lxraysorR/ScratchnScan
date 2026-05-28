---
name: scratchnscan-design
description: Use this skill to generate well-branded interfaces and assets for ScratchnScan, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the "scan a packaged food, get a homemade recipe" mobile experience.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

ScratchnScan is a **mobile-first, on-device** food companion that turns packaged foods into simple homemade alternatives. The user scans, photographs, or types a packaged food → the app generates a clean recipe with real ingredients and step-by-step instructions.

**Visual language:**
- Warm cream `#F4EFE5` page wash (never pure white)
- Deep forest green `#0B2F27` as the primary brand color
- Gold accents `#CAA85D` for premium / celebratory moments
- Warm-tinted shadows, never grey
- Inter (400 / 500 / 600 / 700 / 800 / 900) is the only typeface
- 24×24 stroke-only SVG icons, `stroke-width: 2`, `currentColor`
- Single-column 480-px mobile shell, even on desktop
- No emoji in the live app; no photo backgrounds; no purple gradients

**Voice:**
- Second person, conversational, plain English
- Title case for buttons & screen titles; sentence case for descriptions
- "Cleaner" not "healthier"; "homemade" not "DIY"; "saved ideas" not "favorites"
- Always end recipes with: *"General food information only. Not medical or dietary advice."*

## How to use this skill

1. **Tokens:** `colors_and_type.css` — CSS custom properties for color, type, spacing, radius, shadow, motion. Drop it into a new design with `<link rel="stylesheet" href="colors_and_type.css" />`.
2. **Components:** `ui_kits/scratchnscan-app/` — JSX recreations of every core surface (Topbar, BottomNav, Hero, StartCard, ManualScreen, GenerationProgress, ResultScreen, HistoryScreen, UpgradeScreen). Lift these directly into new prototypes.
3. **Assets:** `assets/` — brand mark, wordmark, and the full 24×24 icon set as standalone SVGs.
4. **Preview cards:** `preview/*.html` — visual tokens (colors, type specimens, components in isolation) you can crop into slides or design docs.
5. **Source of truth:** the live MVP code lives at <https://github.com/lxraysorR/ScratchnScan>. If something seems ambiguous, the live `app/styles.css` is canonical.

## Don't

- Don't invent new colors outside the green / cream / gold palette without flagging it
- Don't use emoji in production UI
- Don't draw your own icon SVGs from scratch — extend the existing stroke vocabulary or use Lucide as the closest visual sibling
- Don't expand the surface scope (cloud sync, accounts, real payment) — ScratchnScan stays intentionally small
- Don't use medical or dietary-claim language in copy
