# Claude QA Prompt — Storage (Supabase + IndexedDB Fallback)

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Assess durable storage plan/implementation status and ensure MVP remains functional without Supabase config.

## Do-not-change instructions
- QA-only pass; do not add storage features here.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
- `npm test`
- Storage-related tests if present.
- Inspect docs/config/script references to Supabase and IndexedDB.

## Checklist
- [ ] Supabase is documented as durable storage target (if adopted).
- [ ] IndexedDB remains fallback/cache path.
- [ ] Service role key is not exposed in frontend runtime.
- [ ] Durable records do not store large recipe media as base64 blobs.
- [ ] SQL scripts exist if Supabase implementation has started.
- [ ] Missing Supabase config does not break MVP.
- [ ] History/details still work through IndexedDB fallback.
- [ ] Old local records still render.

## Special handling
If Supabase is not implemented yet:
- Do **not** fail MVP solely for missing Supabase implementation.
- Report:
  1. current storage plan status,
  2. implementation gaps,
  3. recommended next Codex prompt.

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` and include a **Storage Readiness Verdict** section.

## Acceptance criteria
PASS/PARTIAL may be acceptable when Supabase is pending, as long as MVP fallback behavior remains healthy.
