import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { default: worker, resetRateLimits } = await import(pathToFileURL(resolve('src/worker.js')).href);

// The worker emits structured console.log diagnostics on every request. They are
// production logging, not under test, so silence them to keep test output readable.
// console.error is preserved so genuine assertion failures still surface.
const realConsoleLog = console.log;
console.log = () => {};

// ---------------------------------------------------------------------------
// Test harness: mock global fetch, build requests, flush fire-and-forget work.
// ---------------------------------------------------------------------------
const realFetch = globalThis.fetch;

/**
 * Install a mock fetch. `handler(url, options, calls)` should return a Response,
 * or throw to simulate a network failure. Returns the captured calls array.
 */
function installFetch(handler) {
  const calls = [];
  globalThis.fetch = async (input, options = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    calls.push({ url, options, method: (options.method || 'GET').toUpperCase() });
    return handler(url, options, calls);
  };
  return calls;
}

function restoreFetch() {
  globalThis.fetch = realFetch;
}

const BASE = 'https://scratchnscan.layr-sor.workers.dev';

function makeRequest(path, { method = 'GET', body, headers = {}, origin } = {}) {
  const h = new Headers(headers);
  if (origin) h.set('Origin', origin);
  const init = { method, headers: h };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
  }
  return new Request(BASE + path, init);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Let fire-and-forget logRequestEvent() settle before asserting on calls.
const flush = () => new Promise((r) => setTimeout(r, 0));

const SUPABASE_ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
};

function supabaseCalls(calls) {
  return calls.filter((c) => c.url.includes('test.supabase.co'));
}

let passed = 0;
async function test(name, fn) {
  const calls = [];
  try {
    await fn();
    passed += 1;
  } catch (err) {
    console.error(`\n✗ ${name}`);
    throw err;
  } finally {
    restoreFetch();
    resetRateLimits();
  }
}

// ===========================================================================
// A. Health route
// ===========================================================================
await test('health: 200 + ok:true + JSON', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(makeRequest('/api/health'), {});
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /application\/json/);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, 'scratchnscan');
});

// ===========================================================================
// B. Admin status route
// ===========================================================================
await test('admin: 401 when Authorization header missing', async () => {
  const res = await worker.fetch(makeRequest('/api/admin/status'), { APP_ADMIN_TOKEN: 'secret' });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.ok, false);
});

await test('admin: 401 when bearer token is wrong', async () => {
  const res = await worker.fetch(
    makeRequest('/api/admin/status', { headers: { Authorization: 'Bearer nope' } }),
    { APP_ADMIN_TOKEN: 'secret' },
  );
  assert.equal(res.status, 401);
});

await test('admin: 200 with correct token + secret presence map', async () => {
  const res = await worker.fetch(
    makeRequest('/api/admin/status', { headers: { Authorization: 'Bearer secret' } }),
    { APP_ADMIN_TOKEN: 'secret', SEARCHUPCDATA_API_KEY: 'upc', /* GEMINI missing */ },
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.admin, true);
  assert.equal(body.secrets.APP_ADMIN_TOKEN, 'set');
  assert.equal(body.secrets.SEARCHUPCDATA_API_KEY, 'set');
  assert.equal(body.secrets.GEMINI_API_KEY, 'missing');
});

// ===========================================================================
// C. UPC lookup route
// ===========================================================================
await test('lookup-upc: rejects invalid JSON body (400)', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(
    makeRequest('/api/lookup-upc', { method: 'POST', body: '{not valid json', headers: { 'Content-Type': 'application/json' } }),
    { SEARCHUPCDATA_API_KEY: 'k' },
  );
  assert.equal(res.status, 400);
});

await test('lookup-upc: rejects invalid UPC format (400)', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(
    makeRequest('/api/lookup-upc', { method: 'POST', body: { upc: '12ab' } }),
    { SEARCHUPCDATA_API_KEY: 'k' },
  );
  assert.equal(res.status, 400);
  // Wrong length is also invalid.
  const res2 = await worker.fetch(
    makeRequest('/api/lookup-upc', { method: 'POST', body: { upc: '123' } }),
    { SEARCHUPCDATA_API_KEY: 'k' },
  );
  assert.equal(res2.status, 400);
});

await test('lookup-upc: 500 when SEARCHUPCDATA_API_KEY missing', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(
    makeRequest('/api/lookup-upc', { method: 'POST', body: { upc: '012000001772' } }),
    {},
  );
  assert.equal(res.status, 500);
});

await test('lookup-upc: 502 when provider network fails', async () => {
  installFetch(() => { throw new Error('ECONNRESET'); });
  const res = await worker.fetch(
    makeRequest('/api/lookup-upc', { method: 'POST', body: { upc: '012000001772' } }),
    { SEARCHUPCDATA_API_KEY: 'k' },
  );
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.equal(body.providerStatus, 0);
});

