# Task 004 — IndexedDB History

## Objective
Implement local history with a storage adapter interface and IndexedDB-backed MVP implementation.

## Do
- Reuse existing local storage helpers if present.
- Add adapter boundary so Supabase can be added later.
- Keep persistence local-only for MVP.
- Update docs/checklist/known issues and add QA report.

## Do Not
- Do not integrate Supabase unless already working.
- Do not add backend persistence requirements.

## Tests
- Save/reload history checks.
- `npm run qa:smoke`
