// jsdom DOM-behavior tests for the package-photo tiles and homepage chips.
// These build small, isolated DOM fragments (no app bootstrap) so the
// preview/replace/remove and chip-render behavior is verified directly.
// Requires dev dependencies (jsdom): run `npm install` first.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { applyThumbToTile } = await import(pathToFileURL(resolve('app/js/photoTiles.js')).href);
const { renderPopularChips, pickChipNames, STARTER_PANTRY_ITEMS } =
  await import(pathToFileURL(resolve('app/js/popularChips.js')).href);
const { createLabelTip } = await import(pathToFileURL(resolve('app/js/labelTip.js')).href);

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; }
  catch (err) { console.error(`\n✗ ${name}`); throw err; }
}

function photoSlotMarkup(which) {
  return `
    <div class="photo-slot" data-photo="${which}">
      <button class="photo-tile" type="button" data-photo-trigger="${which}" aria-label="Add ${which} photo">
        <img class="photo-thumb" alt="" hidden />
      </button>
      <input class="photo-input" type="file" data-photo-input="${which}" hidden />
      <div class="photo-actions" data-photo-actions="${which}" hidden>
        <button type="button" data-photo-replace="${which}">Replace</button>
        <button type="button" data-photo-remove="${which}">Remove</button>
      </div>
    </div>`;
}

function freshDoc() {
  const dom = new JSDOM(`<!DOCTYPE html><body>${photoSlotMarkup('front')}${photoSlotMarkup('back')}</body>`);
  return dom.window.document;
}

const slot = (doc, which) => ({
  tile: doc.querySelector(`.photo-slot[data-photo="${which}"] .photo-tile`),
  img: doc.querySelector(`.photo-slot[data-photo="${which}"] .photo-thumb`),
  actions: doc.querySelector(`[data-photo-actions="${which}"]`),
});

// ===========================================================================
// B/C. Selecting an image shows a preview; remove clears it.
// ===========================================================================
test('front image selection shows a thumbnail preview + actions', () => {
  const doc = freshDoc();
  applyThumbToTile('front', 'data:image/jpeg;base64,AAAA', doc);
  const { tile, img, actions } = slot(doc, 'front');
  assert.equal(img.getAttribute('src'), 'data:image/jpeg;base64,AAAA', 'preview src is set');
  assert.equal(img.hidden, false, 'preview becomes visible');
  assert.ok(tile.classList.contains('has-photo'), 'tile marked as having a photo');
  assert.equal(actions.hidden, false, 'replace/remove actions revealed');
  assert.match(tile.getAttribute('aria-label'), /replace front/i, 'aria-label flips to Replace');
});

test('back image selection shows its own preview', () => {
  const doc = freshDoc();
  applyThumbToTile('back', 'data:image/png;base64,BBBB', doc);
  const { img, actions } = slot(doc, 'back');
  assert.equal(img.getAttribute('src'), 'data:image/png;base64,BBBB');
  assert.equal(img.hidden, false);
  assert.equal(actions.hidden, false);
});

test('replacing an image updates the preview src', () => {
  const doc = freshDoc();
  applyThumbToTile('front', 'data:image/jpeg;base64,FIRST', doc);
  applyThumbToTile('front', 'data:image/jpeg;base64,SECOND', doc);
  assert.equal(slot(doc, 'front').img.getAttribute('src'), 'data:image/jpeg;base64,SECOND');
});

test('removing an image clears the preview and resets the tile', () => {
  const doc = freshDoc();
  applyThumbToTile('front', 'data:image/jpeg;base64,AAAA', doc);
  applyThumbToTile('front', null, doc);
  const { tile, img, actions } = slot(doc, 'front');
  assert.equal(img.hasAttribute('src'), false, 'src cleared');
  assert.equal(img.hidden, true, 'preview hidden again');
  assert.equal(tile.classList.contains('has-photo'), false, 'has-photo removed');
  assert.equal(actions.hidden, true, 'actions hidden again');
  assert.match(tile.getAttribute('aria-label'), /add front/i, 'aria-label flips back to Add');
});

