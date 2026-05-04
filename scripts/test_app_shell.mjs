import { readFileSync, existsSync } from 'node:fs';

const required = ['app/index.html', 'app/styles.css', 'AGENTS.md', 'docs/MVP_SCOPE.md'];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const html = readFileSync('app/index.html', 'utf8');
const checks = ['ScratchNScan', 'Scan / Enter UPC', 'Upload Labels', 'Not medical advice'];
for (const token of checks) {
  if (!html.includes(token)) throw new Error(`Missing token in app/index.html: ${token}`);
}

console.log('App shell tests passed.');
