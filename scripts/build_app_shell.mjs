import { cpSync, mkdirSync, rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/js', { recursive: true });
cpSync('app/index.html', 'dist/index.html');
cpSync('app/styles.css', 'dist/styles.css');
cpSync('app/js', 'dist/js', { recursive: true });
console.log('Build completed: dist/');
