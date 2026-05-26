// Pure (no-DOM, no-network) unit tests for the frontend helpers that drive the
// core user flow. Network is mocked via globalThis.fetch; no jsdom required so
// this runs in the default `npm test` chain without dev dependencies.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// A sessionStorage shim so scannerService draft-barcode helpers work in Node.
const memory = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
  clear: () => memory.clear(),
};

const load = (p) => import(pathToFileURL(resolve(p)).href);

const { buildGenerationPayload } = await load('app/js/generationPayload.js');
const { pickChipNames, STARTER_PANTRY_ITEMS } = await load('app/js/popularChips.js');
const coordinator = await load('app/js/scanCoordinator.js');
const scannerService = await load('app/js/scannerService.js');
const api = await load('app/js/api.js');
const { compressImageFile } = await load('app/js/packageImages.js');

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
  } catch (err) {
    console.error(`\n✗ ${name}`);
    throw err;
  }
}

// ===========================================================================
// E. Generation payload shaping
// ===========================================================================
await test('buildGenerationPayload: shapes text-only request correctly', () => {
  const p = buildGenerationPayload({ productName: '  Oreos  ', ingredients: ' sugar ', dietaryPreference: 'less sugar' });
  assert.equal(p.productName, 'Oreos', 'trims product name');
  assert.equal(p.ingredients, 'sugar', 'trims ingredients');
  assert.equal(p.dietaryPreference, 'less sugar');
  assert.equal(p.goals, 'less sugar', 'mirrors dietaryPreference into goals for the worker');
  assert.equal(p.upc, undefined, 'no barcode -> upc omitted');
  assert.equal(p.hasFrontImage, false, 'image flags default to booleans');
  assert.equal(p.hasBackImage, false);
});

await test('buildGenerationPayload: includes barcode + image metadata when present', () => {
  const p = buildGenerationPayload({
    productName: 'Mystery Snack',
    barcode: '012000001772',
    hasFrontImage: 'truthy',
    hasBackImage: 1,
  });
  assert.equal(p.upc, '012000001772', 'barcode forwarded as upc');
  assert.equal(p.hasFrontImage, true, 'coerces truthy image flag to boolean');
  assert.equal(p.hasBackImage, true);
});

await test('buildGenerationPayload: empty input is safe', () => {
  const p = buildGenerationPayload();
  assert.equal(p.productName, '');
  assert.equal(p.upc, undefined);
  assert.equal(p.hasFrontImage, false);
});

// ===========================================================================
// F. Popular homepage chips (selection logic)
// ===========================================================================
await test('pickChipNames: returns dynamic names from API data, capped + ordered', () => {
  const items = [
    { name: 'Ketchup', normalizedName: 'ketchup' },
    { name: 'Mayo', normalizedName: 'mayo' },
    { name: 'Mustard', normalizedName: 'mustard' },
  ];
  assert.deepEqual(pickChipNames(items), ['Ketchup', 'Mayo', 'Mustard']);
});

await test('pickChipNames: dedupes by normalized key and respects the limit', () => {
  const items = [
    { name: 'Ketchup', normalizedName: 'ketchup' },
    { name: 'ketchup', normalizedName: 'ketchup' },
    { name: 'Mayo' },
    { name: 'Mustard' },
    { name: 'Relish' },
    { name: 'Pickles' },
  ];
  const picked = pickChipNames(items);
  assert.deepEqual(picked, ['Ketchup', 'Mayo', 'Mustard', 'Relish', 'Pickles'], 'dedupe + 5-item cap');
  assert.equal(pickChipNames(items, 2).length, 2, 'honors custom limit');
});

await test('pickChipNames: empty/blank input falls back to pantry starters', () => {
  assert.deepEqual(pickChipNames([]), STARTER_PANTRY_ITEMS);
  assert.deepEqual(pickChipNames(undefined), STARTER_PANTRY_ITEMS);
  assert.deepEqual(pickChipNames([{ name: '  ' }, { name: '' }]), STARTER_PANTRY_ITEMS, 'blank names -> fallback');
  assert.deepEqual(STARTER_PANTRY_ITEMS, ['Cream Cheese', 'Mayo', 'Mustard', 'Ketchup', 'Tomato Sauce']);
});

// ===========================================================================
// A. Scan availability / coordinator guard rails
// ===========================================================================
await test('scanCoordinator: prevents concurrent scans (no dead/double trigger)', () => {
  coordinator.resetScanState();
  assert.equal(coordinator.beginScan(), true, 'first scan starts');
  assert.equal(coordinator.beginScan(), false, 'second concurrent scan is blocked');
  assert.equal(coordinator.isScanInFlight(), true);
  coordinator.endScan();
  assert.equal(coordinator.beginScan(), true, 'can scan again after the first ends');
  coordinator.endScan();
});

await test('scanCoordinator: de-dupes the same barcode within the cooldown window', () => {
  coordinator.resetScanState();
  coordinator.setCooldownMs(1500);
  assert.equal(coordinator.shouldAcceptBarcode('012000001772'), true, 'first read accepted');
  assert.equal(coordinator.shouldAcceptBarcode('012000001772'), false, 'immediate repeat rejected');
  assert.equal(coordinator.shouldAcceptBarcode('999999999999'), true, 'a different barcode is accepted');
});

await test('scannerService.startScan: returns a friendly fallback in the browser', async () => {
  scannerService.resetScannerState();
  delete globalThis.Capacitor; // ensure non-native
  const result = await scannerService.startScan();
  assert.equal(result.status, 'unsupported', 'web/no-camera resolves to a fallback status, never a throw');
  assert.equal(result.barcode, null);
});