await test('lookup-upc: 502 when provider returns non-OK', async () => {
  installFetch(() => new Response('rate limited', { status: 429 }));
  const res = await worker.fetch(
    makeRequest('/api/lookup-upc', { method: 'POST', body: { upc: '012000001772' } }),
    { SEARCHUPCDATA_API_KEY: 'k' },
  );
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.equal(body.providerStatus, 429);
});

await test('lookup-upc: 404 when provider has no usable product name', async () => {
  installFetch(() => jsonResponse({ brand: 'NoName Co' }));
  const res = await worker.fetch(
    makeRequest('/api/lookup-upc', { method: 'POST', body: { upc: '012000001772' } }),
    { SEARCHUPCDATA_API_KEY: 'k' },
  );
  assert.equal(res.status, 404);
});

await test('lookup-upc: 200 + normalized product on success', async () => {
  const calls = installFetch((url) => {
    if (url.includes('searchupcdata.com')) {
      assert.match(url, /upc=012000001772/, 'forwards normalized upc to provider');
      return jsonResponse({ product_name: 'Test Ketchup', brand: 'Heinz', image: 'http://img/k.png' });
    }
    return new Response(null, { status: 204 }); // supabase log
  });
  const res = await worker.fetch(
    makeRequest('/api/lookup-upc', { method: 'POST', body: { upc: ' 012-000-001772 ' } }),
    { SEARCHUPCDATA_API_KEY: 'k', ...SUPABASE_ENV },
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.product, {
    upc: '012000001772',
    name: 'Test Ketchup',
    brand: 'Heinz',
    category: null,
    ingredients: null,
    imageUrl: 'http://img/k.png',
  });
  await flush();
  // G. popularity logged after successful lookup with normalized name.
  const logs = supabaseCalls(calls).filter((c) => c.method === 'POST');
  assert.equal(logs.length, 1, 'one request event recorded on success');
  const logged = JSON.parse(logs[0].options.body)[0];
  assert.equal(logged.event_type, 'lookup_success');
  assert.equal(logged.item_name, 'Test Ketchup');
  assert.equal(logged.normalized_item_name, 'test ketchup', 'normalized name lowercased/collapsed');
});

await test('lookup-upc: no event recorded on failed lookup', async () => {
  const calls = installFetch(() => jsonResponse({ brand: 'NoName' })); // 404 path
  const res = await worker.fetch(
    makeRequest('/api/lookup-upc', { method: 'POST', body: { upc: '012000001772' } }),
    { SEARCHUPCDATA_API_KEY: 'k', ...SUPABASE_ENV },
  );
  assert.equal(res.status, 404);
  await flush();
  assert.equal(supabaseCalls(calls).filter((c) => c.method === 'POST').length, 0, 'no event on failure');
});

// ===========================================================================
// D. Scratch recipe generation route
// ===========================================================================
function validGeminiRecipe() {
  return {
    product: { name: 'Cookies', foodType: 'snack', confidence: 'medium', sourceBasis: ['user_text'] },
    plainEnglishExplanation: 'Packaged cookies.',
    ingredientSignals: [{ name: 'sugar', reason: 'sweetener', category: 'sweetener' }],
    homemadeAlternative: {
      title: 'Homemade Cookies',
      positioning: 'simpler',
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      difficulty: 'easy',
      servings: '12',
      ingredients: [{ item: 'flour', amount: '1 cup', notes: '' }],
      steps: ['Mix', 'Bake'],
      simpleSwaps: [],
      whyLessProcessed: ['fewer additives'],
      tasteAndTextureExpectation: 'similar',
      storageTips: 'airtight',
    },
    safetyNotes: ['check allergies'],
    disclaimer: 'Provided disclaimer.',
  };
}

function geminiResponse(textPayload) {
  return jsonResponse({ candidates: [{ content: { parts: [{ text: textPayload }] } }] });
}

await test('generate: rejects invalid JSON body (400)', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: 'not json', headers: { 'Content-Type': 'application/json' } }),
    { GEMINI_API_KEY: 'g' },
  );
  assert.equal(res.status, 400);
});

await test('generate: rejects when no meaningful inputs (400)', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { brand: 'Acme', goals: 'tasty' } }),
    { GEMINI_API_KEY: 'g' },
  );
  assert.equal(res.status, 400);
});

await test('generate: 502 when GEMINI_API_KEY missing', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { productName: 'Oreos' } }),
    {},
  );
  assert.equal(res.status, 502);
});

await test('generate: 502 when Gemini network call fails', async () => {
  installFetch(() => { throw new Error('network down'); });
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { productName: 'Oreos' } }),
    { GEMINI_API_KEY: 'g' },
  );
  assert.equal(res.status, 502);
});

