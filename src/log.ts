export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFormat = "pretty" | "json";

export interface LoggerLike {
  debug: (msg: string, ctx?: Record<string, unknown>) => void;
  info: (msg: string, ctx?: Record<string, unknown>) => void;
  warn: (msg: string, ctx?: Record<string, unknown>) => void;
  error: (msg: string, ctx?: Record<string, unknown>) => void;
}

export interface LoggerOptions {
  level?: LogLevel;
  format?: LogFormat;
  scope?: string;
  // for testing
  write?: (s: string) => void;
}

export function resolveLogLevel(env?: NodeJS.ProcessEnv): LogLevel {
  const raw = String(
    (env || process.env).A5C_LOG_LEVEL || "info",
  ).toLowerCase();
  if (raw === "debug" || raw === "trace") return "debug";
  if (raw === "warn" || raw === "warning") return "warn";
  if (raw === "error") return "error";
  return "info";
}

export function resolveLogFormat(env?: NodeJS.ProcessEnv): LogFormat {
  const raw = String(
    (env || process.env).A5C_LOG_FORMAT || "pretty",
  ).toLowerCase();
  return raw === "json" ? "json" : "pretty";
}

function levelToNum(level: LogLevel): number {
  switch (level) {
    case "debug":
      return 10;
    case "info":
      return 20;
    case "warn":
      return 30;
    case "error":
      return 40;
  }
}

export function createLogger(opts: LoggerOptions = {}): LoggerLike {
  const envLevel = resolveLogLevel();
  const envFormat = resolveLogFormat();
  const level: LogLevel = opts.level || envLevel;
  const format: LogFormat = opts.format || envFormat;
  const scope = opts.scope || "a5c";
  const write = opts.write || ((s: string) => process.stderr.write(s));

  const min = levelToNum(level);
  const isActions =
    String(process.env.GITHUB_ACTIONS || "").toLowerCase() === "true";

  function emit(lvl: LogLevel, msg: string, ctx?: Record<string, unknown>) {
    if (levelToNum(lvl) < min) return;
    const ts = new Date().toISOString();
    if (format === "json") {
      const line: Record<string, unknown> = { ts, level: lvl, scope, msg };
      if (ctx && typeof ctx === "object") {
        for (const [k, v] of Object.entries(ctx)) line[k] = v;
      }
      write(JSON.stringify(line) + "\n");
      return;
    }
    // pretty: try to integrate with GitHub Actions if present
    let prefix = `[${scope}] ${lvl.toUpperCase()}:`;
    if (isActions) {
      if (lvl === "debug") prefix = "::debug::";
      else if (lvl === "warn") prefix = "::warning::";
      else if (lvl === "error") prefix = "::error::";
      else prefix = "::notice::";
    }
    const suffix =
      ctx && Object.keys(ctx).length ? ` ${safeStringify(ctx)}` : "";
    write(`${prefix} ${msg}${suffix}\n`);
  }

  return {
    debug: (m, c) => emit("debug", m, c),
    info: (m, c) => emit("info", m, c),
    warn: (m, c) => emit("warn", m, c),
    error: (m, c) => emit("error", m, c),
  };
}

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}
