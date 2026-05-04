# Skill: scratchnscan-build

Purpose: Guide phased implementation of ScratchNScan while preserving a strict MVP boundary.

## When to use
- Starting a new implementation phase
- Reviewing scope drift
- Generating or updating prompts/contracts

## Workflow
1. Read `docs/MVP_SCOPE.md` and `docs/SCRATCHNSCAN_IMPLEMENTATION_PLAN.md`.
2. Confirm requested work maps to current phase.
3. If out-of-scope, add to `docs/BACKLOG.md` and do not implement.
4. Keep AI outputs compliant with `docs/AI_JSON_CONTRACT.md`.
5. Include disclaimer in user-facing result payloads.

## Definition of done
- Scope respected
- Contracts updated if interface changed
- Tests/checks passed