await test('generate: 502 when Gemini returns non-OK', async () => {
  installFetch(() => new Response('bad request', { status: 400 }));
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { productName: 'Oreos' } }),
    { GEMINI_API_KEY: 'g' },
  );
  assert.equal(res.status, 502);
});

await test('generate: 502 when Gemini returns malformed JSON text', async () => {
  installFetch(() => geminiResponse('this is not json at all'));
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { productName: 'Oreos' } }),
    { GEMINI_API_KEY: 'g' },
  );
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.match(body.error, /malformed JSON/i);
});

await test('generate: 502 when Gemini JSON violates contract', async () => {
  const broken = validGeminiRecipe();
  delete broken.homemadeAlternative.title; // contract violation
  installFetch(() => geminiResponse(JSON.stringify(broken)));
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { productName: 'Oreos' } }),
    { GEMINI_API_KEY: 'g' },
  );
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.match(body.error, /failed validation/i);
  assert.ok(Array.isArray(body.details) && body.details.length > 0, 'reports validation details');
});

await test('generate: 200 with validated recipe + logs event', async () => {
  const calls = installFetch((url) => {
    if (url.includes('generativelanguage.googleapis.com')) {
      return geminiResponse(JSON.stringify(validGeminiRecipe()));
    }
    return new Response(null, { status: 204 }); // supabase log
  });
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { productName: 'Oreos' } }),
    { GEMINI_API_KEY: 'g', ...SUPABASE_ENV },
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.recipe.homemadeAlternative.title, 'Homemade Cookies');
  assert.equal(body.meta.model, 'gemini-3.5-flash');
  assert.equal(body.meta.usedInputs.productName, true);
  await flush();
  const logs = supabaseCalls(calls).filter((c) => c.method === 'POST');
  assert.equal(logs.length, 1, 'one generation event recorded');
  const logged = JSON.parse(logs[0].options.body)[0];
  assert.equal(logged.event_type, 'generation_success');
  assert.equal(logged.normalized_item_name, 'oreos');
});

await test('generate: no event recorded on failed generation', async () => {
  const calls = installFetch(() => new Response('err', { status: 500 }));
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { productName: 'Oreos' } }),
    { GEMINI_API_KEY: 'g', ...SUPABASE_ENV },
  );
  assert.equal(res.status, 502);
  await flush();
  assert.equal(supabaseCalls(calls).filter((c) => c.method === 'POST').length, 0, 'no event on failure');
});

await test('generate: accepts a photo-only request and forwards the image to Gemini', async () => {
  const tinyJpegDataUrl =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//';
  let geminiParts = null;
  installFetch((url, options) => {
    if (url.includes('generativelanguage.googleapis.com')) {
      geminiParts = JSON.parse(options.body).contents[0].parts;
      return geminiResponse(JSON.stringify(validGeminiRecipe()));
    }
    return new Response(null, { status: 204 });
  });
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { frontImage: tinyJpegDataUrl } }),
    { GEMINI_API_KEY: 'g', ...SUPABASE_ENV },
  );
  assert.equal(res.status, 200, 'photo-only input is accepted (no productName required)');
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.meta.usedInputs.frontImage, true, 'meta records the image input');
  assert.ok(Array.isArray(geminiParts), 'gemini request was made');
  const imagePart = geminiParts.find((p) => p.inlineData);
  assert.ok(imagePart, 'image is forwarded as an inlineData part');
  assert.equal(imagePart.inlineData.mimeType, 'image/jpeg');
});

await test('generate: rejects a malformed image with no other input (400)', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(
    makeRequest('/api/generate-scratch-recipe', { method: 'POST', body: { frontImage: 'not-a-data-url' } }),
    { GEMINI_API_KEY: 'g' },
  );
  assert.equal(res.status, 400, 'a non-image string is not meaningful input');
});

// ===========================================================================
// E. Alias route /api/generate-homemade-version
// ===========================================================================
await test('alias: generate-homemade-version behaves like scratch recipe', async () => {
  installFetch((url) => {
    if (url.includes('generativelanguage.googleapis.com')) {
      return geminiResponse(JSON.stringify(validGeminiRecipe()));
    }
    return new Response(null, { status: 204 });
  });
  const res = await worker.fetch(
    makeRequest('/api/generate-homemade-version', { method: 'POST', body: { productName: 'Oreos' } }),
    { GEMINI_API_KEY: 'g' },
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.recipe.homemadeAlternative.title, 'Homemade Cookies');
});

