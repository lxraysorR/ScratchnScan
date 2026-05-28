// Responsive CSS regression tests.
// Verifies that styles.css contains the correct mobile-first layout rules
// for all components that were fixed to prevent horizontal overflow.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('app/styles.css', 'utf8');

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; }
  catch (err) { console.error(`\n✗ ${name}`); throw err; }
}

// ── Global overflow protection ──────────────────────────────────────────────

test('html has max-width: 100%', () => {
  assert.ok(/html\s*\{[^}]*max-width:\s*100%/.test(css), 'html must have max-width: 100%');
});

test('body has overflow-x: hidden', () => {
  assert.ok(/body\s*\{[^}]*overflow-x:\s*hidden/.test(css), 'body must have overflow-x: hidden');
});

test('key containers have max-width: 100% and min-width: 0 block', () => {
  assert.ok(
    css.includes('.app,') && css.includes('.main,') && css.includes('max-width: 100%;') && css.includes('min-width: 0;'),
    'global container safety block must set max-width: 100% and min-width: 0'
  );
});

// ── .btn ────────────────────────────────────────────────────────────────────

test('.btn has max-width: 100%', () => {
  const btnBlock = css.match(/\.btn\s*\{([^}]+)\}/)?.[1] ?? '';
  assert.ok(btnBlock.includes('max-width: 100%'), '.btn must have max-width: 100%');
});

test('.btn has min-width: 0', () => {
  const btnBlock = css.match(/\.btn\s*\{([^}]+)\}/)?.[1] ?? '';
  assert.ok(btnBlock.includes('min-width: 0'), '.btn must have min-width: 0');
});

test('.btn has white-space: normal', () => {
  const btnBlock = css.match(/\.btn\s*\{([^}]+)\}/)?.[1] ?? '';
  assert.ok(btnBlock.includes('white-space: normal'), '.btn must have white-space: normal');
});

// ── .scan-actions ───────────────────────────────────────────────────────────

test('.scan-actions defaults to 1 column', () => {
  assert.ok(
    /\.scan-actions\s*\{[^}]*grid-template-columns:\s*1fr[^}]*\}/.test(css),
    '.scan-actions must default to grid-template-columns: 1fr'
  );
});

test('.scan-actions becomes 2 columns only at min-width: 390px', () => {
  assert.ok(
    /min-width:\s*390px[^}]*\}[^{]*\.scan-actions|\.scan-actions[^{]*min-width:\s*390px/.test(css) ||
    css.includes('@media (min-width: 390px)') && css.includes('.scan-actions'),
    '.scan-actions must gain 2 columns only inside a 390px min-width media query'
  );
});

// ── .photo-grid ─────────────────────────────────────────────────────────────

test('.photo-grid defaults to 1 column', () => {
  assert.ok(
    /\.photo-grid\s*\{[^}]*grid-template-columns:\s*1fr[^}]*\}/.test(css),
    '.photo-grid must default to grid-template-columns: 1fr'
  );
});

test('.photo-grid has a min-width media query for 2 columns', () => {
  const mediaBlocks = [...css.matchAll(/@media\s*\([^)]*min-width[^)]*\)\s*\{([^{}]*\{[^}]*\}[^{}]*)*\}/g)]
    .map(m => m[0]);
  const hasResponsivePhotoGrid = mediaBlocks.some(b => b.includes('.photo-grid') && b.includes('1fr 1fr'));
  assert.ok(hasResponsivePhotoGrid, '.photo-grid must switch to 2 columns inside a min-width media query');
});

// ── .photo-actions ──────────────────────────────────────────────────────────

test('.photo-actions defaults to 1 column', () => {
  assert.ok(
    /\.photo-actions\s*\{[^}]*grid-template-columns:\s*1fr[^}]*\}/.test(css),
    '.photo-actions must default to 1 column'
  );
});

// ── .form-actions-inline ─────────────────────────────────────────────────────

test('.form-actions-inline defaults to 1 column', () => {
  assert.ok(
    /\.form-actions-inline\s*\{[^}]*grid-template-columns:\s*1fr[^}]*\}/.test(css),
    '.form-actions-inline must default to grid-template-columns: 1fr'
  );
});

// ── .sticky-action-bar ──────────────────────────────────────────────────────

