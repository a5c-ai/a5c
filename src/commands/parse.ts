import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

export interface ParseOptions {
  type?: string;
}

export type CodexEvent = {
  type:
    | "user_instructions_event"
    | "tokens_used"
    | "thinking"
    | "codex"
    | "exec"
    | "exec_result"
    | "banner";
  timestamp: string;
  raw: string;
  // Optional fields depending on type
  fields?: Record<string, unknown>;
};

// Streaming, line-by-line parser for Codex stdout format
export class CodexStdoutParser {
  private currentTimestamp: string | null = null;
  private currentType:
    | "user_instructions_event"
    | "thinking"
    | "codex"
    | "exec"
    | "exec_result"
    | "banner"
    | null = null;
  private bufferLines: string[] = [];
  private currentExecMeta: {
    command?: string;
    cwd?: string;
    status?: string;
    durationMs?: number;
    exitCode?: number;
  } | null = null;

  // Regexes
  private readonly tsRe = /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\]/;
  private readonly headerUserInstructions = /^User instructions:\s*$/;
  private readonly headerThinking = /^thinking\s*$/;
  private readonly headerCodex = /^codex\s*$/;
  private readonly headerExec = /^exec\s+(.+?)\s+in\s+(.+)\s*$/;
  private readonly headerTokensUsed = /^tokens used:\s*(\d+)\s*$/i;
  private readonly bannerFirst = /^OpenAI Codex\s+(v?.+)$/;
  private readonly bannerRule = /^-+$/;
  private readonly kvLine = /^([^:]+):\s*(.*)$/;
  private readonly successLine = /^(.+?)\s+succeeded\s+in\s+(\d+)ms:$/;
  private readonly exitLine = /^(.+?)\s+exited\s+(\d+)\s+in\s+([0-9.]+)s:$/;

  parseLine(line: string): CodexEvent[] {
    const events: CodexEvent[] = [];

    // New timestamp header starts a new event chunk
    const tsMatch = this.tsRe.exec(line);
    if (tsMatch) {
      this.flushIfAny(events);
      this.currentTimestamp = tsMatch[1];
      // After timestamp, the next non-empty line defines the subtype
      this.currentType = null;
      this.bufferLines = [];
      // Process remainder of the line after the timestamp if present
      const rest = line.slice(tsMatch[0].length).trimStart();
      if (rest.length > 0) {
        this.processWithinTimestamp(rest, events);
      }
      return events;
    }

    // If we don't have a timestamp yet, ignore preamble
    if (!this.currentTimestamp) return events;

    this.processWithinTimestamp(line, events);
    return events;
  }

  private processWithinTimestamp(line: string, events: CodexEvent[]): void {
    // Determine subtype if not set
    if (!this.currentType) {
      // Exec result header can appear as its own timestamped line
      const succ = this.successLine.exec(line);
      if (succ) {
        this.currentType = "exec_result";
        this.bufferLines = [line];
        this.currentExecMeta = {
          ...(this.currentExecMeta || {}),
          command: succ[1],
          status: "succeeded",
          durationMs: Number(succ[2]),
        };
        return;
      }
      const ex = this.exitLine.exec(line);
      if (ex) {
        this.currentType = "exec_result";
        this.bufferLines = [line];
        const seconds = Number(ex[3]);
        const durationMs = Number.isFinite(seconds)
          ? Math.round(seconds * 1000)
          : undefined;
        this.currentExecMeta = {
          ...(this.currentExecMeta || {}),
          command: ex[1],
          status: "exited",
          exitCode: Number(ex[2]),
          durationMs,
        };
        return;
      }
      // Tokens used is a single-line event with value
      const tokenM = this.headerTokensUsed.exec(line);
      if (tokenM) {
        events.push({
          type: "tokens_used",
          timestamp: this.currentTimestamp || "",
          raw: line,
          fields: { tokens: Number(tokenM[1]) },
        });
        return;
      }
      if (this.headerUserInstructions.test(line)) {
        this.currentType = "user_instructions_event";
        this.bufferLines = [line];
        return;
      }
      if (this.headerThinking.test(line)) {
        this.currentType = "thinking";
        this.bufferLines = [line];
        return;
      }
      if (this.headerCodex.test(line)) {
        this.currentType = "codex";
        this.bufferLines = [line];
        return;
      }
      // exec header
      const execM = this.headerExec.exec(line);
      if (execM) {
        this.currentType = "exec";
        this.bufferLines = [line];
        this.currentExecMeta = { command: execM[1], cwd: execM[2] };
        // Emit exec header immediately with parsed command and path
        events.push({
          type: "exec",
          timestamp: this.currentTimestamp || "",
          raw: line,
          fields: { command: execM[1], cwd: execM[2] },
        });
        return;
      }
      // Banner start: first line with version
      const bannerM = this.bannerFirst.exec(line);
      if (bannerM) {
        this.currentType = "banner";
        this.bufferLines = [line];
        return;
      }
      // Anything else: treat as body of previous header; but without type, we ignore
      return;
    }

    // We have an active type; accumulate until we detect the next timestamp in caller
    this.bufferLines.push(line);

    // Special handling for exec result: it has a structured closing line
    if (this.currentType === "exec_result") {
      // exec_result body can be multiline; no explicit terminator other than next timestamp
      return;
    }

    if (this.currentType === "exec") {
      // After an exec header, we expect an outcome line like: "<cmd> succeeded in Nms:" then body lines
      const m = this.successLine.exec(line);
      if (m) {
        // Switch to exec_result and store metadata; include this line in buffer
        this.currentType = "exec_result";
        this.bufferLines = [line];
        this.currentExecMeta = {
          ...(this.currentExecMeta || {}),
          command: this.currentExecMeta?.command || m[1],
          status: "succeeded",
          durationMs: Number(m[2]),
        };
        return;
      }
      const e = this.exitLine.exec(line);
      if (e) {
        this.currentType = "exec_result";
        this.bufferLines = [line];
        const seconds = Number(e[3]);
        const durationMs = Number.isFinite(seconds) ? Math.round(seconds * 1000) : undefined;
        this.currentExecMeta = {
          ...(this.currentExecMeta || {}),
          command: this.currentExecMeta?.command || e[1],
          status: "exited",
          exitCode: Number(e[2]),
          durationMs,
        };
        return;
      }
      return;
    }

    if (this.currentType === "banner") {
      // Banner ends on a line with only dashes after we've seen at least one section of keys and a closing dashes
      // We parse banner once we see the trailing dashed rule (second dashed line)
      if (this.bannerRule.test(line)) {
        // When we got here, bufferLines includes the first line (version) and possibly a dashed line
        // If we now have two dashed separators, we can emit
        const dashedIdxs = this.bufferLines
          .map((l, i) => (this.bannerRule.test(l) ? i : -1))
          .filter((i) => i >= 0);
        if (dashedIdxs.length >= 2) {
          const fields: Record<string, unknown> = {};
          // Extract key: val pairs between the dashed lines
          const start = dashedIdxs[0] + 1;
          const end = dashedIdxs[1];
          for (let i = start; i < end; i++) {
            const kv = this.kvLine.exec(this.bufferLines[i]);
            if (kv) fields[kv[1].trim()] = kv[2].trim();
          }
          const versionMatch = this.bannerFirst.exec(this.bufferLines[0]);
          if (versionMatch) fields["version"] = versionMatch[1].trim();
          const raw = this.bufferLines.join("\n");
          events.push({
            type: "banner",
            timestamp: this.currentTimestamp || "",
            raw,
            fields,
          });
          // Reset to await next timestamp
          this.currentType = null;
          this.bufferLines = [];
        }
      }
      return;
    }

    // For user_instructions_event, thinking, codex: no internal terminator; they end on next timestamp (handled by flush)
    return;
  }

  flushIfAny(out: CodexEvent[]): void {
    if (!this.currentTimestamp || !this.currentType) {
      this.currentTimestamp = null;
      this.currentType = null;
      this.bufferLines = [];
      this.currentExecMeta = null;
      return;
    }
    // Avoid duplicating the exec header event: it's emitted immediately on detection
    if (this.currentType !== "exec") {
      const raw = this.bufferLines.join("\n");
      const baseFields =
        this.currentType === "exec_result"
          ? { ...(this.currentExecMeta || {}) }
          : undefined;
      const evt: CodexEvent = {
        type: this.currentType,
        timestamp: this.currentTimestamp,
        raw,
        fields: baseFields,
      };
      out.push(evt);
    }
    this.currentTimestamp = null;
    this.currentType = null;
    this.bufferLines = [];
    this.currentExecMeta = null;
  }
}

export async function handleParse(
  opts: ParseOptions,
): Promise<{ code: number; errorMessage?: string }> {
  if ((opts.type || "").toLowerCase() !== "codex") {
    return { code: 2, errorMessage: "parse: unsupported --type (expected 'codex')" };
  }

  const parser = new CodexStdoutParser();
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const events = parser.parseLine(line);
    for (const evt of events) output.write(JSON.stringify(evt) + "\n");
  });
  return await new Promise((resolve) => {
    rl.on("close", () => {
      const tail: CodexEvent[] = [];
      parser.flushIfAny(tail);
      for (const evt of tail) output.write(JSON.stringify(evt) + "\n");
      resolve({ code: 0 });
    });
  });
}
