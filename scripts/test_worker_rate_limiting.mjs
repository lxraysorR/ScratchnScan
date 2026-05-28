import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { default: worker, resetRateLimits } = await import(
  pathToFileURL(resolve('src/worker.js')).href
);

// Silence production structured logs.
console.log = () => {};

const BASE = 'https://scratchnscan.layr-sor.workers.dev';

function makeRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const h = new Headers(headers);
  const init = { method, headers: h };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
  }
  return new Request(BASE + path, init);
}

function makeRequestFromIp(path, ip, opts = {}) {
  const h = new Headers(opts.headers || {});
  h.set('cf-connecting-ip', ip);
  return makeRequest(path, { ...opts, headers: h });
}

// Minimal env stubs — no real API keys needed; rate limiter fires before handlers.
const ENV = { SEARCHUPCDATA_API_KEY: 'k', GEMINI_API_KEY: 'g' };

// Mock fetch so handler network calls never fire.
const realFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('network should not be reached'); };

let passed = 0;
let failed = 0;

async function test(name, fn) {
  resetRateLimits();
  try {
    await fn();
    passed++;
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// generate-scratch-recipe: limit 5 req/min
// ---------------------------------------------------------------------------

await test('generate: first 5 requests return non-429', async () => {
  for (let i = 0; i < 5; i++) {
    const res = await worker.fetch(
      makeRequestFromIp('/api/generate-scratch-recipe', '1.2.3.4', {
        method: 'POST',
        body: { productName: 'test' },
      }),
      ENV,
    );
    assert.notEqual(res.status, 429, `request ${i + 1} should not be rate limited`);
  }
});

await test('generate: 6th request returns 429', async () => {
  for (let i = 0; i < 5; i++) {
    await worker.fetch(
      makeRequestFromIp('/api/generate-scratch-recipe', '1.2.3.4', {
        method: 'POST',
        body: { productName: 'test' },
      }),
      ENV,
    );
  }
  const res = await worker.fetch(
    makeRequestFromIp('/api/generate-scratch-recipe', '1.2.3.4', {
      method: 'POST',
      body: { productName: 'test' },
    }),
    ENV,
  );
  assert.equal(res.status, 429);
});

await test('generate: 429 body has ok:false, error, and retryAfter', async () => {
  for (let i = 0; i < 5; i++) {
    await worker.fetch(
      makeRequestFromIp('/api/generate-scratch-recipe', '1.2.3.4', {
        method: 'POST',
        body: { productName: 'test' },
      }),
      ENV,
    );
  }
  const res = await worker.fetch(
    makeRequestFromIp('/api/generate-scratch-recipe', '1.2.3.4', {
      method: 'POST',
      body: { productName: 'test' },
    }),
    ENV,
  );
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(typeof body.error === 'string' && body.error.length > 0);
  assert.ok(typeof body.retryAfter === 'number' && body.retryAfter > 0);
});

await test('generate: 429 response has Retry-After header', async () => {
  for (let i = 0; i < 5; i++) {
    await worker.fetch(
      makeRequestFromIp('/api/generate-scratch-recipe', '1.2.3.4', {
        method: 'POST',
        body: { productName: 'test' },
      }),
      ENV,
    );
  }
  const res = await worker.fetch(
    makeRequestFromIp('/api/generate-scratch-recipe', '1.2.3.4', {
      method: 'POST',
      body: { productName: 'test' },
    }),
    ENV,
  );
  const retryAfter = res.headers.get('Retry-After');
  assert.ok(retryAfter !== null, 'Retry-After header must be present');
  assert.ok(Number(retryAfter) > 0, 'Retry-After must be a positive number');
});

await test('generate alias /api/generate-homemade-version shares the same bucket', async () => {
  // 3 requests on the primary route
  for (let i = 0; i < 3; i++) {
    await worker.fetch(
      makeRequestFromIp('/api/generate-scratch-recipe', '1.2.3.4', {
        method: 'POST',
        body: {},
      }),
      ENV,
    );
  }
  // 2 more on the alias — bucket is now at 5
  for (let i = 0; i < 2; i++) {
    await worker.fetch(
      makeRequestFromIp('/api/generate-homemade-version', '1.2.3.4', {
        method: 'POST',
        body: {},
      }),
      ENV,
    );
  }
  // 6th total should be 429
  const res = await worker.fetch(
    makeRequestFromIp('/api/generate-homemade-version', '1.2.3.4', {
      method: 'POST',
      body: {},
    }),
    ENV,
  );
  assert.equal(res.status, 429);
});

await test('generate: different IPs have independent buckets', async () => {
  // Exhaust IP A
  for (let i = 0; i < 5; i++) {
    await worker.fetch(
      makeRequestFromIp('/api/generate-scratch-recipe', '10.0.0.1', {
        method: 'POST',
        body: {},
      }),
      ENV,
    );
  }
  // IP B should still be allowed
  const res = await worker.fetch(
    makeRequestFromIp('/api/generate-scratch-recipe', '10.0.0.2', {
      method: 'POST',
      body: {},
    }),
    ENV,
  );
  assert.notEqual(res.status, 429, 'a different IP must not be affected');
});

// ---------------------------------------------------------------------------
// lookup-upc: limit 20 req/min
// ---------------------------------------------------------------------------

await test('lookup-upc: first 20 requests return non-429', async () => {
  for (let i = 0; i < 20; i++) {
    const res = await worker.fetch(
      makeRequestFromIp('/api/lookup-upc', '2.2.2.2', {
        method: 'POST',
        body: { upc: '012345678905' },
      }),
      ENV,
    );
    assert.notEqual(res.status, 429, `request ${i + 1} should not be rate limited`);
  }
});

await test('lookup-upc: 21st request returns 429', async () => {
  for (let i = 0; i < 20; i++) {
    await worker.fetch(
      makeRequestFromIp('/api/lookup-upc', '2.2.2.2', {
        method: 'POST',
        body: { upc: '012345678905' },
      }),
      ENV,
    );
  }
  const res = await worker.fetch(
    makeRequestFromIp('/api/lookup-upc', '2.2.2.2', {
      method: 'POST',
      body: { upc: '012345678905' },
    }),
    ENV,
  );
  assert.equal(res.status, 429);
});

// ---------------------------------------------------------------------------
// popular-items: limit 60 req/min
// ---------------------------------------------------------------------------

await test('popular-items: first 60 requests return non-429', async () => {
  // Install a lightweight mock so the handler doesn't crash on 60 calls.
  globalThis.fetch = async () =>
    new Response(JSON.stringify([]), { status: 200 });

  for (let i = 0; i < 60; i++) {
    const res = await worker.fetch(
      makeRequestFromIp('/api/popular-items', '3.3.3.3'),
      ENV,
    );
    assert.notEqual(res.status, 429, `request ${i + 1} should not be rate limited`);
  }

  globalThis.fetch = async () => { throw new Error('network should not be reached'); };
});

await test('popular-items: 61st request returns 429', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify([]), { status: 200 });

  for (let i = 0; i < 60; i++) {
    await worker.fetch(makeRequestFromIp('/api/popular-items', '3.3.3.3'), ENV);
  }

  globalThis.fetch = async () => { throw new Error('network should not be reached'); };

  const res = await worker.fetch(
    makeRequestFromIp('/api/popular-items', '3.3.3.3'),
    ENV,
  );
  assert.equal(res.status, 429);
});

