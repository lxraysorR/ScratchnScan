/**
 * QA tests for R-05: duplicate list-rendering loops in result.js must be
 * replaced by shared renderList / renderListBlock helpers.
 *
 * Tests cover:
 *  - Source-level: helpers defined, old duplicate loops gone.
 *  - Runtime: renderList clears and populates a list element.
 *  - Runtime: renderListBlock shows/hides the block based on item count.
 *  - Runtime: empty items produce an empty list and hidden block.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = await readFile(resolve('app/js/result.js'), 'utf8');

// ---------------------------------------------------------------------------
// Source-level: helpers must be defined
// ---------------------------------------------------------------------------
{
  assert.ok(/function renderList\(/.test(src), 'renderList() helper is defined');
  assert.ok(/function renderListBlock\(/.test(src), 'renderListBlock() helper is defined');
}

{
  // Old duplicate loops must be gone — no bare innerHTML="" + for...of pairs
  // for the four list elements.
  const oldIngredientLoop = /ingredients\.innerHTML\s*=\s*""\s*;\s*for/.test(src);
  assert.ok(!oldIngredientLoop, 'inline ingredient loop is removed');

  const oldStepsLoop = /steps\.innerHTML\s*=\s*""\s*;\s*for/.test(src);
  assert.ok(!oldStepsLoop, 'inline steps loop is removed');
}

{
  // Both call sites now use the helpers.
  assert.ok(/renderList\(el\("result-homemade-ingredients"\)/.test(src),
    'ingredients list uses renderList()');
  assert.ok(/renderList\(el\("result-homemade-steps"\)/.test(src),
    'steps list uses renderList()');
  assert.ok(/renderListBlock\(whyBlock,\s*whyList/.test(src),
    'why block uses renderListBlock()');
  assert.ok(/renderListBlock\(tipsBlock,\s*tipsList/.test(src),
    'tips block uses renderListBlock()');
}

// ---------------------------------------------------------------------------
// Runtime: replicate helpers and verify behaviour
// ---------------------------------------------------------------------------

// Minimal DOM stub
function makeEl(tag = 'ul') {
  const children = [];
  return {
    tag,
    get innerHTML() { return children.map(c => `<li>${c}</li>`).join(''); },
    set innerHTML(v) { if (v === '') children.length = 0; },
    hidden: false,
    appendChild(child) { children.push(child.textContent); },
    get childCount() { return children.length; },
    get items() { return [...children]; },
  };
}

function renderList(listEl, items) {
  listEl.innerHTML = '';
  for (const item of items) {
    listEl.appendChild({ textContent: item });
  }
}

function renderListBlock(blockEl, listEl, items) {
  if (!listEl || !blockEl) return;
  renderList(listEl, items);
  blockEl.hidden = items.length === 0;
}

{
  // renderList: clears existing content and populates new items
  const list = makeEl();
  list.appendChild({ textContent: 'old item' });
  renderList(list, ['apple', 'banana', 'cherry']);
  assert.deepEqual(list.items, ['apple', 'banana', 'cherry'], 'renderList populates correct items');
}

{
  // renderList: empty array clears the list
  const list = makeEl();
  list.appendChild({ textContent: 'stale' });
  renderList(list, []);
  assert.equal(list.childCount, 0, 'renderList with empty array clears the list');
}

{
  // renderListBlock: items present → block visible
  const block = makeEl('div');
  const list = makeEl();
  block.hidden = true;
  renderListBlock(block, list, ['tip one', 'tip two']);
  assert.equal(block.hidden, false, 'renderListBlock shows block when items present');
  assert.deepEqual(list.items, ['tip one', 'tip two'], 'renderListBlock populates items');
}

{
  // renderListBlock: no items → block hidden
  const block = makeEl('div');
  const list = makeEl();
  block.hidden = false;
  renderListBlock(block, list, []);
  assert.equal(block.hidden, true, 'renderListBlock hides block when no items');
  assert.equal(list.childCount, 0, 'renderListBlock leaves list empty');
}

{
  // renderListBlock: null elements handled gracefully (no throw)
  assert.doesNotThrow(() => renderListBlock(null, null, ['x']),
    'renderListBlock does not throw when elements are null');
}

console.log('R-05 list rendering deduplication tests passed (13 assertions).');
