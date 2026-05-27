# QA Report: [QA FILE NAME]

## Overview

| Field | Value |
|-------|-------|
| QA file | `docs/qa/XX-filename.md` |
| Date | YYYY-MM-DD |
| Branch | |
| Tester | Claude Code (automated) |
| Overall status | PASS / FAIL / FIXED / BLOCKED |

## Commands run

```
npm install
npm test
npm run build
npm run qa:smoke
npm run qa:flow
```

## Pass/fail results

| Command | Result | Notes |
|---------|--------|-------|
| `npm install` | | |
| `npm test` | | |
| `npm run qa:smoke` | | |
| `npm run build` | | |

## Checklist results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | | | |

## Issues found

### Issue 1 — [Severity: Critical/High/Medium/Low]

**File:** `path/to/file.js`
**Description:**
**Impact:**

## Fixes made

### Fix 1 — [Issue reference]

**Files changed:**
- `path/to/file.js`

**What changed:**

## Files changed

- `path/to/file.js` — description

## Tests rerun after fixes

| Command | Result |
|---------|--------|
| `npm test` | |
| `npm run build` | |

## Remaining issues

| ID | Description | Severity | Recommended action |
|----|-------------|----------|--------------------|

## Recommended next QA file

`docs/qa/XX-next-qa-file.md`

## Recommended Codex prompt for unresolved issues

```
[Codex prompt if any issues remain unresolved]
```
