import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import YAML from "yaml";

const DEFAULT_REGISTRY_PACKAGE_BASE = "github://a5c-ai/a5c/branch/main/registry/packages";
const URI_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;

export function resolveInstallUri(input: string): string {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) throw new Error("install: empty package identifier");
  if (URI_SCHEME_REGEX.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  const sanitized = trimmed.replace(/\\/g, "/");
  let segments = sanitized.split("/").filter(Boolean);

  if (segments.length >= 2 && segments[0].toLowerCase() === "registry" && segments[1].toLowerCase() === "packages") {
    segments = segments.slice(2);
  } else if (segments.length >= 1 && segments[0].toLowerCase() === "packages") {
    segments = segments.slice(1);
  }

  if (!segments.length || segments.some((seg) => seg === "." || seg === "..")) {
    throw new Error(`invalid package identifier '${input}'`);
  }

  return `${DEFAULT_REGISTRY_PACKAGE_BASE}/${segments.join("/")}`.replace(/\/+$/, "");
}

class InstallProgress {
  private currentStage?: ProgressStage;

  constructor(private readonly enabled: boolean) {}

  startStage(label: string, total?: number): ProgressStage {
    this.finishStage();
    this.currentStage = new ProgressStage(this.enabled, label, total);
    return this.currentStage;
  }

  finishStage(finalInfo?: string): void {
    if (this.currentStage) {
      this.currentStage.finish(finalInfo);
      this.currentStage = undefined;
    }
  }

