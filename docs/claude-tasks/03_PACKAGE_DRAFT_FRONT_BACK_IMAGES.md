# Task 03 — Package Draft Model with Front and Back Package Images

You are working in the ScratchnScan repository.

## Primary Task

Add a clean local package draft model that supports front/back package images now and can migrate to a real database later.

## Important

Do not add:

- cloud database
- accounts
- Supabase
- server image upload
- AI OCR

Use IndexedDB for now.

Only add image capture/selection if it can be done safely without destabilizing the app.

## Product Direction

ScratchnScan’s ideal flow is:

```text
front package photo
→ back label photo
→ ingredients/preferences
→ homemade recipe generation
```

Brand and category should not be primary required inputs because the future photo/AI flow should extract:

- product name
- brand
- category
- ingredients
- nutrition/label details

## Current MVP

The current MVP must still work without photos.

Keep:

- manual product name
- ingredient text
- preference
- IndexedDB local saved history
- favorite/delete/details

## Package Draft Structure

Add or refine a local package draft structure:

```js
{
  id,
  barcode,
  productName,
  ingredientsText,
  dietaryPreference,
  frontImageLocalRef,
  backImageLocalRef,
  frontImagePreviewDataUrl,
  backImagePreviewDataUrl,
  recipeTitle,
  recipeIngredients,
  recipeSteps,
  recipeTips,
  fallbackUsed,
  isFavorite,
  createdAt,
  updatedAt,
  generationCountedAt
}
```

## Image Handling

If adding actual image selection is safe:

- allow user to choose/take a front image
- allow user to choose/take a back image
- show sharp thumbnails immediately
- allow replace/remove
- store local references or compressed previews in IndexedDB
- avoid huge base64 storage if possible
- keep images optional

If actual image handling is not safe in this pass:

- keep polished photo placeholders
- add code comments and TODOs for real capture
- do not fake that real images were saved

## UI Requirements

Package Entry screen should show:

1. Front package tile
2. Back label tile
3. Product name or quick note
4. Ingredients from package
5. Preference
6. Create Homemade Version button

After user chooses images:

- show thumbnail previews
- show “Replace” and “Remove”
- do not allow thumbnails to look blurry or stretched
- use `object-fit: cover`
- maintain clean mobile layout

## Generation Context

The generator should use available context in this order:

1. productName
2. ingredientsText
3. barcode if present
4. image metadata/placeholders if present
5. dietaryPreference

Do not require images to generate.

Do not require barcode to generate.

Product name should still be required until OCR/AI extraction exists.

## History and Details

Saved history should preserve:

- product name
- recipe title
- ingredients/steps
- preference
- barcode if captured
- image previews if available
- favorite state

Details screen should show:

- original package section
- front/back thumbnails if available
- generated homemade version
- ingredients
- steps
- tips
- disclaimer
- favorite/delete/back actions

## Validation

Run:

```bash
npm test
npm run qa:smoke
npm run build
```

## Manual Validation

1. App loads.
2. Package entry opens.
3. Front/back image placeholders display cleanly.
4. Product name required validation works.
5. Ingredients/preference fields work.
6. If image selection is implemented, thumbnails display sharply.
7. Generate works with no images.
8. Generate works with images if implemented.
9. Save to history works.
10. Details page shows original package context.
11. Delete/favorite works.
12. No console errors.

## Deliverables

Report:

1. Files changed.
2. Package draft model implemented.
3. Front/back image behavior.
4. Confirmation IndexedDB remains local storage.
5. Confirmation no accounts/database were added.
6. Explanation of how this can migrate later to a real database.
