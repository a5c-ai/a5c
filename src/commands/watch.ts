import { spawn } from "node:child_process";
import path from "node:path";

export interface WatchOptions {
  intervalSeconds: number;
  branch?: string;
  command: string[];
}

type TrackingInfo = {
  localBranch?: string;
  remote?: string;
  remoteBranch?: string;
  hasUpstream: boolean;
};

const SIGNAL_EXIT_CODES: Partial<Record<NodeJS.Signals, number>> = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15,
  SIGBREAK: 21,
  SIGUSR1: 10,
  SIGUSR2: 12,
  SIGQUIT: 3,
  SIGTRAP: 5,
  SIGABRT: 6,
  SIGBUS: 7,
  SIGFPE: 8,
  SIGILL: 4,
  SIGIOT: 6,
  SIGKILL: 9,
  SIGPIPE: 13,
  SIGSEGV: 11,
  SIGSYS: 12,
  SIGTSTP: 18,
  SIGXCPU: 24,
  SIGXFSZ: 25,
};

export async function handleWatch(
  opts: WatchOptions,
): Promise<{ code: number; errorMessage?: string }> {
  try {
    const intervalSeconds = Number.isFinite(opts.intervalSeconds)
      ? Math.max(1, Math.floor(opts.intervalSeconds))
      : 60;
    const command = Array.isArray(opts.command) ? opts.command.filter(Boolean) : [];
    if (!command.length) {
      return {
        code: 2,
        errorMessage: "watch: missing command to execute (provide args after '--')",
      };
    }

    if (!(await ensureGitRepository())) {
      return { code: 2, errorMessage: "watch: current directory is not a git repository" };
    }

    if (opts.branch) {
      await checkoutBranch(opts.branch);
    }

    const tracking = await resolveTrackingInfo();

    let stopRequested = false;
    const requestStop = () => {
      stopRequested = true;
    };

    const watcherPromise = runWatcherLoop(intervalSeconds, tracking, () => stopRequested);

    let exitCode = 0;
    try {
      exitCode = await runMainCommand(command, requestStop);
    } catch (err: any) {
      requestStop();
      await watcherPromise;
      return { code: 1, errorMessage: `watch: ${err?.message || err}` };
    }

    requestStop();
    await watcherPromise;
    return { code: exitCode };
  } catch (e: any) {
    return { code: 1, errorMessage: `watch: ${String(e?.message || e)}` };
  }
}

async function ensureGitRepository(): Promise<boolean> {
  try {
    const result = await runGit(["rev-parse", "--is-inside-work-tree"], {
      capture: true,
      allowFailure: true,
    });
    return result.code === 0 && result.stdout.trim() === "true";
  } catch {
    return false;
  }
}

async function checkoutBranch(branchSpec: string): Promise<void> {
  const trimmed = branchSpec.trim();
  if (!trimmed) return;

  await runGit(["fetch", "--all"], { label: "git fetch --all" });

  const directCheckout = await runGit(["checkout", trimmed], {
    allowFailure: true,
    label: `git checkout ${trimmed}`,
  });
  if (directCheckout.code === 0) return;

  if (trimmed.includes("/")) {
    const [remote, ...rest] = trimmed.split("/");
    const branch = rest.join("/");
    if (remote && branch) {
      await runGit(["fetch", remote, branch], { label: `git fetch ${remote} ${branch}` });
      const create = await runGit(["checkout", "-B", branch, `${remote}/${branch}`], {
        allowFailure: true,
        label: `git checkout -B ${branch} ${remote}/${branch}`,
      });
      if (create.code === 0) return;
    }
  }

  throw new Error(`unable to checkout branch '${trimmed}'`);
}

