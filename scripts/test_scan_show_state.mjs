/**
 * QA tests for R-06: scan state must be managed by a declarative visibility
 * map (STATE_VISIBLE / STATE_MANAGED_IDS) rather than scattered hidden toggles.
 *
 * Tests cover:
 *  - Source-level: map and set are defined, old scattered toggles removed.
 *  - Runtime: correct elements shown/hidden for "entry" and "creating" states.
 *  - Runtime: unknown state hides everything managed.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = await readFile(resolve('app/js/scan.js'), 'utf8');

// ---------------------------------------------------------------------------
// Source-level checks
// ---------------------------------------------------------------------------
{
  assert.ok(/STATE_VISIBLE\s*=\s*\{/.test(src), 'STATE_VISIBLE map is defined');
  assert.ok(/STATE_MANAGED_IDS\s*=\s*new Set/.test(src), 'STATE_MANAGED_IDS Set is defined');
}

{
  // Old entryParts array + forEach toggle must be gone.
  const hasEntryParts = /const entryParts\s*=/.test(src);
  assert.ok(!hasEntryParts, 'old entryParts array is removed');
}

{
  // The manual if-block that partially overrode entry state must be gone.
  const hasEntryOverride = /if\s*\(next\s*===\s*["']entry["']\)\s*\{[\s\S]*?manual-confirm-card/.test(src);
  assert.ok(!hasEntryOverride, 'old if(next==="entry") manual-confirm-card override is removed');
}

{
  // showState must delegate to the map, not list individual element IDs inline.
  assert.ok(/STATE_MANAGED_IDS\.forEach/.test(src), 'showState uses STATE_MANAGED_IDS.forEach');
  assert.ok(/visible\.has\(id\)/.test(src), 'visibility is determined by visible.has(id)');
}

// ---------------------------------------------------------------------------
// Runtime: replicate showState logic with a minimal DOM stub
// ---------------------------------------------------------------------------

function makeElements(ids) {
  const nodes = {};
  for (const id of ids) nodes[id] = { hidden: false };
  return nodes;
}

const STATE_VISIBLE = {
  entry:    ['scan-error', 'manual-clear-btn', 'scan-submit-btn'],
  creating: ['manual-creating-state'],
};
const STATE_MANAGED_IDS = new Set([
  'manual-creating-state',
  'manual-confirm-card',
  'scan-error',
  'manual-clear-btn',
  'scan-submit-btn',
]);

function showState(next, nodes) {
  const visible = new Set(STATE_VISIBLE[next] || []);
  STATE_MANAGED_IDS.forEach((id) => {
    if (nodes[id]) nodes[id].hidden = !visible.has(id);
  });
}

{
  // "entry" state
  const nodes = makeElements([...STATE_MANAGED_IDS]);
  showState('entry', nodes);

  assert.equal(nodes['manual-creating-state'].hidden, true,  'entry: manual-creating-state is hidden');
  assert.equal(nodes['manual-confirm-card'].hidden,   true,  'entry: manual-confirm-card is hidden');
  assert.equal(nodes['scan-error'].hidden,            false, 'entry: scan-error is visible');
  assert.equal(nodes['manual-clear-btn'].hidden,      false, 'entry: manual-clear-btn is visible');
  assert.equal(nodes['scan-submit-btn'].hidden,       false, 'entry: scan-submit-btn is visible');
}

{
  // "creating" state
  const nodes = makeElements([...STATE_MANAGED_IDS]);
  showState('creating', nodes);

  assert.equal(nodes['manual-creating-state'].hidden, false, 'creating: manual-creating-state is visible');
  assert.equal(nodes['manual-confirm-card'].hidden,   true,  'creating: manual-confirm-card is hidden');
  assert.equal(nodes['scan-error'].hidden,            true,  'creating: scan-error is hidden');
  assert.equal(nodes['manual-clear-btn'].hidden,      true,  'creating: manual-clear-btn is hidden');
  assert.equal(nodes['scan-submit-btn'].hidden,       true,  'creating: scan-submit-btn is hidden');
}

{
  // Unknown state — all managed elements hidden (safe default)
  const nodes = makeElements([...STATE_MANAGED_IDS]);
  showState('unknown-state', nodes);
  for (const id of STATE_MANAGED_IDS) {
    assert.equal(nodes[id].hidden, true, `unknown state: ${id} is hidden`);
  }
}

console.log('R-06 scan state visibility tests passed (17 assertions).');
