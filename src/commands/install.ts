import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import YAML from "yaml";

export interface InstallOptions {
  uri: string;
}

type GithubParts = {
  owner: string;
  repo: string;
  ref: string;
  basePath: string; // directory path inside repo that contains the package root
};

type PackageSpec = {
  name?: string;
  description?: string;
  dependencies?: string[];
};

type PlannedFile = {
  targetPath: string; // absolute target path in CWD
  relPath: string; // path relative to repo root (as written)
  content: Buffer;
  sourceUri: string; // originating package URI
};

type InstallPlan = {
  packages: { uri: string; parts: GithubParts; spec: PackageSpec }[]; // dependency-first order
  files: PlannedFile[];
};

export async function handleInstall(
  opts: InstallOptions,
): Promise<{ code: number; errorMessage?: string }> {
  try {
    if (!opts.uri || typeof opts.uri !== "string") {
      return { code: 2, errorMessage: "install: missing required <github-uri>" };
    }
    const plan = await buildInstallPlan(opts.uri);

    const conflictReport = detectConflicts(plan);
    if (conflictReport.conflicts.length > 0) {
      printConflictReport(conflictReport);
      return { code: 3, errorMessage: "install aborted due to conflicts" };
    }

    // Apply files
    for (const pf of plan.files) {
      fs.mkdirSync(path.dirname(pf.targetPath), { recursive: true });
      fs.writeFileSync(pf.targetPath, pf.content);
    }

    // Run install scripts package-by-package (dependencies first)
    for (const p of plan.packages) {
      await runInstallScriptIfExists(p.parts);
    }

    // Update .a5c/packages.yaml
    await updatePackagesYaml(plan);

    // Print INSTALL.md for the root package if available
    const root = plan.packages[plan.packages.length - 1];
    if (root) await printDocIfExists(root.parts, "INSTALL.md", "Installation instructions:");

    return { code: 0 };
  } catch (e: any) {
    return { code: 1, errorMessage: String(e?.message || e) };
  }
}

export async function handleInit(opts: {
  pkg?: string;
}): Promise<{ code: number; errorMessage?: string }> {
  try {
    const a5cDir = path.resolve(".a5c");
    fs.mkdirSync(a5cDir, { recursive: true });

    const packagesYaml = path.join(a5cDir, "packages.yaml");
    if (!fs.existsSync(packagesYaml)) {
      const initDoc = { packages: [] as any[] };
      fs.writeFileSync(packagesYaml, YAML.stringify(initDoc), "utf8");
    }
    const configYaml = path.join(a5cDir, "config.yaml");
    if (!fs.existsSync(configYaml)) {
      fs.writeFileSync(configYaml, "", "utf8");
    }

    const defaultPkg =
      opts.pkg ||
      "github://a5c-ai/a5c/branch/main/registry/packages/github";

    const { code, errorMessage } = await handleInstall({ uri: defaultPkg });
    if (code !== 0) return { code, errorMessage };
    return { code: 0 };
  } catch (e: any) {
    return { code: 1, errorMessage: String(e?.message || e) };
  }
}

async function buildInstallPlan(rootUri: string): Promise<InstallPlan> {
  const visited = new Set<string>();
  const packages: { uri: string; parts: GithubParts; spec: PackageSpec }[] = [];
  const files: PlannedFile[] = [];

  async function visit(uri: string): Promise<void> {
    const normalized = uri.trim();
    if (visited.has(normalized)) return;
    visited.add(normalized);

    const parts = parseGithubUri(normalized);
    const { spec, packageRootPath } = await readPackageSpec(parts);
    const deps = Array.isArray(spec.dependencies) ? spec.dependencies : [];
    for (const dep of deps) {
      await visit(String(dep));
    }
    packages.push({ uri: normalized, parts, spec });

    // Stage files/ from this package
    const entries = await listGithubDirectory(parts, path.posix.join(packageRootPath, "files"));
    for (const entry of entries) {
      if (entry.type === "file") {
        const relWithinFiles = path.posix.relative(
          path.posix.join(packageRootPath, "files"),
          entry.path,
        );
        const relOut = relWithinFiles.replace(/\\/g, "/");
        const targetAbs = path.resolve(relOut);
        const content = await fetchGithubFileBuffer(parts, entry.path);
        files.push({ targetPath: targetAbs, relPath: relOut, content, sourceUri: normalized });
      }
    }
  }

  await visit(rootUri);

  // Detect duplicate target paths inside the plan
  const seen = new Map<string, string>();
  for (const pf of files) {
    const prev = seen.get(pf.relPath);
    if (!prev) {
      seen.set(pf.relPath, pf.sourceUri);
    } else if (prev !== pf.sourceUri) {
      // Two different packages provide the same file; treat as conflict later
    }
  }

  return { packages, files };
}