  finish(): void {
    this.finishStage();
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

class ProgressStage {
  private total: number;
  private current = 0;
  private info = "";
  private lastRendered = "";
  private finished = false;
  private readonly width = 24;

  constructor(private readonly enabled: boolean, private readonly label: string, total?: number) {
    this.total = typeof total === "number" && total > 0 ? total : 0;
    if (this.enabled) this.render();
  }

  setTotal(total: number): void {
    if (!this.enabled || this.finished) return;
    this.total = total > 0 ? total : 0;
    this.render();
  }

  advance(info?: string): void {
    if (!this.enabled || this.finished) return;
    this.current += 1;
    if (info !== undefined) this.info = info;
    this.render();
  }

  update(current: number, info?: string): void {
    if (!this.enabled || this.finished) return;
    this.current = Math.max(0, current);
    if (info !== undefined) this.info = info;
    this.render();
  }

  setInfo(info: string): void {
    if (!this.enabled || this.finished) return;
    this.info = info;
    this.render();
  }

  finish(finalInfo?: string): void {
    if (!this.enabled || this.finished) return;
    if (finalInfo !== undefined) this.info = finalInfo;
    this.render(true);
    this.finished = true;
  }

  private render(final = false): void {
    if (!this.enabled) return;
    const total = this.total;
    const current = total > 0 ? Math.min(this.current, total) : this.current;
    const ratio = total > 0 ? Math.max(0, Math.min(1, current / total)) : 0;
    const filled = total > 0 ? Math.round(ratio * this.width) : 0;
    const empty = this.width - filled;
    const bar = total > 0 ? `[${"#".repeat(filled)}${"-".repeat(empty)}] ${(ratio * 100).toFixed(0).padStart(3, " ")} %` : "";
    const counts = total > 0 ? `${current}/${total}` : `${current}`;
    const infoPart = this.info ? ` ${this.info}` : "";
    const line = `${this.label}${bar ? ` ${bar}` : ""} ${counts}${infoPart}`.trimEnd();
    if (line === this.lastRendered && !final) return;
    process.stdout.write(`\r${line}`);
    this.lastRendered = line;
    if (final) {
      process.stdout.write("\n");
      this.lastRendered = "";
    }
  }
}

export interface InstallOptions {
  uri: string;
  showProgress?: boolean;
  serverSideOnly?: boolean;
  serverSide?: ServerSideInstallOptions;
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

type InstallPackage = {
  uri: string;
  parts: GithubParts;
  spec: PackageSpec;
  packageRootPath: string;
};

type InstallPlan = {
  packages: InstallPackage[]; // dependency-first order
  files: PlannedFile[];
};

type InstallContext = {
  progress: InstallProgress;
  docsPrinted: Set<string>;
  serverSide?: ServerSideInstallOptions;
};

let currentInstallContext: InstallContext | undefined;

type ServerSideInstallOptions = {
  targetRepo: string;
  targetBranch: string;
  newBranch: string;
  prTitle?: string;
  prBody?: string;
  skipScripts?: boolean;
  octokitFactory?: () => Promise<any>;
  gitAuthor?: { name: string; email: string };
  commitMessage?: string;
  token?: string;
  overridePaths?: Record<string, Buffer | string>;
  commitSummary?: string;
};

/**
 * Example (server-side usage):
 * ```ts
 * await handleInstall({
 *   uri: "github://a5c-ai/a5c/branch/main/registry/packages/github-starter",
 *   serverSideOnly: true,
 *   serverSide: {
 *     targetRepo: "my-org/my-repo",
 *     targetBranch: "main",
 *     newBranch: "chore/add-a5c-starter",
 *     token: process.env.GITHUB_TOKEN,
 *   },
 * });
 * ```
 */
export async function handleInstall(
  opts: InstallOptions,
): Promise<{ code: number; errorMessage?: string; installDocs?: string[]; prUrl?: string }> {
  try {
    if (!opts.uri || typeof opts.uri !== "string") {
      return { code: 2, errorMessage: "install: missing required <github-uri>" };
    }
    let resolvedUri: string;
    try {
      resolvedUri = resolveInstallUri(opts.uri);
    } catch (err: any) {
      return { code: 2, errorMessage: String(err?.message || err) };
    }
    const serverSide = opts.serverSideOnly === true ? (opts.serverSide as ServerSideInstallOptions | undefined) : undefined;
    const progress = new InstallProgress(opts.showProgress === true && !serverSide);
    const ctx: InstallContext = {
      progress,
      docsPrinted: new Set(),
      serverSide,
    };
    if (opts.serverSideOnly && !ctx.serverSide) {
      return {
        code: 2,
        errorMessage: "install: serverSideOnly requires serverSide configuration",
      };
    }

    const previousContext = currentInstallContext;
    currentInstallContext = ctx;
    try {
      const plan = await buildInstallPlan(resolvedUri, ctx);

      const conflictReport = detectConflicts(plan);
      if (conflictReport.conflicts.length > 0) {
        printConflictReport(conflictReport);
        return { code: 3, errorMessage: "install aborted due to conflicts" };
      }

      if (opts.serverSideOnly) {
        return await performServerSideInstall(plan, ctx);
      }

      // Apply files
      for (const pf of plan.files) {
        fs.mkdirSync(path.dirname(pf.targetPath), { recursive: true });
        fs.writeFileSync(pf.targetPath, pf.content);
      }

      // Run install scripts package-by-package (dependencies first)
      const scriptStage = progress.startStage("Running install scripts", plan.packages.length);
      for (const p of plan.packages) {
        scriptStage.setInfo(p.spec.name || p.uri);
    await runInstallScriptIfExists(p.parts);
        scriptStage.advance();
      }
      progress.finishStage();

      // Update .a5c/packages.yaml
      await updatePackagesYaml(plan);

      // Print INSTALL.md for each package (dependencies first)
      const docs: string[] = [];
      for (const pkg of plan.packages) {
        const doc = await printDocIfExists(
          pkg.parts,
          "INSTALL.md",
          `Installation instructions (${pkg.spec.name || pkg.uri}):`,
          ctx,
        );
        if (doc) docs.push(doc);
      }

      progress.finish();
      return { code: 0, installDocs: docs.length ? docs : undefined };
    } finally {
      currentInstallContext = previousContext;
    }
  } catch (e: any) {
    return { code: 1, errorMessage: String(e?.message || e) };
  }
}

export async function handleInit(opts: {
  pkg?: string;
  showProgress?: boolean;
  serverSideOnly?: boolean;
  serverSide?: ServerSideInstallOptions;
}): Promise<{ code: number; errorMessage?: string; installDocs?: string[]; prUrl?: string }> {
  try {
    const a5cDir = path.resolve(".a5c");
    fs.mkdirSync(a5cDir, { recursive: true });

    const packagesYaml = path.join(a5cDir, "packages.yaml");
    if (fs.existsSync(packagesYaml)) {
      return {
        code: 4,
        errorMessage: "init: .a5c/packages.yaml already exists; refusing to overwrite",
      };
    }
    const initDoc = { packages: [] as any[] };
    fs.writeFileSync(packagesYaml, YAML.stringify(initDoc), "utf8");
    const configYaml = path.join(a5cDir, "config.yaml");
    if (!fs.existsSync(configYaml)) {
      fs.writeFileSync(configYaml, "", "utf8");
    }

    let defaultPkg = opts.pkg || "github://a5c-ai/a5c/branch/main/registry/packages/github-starter";
    try {
      defaultPkg = resolveInstallUri(defaultPkg);
    } catch (err: any) {
      return { code: 2, errorMessage: String(err?.message || err) };
    }

    const showProgress = opts.showProgress !== false;
    const { code, errorMessage, installDocs, prUrl } = await handleInstall({
      uri: defaultPkg,
      showProgress,
      serverSideOnly: opts.serverSideOnly,
      serverSide: opts.serverSide,
    });
    if (code !== 0) return { code, errorMessage, installDocs, prUrl };
    return { code: 0, installDocs, prUrl };
  } catch (e: any) {
    return { code: 1, errorMessage: String(e?.message || e) };
  }
}

async function buildInstallPlan(
  rootUri: string,
  ctx: InstallContext,
): Promise<InstallPlan> {
  const visited = new Set<string>();
  const packages: InstallPackage[] = [];
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
    packages.push({ uri: normalized, parts, spec, packageRootPath });

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
  if (currentInstallContext?.serverSide && currentInstallContext.serverSide.skipScripts !== false) {
    return;
  }
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
    const progress = new InstallProgress(opts.showProgress === true);
    const ctx: InstallContext = { progress, docsPrinted: new Set() };
    const plan = await buildInstallPlan(opts.uri, ctx);

    // Apply files, overwriting existing content
    const fileStage = progress.startStage(
      "Applying files",
      plan.files.length > 0 ? plan.files.length : undefined,
    );
    for (const pf of plan.files) {
      fs.mkdirSync(path.dirname(pf.targetPath), { recursive: true });
      fs.writeFileSync(pf.targetPath, pf.content);
      fileStage.advance(pf.relPath);
    }
    progress.finishStage();

    // Run install scripts package-by-package (dependencies first)
    const scriptStage = progress.startStage("Running install scripts", plan.packages.length);
    for (const p of plan.packages) {
      scriptStage.setInfo(p.spec.name || p.uri);
      await runInstallScriptIfExists(p.parts);
      scriptStage.advance();
    }
    progress.finishStage();

    // Update .a5c/packages.yaml (mark upgradedAt)
    await updatePackagesYamlUpgrade(plan);

    // Print MIGRATIONS.md for the root package if available
    const root = plan.packages[plan.packages.length - 1];
    if (root)
      await printDocIfExists(
        root.parts,
        "MIGRATIONS.md",
        `Migrations (${root.spec.name || root.uri}):`,
        ctx,
      );

    progress.finish();
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
  ctx?: InstallContext,
): Promise<string | undefined> {
  const maybe = await fetchGithubMaybe(parts, path.posix.join(parts.basePath, fileName));
  const trimmed = maybe?.trim();
  if (trimmed && trimmed.length > 0) {
    const key = `${parts.owner}/${parts.repo}/${parts.ref}/${parts.basePath}/${fileName}`;
    if (ctx?.docsPrinted.has(key)) return;
    ctx?.docsPrinted.add(key);
    if (!ctx?.serverSide) {
      process.stdout.write(header + "\n");
      process.stdout.write(trimmed + "\n");
    }
    return `${header}\n${trimmed}`;
  }
  return undefined;
}

async function performServerSideInstall(
  plan: InstallPlan,
  ctx: InstallContext,
): Promise<{ code: number; errorMessage?: string; installDocs?: string[]; prUrl?: string }> {
  const ss = ctx.serverSide;
  if (!ss) {
    return { code: 2, errorMessage: "server-side install missing configuration" };
  }

  const docs: string[] = [];
  for (const pkg of plan.packages) {
    const doc = await printDocIfExists(
      pkg.parts,
      "INSTALL.md",
      `Installation instructions (${pkg.spec.name || pkg.uri}):`,
      ctx,
    );
    if (doc) docs.push(doc);
  }

  try {
    const { owner, repo } = parseOwnerRepo(ss.targetRepo);
    const octokit = await getOctokitForServerSide(ss);

    const baseRefResp = await octokit.git.getRef({ owner, repo, ref: `heads/${ss.targetBranch}` });
    const baseCommitSha: string = baseRefResp.data.object.sha;

    try {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${ss.newBranch}`,
        sha: baseCommitSha,
      });
    } catch (err: any) {
      if (Number(err?.status) === 422) {
        throw new Error(`target branch '${ss.newBranch}' already exists`);
      }
      throw err;
    }

    const baseCommitResp = await octokit.git.getCommit({ owner, repo, commit_sha: baseCommitSha });
    const baseTreeSha: string = baseCommitResp.data.tree.sha;

    const packagesYamlContent = await buildServerSidePackagesYaml(plan, octokit, owner, repo, ss.targetBranch);

    const fileMap = new Map<string, Buffer>();
    for (const pf of plan.files) {
      fileMap.set(pf.relPath.replace(/\\/g, "/"), Buffer.from(pf.content));
    }
    fileMap.set(".a5c/packages.yaml", Buffer.from(packagesYamlContent, "utf8"));

    if (ss.overridePaths) {
      for (const [p, content] of Object.entries(ss.overridePaths)) {
        const buf = Buffer.isBuffer(content) ? content : Buffer.from(String(content));
        fileMap.set(p.replace(/\\/g, "/"), Buffer.from(buf));
      }
    }

    if (fileMap.size === 0) {
      throw new Error("no files to commit for server-side install");
    }

    const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [];
    for (const [filePath, buf] of fileMap.entries()) {
      const blobResp = await octokit.git.createBlob({
        owner,
        repo,
        content: buf.toString("base64"),
        encoding: "base64",
      });
      treeEntries.push({ path: filePath, mode: "100644", type: "blob", sha: blobResp.data.sha });
    }

    const treeResp = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: treeEntries,
    });

    const commitMessage = ss.commitMessage || buildDefaultCommitMessage(plan);
    const commitParams: any = {
      owner,
      repo,
      message: commitMessage,
      tree: treeResp.data.sha,
      parents: [baseCommitSha],
    };
    if (ss.gitAuthor) commitParams.author = ss.gitAuthor;

    const commitResp = await octokit.git.createCommit(commitParams);

    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${ss.newBranch}`,
      sha: commitResp.data.sha,
      force: true,
    });

    const prTitle = ss.prTitle || commitMessage;
    const prBody = ss.prBody || buildDefaultPullRequestBody(plan, docs);

    const prResp = await octokit.pulls.create({
      owner,
      repo,
      title: prTitle,
      head: ss.newBranch,
      base: ss.targetBranch,
      body: prBody,
    });

    ctx.progress.finish();
    return {
      code: 0,
      installDocs: docs.length ? docs : undefined,
      prUrl: prResp?.data?.html_url,
    };
  } catch (e: any) {
    ctx.progress.finish();
    return {
      code: 1,
      errorMessage: String(e?.message || e),
      installDocs: docs.length ? docs : undefined,
    };
  }
}

function parseOwnerRepo(input: string): { owner: string; repo: string } {
  const trimmed = String(input || "").trim();
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length !== 2) {
    throw new Error(`invalid repository identifier '${input}' (expected owner/repo)`);
  }
  return { owner: parts[0], repo: parts[1] };
}

async function getOctokitForServerSide(ss: ServerSideInstallOptions): Promise<any> {
  if (ss.octokitFactory) {
    return await ss.octokitFactory();
  }
  return await getOctokitClient({ suppressLogging: true, tokenOverride: ss.token });
}

async function buildServerSidePackagesYaml(
  plan: InstallPlan,
  octokit: any,
  owner: string,
  repo: string,
  ref: string,
): Promise<string> {
  let doc: any = { packages: [] };
  try {
    const resp = await octokit.repos.getContent({ owner, repo, path: ".a5c/packages.yaml", ref });
    if (!Array.isArray(resp.data)) {
      const encoding = resp.data.encoding || "base64";
      const raw = Buffer.from(resp.data.content || "", encoding as BufferEncoding).toString("utf8");
      if (raw.trim().length) {
        doc = YAML.parse(raw) || { packages: [] };
      }
    }
  } catch (err: any) {
    if (Number(err?.status) !== 404) throw err;
  }
  if (!Array.isArray(doc.packages)) doc.packages = [];

  const now = new Date().toISOString();
  for (const p of plan.packages) {
    const uri = `github://${p.parts.owner}/${p.parts.repo}/${p.parts.ref}/${p.parts.basePath}`;
    const idx = (doc.packages as any[]).findIndex((x) => x && x.uri === uri);
    const entry = {
      uri,
      name: p.spec.name || "",
      installedAt: now,
    };
    if (idx >= 0) {
      doc.packages[idx] = { ...(doc.packages[idx] || {}), ...entry };
    } else {
      (doc.packages as any[]).push(entry);
    }
  }
  return YAML.stringify(doc);
}

function buildDefaultCommitMessage(plan: InstallPlan): string {
  const root = plan.packages[plan.packages.length - 1];
  const name = root?.spec?.name || root?.uri || "a5c package";
  return `Install ${name} via a5c`;
}

function buildDefaultPullRequestBody(plan: InstallPlan, docs: string[]): string {
  const lines: string[] = [];
  const root = plan.packages[plan.packages.length - 1];
  const name = root?.spec?.name || root?.uri || "a5c package";
  lines.push(`# Install ${name}`);
  lines.push("");
  lines.push("This pull request was created automatically by the a5c installer.");
  lines.push("");
  lines.push("## Packages");
  for (const pkg of plan.packages) {
    lines.push(`- ${pkg.spec.name || pkg.uri}`);
  }
  if (docs.length) {
    lines.push("");
    lines.push("## Installation Notes");
    for (const doc of docs) {
      lines.push("");
      lines.push("---");
      lines.push(doc);
    }
  }
  return lines.join("\n");
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
    const buf = await fetchGithubFileBuffer(parts, filePath, {
      suppressRequestLogging: true,
    });
    return buf.toString("utf8");
  } catch (e: any) {
    return null;
  }
}