// ---------------------------------------------------------------------------
// Routes that must NOT be rate-limited
// ---------------------------------------------------------------------------

await test('health: not rate limited regardless of call count', async () => {
  for (let i = 0; i < 100; i++) {
    const res = await worker.fetch(
      makeRequestFromIp('/api/health', '4.4.4.4'),
      ENV,
    );
    assert.equal(res.status, 200, `request ${i + 1} must not be rate limited`);
  }
});

// ---------------------------------------------------------------------------
// x-forwarded-for fallback
// ---------------------------------------------------------------------------

await test('x-forwarded-for is used when cf-connecting-ip is absent', async () => {
  const h = new Headers({ 'x-forwarded-for': '5.5.5.5, 10.0.0.1' });
  for (let i = 0; i < 5; i++) {
    await worker.fetch(
      new Request(`${BASE}/api/generate-scratch-recipe`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({}),
      }),
      ENV,
    );
  }
  const res = await worker.fetch(
    new Request(`${BASE}/api/generate-scratch-recipe`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({}),
    }),
    ENV,
  );
  assert.equal(res.status, 429, 'x-forwarded-for IP must accumulate correctly');
});

// ---------------------------------------------------------------------------

globalThis.fetch = realFetch;

process.stdout.write(`\nRate limiting: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
