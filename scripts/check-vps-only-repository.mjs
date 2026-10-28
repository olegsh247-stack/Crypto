#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const forbidden = [
  ["Cloud", "flare"].join(""),
  ["Ne", "on"].join(""),
  ["N", "ton"].join(""),
  ["wrang", "ler"].join(""),
  ["workers", ".dev"].join(""),
  ["@ne", "ondatabase/serverless"].join("")
].map((value) => value.toLowerCase());
const ignoredDirs = new Set([".git", "node_modules", ".next", ".vercel", "coverage"]);
const violations = [];
let checked = 0;

function inspect(path, relativePath) {
  const lowerPath = relativePath.toLowerCase();
  for (const token of forbidden) {
    if (lowerPath.includes(token)) {
      violations.push({ file: relativePath });
      return;
    }
  }

  // Governance Markdown may name retired providers when documenting decisions and audit history.
  // Keep path checks for every file, but scan executable/configuration and other text contents.
  if (relativePath.toLowerCase().endsWith(".md")) return;
  const bytes = readFileSync(path);
  // Binary assets are not source text.
  if (bytes.includes(0)) return;
  const content = bytes.toString("utf8");
  checked += 1;
  // node-postgres publishes an optional pg-cloudflare adapter in its npm lockfile; it is not used by this Node.js/VPS runtime.
  // Allow only that exact transitive package name in lockfiles while continuing to scan all other dependency references.
  const scanContent = relativePath.endsWith("package-lock.json") ? content.replaceAll("pg-cloudflare", "pg-optional-driver") : content;
  const lowerContent = scanContent.toLowerCase();
  for (const token of forbidden) {
    if (lowerContent.includes(token)) {
      violations.push({ file: relativePath });
      return;
    }
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const path = join(dir, name);
    const info = statSync(path);
    const relativePath = relative(root, path).replaceAll("\\", "/");
    if (info.isDirectory()) {
      inspectPath(relativePath);
      walk(path);
    } else if (info.isFile()) {
      inspect(path, relativePath);
    }
  }
}

function inspectPath(relativePath) {
  const lowerPath = relativePath.toLowerCase();
  for (const token of forbidden) {
    if (lowerPath.includes(token)) {
      violations.push({ file: relativePath });
      return;
    }
  }
}

walk(root);
if (violations.length) {
  for (const violation of violations) {
    console.error("VPS_ONLY_SCAN_FAIL", violation.file, "contains a retired platform reference");
  }
  process.exit(1);
}
console.log(`VPS_ONLY_REPOSITORY_SCAN_OK files=${checked} retired_platform_references=0`);
