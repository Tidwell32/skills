#!/usr/bin/env node
// SessionStart hook for the z-map plugin.
//
// Reads the in-repo codebase map (if present) and injects its Orientation block
// plus a one-line staleness verdict into the new session's context. It is cheap,
// silent when no map exists, and never throws in a way that disrupts the session.
//
// Output contract: a SessionStart hook may return JSON with
//   hookSpecificOutput.additionalContext  -> appended to the session context.
// On any error or when there is nothing to say, it emits a no-op envelope.

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

  // --- no map: hint once per repo, only at real startup inside a git repo ---
  if (!meta || mapText === null) {
    if (
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
          "No codebase map found in this repo. Run the `z-map` skill (`generate`) to create an onboarding map at .z/map/map.md that this hook keeps flagging for staleness and the skill refreshes on demand. Set CODEMAP_HINT=off to silence this.",
        );
        return;
      }
    }
    emit(null);
    return;
  }

  // --- orientation block ---
  const m = mapText.match(
    /<!--\s*orientation\s*-->([\s\S]*?)<!--\s*\/orientation\s*-->/i,
  );
  const orientation = m
    ? m[1].trim()
    : "(orientation markers not found in .z/map/map.md — read the file directly)";

  // --- staleness verdict ---
  let staleness;
  const builtSha = meta.built_against_sha;
  if (!builtSha) {
    staleness = "Map has no recorded build SHA — run `z-map refresh`.";
  } else {
    try {
      const head = git(root, ["rev-parse", "HEAD"]);
      if (head === builtSha) {
        staleness = "Map is up to date with HEAD.";
      } else {
        let known = true;
        try {
          git(root, ["cat-file", "-e", `${builtSha}^{commit}`]);
        } catch {
          known = false;
        }
        if (!known) {
          staleness = `Map was built against ${builtSha.slice(0, 8)}, no longer in history (rebased?) — run \`z-map refresh\`.`;
        } else {
          let commits = "?";
          let files = "?";
          try {
            commits = git(root, ["rev-list", "--count", `${builtSha}..HEAD`]);
          } catch {
            /* ignore */
          }
          try {
            files = String(
              git(root, ["diff", "--name-only", `${builtSha}..HEAD`])
                .split("\n")
                .filter(Boolean).length,
            );
          } catch {
            /* ignore */
          }
          staleness = `Map is ${commits} commit(s) / ${files} file(s) behind HEAD (built @ ${builtSha.slice(0, 8)}) — run \`z-map refresh\`.`;
        }
      }
    } catch {
      staleness = "Git unavailable — map staleness unknown.";
    }
  }

  const ctx = [
    "## Codebase map (auto-injected by z-map)",
    "",
    orientation,
    "",
    `> ${staleness} Full map: .z/map/map.md — read it for the module tree, diagrams, and key-files index before grepping the whole tree.`,
  ].join("\n");

  emit(ctx);
}

try {
  main();
} catch {
  emit(null);
}
