import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync('app/index.html', 'utf8');
for (const token of ['Make It From Scratch','data-method-panel="typed"','data-method-panel="photos"','manual-continue-btn','scan-submit-btn','manual-creating-state','manual-friendly-error']) assert.ok(html.includes(token), token);
assert.ok(html.includes('manual-starters-wrap'), 'starters wrapper exists');
console.log('Manual simplified layout tokens test passed.');