await test('scannerService.startScan: reports busy when a scan is already in flight', async () => {
  scannerService.resetScannerState();
  delete globalThis.Capacitor;
  assert.equal(coordinator.beginScan(), true);
  const result = await scannerService.startScan();
  assert.equal(result.status, 'busy', 'second concurrent start is reported, not crashed');
  coordinator.endScan();
});

await test('scannerService.startScan: a cancelled native scan resolves cleanly (no crash)', async () => {
  scannerService.resetScannerState();
  // Simulate a native device whose scanner returns no barcode (user cancelled).
  globalThis.Capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => 'ios',
    Plugins: {
      BarcodeScanner: {
        isSupported: async () => ({ supported: true }),
        checkPermissions: async () => ({ camera: 'granted' }),
        requestPermissions: async () => ({ camera: 'granted' }),
        scan: async () => ({ barcodes: [] }),
      },
    },
  };
  const result = await scannerService.startScan();
  assert.equal(result.status, 'cancelled', 'cancelled scan yields a clean status object');
  assert.equal(result.barcode, null);
  delete globalThis.Capacitor;
  scannerService.resetScannerState();
});

await test('scannerService draft barcode: set / read / clear round-trips', () => {
  scannerService.setDraftBarcode('012000001772');
  assert.equal(scannerService.getDraftBarcode(), '012000001772');
  scannerService.clearDraftBarcode();
  assert.equal(scannerService.getDraftBarcode(), '');
});

// ===========================================================================
// D / H. API client: readable errors + safe fallbacks
// ===========================================================================
const realFetch = globalThis.fetch;
function mockFetch(handler) {
  globalThis.fetch = async (url, options) => handler(String(url), options);
}
function restoreFetch() { globalThis.fetch = realFetch; }
const jsonRes = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

await test('generateScratchRecipe: returns the body on success', async () => {
  mockFetch(() => jsonRes({ ok: true, recipe: { homemadeAlternative: { title: 'X' } } }));
  try {
    const body = await api.generateScratchRecipe({ productName: 'Oreos' });
    assert.equal(body.ok, true);
    assert.equal(body.recipe.homemadeAlternative.title, 'X');
  } finally { restoreFetch(); }
});

await test('generateScratchRecipe: surfaces a readable error on non-OK', async () => {
  mockFetch(() => jsonRes({ error: 'AI response failed validation' }, 502));
  try {
    await assert.rejects(() => api.generateScratchRecipe({ productName: 'Oreos' }), /failed validation/i);
  } finally { restoreFetch(); }
});

await test('generateScratchRecipe: readable error when the network is unreachable', async () => {
  mockFetch(() => { throw new Error('boom'); });
  try {
    await assert.rejects(() => api.generateScratchRecipe({ productName: 'Oreos' }), /could not reach the ai service/i);
  } finally { restoreFetch(); }
});

await test('generateScratchRecipe: readable error when the response is not JSON', async () => {
  mockFetch(() => new Response('<html>nope</html>', { status: 200 }));
  try {
    await assert.rejects(() => api.generateScratchRecipe({ productName: 'Oreos' }), /unexpected response/i);
  } finally { restoreFetch(); }
});

await test('getPopularItems: passes through API data', async () => {
  mockFetch(() => jsonRes({ ok: true, items: [{ name: 'Ketchup' }] }));
  try {
    const out = await api.getPopularItems();
    assert.equal(out.ok, true);
    assert.equal(out.items[0].name, 'Ketchup');
  } finally { restoreFetch(); }
});

await test('getPopularItems: degrades to a safe empty payload on network/JSON failure', async () => {
  mockFetch(() => { throw new Error('offline'); });
  try {
    assert.deepEqual(await api.getPopularItems(), { ok: false, items: [] });
  } finally { restoreFetch(); }
  mockFetch(() => new Response('not json', { status: 200 }));
  try {
    assert.deepEqual(await api.getPopularItems(), { ok: false, items: [] });
  } finally { restoreFetch(); }
});

await test('lookupUpc: a 404 is flagged as notFound with a readable message', async () => {
  mockFetch(() => jsonRes({ error: 'Product not found' }, 404));
  try {
    await assert.rejects(
      () => api.lookupUpc('012000001772'),
      (err) => err.notFound === true && err.status === 404 && /not found/i.test(err.message),
    );
  } finally { restoreFetch(); }
});

await test('normalizeProduct: maps worker fields and computes found flag', () => {
  const found = api.normalizeProduct({ product: { name: 'Ketchup', brand: 'Heinz', upc: '1' } }, '1');
  assert.equal(found.productName, 'Ketchup');
  assert.equal(found.brand, 'Heinz');
  assert.equal(found.found, true);
  const missing = api.normalizeProduct({ product: {} }, '999');
  assert.equal(missing.found, false, 'no name -> found:false');
  assert.equal(missing.upc, '999', 'falls back to provided upc');
});

// ===========================================================================
// B/C. Selected-file validation guard
// ===========================================================================
await test('compressImageFile: rejects non-image and missing files', async () => {
  await assert.rejects(() => compressImageFile(null), /not an image/i);
  await assert.rejects(() => compressImageFile({ type: 'text/plain' }), /not an image/i);
  await assert.rejects(() => compressImageFile({}), /not an image/i);
});

console.log(`Frontend helper unit tests passed (${passed} cases).`);
