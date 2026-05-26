# Workflow Status

- Date: 2026-05-26
- Task: Replace static homepage sample chips with dynamic popular items from request activity.
- Required references read: `AGENTS.md`, `CLAUDE.md`, `.agents/skills/scratchnscan-build/SKILL.md`, `.agents/03-homemade-recipe-engine/AGENT.md`.

## File-level patch plan
1. Add worker-level Supabase helper using `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
2. Log request events into `public.sns_request_events` after successful UPC lookup and successful homemade generation.
3. Add `GET /api/popular-items` that returns grouped top items by normalized name and fallback starter items.
4. Replace homepage static chip source with dynamic fetch/render and fallback to starter pantry list.
5. Add lightweight generated checks for endpoint and homepage wiring, then run test/build commands.
