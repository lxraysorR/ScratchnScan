# Workflow Status

## Task
Create a structured QA prompt pack for Claude under `docs/qa/` so QA can be run in focused passes without changing production behavior.

## File-level patch plan
1. **Create `docs/qa/README.md`** with usage rules, constraints, and recommended execution sequence.
2. **Create `docs/qa/00-master-qa-runbook.md`** as the orchestration prompt for full QA execution.
3. **Create focused QA prompts** in `docs/qa/01` through `docs/qa/10` covering smoke, generation, photo upload, ProductContext, popular starters, scanner flow, result/details UI, storage fallback, accessibility/mobile, and regression.
4. **Create `docs/qa/REPORT_TEMPLATE.md`** as the standard output format for all QA runs.
5. **Run validation commands** (`npm test`, `npm run build`, `npm run qa:smoke`) and report outcomes.

## Constraints honored
- Documentation-only change set.
- No production behavior changes.
- No auth/billing/scanner implementation/Supabase feature work.
- Keep prompts focused so Claude reports issues first and proposes separate Codex fix prompts.
