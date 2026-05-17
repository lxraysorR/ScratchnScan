import { readFileSync } from 'node:fs';

const html = readFileSync('app/index.html', 'utf8');
const tokens = [
  'Manual Product Entry',
  'Create Homemade Version',
  'Save to History',
  'No saved homemade versions yet. Start by entering a product.',
  'Back to History',
];

for (const token of tokens) {
  if (!html.includes(token)) throw new Error(`Missing UI token: ${token}`);
}

console.log('manual MVP generated token test passed');