// ===========================================================================
// F. Popular items route
// ===========================================================================
await test('popular-items: top items ordered by count then recency', async () => {
  const rows = [
    { item_name: 'Ketchup', normalized_item_name: 'ketchup', created_at: '2026-05-01T00:00:00Z' },
    { item_name: 'Ketchup', normalized_item_name: 'ketchup', created_at: '2026-05-02T00:00:00Z' },
    { item_name: 'Ketchup', normalized_item_name: 'ketchup', created_at: '2026-05-03T00:00:00Z' },
    { item_name: 'Mayo', normalized_item_name: 'mayo', created_at: '2026-05-10T00:00:00Z' },
    { item_name: 'Mayo', normalized_item_name: 'mayo', created_at: '2026-05-11T00:00:00Z' },
    { item_name: 'Mustard', normalized_item_name: 'mustard', created_at: '2026-05-20T00:00:00Z' },
  ];
  installFetch(() => jsonResponse(rows));
  const res = await worker.fetch(makeRequest('/api/popular-items'), SUPABASE_ENV);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.items.map((i) => i.name), ['Ketchup', 'Mayo', 'Mustard'], 'ordered by request count');
  assert.equal(body.items[0].requestCount, 3);
  assert.equal(body.items[1].requestCount, 2);
});

await test('popular-items: ties broken by most recent usage', async () => {
  const rows = [
    { item_name: 'Older', normalized_item_name: 'older', created_at: '2026-01-01T00:00:00Z' },
    { item_name: 'Newer', normalized_item_name: 'newer', created_at: '2026-05-01T00:00:00Z' },
  ];
  installFetch(() => jsonResponse(rows));
  const res = await worker.fetch(makeRequest('/api/popular-items'), SUPABASE_ENV);
  const body = await res.json();
  assert.deepEqual(body.items.map((i) => i.name), ['Newer', 'Older'], 'recent usage wins on equal counts');
});

await test('popular-items: empty Supabase result -> fallback starters', async () => {
  installFetch(() => jsonResponse([]));
  const res = await worker.fetch(makeRequest('/api/popular-items'), SUPABASE_ENV);
  const body = await res.json();
  assert.deepEqual(
    body.items.map((i) => i.name),
    ['Cream Cheese', 'Mayo', 'Mustard', 'Ketchup', 'Tomato Sauce'],
  );
});

await test('popular-items: Supabase failure -> fallback starters', async () => {
  installFetch(() => new Response('boom', { status: 500 }));
  const res = await worker.fetch(makeRequest('/api/popular-items'), SUPABASE_ENV);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(
    body.items.map((i) => i.name),
    ['Cream Cheese', 'Mayo', 'Mustard', 'Ketchup', 'Tomato Sauce'],
  );
});

await test('popular-items: no Supabase config -> fallback starters', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(makeRequest('/api/popular-items'), {});
  const body = await res.json();
  assert.equal(body.items.length, 5);
  assert.equal(body.items[0].name, 'Cream Cheese');
});

// ===========================================================================
// H. CORS / OPTIONS
// ===========================================================================
await test('OPTIONS: returns 204 with CORS headers', async () => {
  const res = await worker.fetch(
    makeRequest('/api/health', { method: 'OPTIONS', origin: 'http://localhost:5173' }),
    {},
  );
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
  assert.match(res.headers.get('Access-Control-Allow-Methods'), /POST/);
  assert.match(res.headers.get('Access-Control-Allow-Headers'), /Authorization/);
});

await test('CORS: JSON routes echo allowed origin + Vary', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(
    makeRequest('/api/health', { origin: 'http://localhost:5173' }),
    {},
  );
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
  assert.equal(res.headers.get('Vary'), 'Origin');
});

await test('CORS: unknown origin gets no Access-Control-Allow-Origin header', async () => {
  installFetch(() => { throw new Error('no network expected'); });
  const res = await worker.fetch(
    makeRequest('/api/health', { origin: 'https://evil.example.com' }),
    {},
  );
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
  // Vary must still be set so caches know to vary by Origin.
  assert.equal(res.headers.get('Vary'), 'Origin');
});

await test('OPTIONS: unknown origin preflight returns 403', async () => {
  const res = await worker.fetch(
    makeRequest('/api/health', { method: 'OPTIONS', origin: 'https://evil.example.com' }),
    {},
  );
  assert.equal(res.status, 403);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
});

await test('OPTIONS: no Origin header (non-CORS preflight) returns 204', async () => {
  const res = await worker.fetch(
    makeRequest('/api/health', { method: 'OPTIONS' }),
    {},
  );
  assert.equal(res.status, 204);
});

// ===========================================================================
// Unknown API route
// ===========================================================================
await test('unknown /api/* route returns 404 JSON', async () => {
  const res = await worker.fetch(makeRequest('/api/does-not-exist'), {});
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.ok, false);
});

console.log = realConsoleLog;
console.log(`Worker route tests passed (${passed} cases).`);
