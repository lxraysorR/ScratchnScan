You are working in the Scan-Scratch repo.

Primary task:
Create the backend homemade alternative AI service and endpoint.

Read first:
1. AGENTS.md
2. .agents/skills/scan-scratch-build/SKILL.md
3. docs/AI_JSON_CONTRACT.md
4. .agents/03-homemade-recipe-engine/AGENT.md
5. .agents/05-testing-security-release/AGENT.md
6. Existing src/ai provider files and exact route/service files

Goal:
Add a safe service and endpoint that accepts product/label context and returns validated JSON for a homemade alternative.

Preferred shape:
- POST /api/scan-scratch/homemade-alternative
- src/services/homemadeAlternativeService.js
- src/ai/scanScratchSchema.js or equivalent validator
- tests under src/tests/

Rules:
- Use existing AI/provider abstraction if present.
- Read model/provider from environment variables.
- Never hardcode secrets.
- Never render raw AI prose directly.
- Validate output against docs/AI_JSON_CONTRACT.md.
- Include cautious health/disclaimer language.
- Fail gracefully with a recoverable message.

Validation:
Add tests for valid JSON, malformed JSON, missing fields, and low-confidence output. Run targeted tests, npm test, and npm run build if possible.

Final response:
1. Endpoint/service created
2. Files changed
3. AI provider assumptions
4. Tests/checks run
5. Risks/follow-up
6. Suggested Claude review prompt
