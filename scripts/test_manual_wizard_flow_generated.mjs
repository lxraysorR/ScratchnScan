import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('app/index.html', 'utf8');
for (const token of [
  'data-input-method="typed"',
  'data-input-method="photos"',
  'data-input-method="barcode"',
  'data-method-panel="typed"',
  'data-method-panel="photos"',
  'data-method-panel="barcode"',
  'manual-popular-starters-wrap',
  'friendly-recovery',
  'Generate Homemade Version',
]) {
  assert.ok(html.includes(token), `missing wizard token: ${token}`);
}
assert.ok(!html.includes('data-manual-step="details"'), 'details step should be collapsed into advanced details');
console.log('Manual wizard flow test passed.');