test('front and back previews are independent', () => {
  const doc = freshDoc();
  applyThumbToTile('front', 'data:image/jpeg;base64,FRONT', doc);
  applyThumbToTile('back', 'data:image/jpeg;base64,BACK', doc);
  applyThumbToTile('front', null, doc); // remove front only
  assert.equal(slot(doc, 'front').img.hidden, true, 'front cleared');
  assert.equal(slot(doc, 'back').img.getAttribute('src'), 'data:image/jpeg;base64,BACK', 'back untouched');
  assert.equal(slot(doc, 'back').img.hidden, false);
});

test('applyThumbToTile is a no-op when the slot is missing (no throw)', () => {
  const doc = freshDoc();
  assert.doesNotThrow(() => applyThumbToTile('nonexistent', 'data:...', doc));
});

// ===========================================================================
// F. Homepage chips render dynamically, fall back, and are clickable controls.
// ===========================================================================
function chipContainer() {
  const dom = new JSDOM('<!DOCTYPE html><body><div id="home-samples"></div></body>');
  return dom.window.document.getElementById('home-samples');
}

test('dynamic chips render from API data as clickable [data-sample] buttons', () => {
  const container = chipContainer();
  renderPopularChips([{ name: 'Ketchup' }, { name: 'Mayo' }, { name: 'Mustard' }], container);
  const chips = [...container.querySelectorAll('button.chip')];
  assert.equal(chips.length, 3);
  assert.deepEqual(chips.map((c) => c.dataset.sample), ['Ketchup', 'Mayo', 'Mustard'], 'each chip carries its sample name');
  assert.deepEqual(chips.map((c) => c.textContent), ['Ketchup', 'Mayo', 'Mustard']);
  assert.ok(chips.every((c) => c.type === 'button'), 'chips are real buttons');
});

test('fallback pantry chips render when API data is empty', () => {
  const container = chipContainer();
  renderPopularChips([], container);
  const names = [...container.querySelectorAll('button.chip')].map((c) => c.dataset.sample);
  assert.deepEqual(names, STARTER_PANTRY_ITEMS, 'shows Cream Cheese / Mayo / Mustard / Ketchup / Tomato Sauce');
});

test('dynamic and fallback chips share the same clickable contract', () => {
  const dynamic = chipContainer();
  renderPopularChips([{ name: 'Relish' }], dynamic);
  const fallback = chipContainer();
  renderPopularChips([], fallback);
  const dynChip = dynamic.querySelector('button.chip');
  const fbChip = fallback.querySelector('button.chip');
  // The global click handler keys off [data-sample]; both kinds expose it.
  assert.ok(dynChip.dataset.sample && fbChip.dataset.sample, 'both expose data-sample, so clicking behaves identically');
  assert.equal(dynChip.className, fbChip.className, 'same chip styling/class');
});

test('re-rendering clears stale chips (no duplicates)', () => {
  const container = chipContainer();
  renderPopularChips([{ name: 'Ketchup' }], container);
  renderPopularChips([{ name: 'Mayo' }], container);
  const names = [...container.querySelectorAll('button.chip')].map((c) => c.dataset.sample);
  assert.deepEqual(names, ['Mayo'], 'previous chips are cleared before re-render');
});

void pickChipNames; // (covered in test_frontend_helpers.mjs)

console.log(`Frontend DOM tests passed (${passed} cases).`);


test('label tip disclosure is free and accessible with aria-expanded toggling', () => {
  const dom = new JSDOM('<!DOCTYPE html><body></body>');
  const tip = createLabelTip({ title: 'Label tip', body: '<p>Front labels help identify the product.</p>', defaultOpen: false }, dom.window.document);
  dom.window.document.body.appendChild(tip);
  const toggle = tip.querySelector('.label-tip-toggle');
  const body = tip.querySelector('.label-tip-body');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(body.hidden, true);
  assert.ok(!/premium|upgrade|lock/i.test(tip.textContent), 'no premium gating language');
  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(body.hidden, false);
});
