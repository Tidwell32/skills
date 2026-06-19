# z-skills

Zack's personal collection of custom skills for Claude, distributed as a Claude Code plugin marketplace.

## Skills

- **z-learn** — turns coding sessions into guided learning. Builds, refactors, and debugs incrementally, narrating both _what the code does_ and the _thought process_ behind it, pausing at real decision points, and calibrated to what you already know.
- **z-build** — a streamlined `explore → plan → implement → test → review` loop, built to do what gsd/superpowers do for a coding task without their subagent pipelines and on-disk artifacts. Leans on Opus's native planning and in-context execution. Keeps the disciplines an LLM skips — explore before committing (with a live **visual companion** for mockups/comparisons), align before coding, test-first for risky code, systematic debugging, fresh-eyes review — and leaves the commit to you.
- **z-map** — maintains a compact, in-repo, version-controlled map of a codebase (orientation, module tree, Mermaid diagrams, key-files index, conventions) so a cold session gets oriented in seconds and jumps to the right `file:line` instead of re-reading the tree. A SessionStart hook injects the orientation and flags staleness; the skill generates the map and refreshes it incrementally as the code changes.
- **z-log** — a lean, in-repo episodic memory: a curated log of _decisions, gotchas, and open threads_ so the next session recalls the _why_, not just the what. Model-authored on demand (no noisy per-tool capture); a SessionStart hook injects the bounded digest and nudges when work has happened since the last entry.
- **z-commit** — turns a finished working tree into clean, atomic, reviewable commits. Surveys the diff, proposes commit groupings and messages, flags anything that shouldn't ship, and hands you ready-to-run commands. Never stages or commits for you — the commit is always yours.
- **z-upgrade** — a disciplined dependency/framework/runtime upgrade. Reads the migration notes first, inventories usage, upgrades one layer at a time, verifies _runtime behavior_ (not just compilation), and records deferred deprecations. Never blindly bumps versions.

## Install

Inside Claude Code, add this marketplace once, then install the skills you want:

```
/plugin marketplace add Tidwell32/skills
/plugin install z-learn@z-skills
/plugin install z-build@z-skills
/plugin install z-map@z-skills
/plugin install z-log@z-skills
/plugin install z-commit@z-skills
/plugin install z-upgrade@z-skills
```

Updates are handled by Claude Code — re-run `/plugin marketplace update z-skills` to pull the latest.

## Repo layout

```
skills/                                     repo root = the marketplace
├── .claude-plugin/marketplace.json         lists the plugins below
└── plugins/
    ├── z-learn/                   one plugin
    │   ├── .claude-plugin/plugin.json
    │   └── skills/
    │       └── z-learn/           the skill itself
    │           ├── SKILL.md                 entry point: core loop, calibration, controls
    │           ├── building.md              building from scratch
    │           ├── refactoring.md           changing existing code safely
    │           └── debugging.md             debugging as a methodology
    ├── z-build/                          explore→plan→implement→test→review loop
    │   ├── .claude-plugin/plugin.json
    │   └── skills/
    │       ├── z-build/SKILL.md          orchestrator: the 5-beat loop
    │       ├── z-explore/                ideation + visual companion (conditional)
    │       │   ├── SKILL.md                 surface options, agree a direction
    │       │   ├── visual-companion.md      how to drive the preview server
    │       │   └── server.js                zero-dep live-reload preview server
    │       ├── z-plan/SKILL.md           align on approach + ephemeral plan
    │       ├── z-tdd/SKILL.md            test-first for risky code / bug fixes
    │       ├── z-debug/SKILL.md          systematic debugging (conditional)
    │       └── z-review/
    │           ├── SKILL.md                 dispatch fresh-eyes review + triage
    │           └── reviewer-prompt.md       template handed to the review subagent
    ├── z-map/                        in-repo, version-controlled codebase map
    │   ├── .claude-plugin/plugin.json
    │   ├── hooks/session-start.mjs          injects orientation + staleness at session start
    │   └── skills/
    │       └── z-map/
    │           ├── SKILL.md                 status → generate / refresh loop
    │           ├── generating.md            first build via parallel fan-out
    │           └── refreshing.md            incremental update proportional to the diff
    ├── z-log/                             in-repo episodic memory: decisions/gotchas/threads
    │   ├── .claude-plugin/plugin.json
    │   ├── hooks/session-start.mjs          injects the bounded digest + freshness nudge
    │   └── skills/
    │       └── z-log/
    │           ├── SKILL.md                 when/what to capture; the loop
    │           ├── capturing.md             writing a tight, dated entry
    │           └── curating.md              keeping the injected digest bounded
    ├── z-commit/                         working tree → clean atomic commits (you commit)
    │   ├── .claude-plugin/plugin.json
    │   └── skills/
    │       └── z-commit/SKILL.md         survey → group → propose → hand off
    └── z-upgrade/                         disciplined dependency / framework upgrades
        ├── .claude-plugin/plugin.json
        └── skills/
            └── z-upgrade/SKILL.md         notes → inventory → one layer → verify
```

## Adding a new skill

1. Create `plugins/<plugin-name>/.claude-plugin/plugin.json`.
2. Put the skill at `plugins/<plugin-name>/skills/<skill-name>/SKILL.md` (+ any supporting files).
3. Add an entry to `.claude-plugin/marketplace.json` pointing at `./plugins/<plugin-name>`.

### Conventions

- **Name with the `z-` prefix** (`z-build`, `z-map`, …) so everything installs as `z-<thing>@z-skills`.
- **Persistent in-repo state goes under `.z/<skill>/`** — one folder per skill, so every z-skill's artifacts live together and the repo root stays clean. Keep the human-readable doc and the machine state as siblings there. Today: `z-map` → `.z/map/` (`map.md` + `meta.json`); `z-log` → `.z/log/` (`log.md` + `meta.json` + `archive.md`). A new stateful skill just claims its own `.z/<skill>/`.
- **Inject that state with a SessionStart hook** in `plugins/<plugin>/hooks/` (see `z-map`/`z-log`). Reference scripts via `${CLAUDE_PLUGIN_ROOT}` so a plugin rename stays safe.
