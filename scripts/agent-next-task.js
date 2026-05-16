#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const statePath = path.join(process.cwd(), 'qa/state/daily-qa-state.json');
const promptDir = path.join(process.cwd(), 'agents/prompts');
const order = [
  '001-project-audit.md',
  '002-mvp-completion-plan.md',
  '003-manual-lookup-flow.md',
  '004-indexeddb-history.md',
  '005-ai-scratch-recipe.md',
  '006-mobile-polish.md',
  '007-final-qa.md'
];

function readState() {
  if (!fs.existsSync(statePath)) return { completedTasks: [], blockedTasks: [] };
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return { completedTasks: [], blockedTasks: [] };
  }
}

const state = readState();
const done = new Set([...(state.completedTasks || []), ...(state.blockedTasks || [])]);
const next = order.find((file) => !done.has(file.replace('.md', '')));

if (!next) {
  console.log('All prompt tasks are completed or blocked.');
  process.exit(0);
}

const nextPath = path.join(promptDir, next);
console.log(`Next recommended prompt: agents/prompts/${next}`);
console.log(fs.existsSync(nextPath) ? 'Status: file exists' : 'Status: file missing');
