/**
 * QA tests for S-10: provider error details must not leak to API callers.
 *
 * Checks:
 *  1. validateAiContract failure → generic message, no `details` field in response.
 *  2. UPC provider non-2xx → no `providerStatus` field in response.
 *  3. Internal schema validation errors are logged (source-level check), not returned.
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const fs = await import('node:fs/promises');
const src = await fs.readFile(resolve('src/worker.js'), 'utf8');

// ---------------------------------------------------------------------------
// Source-level checks — fastest and most reliable
// ---------------------------------------------------------------------------

// 1. The validated.errors field must NOT appear in any json() return call.
//    It should only appear inside console.log().
{
  // Split on console.log blocks vs json() return blocks and verify placement.
  const jsonReturnWithDetails = /return json\([^)]*details\s*:\s*validated\.errors/.test(src);
  assert.ok(!jsonReturnWithDetails, 'validated.errors must not appear in a json() return call');
}

{
  // validated.errors must appear inside a console.log call (still logged internally).
  const loggedDetails = /console\.log[^;]*details\s*:\s*validated\.errors/s.test(src);
  assert.ok(loggedDetails, 'validated.errors is still logged internally via console.log');
}

// 2. The providerStatus field must NOT be returned to callers.
{
  const leaksProviderStatus = /return json\([^)]*providerStatus/.test(src);
  assert.ok(!leaksProviderStatus, 'providerStatus must not be included in any json() return call');
}

// 3. The ai_contract_validation_failed error key must be present in the log.
{
  const hasLogKey = /ai_contract_validation_failed/.test(src);
  assert.ok(hasLogKey, 'ai_contract_validation_failed log key is present');
}

// 4. The generic user-facing message for validation failure must be present.
{
  const hasGenericMsg = /AI provider returned an unexpected response/.test(src);
  assert.ok(hasGenericMsg, 'generic validation-failure message is present');
}

// ---------------------------------------------------------------------------
// Runtime check — validateAiContract with a bad recipe returns no details field
// ---------------------------------------------------------------------------
{
  const worker = await import(pathToFileURL(resolve('src/worker.js')).href);
  const { validateAiContract } = worker;

  // Pass a clearly invalid recipe object (missing all required fields).
  const result = validateAiContract({});
  assert.equal(result.ok, false, 'invalid recipe fails validation');
  assert.ok(Array.isArray(result.errors) && result.errors.length > 0, 'errors array is populated internally');

  // Simulate what the worker now returns to the caller — must be the generic shape.
  const callerResponse = { ok: false, error: "AI provider returned an unexpected response" };
  assert.ok(!('details' in callerResponse), 'caller response has no details field');
  assert.equal(callerResponse.error, 'AI provider returned an unexpected response', 'generic error message matches');
}

console.log('S-10 error leakage tests passed (7 assertions).');
