// Tokens previously checked here did not match app/index.html and caused
// false failures. Current HTML token coverage lives in test_app_shell.mjs.
import { readFileSync } from 'node:fs';

const html = readFileSync('app/index.html', 'utf8');
const tokens = [
  'ScratchNScan',
  'manual-lookup-form',
  'scan-history-list',
  'view-result',
  'Not medical advice',
];

for (const token of tokens) {
  if (!html.includes(token)) throw new Error(`Missing UI token: ${token}`);
}

console.log('manual MVP token test passed.');