function detectConflicts(plan: InstallPlan): {
  conflicts: {
    relPath: string;
    existing?: Buffer;
    incoming: Buffer;
    fromUri: string;
    reason: "exists-different" | "duplicate-in-plan";
  }[];
} {
  const conflicts: {
    relPath: string;
    existing?: Buffer;
    incoming: Buffer;
    fromUri: string;
    reason: "exists-different" | "duplicate-in-plan";
  }[] = [];

  // Duplicate within plan
  const byRel = new Map<string, PlannedFile[]>();
  for (const pf of plan.files) {
    const arr = byRel.get(pf.relPath) || [];
    arr.push(pf);
    byRel.set(pf.relPath, arr);
  }
  for (const [rel, arr] of byRel.entries()) {
    if (arr.length > 1) {
      const baseline = arr[0].content;
      for (let i = 1; i < arr.length; i++) {
        if (!baseline.equals(arr[i].content)) {
          conflicts.push({
            relPath: rel,
            incoming: arr[i].content,
            fromUri: arr[i].sourceUri,
            reason: "duplicate-in-plan",
          });
        }
      }
    }
  }

  // Existing file conflicts
  for (const pf of plan.files) {
    if (fs.existsSync(pf.targetPath)) {
      try {
        const existing = fs.readFileSync(pf.targetPath);
        if (!existing.equals(pf.content)) {
          conflicts.push({
            relPath: pf.relPath,
            existing,
            incoming: pf.content,
            fromUri: pf.sourceUri,
            reason: "exists-different",
          });
        }
      } catch {
        // If can't read, treat as conflict
        conflicts.push({
          relPath: pf.relPath,
          existing: undefined,
          incoming: pf.content,
          fromUri: pf.sourceUri,
          reason: "exists-different",
        });
      }
    }
  }
  return { conflicts };
}

function printConflictReport(rep: {
  conflicts: {
    relPath: string;
    existing?: Buffer;
    incoming: Buffer;
    fromUri: string;
    reason: string;
  }[];
}): void {
  const lines: string[] = [];
  lines.push("install: conflicts detected; aborting");
  for (const c of rep.conflicts) {
    lines.push("");
    lines.push(`file: ${c.relPath} (${c.reason})`);
    if (c.reason === "exists-different") {
      lines.push("--- existing ---");
      lines.push(bufferPreview(c.existing));
    }
    lines.push("+++ incoming ---");
    lines.push(bufferPreview(c.incoming));
    lines.push(`from: ${c.fromUri}`);
  }
  process.stderr.write(lines.join("\n") + "\n");
}

function bufferPreview(buf?: Buffer): string {
  if (!buf) return "<unreadable>";
  const str = ensureText(buf);
  // Limit to 2000 chars for safety
  return str.length > 2000 ? str.slice(0, 2000) + "\n... (truncated)" : str;
}

function ensureText(buf: Buffer): string {
  // Best-effort: treat as UTF-8
  try {
    return buf.toString("utf8");
  } catch {
    return "<binary>";
  }
}

async function readPackageSpec(parts: GithubParts): Promise<{
  spec: PackageSpec;
  packageRootPath: string; // inside repo
}> {
  // Try: provided basePath is a directory -> basePath/package.a5c.yaml
  // Else: basePath is already the file path -> use its dirname as root
  const candidateFile = path.posix.join(parts.basePath, "package.a5c.yaml");
  const content = await fetchGithubMaybe(parts, candidateFile);
  let pkgFilePath = candidateFile;
  let pkgText: string | null = null;
  if (content) {
    pkgText = content;
  } else {
    // Try basePath as file
    const c2 = await fetchGithubMaybe(parts, parts.basePath);
    if (!c2) {
      throw new Error(
        `package.a5c.yaml not found at '${candidateFile}' or '${parts.basePath}'`,
      );
    }
    pkgText = c2;
    pkgFilePath = parts.basePath;
  }
  const spec = (YAML.parse(pkgText || "") || {}) as PackageSpec;
  const packageRootPath = path.posix.dirname(pkgFilePath);
  return { spec, packageRootPath };
}

