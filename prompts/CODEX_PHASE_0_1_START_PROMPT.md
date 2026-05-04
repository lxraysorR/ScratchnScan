You are working in the Scan-Scratch repo, forked from PantryPulse/NutraPlate.

Primary task:
Set up the Scan-Scratch project shell and MVP direction without implementing the full AI engine yet.

Read first:
1. AGENTS.md
2. CLAUDE.md
3. .agents/skills/scan-scratch-build/SKILL.md
4. docs/MVP_SCOPE.md
5. docs/SCAN_SCRATCH_IMPLEMENTATION_PLAN.md
6. .agents/00-orchestrator/AGENT.md
7. .agents/01-repo-inventory-and-scope/AGENT.md
8. Exact files you plan to modify

Goal:
Complete Phase 0 and Phase 1 from docs/SCAN_SCRATCH_IMPLEMENTATION_PLAN.md.

Rules:
- Keep changes small and safe.
- Do not build subscriptions, household consensus, pantry inventory, Instacart, or meal planning.
- Do not delete inherited code unless you prove it is unused and safe.
- Focus on branding/shell: Scan-Scratch name, mission copy, simple home CTA, and parking non-MVP routes where safe.
- Preserve scan route functionality.
- Update docs/generated/00-workflow-status.md with what you inspected and changed.

Likely files:
- package.json
- public/index.html
- public/manifest.json
- public/app.js
- public/router.js
- public/pages/home.js
- public/styles.css
- docs/generated/00-workflow-status.md

Validation:
Run npm test and npm run build if possible. If either cannot run, document the exact blocker.

Final response:
1. Goal completed
2. Files changed
3. Tests/checks run
4. What was intentionally left out of MVP
5. Risks/follow-up items
6. Suggested Claude review prompt