async function resolveTrackingInfo(): Promise<TrackingInfo> {
  const tracking: TrackingInfo = { hasUpstream: false };

  const currentBranch = await runGit(["rev-parse", "--abbrev-ref", "HEAD"], {
    capture: true,
    label: "git rev-parse --abbrev-ref HEAD",
  });
  const branchName = currentBranch.stdout.trim();
  tracking.localBranch = branchName !== "HEAD" ? branchName : undefined;

  if (tracking.localBranch) {
    const remote = await runGit(
      ["config", "--get", `branch.${tracking.localBranch}.remote`],
      { capture: true, allowFailure: true },
    );
    if (remote.code === 0) {
      tracking.remote = remote.stdout.trim();
    }

    const merge = await runGit(
      ["config", "--get", `branch.${tracking.localBranch}.merge`],
      { capture: true, allowFailure: true },
    );
    if (merge.code === 0) {
      const ref = merge.stdout.trim();
      tracking.remoteBranch = ref.replace(/^refs\/(heads|remotes)\//, "");
    }
  }

  const upstream = await runGit(["rev-parse", "--abbrev-ref", "@{u}"], {
    capture: true,
    allowFailure: true,
  });
  tracking.hasUpstream = upstream.code === 0 && upstream.stdout.trim().length > 0;

  return tracking;
}

async function runWatcherLoop(
  intervalSeconds: number,
  tracking: TrackingInfo,
  shouldStop: () => boolean,
): Promise<void> {
  const intervalMs = intervalSeconds * 1000;
  while (!shouldStop()) {
    try {
      await performPoll(tracking);
    } catch (err: any) {
      process.stderr.write(`[watch] ${new Date().toISOString()} ${err?.message || err}\n`);
    }

    const step = 500;
    let remaining = intervalMs;
    while (remaining > 0 && !shouldStop()) {
      await delay(Math.min(step, remaining));
      remaining -= step;
    }
  }
}

async function performPoll(tracking: TrackingInfo): Promise<void> {
  const fetchArgs = ["fetch"];
  if (tracking.remote) fetchArgs.push(tracking.remote);
  const fetchResult = await runGit(fetchArgs, { allowFailure: true, label: fetchArgs.join(" ") });
  if (fetchResult.code !== 0) {
    throw new Error(`git fetch failed with code ${fetchResult.code}`);
  }

  if (!tracking.hasUpstream) {
    return;
  }

  const pullArgs = ["pull", "--ff-only"];
  if (tracking.remote) pullArgs.push(tracking.remote);
  if (tracking.remote && tracking.remoteBranch) pullArgs.push(tracking.remoteBranch);
  const pullResult = await runGit(pullArgs, { allowFailure: true, label: pullArgs.join(" ") });
  if (pullResult.code !== 0) {
    throw new Error(`git pull failed with code ${pullResult.code}`);
  }
}

async function runMainCommand(command: string[], onSignal: () => void): Promise<number> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      stdio: "inherit",
      env: process.env,
      shell: false,
    });

    let settled = false;

    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];
    const signalHandler = (signal: NodeJS.Signals) => {
      onSignal();
      child.kill(signal);
    };
    signals.forEach((sig) => process.on(sig, signalHandler));

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      signals.forEach((sig) => process.off(sig, signalHandler));
      reject(err);
    });

    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      signals.forEach((sig) => process.off(sig, signalHandler));
      onSignal();
      if (signal) {
        const exit = SIGNAL_EXIT_CODES[signal] ?? 128;
        resolve(128 + exit);
      } else {
        resolve(code ?? 0);
      }
    });
  });
}

async function runGit(
  args: string[],
  options: {
    capture?: boolean;
    allowFailure?: boolean;
    label?: string;
  } = {},
): Promise<{ code: number; stdout: string }> {
  const capture = options.capture === true;
  return await new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child = spawn("git", args, {
      stdio: capture ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
      cwd: process.cwd(),
    });

    if (capture) {
      const out = child.stdout;
      const err = child.stderr;
      if (out) {
        out.on("data", (chunk) => {
          stdout += chunk.toString();
        });
      }
      if (err) {
        err.on("data", (chunk) => {
          stderr += chunk.toString();
        });
      }
    }

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      const exitCode = code ?? 0;
      if (exitCode === 0 || options.allowFailure) {
        resolve({ code: exitCode, stdout });
      } else {
        const label = options.label || `git ${args.join(" ")}`;
        const message = capture && stderr.trim().length
          ? stderr.trim()
          : `${label} exited with code ${exitCode}`;
        reject(new Error(message));
      }
    });
  });
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}


