# QA Run Status

| # | QA File | Status | Date | Summary | Report |
|---|---------|--------|------|---------|--------|
| 01 | `docs/qa/01-smoke-test.md` | Fixed | 2026-05-27 | One blocker: `check:syntax` script missing from package.json. Fixed. All commands pass. | [report](reports/01-smoke-test-report.md) |
| 02 | `docs/qa/02-generation-flow-qa.md` | Fixed | 2026-05-27 | One medium issue: `whyCleaner` vs `whyLessProcessed` contract mismatch in generationController. Fixed. All tests pass. | [report](reports/02-generation-flow-qa-report.md) |
| 03 | `docs/qa/03-photo-upload-qa.md` | Fixed | 2026-05-27 | One medium issue: test_frontend_dom.mjs and test_frontend_helpers.mjs excluded from npm test. Added. All 16 suites pass. | [report](reports/03-photo-upload-qa-report.md) |
| 04 | `docs/qa/04-product-context-qa.md` | Passed | 2026-05-27 | All normalization, confidence, needsManualCorrection, contextToRecipeInput checks pass. Low gap: mergeProductContexts has no direct unit test. | [report](reports/04-product-context-qa-report.md) |
| 05 | `docs/qa/05-popular-starters-qa.md` | Fixed | 2026-05-27 | One medium issue: app.js had a local duplicate of renderPopularChips/STARTER_PANTRY_ITEMS instead of importing popularChips.js. Fixed. | [report](reports/05-popular-starters-qa-report.md) |
| 06 | `docs/qa/06-scanner-flow-qa.md` | Fixed | 2026-05-27 | Two medium issues: dead hasFrontImage/hasBackImage declarations in scan.js; test_scan_submit_regression.mjs excluded from npm test. Both fixed; stale regression assertions updated. | [report](reports/06-scanner-flow-qa-report.md) |
| 07 | `docs/qa/07-result-details-ui-qa.md` | Not Started | — | — | — |
| 08 | `docs/qa/08-storage-supabase-indexeddb-qa.md` | Not Started | — | — | — |
| 09 | `docs/qa/09-accessibility-mobile-qa.md` | Not Started | — | — | — |
| 10 | `docs/qa/10-regression-checklist.md` | Not Started | — | — | — |
