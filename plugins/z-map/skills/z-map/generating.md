# Generating the map (first build)

Goal: produce `.z/map/map.md` + `.z/map/meta.json` that let a cold session orient in seconds and navigate to the right `file:line`. **Map, not mirror** — every step optimizes for a small, high-signal artifact.

## Step 1 — Survey, cheaply

Get the shape of the repo without reading file bodies:

- `git ls-files | sed 's:/.*::' | sort | uniq -c | sort -rn` — top-level layout + weight
- Identify stack & entry points from manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, `*.csproj`, etc.) and run/test scripts.
- Note the build/test/run commands and the main executable/server entry.
- Pick the **major areas** to map — usually top-level source dirs or logical modules. Aim for a handful, not dozens.

"Don't read every file" means don't bulk-read the whole tree — not "never open a file." Reading manifests, the README, and entry-point files here is expected; the deep reads happen in Step 2 (or, for a small repo, directly) and stay scoped to what you summarize.

**Ground-truth from the code, not the docs.** Derive structure from `git ls-files`, manifests, and source — never trust an existing README or ARCHITECTURE doc that may be stale. If documented structure conflicts with reality, follow reality and note the discrepancy in the Conventions section.

## Step 2 — Fan out compact summaries

Dispatch parallel sub-agents (Explore / general-purpose), **one per major area**. Give each a strict contract:

> Map `<area>`. Return ONLY (no file contents, ≤ ~25 lines):
> - One-line purpose of the area.
> - Public surface / entry points (exported APIs, routes, CLI commands, main functions) with `file:line`.
> - Key internal files and what each owns, one line each, with `file:line`.
> - Inbound/outbound dependencies on other areas (names only).
> - Any non-obvious invariant, gotcha, or convention.

The point of delegation is to keep raw bytes out of *your* context — collect summaries, not dumps. For a small repo you may skip fan-out and survey directly: read the manifests, entry points, and the files you're summarizing, but still emit summaries and `file:line` pointers, not transcriptions.

## Step 3 — Aggregate into `.z/map/map.md`

Assemble the five sections in order:

1. **Orientation** — a `## Orientation` section whose body is wrapped in `<!--orientation-->` … `<!--/orientation-->`. The markers let the hook inject exactly this block every session; the `##` heading lets `section_index` key it like every other section (keep the markers inside the section). What the project is, the stack, the entry points, how to run and test. **Include only the fields that apply** — a library, content, or config repo may have no run/server/build command, so drop those fields rather than inventing them (use "Entry points" for its main modules, package, or manifest). Make it dense and ≤ ~40 lines:
   ```markdown
   ## Orientation
   <!--orientation-->
   **What:** <one-paragraph elevator pitch>
   **Stack:** <languages / frameworks / runtime>
   **Entry points:** `path/to/main` (cli), `path/to/server` (http) …
   **Run:** `<command>`  ·  **Test:** `<command>`  ·  **Build:** `<command>`
   <!--/orientation-->
   ```
2. **Territory** — annotated tree of meaningful dirs/modules, one line of purpose each. Omit noise (node_modules, build output, vendored deps).
3. **Diagrams** — inline Mermaid. At minimum a module-dependency graph; add the 1–3 most important flows (request lifecycle, data pipeline, build/deploy). **Every node labeled with a `file:path`** so it's navigable:
   ```mermaid
   graph TD
     cli["cli — src/cli/main.ts"] --> core["core — src/core/engine.ts"]
     core --> store["store — src/store/db.ts"]
   ```
4. **Key-files index** — a table of the ~20–40 files that matter most. This is the jump-table the next session navigates from:
   | File | Owns / responsibility |
   |------|-----------------------|
   | `src/core/engine.ts:1` | orchestrates the run loop |
5. **Conventions / invariants / gotchas** — where new code goes, naming/patterns, "don't do X", things that bite.

**Size budget:** orientation ≤ ~40 lines; whole file ≤ ~1500 lines. Over budget → compress (more `file:line` pointers, fewer prose words). Never expand toward mirroring the code.

## Step 4 — Write `.z/map/meta.json`

```json
{
  "version": 1,
  "built_against_sha": "<output of: git rev-parse HEAD>",
  "generated_at": "<UTC ISO 8601, e.g. output of: date -u +%Y-%m-%dT%H:%M:%SZ>",
  "thresholds": { "incremental_max_files": 25 },
  "section_index": {
    "Orientation": ["**/package.json", "**/pyproject.toml", "**/go.mod", "Makefile", "**/*.toml", "README*"],
    "Territory": ["**/*"],
    "Diagrams": ["**/*"],
    "Key-files index": ["**/*"],
    "Conventions / invariants / gotchas": ["**/*"]
  }
}
```

**The `section_index` contract:** each key is a `##` section heading in `.z/map/map.md`, spelled **exactly** as the heading; each value is the globs of files that feed it. Every `##` heading must appear as a key and every key must match a heading — `refresh` resolves a changed file → matching key(s) → the heading(s) to regenerate, so a key/heading desync silently breaks updates. Coarse sections any change can affect (Territory, Diagrams, Key-files index, Conventions) map to `**/*`; Orientation maps to the manifests/README that define it. If your map gives a large module its own `## Module: <name>` section, add a key for that exact heading mapped to its subtree (e.g. `"Module: auth": ["src/auth/**"]`) — "areas" are whatever the repo's top-level units are (packages, plugins, services), not necessarily `src/*`. Record the **exact** `HEAD` sha — staleness depends on it.

## Step 5 — Hand off

Report what was created, the file's size vs budget, and the build sha. **Do not commit.** Tell the user to review `.z/map/map.md` + `.z/map/meta.json` and commit them so the map travels with the repo.

## Checklist

- [ ] Surveyed structure without reading file bodies wholesale
- [ ] Summaries gathered via fan-out (no file contents pulled into context)
- [ ] All five sections present; Orientation wrapped in markers, ≤ ~40 lines
- [ ] Every Mermaid node carries a `file:path`
- [ ] Key-files index rows resolve to real `file:line`
- [ ] Whole map ≤ ~1500 lines
- [ ] `meta.json` written with exact `built_against_sha`, `generated_at`, `section_index`
- [ ] Handed off without committing
