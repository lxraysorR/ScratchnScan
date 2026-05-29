/**
 * QA tests for P-08: dependencies must be pinned to exact versions and
 * npm audit must be present in the qa:flow script.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(await readFile(resolve('package.json'), 'utf8'));

// ---------------------------------------------------------------------------
// All direct dependencies must be pinned (no ^ or ~ prefix)
// ---------------------------------------------------------------------------
{
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const [name, version] of Object.entries(allDeps)) {
    const unpinned = /^[\^~]/.test(version);
    assert.ok(!unpinned, `${name} version "${version}" must be pinned (no ^ or ~)`);
  }
}

// ---------------------------------------------------------------------------
// qa:flow script must include npm audit
// ---------------------------------------------------------------------------
{
  const qaFlow = pkg.scripts?.['qa:flow'] ?? '';
  assert.ok(qaFlow.includes('npm audit'), 'qa:flow includes npm audit');
  assert.ok(qaFlow.includes('--audit-level'), 'qa:flow passes --audit-level flag');
}

// ---------------------------------------------------------------------------
// Runtime: npm audit must report 0 vulnerabilities at moderate level
// ---------------------------------------------------------------------------
{
  let output;
  try {
    output = execSync('npm audit --audit-level=moderate 2>&1', { encoding: 'utf8' });
  } catch (err) {
    // npm audit exits non-zero when vulnerabilities found
    assert.fail(`npm audit found vulnerabilities:\n${err.stdout || err.message}`);
  }
  assert.ok(output.includes('found 0 vulnerabilities'), 'npm audit reports 0 vulnerabilities');
}

console.log('P-08 package audit tests passed (6 assertions).');
