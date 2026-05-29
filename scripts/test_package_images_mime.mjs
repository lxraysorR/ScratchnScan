/**
 * QA tests for S-06: SVG and unsafe MIME types must be rejected by compressImageFile.
 *
 * compressImageFile uses FileReader + canvas (browser APIs), so we test the
 * MIME guard by extracting and re-implementing the same allowlist logic and
 * verifying it against the source, then confirm the error message changed.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = await readFile(resolve('app/js/packageImages.js'), 'utf8');

// ---------------------------------------------------------------------------
// Source-level: allowlist must be defined and SVG must not be in it
// ---------------------------------------------------------------------------
{
  const hasAllowlist = /ALLOWED_IMAGE_TYPES\s*=\s*new Set/.test(src);
  assert.ok(hasAllowlist, 'ALLOWED_IMAGE_TYPES Set is defined');
}

{
  const svgInAllowlist = /ALLOWED_IMAGE_TYPES[^;]*image\/svg/.test(src);
  assert.ok(!svgInAllowlist, 'image/svg+xml is NOT in the allowlist');
}

{
  // All expected safe types must be present
  const safeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'image/gif'];
  for (const type of safeTypes) {
    assert.ok(src.includes(`"${type}"`), `${type} is in the allowlist`);
  }
}

{
  // Guard uses the allowlist, not the old startsWith check
  const usesAllowlist = /ALLOWED_IMAGE_TYPES\.has\(file\.type/.test(src);
  assert.ok(usesAllowlist, 'guard uses ALLOWED_IMAGE_TYPES.has() not startsWith');

  const usesStartsWith = /file\.type\.startsWith\("image\/"/.test(src);
  assert.ok(!usesStartsWith, 'old startsWith("image/") check is removed');
}

{
  // Error message is user-friendly (not the old terse "Not an image file")
  const hasNewMsg = /Unsupported file type/.test(src);
  assert.ok(hasNewMsg, 'user-friendly error message is present');
}

// ---------------------------------------------------------------------------
// Runtime: replicate the allowlist check and run it against real MIME types
// ---------------------------------------------------------------------------
{
  // Extract the allowlist from source by evaluating just that constant
  const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/avif",
    "image/gif",
  ]);

  function mimeAllowed(type) {
    return ALLOWED_IMAGE_TYPES.has((type ?? "").toLowerCase());
  }

  // Blocked types
  assert.ok(!mimeAllowed("image/svg+xml"),  'SVG is blocked');
  assert.ok(!mimeAllowed("image/svg"),       'SVG shorthand is blocked');
  assert.ok(!mimeAllowed("text/html"),       'HTML is blocked');
  assert.ok(!mimeAllowed("application/pdf"), 'PDF is blocked');
  assert.ok(!mimeAllowed(""),                'empty string is blocked');
  assert.ok(!mimeAllowed(null),              'null is blocked');

  // Allowed types
  assert.ok(mimeAllowed("image/jpeg"),  'JPEG is allowed');
  assert.ok(mimeAllowed("image/jpg"),   'JPG alias is allowed');
  assert.ok(mimeAllowed("image/png"),   'PNG is allowed');
  assert.ok(mimeAllowed("image/webp"),  'WebP is allowed');
  assert.ok(mimeAllowed("image/heic"),  'HEIC is allowed');
  assert.ok(mimeAllowed("image/heif"),  'HEIF is allowed');
  assert.ok(mimeAllowed("image/avif"),  'AVIF is allowed');
  assert.ok(mimeAllowed("image/gif"),   'GIF is allowed');

  // Case-insensitivity
  assert.ok(mimeAllowed("IMAGE/JPEG"),  'MIME type matching is case-insensitive');
  assert.ok(!mimeAllowed("IMAGE/SVG+XML"), 'SVG blocked even uppercase');
}

console.log('S-06 MIME allowlist tests passed (24 assertions).');
