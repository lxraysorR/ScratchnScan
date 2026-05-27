# ScratchnScan QA Pack

This folder contains the controlled QA-and-fix workflow for the ScratchnScan MVP.

## Purpose

Run one QA file at a time. Fix only the issues from that scope. Stop and report. Advance to the next file only after the current one is Passed or Fixed.

## QA file order

| # | File | Scope |
|---|------|-------|
| 01 | [01-smoke-test.md](01-smoke-test.md) | Dependencies, file existence, syntax, build, test suite |
| 02 | [02-generation-flow-qa.md](02-generation-flow-qa.md) | Manual entry → generation → loading/error states |
| 03 | [03-photo-upload-qa.md](03-photo-upload-qa.md) | Photo tile capture, correction flow, preview |
| 04 | [04-product-context-qa.md](04-product-context-qa.md) | ProductContext normalization and enrichment |
| 05 | [05-popular-starters-qa.md](05-popular-starters-qa.md) | Popular chips data and rendering |
| 06 | [06-scanner-flow-qa.md](06-scanner-flow-qa.md) | Scanner ID wiring, fallback copy, barcode draft banner |
| 07 | [07-result-details-ui-qa.md](07-result-details-ui-qa.md) | Result and details view rendering |
| 08 | [08-storage-supabase-indexeddb-qa.md](08-storage-supabase-indexeddb-qa.md) | Storage adapter, save/history/delete/persist |
| 09 | [09-accessibility-mobile-qa.md](09-accessibility-mobile-qa.md) | Mobile layout, aria labels, keyboard nav |
| 10 | [10-regression-checklist.md](10-regression-checklist.md) | Full regression sweep across all flows |

## Status tracker

See [QA_RUN_STATUS.md](QA_RUN_STATUS.md).

## Reports

Reports are written to `docs/qa/reports/` using [REPORT_TEMPLATE.md](REPORT_TEMPLATE.md).
