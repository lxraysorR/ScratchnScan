#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';

const repoName = basename(process.cwd());
if (repoName !== 'ScratchnScan') {
  console.error(`Expected repo directory 'ScratchnScan', got '${repoName}'.`);
  process.exit(1);
}

if (!existsSync('.git')) {
  console.error('Missing .git directory; this does not look like a git repository.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (!pkg.name || typeof pkg.name !== 'string') {
  console.error('package.json is missing a valid "name" field.');
  process.exit(1);
}

console.log('Repo access test passed for ScratchnScan.');
console.log(`Detected package name: ${pkg.name}`);