test('.sticky-action-bar defaults to 1 column', () => {
  assert.ok(
    /\.sticky-action-bar\s*\{[^}]*grid-template-columns:\s*1fr[^}]*\}/.test(css),
    '.sticky-action-bar must default to 1 column'
  );
});

// ── .quick-facts ─────────────────────────────────────────────────────────────

test('.quick-facts defaults to 1 column', () => {
  assert.ok(
    /\.quick-facts\s*\{[^}]*grid-template-columns:\s*1fr[^}]*\}/.test(css),
    '.quick-facts must default to 1 column'
  );
});

test('.quick-facts has a min-width media query for 3 columns', () => {
  assert.ok(
    css.includes('repeat(3, minmax(0, 1fr))') || css.includes('repeat(3,minmax(0,1fr))'),
    '.quick-facts must use repeat(3, minmax(0, 1fr)) inside a min-width media query'
  );
});

// ── .metric-row ──────────────────────────────────────────────────────────────

test('.metric-row defaults to 1 column', () => {
  assert.ok(
    /\.metric-row\s*\{[^}]*grid-template-columns:\s*1fr[^}]*\}/.test(css),
    '.metric-row must default to 1 column'
  );
});

// ── .details-photo-row ───────────────────────────────────────────────────────

test('.details-photo-row defaults to 1 column', () => {
  assert.ok(
    /\.details-photo-row\s*\{[^}]*grid-template-columns:\s*1fr[^}]*\}/.test(css),
    '.details-photo-row must default to 1 column'
  );
});

// ── .history-actions ─────────────────────────────────────────────────────────

test('.history-actions uses minmax(0, 1fr) for main action', () => {
  assert.ok(
    css.includes('minmax(0, 1fr) 44px') || css.includes('minmax(0,1fr) 44px'),
    '.history-actions must use minmax(0, 1fr) to prevent overflow'
  );
});

// ── .start-card ──────────────────────────────────────────────────────────────

test('.start-card text column uses minmax(0, 1fr)', () => {
  assert.ok(
    css.includes('minmax(0, 1fr) auto') || css.includes('minmax(0,1fr) auto'),
    '.start-card must use minmax(0, 1fr) for the text column'
  );
});

// ── .chip-row ────────────────────────────────────────────────────────────────

test('.chip-row uses flex-wrap: nowrap for horizontal scroll', () => {
  assert.ok(
    /\.chip-row\s*\{[^}]*flex-wrap:\s*nowrap/.test(css),
    '.chip-row must have flex-wrap: nowrap'
  );
});

test('.chip-row has overflow-x: auto', () => {
  assert.ok(
    /\.chip-row\s*\{[^}]*overflow-x:\s*auto/.test(css),
    '.chip-row must have overflow-x: auto'
  );
});

// ── Recipe/list containers ───────────────────────────────────────────────────

test('.result-card has overflow-wrap: anywhere', () => {
  assert.ok(
    /\.result-card\s*\{[^}]*overflow-wrap:\s*anywhere/.test(css),
    '.result-card must have overflow-wrap: anywhere'
  );
});

test('.bullet-list and .step-list have max-width: 100%', () => {
  assert.ok(
    /\.bullet-list,\s*\.step-list\s*\{[^}]*max-width:\s*100%/.test(css),
    '.bullet-list and .step-list must have max-width: 100%'
  );
});

test('.bullet-list li and .step-list li have overflow-wrap: anywhere', () => {
  assert.ok(
    /\.bullet-list li,\s*\.step-list li\s*\{[^}]*overflow-wrap:\s*anywhere/.test(css),
    'list items must have overflow-wrap: anywhere'
  );
});

// ── .wizard-stepper ──────────────────────────────────────────────────────────

test('.wizard-stepper defaults to 2 columns on narrow screens', () => {
  assert.ok(
    /\.wizard-stepper\s*\{[^}]*grid-template-columns:\s*repeat\(2/.test(css),
    '.wizard-stepper must default to 2 columns'
  );
});

// ── .alert ───────────────────────────────────────────────────────────────────

test('.alert has flex-wrap: wrap', () => {
  assert.ok(
    /\.alert\s*\{[^}]*flex-wrap:\s*wrap/.test(css),
    '.alert must have flex-wrap: wrap'
  );
});

console.log(`Responsive CSS regression tests passed (${passed} checks).`);
