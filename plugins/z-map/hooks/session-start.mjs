#!/usr/bin/env node
// SessionStart + SubagentStart hook for the z-map plugin.
//
// Reads the in-repo codebase map (if present) and injects its Orientation block
// plus a one-line staleness verdict. SubagentStart matters because subagents
// never see SessionStart context — without it they re-explore from scratch.
// Cheap, silent when no map exists, and never throws in a way that disrupts
// the session.
//
// Staleness is measured against the default branch, not HEAD: worktrees and
// feature branches share one .z/ but sit at different commits, and the map
// describes merged code.
//
// Output contract: a SessionStart/SubagentStart hook may return JSON with
//   hookSpecificOutput.additionalContext  -> appended to the context.
// On any error or when there is nothing to say, it emits a no-op envelope.

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const DEFAULT_STALE_COMMITS = 20;

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

// The ref the map is measured against: meta.base_ref, else origin's default
// branch, else a local main/master, else HEAD.
function resolveBaseRef(root, configured) {
  const candidates = [];
  if (configured) candidates.push(configured);
  try {
    candidates.push(git(root, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]));
  } catch {
    /* no origin/HEAD */
  }
  candidates.push("origin/main", "origin/master", "main", "master");
  for (const ref of candidates) {
    try {
      git(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
      return ref;
    } catch {
      /* try the next candidate */
    }
  }
  return "HEAD";
}

function stalenessVerdict(root, meta) {
  const builtSha = meta.built_against_sha;
  if (!builtSha) {
    return "Map has no recorded build SHA — run `z-map refresh`.";
  }
  const short = builtSha.slice(0, 8);
  const base = resolveBaseRef(root, meta.base_ref);
  const threshold =
    Number(meta.thresholds && meta.thresholds.stale_commits) || DEFAULT_STALE_COMMITS;

  try {
    git(root, ["cat-file", "-e", `${builtSha}^{commit}`]);
  } catch {
    return `Map was built against ${short}, no longer in history (rebased?) — run \`z-map refresh\`.`;
  }
  try {
    git(root, ["merge-base", "--is-ancestor", builtSha, base]);
  } catch {
    return `Map was built from ${short}, which is not on ${base} — run \`z-map refresh\` against ${base}.`;
  }

  let commits;
  try {
    commits = Number(git(root, ["rev-list", "--count", `${builtSha}..${base}`]));
  } catch {
    return "Git unavailable — map staleness unknown.";
  }
  if (commits === 0) return `Map is current with ${base}.`;
  if (commits <= threshold) {
    return `Map is ${commits} commit(s) behind ${base} (within the ${threshold}-commit refresh threshold).`;
  }

  let files = "?";
  try {
    files = String(
      git(root, ["diff", "--name-only", `${builtSha}..${base}`])
        .split("\n")
        .filter(Boolean).length,
    );
  } catch {
    /* ignore */
  }
  return `Map is STALE: ${commits} commits / ${files} files behind ${base} (built @ ${short}). Verify its claims against source, and run \`z-map refresh\` (a \`z-log\` curate pass does this) before relying on it.`;
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

  // --- resolve repo root (fall back to cwd) ---
  let root = cwd;
  try {
    root = git(cwd, ["rev-parse", "--show-toplevel"]);
  } catch {
    /* not a git repo */
  }

  // --- load map state ---
  let meta = null;
  try {
    meta = JSON.parse(readFileSync(join(root, ".z", "map", "meta.json"), "utf8"));
  } catch {
    /* no meta */
  }
  let mapText = null;
  try {
    mapText = readFileSync(join(root, ".z", "map", "map.md"), "utf8");
  } catch {
    /* no map */
  }

  // --- no map: hint once per repo, only at real startup of a main session ---
  if (!meta || mapText === null) {
    if (
      !isSubagent &&
      source === "startup" &&
      process.env.CODEMAP_HINT !== "off" &&
      meta === null &&
      mapText === null
    ) {
      let isRepo = false;
      try {
        isRepo = git(cwd, ["rev-parse", "--is-inside-work-tree"]) === "true";
      } catch {
        /* not a repo */
      }
      if (isRepo) {
        // Hint at most once per repo: a marker in the git dir records that we
        // already nudged here, so opening the repo daily doesn't nag.
        const marker = gitDirMarker(cwd, "codemap-hint-shown");
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
          "No codebase map found in this repo. Run the `z-map` skill (`generate`) to create an onboarding map at .z/map/map.md that this hook keeps flagging for staleness and the skill refreshes on demand. Set CODEMAP_HINT=off to silence this.",
        );
        return;
      }
    }
    emit(event, null);
    return;
  }

  // --- orientation block ---
  const m = mapText.match(
    /<!--\s*orientation\s*-->([\s\S]*?)<!--\s*\/orientation\s*-->/i,
  );
  const orientation = m
    ? m[1].trim()
    : "(orientation markers not found in .z/map/map.md — read the file directly)";

  let staleness;
  try {
    staleness = stalenessVerdict(root, meta);
  } catch {
    staleness = "Map staleness unknown.";
  }

  const ctx = [
    isSubagent
      ? "## Codebase map (auto-injected by z-map for this subagent)"
      : "## Codebase map (auto-injected by z-map)",
    "",
    orientation,
    "",
    `> ${staleness} Full map: .z/map/map.md — read its key-files index, external contracts and conventions before grepping the whole tree.`,
  ].join("\n");

  emit(event, ctx);
}

try {
  main();
} catch {
  emit(undefined, null);
}
