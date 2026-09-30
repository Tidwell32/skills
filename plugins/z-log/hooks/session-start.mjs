#!/usr/bin/env node
// SessionStart + SubagentStart hook for the z-log plugin.
//
// SessionStart: injects the bounded .z/log/log.md digest, when it was last
// updated, and a warning when the digest is over its line budget — nothing else
// enforces the budget, and an injected digest that keeps growing defeats itself.
// SubagentStart: injects only the Gotchas section. Subagents never see
// SessionStart context, and open threads/decisions are noise for a scoped task.
// Cheap, silent when there is no worklog, and never throws in a way that
// disrupts the session.
//
// Output contract: a SessionStart/SubagentStart hook may return JSON with
//   hookSpecificOutput.additionalContext  -> appended to the context.

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const DEFAULT_BUDGET_LINES = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function emit(event, additionalContext) {
  const out = { continue: true, suppressOutput: true };
  if (additionalContext) {
    out.hookSpecificOutput = {
      hookEventName: event,
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

// Body of the digest's `## …` section whose heading matches `pattern`, or null.
function digestSection(digest, pattern) {
  const lines = digest.split("\n");
  const start = lines.findIndex((l) => /^##\s/.test(l) && pattern.test(l));
  if (start === -1) return null;
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end === -1) end = lines.length;
  const body = lines.slice(start + 1, end).join("\n").trim();
  return body || null;
}

function freshness(meta) {
  const when = meta && meta.last_updated;
  if (!when) return "";
  const day = String(when).slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const age = Math.round((Date.parse(today) - Date.parse(day)) / DAY_MS);
  if (Number.isNaN(age)) return ` (last updated ${day})`;
  if (age <= 0) return ` (last updated ${day}, today)`;
  return ` (last updated ${day}, ${age} day(s) ago)`;
}

function main() {
  // --- hook input (best effort) ---
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    /* no stdin / not JSON */
  }
  const event = input.hook_event_name || "SessionStart";
  const isSubagent = event === "SubagentStart";
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

  // --- no worklog: hint once per repo, only at real startup of a main session ---
  if (text === null) {
    if (!isSubagent && source === "startup" && process.env.WORKLOG_HINT !== "off") {
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
          emit(event, null);
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
          event,
          "No worklog found in this repo. Use the `z-log` skill to start one (in-repo decisions, gotchas, and open threads). Set WORKLOG_HINT=off to silence this.",
        );
        return;
      }
    }
    emit(event, null);
    return;
  }

  // --- digest block ---
  const m = text.match(/<!--\s*worklog\s*-->([\s\S]*?)<!--\s*\/worklog\s*-->/i);
  const digest = m ? m[1].trim() : null;

  // --- subagent: gotchas only ---
  if (isSubagent) {
    const gotchas = digest && digestSection(digest, /gotcha/i);
    if (!gotchas) {
      emit(event, null);
      return;
    }
    emit(
      event,
      [
        "## Worklog gotchas (auto-injected by z-log for this subagent)",
        "",
        gotchas,
        "",
        "> Full worklog: .z/log/log.md.",
      ].join("\n"),
    );
    return;
  }

  // --- main session: whole digest + freshness + budget check ---
  const out = [
    "## Worklog (auto-injected by z-log)",
    "",
    digest ?? "(worklog markers not found in .z/log/log.md — read the file directly)",
    "",
    `> Worklog${freshness(meta)}. Add decisions / gotchas / open threads with the \`z-log\` skill; full history in .z/log/archive.md.`,
  ];
  if (digest) {
    const budget = Number(meta && meta.digest_budget_lines) || DEFAULT_BUDGET_LINES;
    const used = digest.split("\n").length;
    if (used > budget) {
      out.push(
        `> ⚠️ Digest is ${used}/${budget} lines — over budget. Run a \`z-log\` curate pass before adding entries; don't raise the budget to fit.`,
      );
    }
  }

  emit(event, out.join("\n"));
}

try {
  main();
} catch {
  emit(undefined, null);
}
