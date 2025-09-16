#!/usr/bin/env node
// Copy runtime JS assets that tsc does not emit (e.g., src/*.js) into dist
// Keeps TypeScript config strict (no allowJs) while ensuring CLI can import JS helpers.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(
  path.join(
    import.meta.url.startsWith("file:")
      ? new URL(".", import.meta.url).pathname
      : ".",
    "..",
  ),
);
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function relToDist(p) {
  const rel = path.relative(SRC, p);
  return path.join(DIST, rel);
}

try {
  const all = walk(SRC);
  const jsFiles = all.filter((f) => f.endsWith(".js"));
  for (const src of jsFiles) {
    const dest = relToDist(src);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    // Preserve executable bit if set
    const st = fs.statSync(src);
    fs.chmodSync(dest, st.mode);
  }
  process.exit(0);
} catch (e) {
  console.error("[build-post] Failed copying JS assets:", e?.message || e);
  process.exit(1);
}
