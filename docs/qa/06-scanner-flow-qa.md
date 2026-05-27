# QA 06 — Scanner Flow

## Purpose

Verify the scanner service, barcode draft state, `packageEntry.js` wiring, scan-view copy, all status paths, and the regression guard for the manual-submit barcode payload.

## Scope

- `app/js/scannerService.js` — `startScan`, `normalizeBarcode`, draft barcode helpers
- `app/js/scanCoordinator.js` — concurrent scan guard, duplicate barcode cooldown
- `app/js/capacitorBarcodeScannerAdapter.js` — Capacitor adapter
- `app/js/platform.js` — `isNativePlatform`, `getPlatform`
- `app/js/packageEntry.js` — `initPackageEntry`, `refreshBarcodeBanner`, `handleScanClick`, status copy
- `app/index.html` — scan view IDs (`scan-start-btn`, `scan-status`, `draft-barcode*`)
- `scripts/test_scan_submit_regression.mjs`
- `scripts/test_frontend_helpers.mjs` (scanner service / coordinator cases)

## Out of scope

- Generation triggered after scan (QA 02)
- Photo upload (QA 03)
- Storage (QA 08)

## Checklist

### 1. Test suite

- [ ] `node scripts/test_scan_submit_regression.mjs` exits 0
- [ ] `node scripts/test_frontend_helpers.mjs` exits 0 (scanner / coordinator cases)
- [ ] `test_scan_submit_regression.mjs` is in `npm test`

### 2. scan.js payload variables

- [ ] `barcode` is declared with `const` in `handleSubmit`
- [ ] `frontImagePreviewDataUrl` is declared with `const` in `handleSubmit`
- [ ] `backImagePreviewDataUrl` is declared with `const` in `handleSubmit`
- [ ] `barcode` is passed into `runGenerationFlow` input
- [ ] `barcode` is NOT hardcoded as `null` in the saved payload
- [ ] No dead declarations of unused variables remain in `handleSubmit`

### 3. Scanner service statuses

- [ ] Web (non-native) → `{ status: 'unsupported', barcode: null }`
- [ ] Concurrent scan attempt → `{ status: 'busy', barcode: null }`
- [ ] User cancel (no barcodes returned) → `{ status: 'cancelled', barcode: null }`
- [ ] Successful native scan → `{ status: 'success', barcode: <normalized> }`
- [ ] Duplicate barcode within cooldown → `{ status: 'duplicate', barcode: <value> }`

### 4. `normalizeBarcode`

- [ ] Strips all non-digit characters
- [ ] Returns `""` for null/undefined
- [ ] Returns digits-only for mixed input like `"012-000-1772"`

### 5. Draft barcode helpers

- [ ] `setDraftBarcode` → stores in `sessionStorage`
- [ ] `getDraftBarcode` → reads from `sessionStorage`
- [ ] `clearDraftBarcode` → removes from `sessionStorage`
- [ ] All helpers are safe when `sessionStorage` is unavailable (no throw)

### 6. Coordinator

- [ ] `beginScan()` returns `true` first call, `false` if already active
- [ ] `endScan()` unlocks for next scan
- [ ] `shouldAcceptBarcode` rejects same barcode within cooldown
- [ ] `shouldAcceptBarcode` accepts different barcode immediately

### 7. `packageEntry.js` wiring

- [ ] `scan-start-btn` exists in HTML and `initPackageEntry` attaches click handler
- [ ] `draft-barcode`, `draft-barcode-value`, `draft-barcode-clear` exist in HTML
- [ ] `refreshBarcodeBanner` shows banner when draft barcode is set
- [ ] `refreshBarcodeBanner` hides banner when no barcode
- [ ] `draft-barcode-clear` click clears barcode and hides banner
- [ ] `initPackageEntry` is idempotent (second call does not double-wire)

### 8. Status copy coverage

- [ ] `STATUS_COPY` in `packageEntry.js` covers all `startScan` statuses: `scanning`, `success`, `duplicate`, `cancelled`, `busy`, `permission-denied`, `preparing`, `unsupported`, `error`
- [ ] `unsupported` / `error` status routes user to `#manual` after a short delay

### 9. No regressions

- [ ] `npm test` passes
- [ ] `npm run build` passes

## Commands to run

```bash
node scripts/test_scan_submit_regression.mjs
node scripts/test_frontend_helpers.mjs
npm test
npm run build
```

## Pass criteria

All checklist items checked. All commands exit 0. `test_scan_submit_regression.mjs` is in `npm test`.

## Failure response

1. Document failing command and full output.
2. Fix only scanner/barcode/wiring issues — no other scope.
3. Rerun failing test.
