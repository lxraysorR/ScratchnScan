#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const checks = [
  'package.json',
  'app/index.html',
  'app/js/app.js',
  'app/js/api.js',
  'app/js/scan.js',
  'app/js/localDb.js',
  'docs/MVP_SCOPE.md',
  'docs/COMPLETION_CHECKLIST.md',
  'docs/AUTOMATION_WORKFLOW.md',
  'docs/KNOWN_ISSUES.md',
  'agents/prompts/001-project-audit.md',
  'qa/state/daily-qa-state.json',
  'scripts/qa-smoke.js'
];

console.log('ScratchNScan App Status');
console.log('========================');
let missing = 0;
for (const rel of checks) {
  const exists = fs.existsSync(path.join(root, rel));
  console.log(`${exists ? '✅' : '❌'} ${rel}`);
  if (!exists) missing += 1;
}
console.log('------------------------');
console.log(`Missing: ${missing}`);
process.exitCode = missing ? 1 : 0;
