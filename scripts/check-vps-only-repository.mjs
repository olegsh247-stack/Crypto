#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const forbidden = [
  ["Cloud", "flare"].join(""),
  ["Ne", "on"].join(""),
  ["wrang", "ler"].join(""),
  ["workers", ".dev"].join(""),
  ["@ne", "ondatabase/serverless"].join("")
].map((value) => value.toLowerCase());
const ignoredDirs = new Set([".git", "node_modules", ".next", ".vercel", "dist", "coverage"]);
const checkedExtensions = new Set([
  ".md", ".yml", ".yaml", ".toml", ".ts", ".tsx", ".js", ".mjs",
  ".json", ".sql", ".sh", ".css", ".txt", ".html", ".env", ".example"
]);
const violations = [];
let checked = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) {
      walk(path);
      continue;
    }
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : name;
    if (!checkedExtensions.has(ext) && ![".gitignore", "Dockerfile", "Caddyfile"].includes(name)) continue;
    const content = readFileSync(path, "utf8");
    checked += 1;
    for (const token of forbidden) {
      if (content.toLowerCase().includes(token)) {
        violations.push({ file: relative(root, path), token });
      }
    }
  }
}

walk(root);
if (violations.length) {
  for (const violation of violations) {
    console.error("VPS_ONLY_SCAN_FAIL", violation.file, "contains retired platform reference");
  }
  process.exit(1);
}
console.log(`VPS_ONLY_REPOSITORY_SCAN_OK files=${checked} retired_platform_references=0`);
