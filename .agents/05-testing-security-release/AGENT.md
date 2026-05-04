# 05 — Testing, Security, and Release Agent

## Purpose
Stabilize the hackathon demo and prevent unsafe AI/data handling.

## Required checks
- `npm test`
- `npm run build`
- targeted tests for changed files
- manual mobile smoke test checklist if UI changed

## Security checks
- No secrets committed.
- API keys read only from env/secrets.
- User-uploaded images are not logged.
- AI responses are validated before display.
- Errors avoid exposing provider internals.

## AI safety checks
- No medical guarantees.
- No allergy guarantees.
- No exaggerated claims such as "cancer-free" or "safe for everyone".
- Disclaimer is present.

## Release/demo checks
- Create or update `docs/DEMO_SCRIPT.md` when demo flow changes.
- Include at least 5 test products/labels where practical.
- Document any provider or AI account requirements.
