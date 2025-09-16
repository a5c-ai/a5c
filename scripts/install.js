#!/usr/bin/env node
// Guarded prepare script for development vs. consumers.
// - In dev (git repo present), run husky install and build.
// - In consumers (npx/npm i from tarball), skip husky and only build if sources exist.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function hasGitRepo(cwd) {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore", cwd });
    return true;
  } catch {
    return false;
  }
}
function fileExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

const cwd = process.cwd();
const inGitRepo = hasGitRepo(cwd);
const hasHusky = fileExists(path.join(cwd, ".husky"));
const hasSrc = fileExists(path.join(cwd, "src"));
const hasDist = fileExists(path.join(cwd, "dist"));

try {
  if (inGitRepo) {
    if (hasHusky) {
      try {
        execSync("npx --yes husky", { stdio: "inherit" });
      } catch {
        // ignore husky errors in CI
      }
    }
    // Build in dev to keep dist fresh
    execSync("npm run build", { stdio: "inherit" });
  } else {
    // Consumer install: ensure dist exists; if not, try a lightweight build only when sources exist.
    if (!hasDist && hasSrc) {
      try {
        execSync("npm run build", { stdio: "inherit" });
      } catch {
        // ignore; packaged builds should ship prebuilt dist
      }
    }
  }
} catch {
  // never fail consumer install due to prepare
}