async function runInstallScriptIfExists(parts: GithubParts): Promise<void> {
  const isWin = process.platform === "win32";
  const scriptName = isWin ? "install.cmd" : "install.sh";
  const scriptPath = path.posix.join(parts.basePath, scriptName);
  const content = await fetchGithubMaybeBuffer(parts, scriptPath);
  if (!content) return;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "events-inst-"));
  const tmpScript = path.join(tmpDir, scriptName);
  fs.writeFileSync(tmpScript, content);
  if (!isWin) fs.chmodSync(tmpScript, 0o755);
  await runShell(isWin ? `"${tmpScript}"` : tmpScript);
}

async function updatePackagesYaml(plan: InstallPlan): Promise<void> {
  const a5cDir = path.resolve(".a5c");
  fs.mkdirSync(a5cDir, { recursive: true });
  const filePath = path.join(a5cDir, "packages.yaml");
  let doc: any = { packages: [] };
  if (fs.existsSync(filePath)) {
    try {
      const txt = fs.readFileSync(filePath, "utf8");
      const parsed = YAML.parse(txt);
      if (parsed && typeof parsed === "object") doc = parsed;
      if (!Array.isArray(doc.packages)) doc.packages = [];
    } catch {
      doc = { packages: [] };
    }
  }
  const now = new Date().toISOString();
  for (const p of plan.packages) {
    (doc.packages as any[]).push({
      uri: `github://${p.parts.owner}/${p.parts.repo}/${p.parts.ref}/${p.parts.basePath}`,
      name: p.spec.name || "",
      installedAt: now,
    });
  }
  fs.writeFileSync(filePath, YAML.stringify(doc), "utf8");
}

export async function handleUpgrade(
  opts: InstallOptions,
): Promise<{ code: number; errorMessage?: string }> {
  try {
    if (!opts.uri || typeof opts.uri !== "string") {
      return { code: 2, errorMessage: "upgrade: missing required <github-uri>" };
    }
    const plan = await buildInstallPlan(opts.uri);

    // Apply files, overwriting existing content
    for (const pf of plan.files) {
      fs.mkdirSync(path.dirname(pf.targetPath), { recursive: true });
      fs.writeFileSync(pf.targetPath, pf.content);
    }

    // Run install scripts package-by-package (dependencies first)
    for (const p of plan.packages) {
      await runInstallScriptIfExists(p.parts);
    }

    // Update .a5c/packages.yaml (mark upgradedAt)
    await updatePackagesYamlUpgrade(plan);

    // Print MIGRATIONS.md for the root package if available
    const root = plan.packages[plan.packages.length - 1];
    if (root) await printDocIfExists(root.parts, "MIGRATIONS.md", "Migrations:");

    return { code: 0 };
  } catch (e: any) {
    return { code: 1, errorMessage: String(e?.message || e) };
  }
}

async function updatePackagesYamlUpgrade(plan: InstallPlan): Promise<void> {
  const a5cDir = path.resolve(".a5c");
  fs.mkdirSync(a5cDir, { recursive: true });
  const filePath = path.join(a5cDir, "packages.yaml");
  let doc: any = { packages: [] };
  if (fs.existsSync(filePath)) {
    try {
      const txt = fs.readFileSync(filePath, "utf8");
      const parsed = YAML.parse(txt);
      if (parsed && typeof parsed === "object") doc = parsed;
      if (!Array.isArray(doc.packages)) doc.packages = [];
    } catch {
      doc = { packages: [] };
    }
  }
  const now = new Date().toISOString();
  for (const p of plan.packages) {
    const uri = `github://${p.parts.owner}/${p.parts.repo}/${p.parts.ref}/${p.parts.basePath}`;
    const idx = (doc.packages as any[]).findIndex((x) => x && x.uri === uri);
    if (idx >= 0) {
      doc.packages[idx] = {
        ...(doc.packages[idx] || {}),
        uri,
        name: p.spec.name || doc.packages[idx].name || "",
        upgradedAt: now,
      };
    } else {
      (doc.packages as any[]).push({ uri, name: p.spec.name || "", upgradedAt: now });
    }
  }
  fs.writeFileSync(filePath, YAML.stringify(doc), "utf8");
}

