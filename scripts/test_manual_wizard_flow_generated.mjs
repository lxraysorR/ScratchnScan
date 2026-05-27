import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('app/index.html', 'utf8');
for (const token of [
  'data-manual-step="product"',
  'data-manual-step="details"',
  'data-manual-step="review"',
  'data-manual-step="creating"',
  'manual-review-summary',
  'manual-next-product',
  'manual-next-details',
  'scan-edit-btn',
]) {
  assert.ok(html.includes(token), `missing wizard token: ${token}`);
}
console.log('Manual wizard flow test passed.');
