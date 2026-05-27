# QA 03 — Photo Upload

## Purpose

Verify the photo tile UI, file selection, compression, draft state management, and the photo-only correction flow work correctly end-to-end.

## Scope

- `app/js/photoTiles.js` — `applyThumbToTile` DOM helper
- `app/js/packageImages.js` — `compressImageFile`
- `app/js/scan.js` — `wirePhotoControls`, `handlePhotoSelected`, `resetDraftUi`
- `app/index.html` — photo slot markup (`data-photo-trigger`, `data-photo-input`, `data-photo-actions`, `data-photo-replace`, `data-photo-remove`)
- `scripts/test_frontend_dom.mjs` — photo tile DOM behavior tests
- `scripts/test_frontend_helpers.mjs` — `compressImageFile` guard tests

## Out of scope

- Photo-only generation/AI path (QA 02)
- Scanner/barcode (QA 06)
- Storage of photos in IndexedDB (QA 08)

## Checklist

### 1. Test suite — photo components

- [ ] `node scripts/test_frontend_dom.mjs` exits 0
- [ ] `node scripts/test_frontend_helpers.mjs` exits 0
- [ ] Both test files are included in `npm test`

### 2. Photo tile markup

- [ ] Front photo slot has `data-photo="front"` container
- [ ] Front tile button has `data-photo-trigger="front"`
- [ ] Front file input has `data-photo-input="front"` and `accept="image/*"` and `capture="environment"`
- [ ] Front actions div has `data-photo-actions="front"`, hidden by default
- [ ] Replace button has `data-photo-replace="front"`
- [ ] Remove button has `data-photo-remove="front"`
- [ ] Back slot mirrors the same structure with `back`

### 3. Photo preview behavior

- [ ] Selecting a front photo sets `img.src`, unhides the preview, adds `has-photo` class, shows actions
- [ ] Selecting a back photo does the same independently
- [ ] Replacing a photo updates `img.src` to the new data URL
- [ ] Removing a photo clears `img.src`, hides preview, removes `has-photo`, hides actions
- [ ] Front and back previews are independent (removing front does not affect back)
- [ ] `applyThumbToTile` is a no-op when the slot is missing (no throw)
- [ ] Tile `aria-label` flips to "Replace…" when photo is present, back to "Add…" when cleared

### 4. compressImageFile validation

- [ ] Passing `null` throws "Not an image file"
- [ ] Passing `{ type: 'text/plain' }` throws "Not an image file"
- [ ] Passing `{}` (no type) throws "Not an image file"

### 5. Draft state management

- [ ] Clicking "Clear form" clears both `draft.frontImagePreviewDataUrl` and `draft.backImagePreviewDataUrl`
- [ ] Clearing the form calls `applyThumbToTile(which, null)` for both slots
- [ ] After remove button, draft field is set to `null`
- [ ] After remove button, toast message says "Front photo removed" or "Back photo removed"

### 6. File input reset

- [ ] After selecting a file, the file input's `value` is reset to `""` so the same file can be re-selected

### 7. No regressions

- [ ] `npm test` passes after any fixes
- [ ] `npm run build` passes after any fixes

## Commands to run

```bash
node scripts/test_frontend_dom.mjs
node scripts/test_frontend_helpers.mjs
npm test
npm run build
```

## Pass criteria

All checklist items checked. Both test scripts exit 0. Both are in `npm test`.

## Failure response

1. Document failing command and full output.
2. Fix only photo-tile/compression/draft-state issues — no other scope.
3. Rerun failing test.
4. If unfixable, mark BLOCKED and document why.
