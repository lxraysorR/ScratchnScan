import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync('app/index.html', 'utf8');
for (const token of [
  'result-product-summary','result-understood-panel','result-quick-facts',
  'details-product-summary','details-understood-panel','details-quick-facts',
  'sticky-action-bar','details-delete-btn','result-save-btn','details-favorite-btn'
]) assert.ok(html.includes(token), `missing token ${token}`);

const resultJs = readFileSync('app/js/result.js', 'utf8');
assert.match(resultJs, /renderAccordion\(el\("result-homemade-ingredients"\)\?\.closest\("\.recipe-block"\), true\)/);
assert.match(resultJs, /renderAccordion\(el\("result-homemade-steps"\)\?\.closest\("\.recipe-block"\), true\)/);
assert.match(resultJs, /renderAccordion\(el\("result-why-block"\), false\)/);
assert.match(resultJs, /renderAccordion\(el\("result-tips-block"\), false\)/);

const detailsJs = readFileSync('app/js/details.js', 'utf8');
for (const pattern of [
  /renderAccordion\(el\("details-ingredients"\)\?\.closest\("\.recipe-block"\), false\)/,
  /renderAccordion\(el\("details-steps"\)\?\.closest\("\.recipe-block"\), false\)/,
  /renderAccordion\(el\("details-why-block"\), false\)/,
  /renderAccordion\(el\("details-tips-block"\), false\)/,
]) assert.match(detailsJs, pattern);

const css = readFileSync('app/styles.css', 'utf8');
for (const cls of ['.product-summary-card', '.understood-panel', '.quick-facts', '.sticky-action-bar', '.accordion-toggle']) {
  assert.ok(css.includes(cls), `missing style ${cls}`);
}

console.log('Result/details UI regression tests passed.');
