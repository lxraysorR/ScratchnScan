/**
 * QA tests for S-05: base64 image payload size limit in parseInlineImage.
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const worker = await import(pathToFileURL(resolve('src/worker.js')).href);
const { parseInlineImage } = worker;

// ---------------------------------------------------------------------------
// Valid images — must pass through unchanged
// ---------------------------------------------------------------------------
{
  const tiny = 'data:image/jpeg;base64,/9j/abc123==';
  const result = parseInlineImage(tiny);
  assert.ok(result !== null, 'valid tiny image is accepted');
  assert.equal(result.mimeType, 'image/jpeg', 'mime type is preserved');
}

{
  // A realistic compressed JPEG (few hundred bytes of base64)
  const fakeJpeg = 'data:image/jpeg;base64,' + 'A'.repeat(500);
  const result = parseInlineImage(fakeJpeg);
  assert.ok(result !== null, 'small realistic payload accepted');
  assert.equal(result.data.length, 500);
}

// ---------------------------------------------------------------------------
// Oversized image — must be rejected
// ---------------------------------------------------------------------------
{
  // Build a payload whose base64 data exceeds 5,592,405 chars (> 4 MB decoded).
  const oversizedData = 'A'.repeat(5_600_000);
  const oversized = `data:image/jpeg;base64,${oversizedData}`;
  const result = parseInlineImage(oversized);
  assert.equal(result, null, 'oversized base64 payload is rejected');
}

{
  // Just at the limit — 5,592,405 chars — should be rejected (> not >=, boundary check).
  const atLimit = 'A'.repeat(5_592_406);
  const result = parseInlineImage(`data:image/jpeg;base64,${atLimit}`);
  assert.equal(result, null, 'payload one char over limit is rejected');
}

{
  // Exactly at the limit — 5,592,405 chars — should be accepted.
  const exactLimit = 'A'.repeat(5_592_405);
  const result = parseInlineImage(`data:image/jpeg;base64,${exactLimit}`);
  assert.ok(result !== null, 'payload exactly at limit is accepted');
}

// ---------------------------------------------------------------------------
// Edge cases — must return null without throwing
// ---------------------------------------------------------------------------
{
  assert.equal(parseInlineImage(null), null, 'null input returns null');
  assert.equal(parseInlineImage(undefined), null, 'undefined returns null');
  assert.equal(parseInlineImage(''), null, 'empty string returns null');
  assert.equal(parseInlineImage('not-a-data-url'), null, 'plain string returns null');
  assert.equal(parseInlineImage('data:text/html;base64,abc'), null, 'non-image MIME rejected by regex');
}

console.log('S-05 image size limit tests passed (7 assertions).');
