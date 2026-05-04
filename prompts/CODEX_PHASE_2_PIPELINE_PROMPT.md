You are working in the Scan-Scratch repo.

Primary task:
Implement the first usable UPC/not-found/photo-fallback flow for Scan-Scratch.

Read first:
1. AGENTS.md
2. .agents/skills/scan-scratch-build/SKILL.md
3. docs/MVP_SCOPE.md
4. docs/AI_JSON_CONTRACT.md
5. .agents/02-upc-label-ai-pipeline/AGENT.md
6. .agents/04-ux-and-mobile-flow/AGENT.md
7. Exact files involved

Goal:
When UPC lookup succeeds, route to a Scan-Scratch product/result shell. When UPC lookup is not found or incomplete, show a direct fallback panel for front-label and ingredient/back-label photos with immediate thumbnails.

Rules:
- Do not bury the photo fallback under "more tools".
- Do not implement the final AI recipe engine in this phase.
- Add a placeholder CTA for "Generate homemade version" that calls a stub or clearly documented endpoint only if safe.
- Prevent repeated not-found retry loops.
- Preserve manual barcode entry.
- Keep mobile layout compact and clear.

Likely files:
- public/pages/scan.js
- public/pages/nutrition.js or public/pages/result.js
- public/api.js
- public/router.js
- public/styles.css
- src/app.js only if an endpoint is needed
- tests for not-found/fallback behavior where practical

Validation:
Run targeted tests, npm test, and npm run build if possible.

Final response:
1. Files changed
2. Flow implemented
3. Tests/checks run
4. Known limitations
5. Suggested Claude review prompt
