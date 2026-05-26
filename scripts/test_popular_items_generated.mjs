import { readFileSync } from 'node:fs';

const worker = readFileSync('src/worker.js', 'utf8');
for (const token of [
  '/api/popular-items',
  'sns_request_events',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'normalizeItemName',
  'lookup_success',
  'generation_success',
  'grouped.values()',
]) {
  if (!worker.includes(token)) throw new Error(`Missing worker token: ${token}`);
}

const app = readFileSync('app/js/app.js', 'utf8');
for (const token of [
  'STARTER_PANTRY_ITEMS',
  'renderPopularChips',
  'loadPopularItems',
  'data-sample',
]) {
  if (!app.includes(token)) throw new Error(`Missing app token: ${token}`);
}

const api = readFileSync('app/js/api.js', 'utf8');
if (!api.includes('/api/popular-items')) throw new Error('Frontend API missing /api/popular-items');

console.log('Popular items endpoint + homepage wiring checks passed.');
