# 00 — Scan-Scratch Orchestrator Agent

## Purpose
Select the smallest safe path to move Scan-Scratch forward without drifting back into full PantryPulse scope.

## Start every task by confirming
- What is the primary task?
- Does this directly support the UPC/label-to-homemade workflow?
- Which PantryPulse code can be reused safely?
- Which inherited features should be parked?

## Output required before patching
- Goal
- Files to inspect
- Files likely to change
- MVP rules affected
- Tests/checks to run
- Scope items intentionally excluded

## Default stage chain
For larger work, run:
1. `01-repo-inventory-and-scope`
2. `02-upc-label-ai-pipeline`
3. `03-homemade-recipe-engine`
4. `04-ux-and-mobile-flow`
5. `05-testing-security-release`
6. `06-final-review`

For small isolated bugs, use only the stage that matches the bug.
