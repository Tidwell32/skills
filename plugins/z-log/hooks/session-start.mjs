#!/usr/bin/env node
// SessionStart hook for the z-log plugin.
//
// Injects the bounded .z/log/log.md digest plus a "last updated / commits since"
// nudge into the new session. Cheap, silent when there is no worklog, and never
// throws in a way that disrupts the session.
//
// Output contract: a SessionStart hook may return JSON with
//   hookSpecificOutput.additionalContext  -> appended to the session context.

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

function emit(additionalContext) {
  const out = { continue: true, suppressOutput: true };
  if (additionalContext) {
    out.hookSpecificOutput = {
      hookEventName: "SessionStart",
      additionalContext,
    };
  }
  process.stdout.write(JSON.stringify(out));
}

function git(cwd, args) {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

// Path to a marker file inside this repo's git dir (handles worktrees/submodules).
// Returns null if it can't be resolved (caller degrades to hinting again).
function gitDirMarker(cwd, name) {
  try {
    return resolve(cwd, git(cwd, ["rev-parse", "--git-path", name]));
  } catch {
    return null;
  }
}

function main() {
  // --- hook input (best effort) ---
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    /* no stdin / not JSON */
  }
  const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const source = input.source || "startup";

  // --- resolve repo root ---
  let root = cwd;
  try {
    root = git(cwd, ["rev-parse", "--show-toplevel"]);
  } catch {
    /* not a git repo */
  }

  // --- load state ---
  let meta = null;
  try {
    meta = JSON.parse(readFileSync(join(root, ".z", "log", "meta.json"), "utf8"));
  } catch {
    /* no meta */
  }
  let text = null;
  try {
    text = readFileSync(join(root, ".z", "log", "log.md"), "utf8");
  } catch {
    /* no worklog */
  }

  // --- no worklog: hint once per repo, only at real startup inside a git repo ---
  if (text === null) {
    if (source === "startup" && process.env.WORKLOG_HINT !== "off") {
      let isRepo = false;
      try {
        isRepo = git(cwd, ["rev-parse", "--is-inside-work-tree"]) === "true";
      } catch {
        /* not a repo */
      }
      if (isRepo) {
        // Hint at most once per repo: a marker in the git dir records that we
        // already nudged here, so opening the repo daily doesn't nag.
        const marker = gitDirMarker(cwd, "worklog-hint-shown");
        if (marker && existsSync(marker)) {
          emit(null);
          return;
        }
        if (marker) {
          try {
            writeFileSync(marker, `${new Date().toISOString()}\n`);
          } catch {
            /* best effort — if we can't record it, we'll hint again next time */
          }
        }
        emit(
          "No worklog found in this repo. Use the `z-log` skill to start one (in-repo decisions, gotchas, and open threads). Set WORKLOG_HINT=off to silence this.",
        );
        return;
      }
    }
    emit(null);
    return;
  }

  // --- digest block ---
  const m = text.match(/<!--\s*worklog\s*-->([\s\S]*?)<!--\s*\/worklog\s*-->/i);
  const digest = m
    ? m[1].trim()
    : "(worklog markers not found in .z/log/log.md — read the file directly)";

  // --- freshness nudge ---
  const parts = [];
  const when = meta && meta.last_updated;
  const sha = meta && meta.last_updated_sha;
  if (when) parts.push(`last updated ${String(when).slice(0, 10)}`);
  if (sha) {
    try {
      const head = git(root, ["rev-parse", "HEAD"]);
      if (head === sha) {
        parts.push("current with HEAD");
      } else {
        let known = true;
        try {
          git(root, ["cat-file", "-e", `${sha}^{commit}`]);
        } catch {
          known = false;
        }
        if (known) {
          let n = "?";
          try {
            n = git(root, ["rev-list", "--count", `${sha}..HEAD`]);
          } catch {
            /* ignore */
          }
          parts.push(`${n} commit(s) since`);
        }
      }
    } catch {
      /* git unavailable */
    }
  }
  const nudge = parts.length ? ` (${parts.join(", ")})` : "";

  const ctx = [
    "## Worklog (auto-injected by z-log)",
    "",
    digest,
    "",
    `> Worklog${nudge}. Add decisions / gotchas / open threads with the \`z-log\` skill; full history in .z/log/archive.md.`,
  ].join("\n");

  emit(ctx);
}

try {
  main();
} catch {
  emit(null);
}
