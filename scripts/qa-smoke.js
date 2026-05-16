#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(process.cwd(), 'package.json');
const requiredFiles = [
  'app/index.html',
  'app/js/app.js',
  'app/js/api.js',
  'app/styles.css',
  'docs/MVP_SCOPE.md',
  'docs/COMPLETION_CHECKLIST.md',
  'qa/state/daily-qa-state.json',
  'scripts/app-status.js',
  'scripts/agent-next-task.js',
  'scripts/qa-smoke.js'
];
const requiredScripts = ['app:status', 'agent:next', 'qa:smoke'];

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

let pkg = null;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  check('package.json parse', true);
} catch (err) {
  check('package.json parse', false, err.message);
}

for (const file of requiredFiles) {
  check(`file exists: ${file}`, fs.existsSync(path.join(process.cwd(), file)));
}

if (pkg && pkg.scripts) {
  for (const scriptName of requiredScripts) {
    check(`script exists: ${scriptName}`, typeof pkg.scripts[scriptName] === 'string');
  }
} else {
  requiredScripts.forEach((scriptName) => check(`script exists: ${scriptName}`, false));
}

console.log(`Smoke result: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} issue(s))`);
process.exitCode = failures === 0 ? 0 : 1;
