# ScratchnScan Backlog

Items here are explicitly out of MVP scope. They exist so contributors know
what has been considered and intentionally deferred.

Do not implement any item from this list without an explicit decision to
expand scope. Each item carries a rough effort tag:
`[S]` = small · `[M]` = medium · `[L]` = large · `[XL]` = multi-sprint

---

## Phase 2 — Monetisation

- `[M]` Stripe web checkout for upgrade subscription
- `[M]` RevenueCat mobile in-app purchase (iOS / Android)
- `[S]` Entitlement check on generation — real gate, not placeholder
- `[S]` Billing portal link / receipt email
- `[L]` Account system with email / social auth (Supabase Auth)
- `[S]` "Manage subscription" screen

## Phase 2 — Cloud sync

- `[M]` Supabase media upload (stub already exists in `recipeStorage.js`)
- `[M]` Saved recipe sync across devices (Supabase DB, RLS per user)
- `[S]` Conflict resolution for local-vs-server history
- `[S]` Guest-to-account migration when user signs up

## Phase 2 — Native mobile

- `[L]` Capacitor build pipeline for iOS and Android
- `[M]` ML Kit barcode scanner hardware testing on real devices
- `[M]` App Store and Google Play submission
- `[S]` Deep link handling (share recipe → open app)
- `[S]` Push notification for generation completion (if background)

## Phase 3 — Richer AI

- `[M]` Real OCR for ingredient label photos (currently manual text entry)
- `[M]` Allergen detection and dietary flag extraction from labels
- `[S]` Confidence-adaptive UI (ask for more photos when confidence is low)
- `[S]` Multi-product comparison (scan two products, compare recipes)
- `[M]` Recipe difficulty adjustment (beginner / advanced mode)
- `[S]` Serving size scaling

## Phase 3 — Social / sharing

- `[S]` Share recipe as image card (canvas export)
- `[S]` Share link (static shareable URL per recipe)
- `[M]` Community recipe ratings
- `[L]` Household consensus / shared saved list
- `[M]` "Try your friends' recipes" social feed

## Phase 3 — Expanded data

- `[M]` Pantry inventory tracking
- `[L]` Meal planning calendar
- `[M]` Shopping list generation from recipe ingredients
- `[M]` Instacart / shopping checkout integration
- `[L]` Broad nutrition scoring rebuild (NutraPlate heritage)
- `[M]` More recipe templates for niche categories (keto, vegan, gluten-free)

## Operational / infrastructure

- `[S]` Sentry or equivalent error monitoring integration
- `[S]` Cloudflare Analytics Engine structured logging
- `[M]` Load / stress testing for Worker endpoints
- `[S]` Automated lighthouse / a11y CI gate
- `[S]` Canary / blue-green deployment config
- `[M]` Admin dashboard (generation counts, error rates, costs)
- `[S]` Rate limiting dashboard / alert when nearing Gemini quota

## Design system / DX

- `[S]` Delete duplicate design system in `.claude/skills/scratchnscan-design/`
  and establish `design-system/` as the single canonical source
- `[S]` Auto-sync design tokens from Figma (future)
- `[M]` Storybook or equivalent for component previews
- `[S]` i18n / localization infrastructure (strings currently hardcoded)
