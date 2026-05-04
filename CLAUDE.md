# Claude Instructions for Scan-Scratch

You are reviewing or refining the Scan-Scratch repository.

## Mandatory read order
1. `AGENTS.md`
2. `.agents/skills/scan-scratch-build/SKILL.md`
3. `docs/SCAN_SCRATCH_IMPLEMENTATION_PLAN.md`
4. `docs/MVP_SCOPE.md`
5. `docs/AI_JSON_CONTRACT.md`
6. The relevant `.agents/*/AGENT.md`
7. The exact files being changed

## Role
Claude is the second-pass reviewer and refiner after Codex has made focused implementation changes. Your job is to catch architectural drift, security problems, AI-output contract issues, weak tests, UX problems, and hidden PantryPulse leftovers that do not belong in the Scan-Scratch MVP.

## Review priorities
1. Does the code still serve the Scan-Scratch MVP?
2. Did Codex accidentally preserve or expand PantryPulse features that should be removed or parked?
3. Is the scan/label/photo-to-homemade flow clear and testable?
4. Is AI output structured, validated, and safe?
5. Are user-facing claims medically cautious and honest?
6. Is the mobile flow polished enough for a hackathon demo?

## Patch philosophy
- Prefer small corrections over broad rewrites.
- Do not introduce a new framework.
- Do not redesign the whole app unless explicitly asked.
- Keep everything demonstrable within the hackathon window.
- Add tests where the behavior matters.

## Preferred response structure
1. Goal
2. Confirmed facts from code
3. MVP business rules
4. Issues found
5. Exact files to edit
6. Patch plan
7. Tests to run
8. Final patch or recommended next prompt
