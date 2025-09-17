import fs from "node:fs";
import path from "node:path";
import { readJSONFile } from "./config.js";

export interface GenerateContextOptions {
  in?: string;
  template?: string;
  out?: string;
  vars?: Record<string, string>;
  token?: string;
}

export async function handleGenerateContext(
  opts: GenerateContextOptions,
): Promise<{
  code: number;
  output?: string;
  errorMessage?: string;
}> {
  try {
    const input = await readInput(opts.in);
    const token =
      opts.token ||
      process.env.A5C_AGENT_GITHUB_TOKEN ||
      process.env.GITHUB_TOKEN;
    const rootUri = opts.template || "./README.md";
    const rendered = await renderTemplate(
      expandDollarExpressions(rootUri, {
        event: input,
        env: process.env,
        vars: opts.vars || {},
        token,
      }),
      {
        event: input,
        env: process.env,
        vars: opts.vars || {},
        token,
      },
    );
    return { code: 0, output: rendered };
  } catch (e: any) {
    return { code: 1, errorMessage: String(e?.message || e) };
  }
}

async function readInput(inPath?: string): Promise<any> {
  if (inPath) return readJSONFile(inPath);
  const raw = fs.readFileSync(0, "utf8");
  return JSON.parse(raw);
}

type Context = {
  event: any;
  env: NodeJS.ProcessEnv;
  vars: Record<string, any>;
  token?: string;
};

async function renderTemplate(
  uri: string,
  ctx: Context,
  base?: string,
): Promise<string> {
  const content = await fetchResource(uri, ctx, base);
  return await renderString(content, ctx, uri);
}

async function renderString(
  tpl: string,
  ctx: Context,
  currentUri: string,
): Promise<string> {
  // Includes: {{> uri }} or {{> uri key=value }}
  let out = tpl;
  const includeRe = /\{\{>\s*([^}\s]+)(.*?)\}\}/g;
  out = await replaceAsync(
    out,
    includeRe,
    async (_m, rawUri: string, args: string) => {
      const argVars = parseArgs(args);
      const merged: Context = {
        ...ctx,
        vars: { ...ctx.vars, ...argVars },
      };
      const dynUri = expandDollarExpressions(rawUri, merged);
      const included = await renderTemplate(dynUri, merged, currentUri);
      return included;
    },
  );

  // Sections: {{#if expr}}...{{/if}}
  out = await replaceSections(
    out,
    /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    async (expr, body) => {
      const ok = !!evalExpr(expr, ctx, currentUri);
      return ok ? await renderString(body, ctx, currentUri) : "";
    },
  );
  // Each: {{#each expr}}...{{/each}}
  out = await replaceSections(
    out,
    /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    async (expr, body) => {
      const arr = toArray(evalExpr(expr, ctx, currentUri));
      const parts: string[] = [];
      for (const item of arr) {
        const child: Context = { ...ctx, vars: { ...ctx.vars, this: item } };
        parts.push(await renderString(body, child, currentUri));
      }
      return parts.join("");
    },
  );

  // Variables: {{ expr }}
  const varRe = /\{\{\s*([^}]+)\s*\}\}/g;
  out = out.replace(varRe, (_m, expr: string) => {
    // Bind `this` to current vars to allow {{ this }} inside each blocks
    const val = evalWithThis(expr, ctx, currentUri);
    return val == null ? "" : String(val);
  });
  return out;
}

function toArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

function parseArgs(s: string): Record<string, any> {
  const out: Record<string, any> = {};
  const parts = String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (!k) continue;
    out[k] = v ?? true;
  }
  return out;
}

async function replaceSections(
  s: string,
  re: RegExp,
  fn: (expr: string, body: string) => Promise<string>,
): Promise<string> {
  const chunks: string[] = [];
  let lastIndex = 0;
  for (;;) {
    const m = re.exec(s);
    if (!m) break;
    chunks.push(s.slice(lastIndex, m.index));
    lastIndex = m.index + m[0].length;
    chunks.push(await fn(m[1], m[2]));
  }
  chunks.push(s.slice(lastIndex));
  return chunks.join("");
}

