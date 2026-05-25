#!/usr/bin/env node
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "src", "scripts"];
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git"]);
const JS_EXTENSIONS = new Set([".js", ".mjs"]);

function walk(dir, collected) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), collected);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!Array.from(JS_EXTENSIONS).some((ext) => entry.name.endsWith(ext))) continue;
    collected.push(join(dir, entry.name));
  }
}

const files = [];
for (const target of TARGET_DIRS) {
  const abs = join(ROOT, target);
  try {
    if (statSync(abs).isDirectory()) walk(abs, files);
  } catch {
    // Ignore missing target directories.
  }
}

files.sort();
if (!files.length) {
  console.log("⚠️ No JavaScript files found to syntax-check.");
  process.exit(0);
}

console.log(`Checking JavaScript syntax (${files.length} files)...`);
let failed = 0;
for (const file of files) {
  const rel = relative(ROOT, file);
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status === 0) {
    console.log(`✅ ${rel}`);
  } else {
    failed += 1;
    console.log(`❌ ${rel}`);
    if (result.stderr) process.stdout.write(result.stderr);
  }
}

if (failed) {
  console.log(`Syntax check failed: ${failed} file(s) invalid.`);
  process.exit(1);
}

console.log("Syntax check passed.");
