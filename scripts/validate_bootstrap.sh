#!/usr/bin/env bash
set -euo pipefail

required=(
  "AGENTS.md"
  "CLAUDE.md"
  ".agents/00-orchestrator/AGENT.md"
  ".agents/01-repo-inventory-and-scope/AGENT.md"
  ".agents/02-upc-label-ai-pipeline/AGENT.md"
  ".agents/03-homemade-recipe-engine/AGENT.md"
  ".agents/04-ux-and-mobile-flow/AGENT.md"
  ".agents/05-testing-security-release/AGENT.md"
  ".agents/06-final-review/AGENT.md"
  ".agents/skills/scratchnscan-build/SKILL.md"
  "docs/MVP_SCOPE.md"
  "docs/SCRATCHNSCAN_IMPLEMENTATION_PLAN.md"
  "docs/AI_JSON_CONTRACT.md"
  "docs/BACKLOG.md"
  "docs/DEMO_SCRIPT.md"
  "prompts/CODEX_PHASE_0_1_START_PROMPT.md"
  "prompts/CODEX_PHASE_2_PIPELINE_PROMPT.md"
  "prompts/CODEX_PHASE_3_AI_ENGINE_PROMPT.md"
  "prompts/CLAUDE_REVIEW_PROMPT.md"
)

for f in "${required[@]}"; do
  [[ -f "$f" ]] || { echo "Missing: $f"; exit 1; }
done

echo "Bootstrap validation passed."
