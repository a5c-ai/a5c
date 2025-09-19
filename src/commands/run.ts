import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import YAML from "yaml";

export interface RunOptions {
  in?: string; // prompt URI or '-' or file path; default stdin
  out?: string; // output file to write final content (optional)
  profile?: string; // profile name from predefined.yaml (optional)
  model?: string; // model override (optional)
  mcps?: string; // path to mcps.json (optional, default .a5c/mcps.json)
  config?: string; // path/URI to config YAML that overrides predefined
}

type PredefinedSpec = {
  cli: Record<
    string,
    {
      cli_command?: string;
      description?: string;
      install?: string;
      stdin_enabled?: boolean;
      envs?: Record<string, string>;
    }
  >;
  profiles: Record<
    string,
    {
      default?: boolean;
      cli: string; // key into cli map
      model?: string;
      description?: string;
      cli_params?: string; // extra flags appended to the cli_command
    }
  >;
};

export async function handleRun(
  opts: RunOptions,
): Promise<{ code: number; errorMessage?: string }> {
  try {
    const predefined = await loadPredefined(opts.config);
    const profileName =
      opts.profile ||
      findDefaultProfileName(predefined) ||
      Object.keys(predefined.profiles)[0];
    if (!profileName || !predefined.profiles[profileName]) {
      return {
        code: 2,
        errorMessage: `run: unknown profile '${opts.profile || profileName}'`,
      };
    }
    const profile = predefined.profiles[profileName];
    const cliProvider = predefined.cli[profile.cli];
    if (!cliProvider) {
      return {
        code: 2,
        errorMessage: `run: unknown cli provider '${profile.cli}'`,
      };
    }

    // Prepare prompt content
    const promptContent = await readInputPrompt(opts.in);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "events-run-"));
    const promptPath = path.join(tmpDir, "prompt.md");
    fs.writeFileSync(promptPath, promptContent, "utf8");

    // Prepare output path for last message (used by several CLIs)
    const outPath = normalizeOutPath(opts.out);
    const outputLastMsgPath = path.join(tmpDir, "agent-output.md");

    // Compute mcps path
    const mcpsPath = opts.mcps || ".a5c/mcps.json";

    // Templating context
    const templateCtx = {
      prompt_path: promptPath,
      model: opts.model || profile.model || "",
      output_last_message_path: outputLastMsgPath,
      mcp_config: mcpsPath,
      envs: process.env as Record<string, string>,
    };

    // Build environment for the spawned processes (merge predefined envs with process.env)
    const extraEnv = renderEnvVars(cliProvider.envs || {}, templateCtx);
    const childEnv = { ...process.env, ...extraEnv };

    // Run install if provided
    if (cliProvider.install && cliProvider.install.trim().length > 0) {
      const installCmd = renderString(cliProvider.install, templateCtx);
      const instCode = await runShell(installCmd, { env: childEnv });
      if (instCode !== 0)
        return {
          code: instCode,
          errorMessage: `install failed: ${installCmd}`,
        };
    }

    // Compose CLI command
    const baseCmd = renderString(cliProvider.cli_command || "", templateCtx);
    if (!baseCmd) return { code: 2, errorMessage: "run: cli_command is empty" };
    const params = renderString(profile.cli_params || "", templateCtx).trim();
    const fullCmd = params ? `${baseCmd} ${params}` : baseCmd;

    // Execute the command
    const code = await runShell(fullCmd, { env: childEnv });
    // If user provided --out, copy the last message file to out (if exists)
    if (opts.out && fs.existsSync(outputLastMsgPath)) {
      // Ensure parent dir exists
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      const content = fs.readFileSync(outputLastMsgPath, "utf8");
      fs.writeFileSync(outPath, content, "utf8");
    }
    return { code };
  } catch (e: any) {
    return { code: 1, errorMessage: String(e?.message || e) };
  }
}

function normalizeOutPath(out?: string): string {
  if (!out) return path.join(os.tmpdir(), "events-run-out.json");
  return path.isAbsolute(out) ? out : path.resolve(out);
}

