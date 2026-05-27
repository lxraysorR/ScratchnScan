# QA 01 — Smoke Test

## Purpose

Verify the project installs, builds, and its full test suite passes. Confirm required files and scripts are present. Catch syntax errors and missing dependencies before any flow QA.

## Scope

- Dependency installation
- Required file existence
- Required npm scripts existence
- JavaScript syntax checks
- `npm test` (full test suite)
- `npm run qa:smoke` (file/script presence check)
- `npm run build` (dist output)
- `npm run qa:flow` (aggregate gate)

## Out of scope

- Browser behavior
- AI/API calls
- Storage flows
- UI rendering

## Checklist

### 1. Dependencies

- [ ] `npm install` completes without error
- [ ] No missing peer dependencies (warnings are acceptable)

### 2. Required files

- [ ] `app/index.html` exists
- [ ] `app/js/app.js` exists
- [ ] `app/js/scan.js` exists
- [ ] `app/js/api.js` exists
- [ ] `app/styles.css` exists
- [ ] `docs/MVP_SCOPE.md` exists
- [ ] `docs/COMPLETION_CHECKLIST.md` exists
- [ ] `qa/state/daily-qa-state.json` exists
- [ ] `scripts/qa-smoke.js` exists
- [ ] `scripts/app-status.js` exists
- [ ] `scripts/agent-next-task.js` exists

### 3. Required npm scripts

- [ ] `npm test` script defined in package.json
- [ ] `npm run build` script defined in package.json
- [ ] `npm run qa:smoke` script defined in package.json
- [ ] `npm run qa:flow` script defined in package.json
- [ ] `npm run app:status` script defined in package.json
- [ ] `npm run agent:next` script defined in package.json

### 4. Syntax checks

- [ ] `node --check app/js/app.js` passes
- [ ] `node --check app/js/scan.js` passes
- [ ] `node --check app/js/packageEntry.js` passes
- [ ] `node --check app/js/result.js` passes
- [ ] `node --check app/js/history.js` passes
- [ ] `node --check app/js/api.js` passes
- [ ] `node --check app/js/localDb.js` passes
- [ ] `node --check app/js/usage.js` passes
- [ ] `node --check app/js/manualRecipe.js` passes
- [ ] `node --check scripts/app-status.js` passes
- [ ] `node --check scripts/agent-next-task.js` passes

### 5. Test suite

- [ ] `npm test` exits 0
- [ ] No test reports unexpected failures in output

### 6. Smoke script

- [ ] `npm run qa:smoke` exits 0
- [ ] Output shows `Smoke result: PASS`

### 7. Build

- [ ] `npm run build` exits 0
- [ ] `dist/index.html` written
- [ ] `dist/js/app.js` written

### 8. Aggregate flow gate

- [ ] `npm run qa:flow` exits 0

## Commands to run

```bash
npm install
node --check app/js/app.js app/js/scan.js app/js/packageEntry.js app/js/result.js app/js/history.js app/js/api.js app/js/localDb.js app/js/usage.js app/js/manualRecipe.js
node --check scripts/app-status.js scripts/agent-next-task.js
npm test
npm run qa:smoke
npm run build
npm run qa:flow
```

## Pass criteria

All checklist items above must be checked. Any exit-code failure is a blocker.

## Failure response

1. Document the failing command and full output.
2. Fix only the failure (syntax error, missing file, wrong script name).
3. Rerun the failed command.
4. If unfixable, mark BLOCKED and document why.
