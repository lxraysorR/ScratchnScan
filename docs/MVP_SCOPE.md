# Scan-Scratch MVP Scope

## Goal
Deliver a small, testable MVP that converts packaged food inputs into a plain-English explanation and a cleaner homemade alternative recipe without expanding into non-MVP PantryPulse features.

## In Scope
1. Manual UPC entry.
2. Manual product name and ingredient/label text entry.
3. Plain-English packaged food explanation.
4. AI-generated cleaner homemade alternative recipe.
5. Local saved history (IndexedDB/local browser storage, adapter-based).
6. Recent saved item viewing.
7. Graceful missing-data states.
8. Mobile + desktop usable layout.
9. Lightweight smoke/QA checks.
10. Completion reporting.

## Architecture Boundaries
- Use existing app shell and reuse current modules where possible.
- Use a storage adapter interface for persistence.
- Default storage implementation for MVP: IndexedDB/local browser storage.
- Do **not** integrate Supabase unless already present and working.
- Keep AI/provider configuration environment-driven only.

## Out of Scope (MVP)
- Subscriptions or paid gating.
- Pantry inventory systems.
- Meal planning calendar.
- Shopping checkout integrations.
- Large design-system rewrite.
- Complex account systems.
- Broad refactors unrelated to the active task.

## Done Definition
MVP is done when all checklist sections in `docs/COMPLETION_CHECKLIST.md` are either Done or explicitly Blocked with documented mitigation in `docs/KNOWN_ISSUES.md`.