async function fetchGithubMaybeBuffer(parts: GithubParts, filePath: string): Promise<Buffer | null> {
  try {
    const buf = await fetchGithubFileBuffer(parts, filePath, {
      suppressRequestLogging: true,
    });
    return buf;
  } catch {
    return null;
  }
}

async function fetchGithubFileBuffer(
  parts: GithubParts,
  filePath: string,
  opts: { suppressRequestLogging?: boolean } = {},
): Promise<Buffer> {
  const octokit = await getOctokitClient({
    suppressLogging: opts.suppressRequestLogging === true,
    tokenOverride: currentInstallContext?.serverSide?.token,
  });
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
  const octokit = await getOctokitClient({
    suppressLogging: true,
    tokenOverride: currentInstallContext?.serverSide?.token,
  });

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

type OctokitClientOptions = {
  suppressLogging?: boolean;
  tokenOverride?: string;
};

let cachedOctokit: any;
let cachedOctokitSilent: any;

async function getOctokitClient(opts: OctokitClientOptions = {}): Promise<any> {
  const suppress = opts.suppressLogging === true;
  const tokenOverride = opts.tokenOverride;
  if (!tokenOverride) {
    if (suppress && cachedOctokitSilent) return cachedOctokitSilent;
    if (!suppress && cachedOctokit) return cachedOctokit;
  }

  const { Octokit } = await import("@octokit/rest");
  const token = tokenOverride || process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GitHub token is required for this operation");
  }

  const log = suppress
    ? { debug: noop, info: noop, warn: noop, error: noop }
    : undefined;

  const octokit = new Octokit({ auth: token, log });
  if (!tokenOverride) {
    if (suppress) cachedOctokitSilent = octokit;
    else cachedOctokit = octokit;
  }
  return octokit;
}

function noop(): void {}