async function replaceAsync(
  s: string,
  re: RegExp,
  fn: (...m: any[]) => Promise<string>,
): Promise<string> {
  const chunks: string[] = [];
  let lastIndex = 0;
  for (;;) {
    const m = re.exec(s);
    if (!m) break;
    chunks.push(s.slice(lastIndex, m.index));
    lastIndex = m.index + m[0].length;
    chunks.push(await fn(...m));
  }
  chunks.push(s.slice(lastIndex));
  return chunks.join("");
}

function resolveUri(
  raw: string,
  base?: string,
): { scheme: string; path: string } {
  // Support protocol-relative: //path -> inherit scheme from base
  if (raw.startsWith("//") && base) {
    const b = new URL(base, "file://");
    return { scheme: b.protocol.replace(":", ""), path: raw.slice(2) };
  }
  const m = /^(\w+):\/\/(.+)$/.exec(raw);
  if (m) return { scheme: m[1], path: m[2] };
  // relative path
  return { scheme: "file", path: raw };
}

async function fetchResource(
  rawUri: string,
  ctx: Context,
  base?: string,
): Promise<string> {
  // Expand ${{ ... }} inside URI before resolution
  const expanded = expandDollarExpressions(rawUri, ctx);
  const { scheme, path: p } = resolveUri(expanded, base);
  if (scheme === "file") {
    const resolved =
      base && base.startsWith("file://")
        ? path.resolve(path.dirname(new URL(base).pathname), p)
        : path.resolve(p);
    return fs.readFileSync(resolved, "utf8");
  }
  if (scheme === "github") {
    // path: owner/repo/refOrVersion/remaining
    const [owner, repo, refOrVersion, ...rest] = p.split("/");
    const filePath = rest.join("/");
    const ref = await resolveGithubRef(owner, repo, refOrVersion, ctx.token);
    const content = await fetchGithubFile(
      owner,
      repo,
      ref,
      filePath,
      ctx.token,
    );
    return content;
  }
  // Default: treat as file path
  return fs.readFileSync(path.resolve(p), "utf8");
}

async function resolveGithubRef(
  owner: string,
  repo: string,
  refOrVersion: string,
  token?: string,
): Promise<string> {
  if (!refOrVersion) return "main";
  if (/^v?\d+\.\d+\.\d+/.test(refOrVersion)) {
    // semver tag or version: v1.2.3 → prefer tag, else resolve to release/*
    return refOrVersion.startsWith("v") ? refOrVersion : `v${refOrVersion}`;
  }
  return refOrVersion;
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

function evalExpr(expr: string, ctx: Context, currentUri: string): any {
  // Provide helpers: event, env, vars, include(uri), and simple pipes map()/contains()
  const compiled = preprocess(expr);

  const fn = new Function(
    "event",
    "github",
    "env",
    "vars",
    "include",
    `return (${compiled});`,
  );
  const include = (u: string) => renderTemplate(u, ctx, currentUri);
  // Bind JS `this` to the current iteration item when available (e.g., {{ this }})
  const thisArg: any = (ctx as any)?.vars?.this ?? undefined;
  return fn.call(thisArg, ctx.event, ctx.event, ctx.env, ctx.vars, include);
}

function evalWithThis(expr: string, ctx: Context, currentUri: string): any {
  const compiled = preprocess(expr);
  const fn = new Function(
    "event",
    "github",
    "env",
    "vars",
    "include",
    `return (${compiled});`,
  );
  const include = (u: string) => renderTemplate(u, ctx, currentUri);
  try {
    // Bind `this` to current item when available (ctx.vars.this),
    // otherwise fall back to ctx.vars to keep simple cases working.
    const thisArg =
      ctx && ctx.vars && Object.prototype.hasOwnProperty.call(ctx.vars, "this")
        ? ctx.vars.this
        : ctx.vars;
    return fn.call(thisArg, ctx.event, ctx.event, ctx.env, ctx.vars, include);
  } catch {
    // Fallback to non-bound eval
    return evalExpr(expr, ctx, currentUri);
  }
}

function preprocess(expr: string): string {
  // Reuse simple pipeline handling similar to reactor
  return expr;
}

function expandDollarExpressions(s: string, ctx: Context): string {
  return String(s).replace(/\$\{\{\s*([^}]+)\s*\}\}/g, (_m, expr) => {
    try {
      const val = evalExpr(String(expr), ctx, "file:///");
      return val == null ? "" : String(val);
    } catch {
      return "";
    }
  });
}
