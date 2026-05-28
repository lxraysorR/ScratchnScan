import { readFileSync } from 'node:fs';

const html = readFileSync('app/index.html', 'utf8');
const tokens = [
  'Create Homemade Version',
  'Upload Package Photos',
  'Front package',
  'Back label',
  'data-photo="front"',
  'data-photo="back"',
  'product-name-input',
  'ingredients-input',
  'dietary-input',
  'barcode-input',
  'draft-barcode',
  'draft-barcode-value',
  'Saved recipes',
];
for (const token of tokens) {
  if (!html.includes(token)) throw new Error(`Missing UI token: ${token}`);
}

const historyJs = readFileSync('app/js/history.js', 'utf8');
for (const token of ['toggleMvpFavorite', 'deleteMvpRecipe', 'View Recipe', 'window.confirm']) {
  if (!historyJs.includes(token)) throw new Error(`Missing history behavior token: ${token}`);
}

const detailsJs = readFileSync('app/js/details.js', 'utf8');
for (const token of ['toggleMvpFavorite', 'deleteMvpRecipe', 'window.confirm']) {
  if (!detailsJs.includes(token)) throw new Error(`Missing details behavior token: ${token}`);
}

const scanJs = readFileSync('app/js/scan.js', 'utf8');
for (const token of [
  'product name',
  'generateHealthierScratchRecipe',
  'submitBtn.disabled = true',
  'frontImagePlaceholder',
  'backImagePlaceholder',
  'recipeTips',
  'const barcode = draftBarcode || manualBarcode || null',
  'simpleSwaps',
  'storageTips',
  'whyLessProcessed',
]) {
  if (!scanJs.includes(token)) throw new Error(`Missing scan MVP behavior token: ${token}`);
}

console.log('manual MVP generated behavior checks passed.');
