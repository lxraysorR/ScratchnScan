import { cpSync, mkdirSync, rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('app/index.html', 'dist/index.html');
cpSync('app/styles.css', 'dist/styles.css');
console.log('Build completed: dist/');
