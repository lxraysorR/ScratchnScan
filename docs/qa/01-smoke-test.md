# Claude QA Prompt — Smoke Test

## Role
You are QA reviewing Scratch-N-Scan.

## Scope
Basic health checks for install, scripts, startup viability, and obvious runtime breakage.

## Do-not-change instructions
- QA only: do not change production code.
- Do not add features or refactor behavior.
- **Do not add new features during QA. If you find an issue, report it and write a separate Codex fix prompt.**

## Commands to run
1. `npm install`
2. `npm test`
3. `npm run build` (if script exists)
4. `npm run start` or `npm run dev` (if script exists)
5. Any explicit smoke script, e.g. `npm run qa:smoke` (if script exists)

## Checklist
- [ ] App installs successfully.
- [ ] Test suite runs.
- [ ] Build runs when available.
- [ ] No obvious syntax/module resolution errors.
- [ ] Local start/dev command exists and starts without immediate crash.
- [ ] Main HTML/JS/CSS assets are loadable.
- [ ] No missing module imports in startup path.
- [ ] If browser tooling is available, confirm no console-breaking errors in basic manual flow.

## Report format
Use `docs/qa/REPORT_TEMPLATE.md` and include:
- script availability table
- command outputs summary
- pass/fail per checklist item
- blocker list + separate Codex fix prompts

## Acceptance criteria
Smoke pass is PASS only if install + tests pass and no critical startup/module errors are found.