async function readInputPrompt(input?: string): Promise<string> {
  // Default: stdin
  if (!input || input === "-") {
    try {
      return fs.readFileSync(0, "utf8");
    } catch {
      return "";
    }
  }
  // URI handling: file://, github://, else treat as path
  const { scheme, path: p } = resolveUri(input);
  if (scheme === "file") {
    const resolved = p.startsWith("/") ? p : path.resolve(p);
    return fs.readFileSync(resolved, "utf8");
  }
  if (scheme === "github") {
    const [owner, repo, ...rest] = p.split("/");
    if (!owner || !repo || rest.length === 0)
      throw new Error(
        `Invalid github URI: expected github://owner/repo/ref/path, got '${input}'`,
      );
    // Try longest-first ref split
    const token =
      process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    let lastErr: any = null;
    for (let i = rest.length - 1; i >= 1; i--) {
      const refCandidate = rest.slice(0, i).join("/");
      const filePathCandidate = rest.slice(i).join("/");
      try {
        const content = await fetchGithubFile(
          owner,
          repo,
          refCandidate,
          filePathCandidate,
          token,
        );
        return content;
      } catch (e: any) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Failed to fetch GitHub file: unknown error");
  }
  // default: local path
  return fs.readFileSync(path.resolve(p), "utf8");
}

function resolveUri(raw: string): { scheme: string; path: string } {
  const m = /^(\w+):\/\/(.+)$/.exec(raw);
  if (m) return { scheme: m[1], path: m[2] };
  return { scheme: "file", path: raw };
}

async function fetchGithubFile(
  owner: string,
  repo: string,
  ref: string,
  filePath: string,
  token?: string,
): Promise<string> {
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: filePath,
    ref,
  });
  if (Array.isArray(data)) throw new Error("Path is a directory, not a file");
  const encoding = (data as any).encoding || "base64";
  const content: string = Buffer.from(
    (data as any).content || "",
    encoding,
  ).toString("utf8");
  return content;
}

async function loadPredefined(
  configUriOrPath?: string,
): Promise<PredefinedSpec> {
  const base = await readBundledPredefined();
  if (!configUriOrPath) return base;
  const cfgText = await readText(configUriOrPath);
  const cfg = YAML.parse(cfgText) || {};
  return deepMerge(base, cfg);
}

async function readBundledPredefined(): Promise<PredefinedSpec> {
  // Prefer root-level predefined.yaml if present; else try relative to this file
  const candidates: string[] = [];
  candidates.push(path.resolve(process.cwd(), "predefined.yaml"));
  // dist/commands/run.js -> ../../predefined.yaml (package root)
  const here = fileURLToPath(import.meta.url);
  candidates.push(path.resolve(path.dirname(here), "../../predefined.yaml"));
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, "utf8");
      const parsed = YAML.parse(txt) as PredefinedSpec;
      if (parsed && parsed.cli && parsed.profiles) return parsed;
    }
  }
  throw new Error(
    "predefined.yaml not found; ensure it is bundled or present in CWD",
  );
}

async function readText(uriOrPath: string): Promise<string> {
  const { scheme, path: p } = resolveUri(uriOrPath);
  if (scheme === "file") {
    const resolved = p.startsWith("/") ? p : path.resolve(p);
    return fs.readFileSync(resolved, "utf8");
  }
  if (scheme === "github") {
    const [owner, repo, ...rest] = p.split("/");
    if (!owner || !repo || rest.length === 0)
      throw new Error(
        `Invalid github URI: expected github://owner/repo/ref/path, got '${uriOrPath}'`,
      );
    const token =
      process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    let lastErr: any = null;
    for (let i = rest.length - 1; i >= 1; i--) {
      const refCandidate = rest.slice(0, i).join("/");
      const filePathCandidate = rest.slice(i).join("/");
      try {
        const content = await fetchGithubFile(
          owner,
          repo,
          refCandidate,
          filePathCandidate,
          token,
        );
        return content;
      } catch (e: any) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("Failed to fetch GitHub file: unknown error");
  }
  return fs.readFileSync(path.resolve(p), "utf8");
}

function findDefaultProfileName(spec: PredefinedSpec): string | undefined {
  for (const [name, prof] of Object.entries(spec.profiles || {})) {
    if (prof && (prof as any).default) return name;
  }
  return undefined;
}

function renderEnvVars(
  envs: Record<string, string>,
  ctx: Record<string, any>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(envs)) {
    out[k] = renderString(String(v ?? ""), ctx);
  }
  return out;
}

function renderString(tpl: string, ctx: Record<string, any>): string {
  // Very small templating: replace {{path}} with deep value from ctx
  return String(tpl).replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, expr) => {
    const val = lookupPath(ctx, String(expr));
    return val == null ? "" : String(val);
  });
}

function lookupPath(obj: any, dotted: string): any {
  const parts = dotted
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function deepMerge<T extends Record<string, any>>(a: T, b: Partial<T>): T {
  const out: any = Array.isArray(a) ? [...(a as any)] : { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      a &&
      typeof (a as any)[k] === "object" &&
      !Array.isArray((a as any)[k])
    ) {
      (out as any)[k] = deepMerge((a as any)[k], v as any);
    } else {
      (out as any)[k] = v as any;
    }
  }
  return out as T;
}

async function runShell(
  command: string,
  options?: { env?: NodeJS.ProcessEnv },
): Promise<number> {
  return await new Promise<number>((resolve) => {
    const child = spawn(command, {
      shell: true,
      stdio: "inherit",
      env: options?.env,
    });
    // stdout and stderr should be capatured, analyzed and emitted in realtime
    child.stdout?.on("data", (data) => {
      process.stdout.write(data);
    });
    child.stderr?.on("data", (data) => {
      process.stderr.write(data);
    });
    child.on("close", (code) => resolve(code ?? 0));
    child.on("error", () => resolve(1));
  });
}