async function printDocIfExists(
  parts: GithubParts,
  fileName: string,
  header: string,
): Promise<void> {
  const maybe = await fetchGithubMaybe(parts, path.posix.join(parts.basePath, fileName));
  if (maybe && maybe.trim().length > 0) {
    process.stdout.write(header + "\n");
    process.stdout.write(maybe.trim() + "\n");
  }
}

function parseGithubUri(raw: string): GithubParts {
  const m = /^(github):\/\/(.+)$/.exec(raw.trim());
  if (!m) throw new Error(`Invalid github URI: '${raw}'`);
  const rest = m[2];
  const parts = rest.split("/");
  const owner = parts.shift();
  const repo = parts.shift();
  if (!owner || !repo || parts.length === 0) {
    throw new Error(
      `Invalid github URI: expected github://owner/repo/(branch|ref|version)/ref/path, got '${raw}'`,
    );
  }

  const decodeSegments = (segments: string[]): string =>
    segments.map((seg) => decodeURIComponent(seg || "")).join("/");
  const normalizePath = (segments: string[]): string => {
    const joined = decodeSegments(segments);
    return joined.replace(/^\/+/, "").replace(/\/+$/, "");
  };

  const mode = (parts[0] || "").toLowerCase();
  if (mode === "branch" || mode === "ref" || mode === "version") {
    if (parts.length < 2) {
      throw new Error(`Invalid github URI: missing ref in '${raw}'`);
    }
    const ref = decodeURIComponent(parts[1] || "");
    const basePath = normalizePath(parts.slice(2));
    return { owner, repo, ref, basePath };
  }

  // Back-compat: github://owner/repo/ref/path (without explicit mode)
  for (let i = parts.length - 1; i >= 1; i--) {
    const ref = decodeSegments(parts.slice(0, i));
    const basePath = normalizePath(parts.slice(i));
    if (ref && basePath) return { owner, repo, ref, basePath };
  }

  throw new Error(`Invalid github URI: missing ref/path in '${raw}'`);
}

async function fetchGithubMaybe(parts: GithubParts, filePath: string): Promise<string | null> {
  try {
    const buf = await fetchGithubFileBuffer(parts, filePath);
    return buf.toString("utf8");
  } catch (e: any) {
    return null;
  }
}

async function fetchGithubMaybeBuffer(parts: GithubParts, filePath: string): Promise<Buffer | null> {
  try {
    const buf = await fetchGithubFileBuffer(parts, filePath);
    return buf;
  } catch {
    return null;
  }
}

async function fetchGithubFileBuffer(parts: GithubParts, filePath: string): Promise<Buffer> {
  const { Octokit } = await import("@octokit/rest");
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.repos.getContent({
    owner: parts.owner,
    repo: parts.repo,
    path: filePath,
    ref: parts.ref,
  });
  if (Array.isArray(data)) throw new Error("Path is a directory, not a file");
  const encoding = (data as any).encoding || "base64";
  const raw: string = (data as any).content || "";
  return Buffer.from(raw, encoding as BufferEncoding);
}

type GithubEntry = { type: "file" | "dir"; path: string };

async function listGithubDirectory(parts: GithubParts, dirPath: string): Promise<GithubEntry[]> {
  const { Octokit } = await import("@octokit/rest");
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });

  const out: GithubEntry[] = [];
  async function walk(p: string): Promise<void> {
    try {
      const { data } = await octokit.repos.getContent({
        owner: parts.owner,
        repo: parts.repo,
        path: p,
        ref: parts.ref,
      });
      if (Array.isArray(data)) {
        // Directory listing
        for (const item of data as any[]) {
          if (item.type === "dir") {
            await walk(item.path);
          } else if (item.type === "file") {
            out.push({ type: "file", path: item.path });
          }
        }
      } else {
        // It's a file
        out.push({ type: "file", path: p });
      }
    } catch (e: any) {
      // If dir does not exist, return empty
      if (String(e?.status || "") === "404") return;
      throw e;
    }
  }
  await walk(dirPath);
  return out;
}

async function runShell(command: string): Promise<number> {
  return await new Promise<number>((resolve) => {
    const child = spawn(command, { shell: true, stdio: "inherit" });
    child.on("close", (code) => resolve(code ?? 0));
    child.on("error", () => resolve(1));
  });
}


