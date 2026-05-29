/**
 * QA tests for D-02: orphan CSS rules must have section headers.
 *
 * Checks that .dev-reset-link / .btn-link are preceded by a section
 * comment, and that .upgrade-offer rules are preceded by their own header.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = await readFile(resolve('app/styles.css'), 'utf8');

{
  // DEV UTILITIES header must exist before .dev-reset-link
  const devIdx    = src.indexOf('/* DEV UTILITIES */');
  const resetIdx  = src.indexOf('.dev-reset-link');
  assert.ok(devIdx !== -1, '/* DEV UTILITIES */ section header is present');
  assert.ok(devIdx < resetIdx, '/* DEV UTILITIES */ appears before .dev-reset-link');
}

{
  // UPGRADE OFFER header must exist before .upgrade-offer
  const offerHeaderIdx = src.indexOf('/* UPGRADE OFFER */');
  const offerClassIdx  = src.indexOf('.upgrade-offer {');
  assert.ok(offerHeaderIdx !== -1, '/* UPGRADE OFFER */ section header is present');
  assert.ok(offerHeaderIdx < offerClassIdx, '/* UPGRADE OFFER */ appears before .upgrade-offer');
}

{
  // .btn-link must still be present (not accidentally deleted)
  assert.ok(src.includes('.btn-link'), '.btn-link rule is present');
}

{
  // .upgrade-offer-row must still be present
  assert.ok(src.includes('.upgrade-offer-row'), '.upgrade-offer-row rule is present');
}

{
  // Existing UPGRADE section header is still present
  assert.ok(src.includes('/* UPGRADE */'), 'original /* UPGRADE */ section header preserved');
}

console.log('D-02 CSS section header tests passed (5 assertions).');
