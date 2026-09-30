# Generating the map (first build)

Goal: produce `.z/map/map.md` + `.z/map/meta.json` that let a cold session orient in seconds and navigate to the right file and symbol. **Map, not mirror** — every step optimizes for a small, high-signal artifact.

**Build from the base ref** (see SKILL.md — `meta.base_ref`, else `origin/HEAD`, else `main`/`master`). The map describes merged code. If the working tree is on another branch, read files as they are on the base (`git show <base>:<path>`, `git ls-tree -r --name-only <base>`) rather than the checkout.

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
>
> - One-line purpose of the area.
> - Public surface / entry points with `file:line`.
> - Key internal files and what each owns, with `file:line`.
> - Inbound/outbound dependencies on other areas.
> - Cross-boundary contracts / manually synchronized surfaces, with `file:line`.
> - External systems this area calls (services, sibling repos, vendor APIs): how it reaches them, and any behavior of theirs that the code works around, with `file:line`.
> - Non-obvious invariants, intentional behaviors, gotchas, or conventions, each grounded in at least one `file:line`.
> - Up to 1–3 verification anchors (tests/examples) for important non-obvious behavior, when useful.
>
> Name the symbol (function, class, method, constant) alongside each `file:line`.

The point of delegation is to keep raw bytes out of _your_ context — collect summaries, not dumps. For a small repo you may skip fan-out and survey directly: read the manifests, entry points, and the files you're summarizing, but still emit summaries and pointers, not transcriptions. Summaries cite `file:line` as evidence; when you write the map, convert each pointer to file + symbol.

## Step 3 — Aggregate into `.z/map/map.md`

Assemble the sections in order:

1. **Orientation** — a `## Orientation` section whose body is wrapped in `<!--orientation-->` … `<!--/orientation-->`. The markers let the hook inject exactly this block every session; the `##` heading lets `section_index` key it like every other section (keep the markers inside the section). What the project is, the stack, the entry points, how to run and test. **Include only the fields that apply** — a library, content, or config repo may have no run/server/build command, so drop those fields rather than inventing them (use "Entry points" for its main modules, package, or manifest). Make it dense and ≤ ~40 lines:
   ```markdown
   ## Orientation

   <!--orientation-->

   **What:** <one-paragraph elevator pitch>
   **Stack:** <languages / frameworks / runtime>
   **Entry points:** `path/to/main` (cli), `path/to/server` (http) …
   **Run:** `<command>` · **Test:** `<command>` · **Build:** `<command>`

   <!--/orientation-->
   ```
   Leave out what the repo's always-loaded instructions (e.g. `CLAUDE.md`) already say — the orientation is injected alongside them, so repeating them only costs tokens.
2. **Territory** — annotated tree of meaningful dirs/modules, one line of purpose each. Omit noise (node_modules, build output, vendored deps).
3. **Diagrams** — inline Mermaid. At minimum a module-dependency graph; add the 1–3 most important flows (request lifecycle, data pipeline, build/deploy). **Every node labeled with a file path** so it's navigable:
   ```mermaid
   graph TD
     cli["cli — src/cli/main.ts"] --> core["core — src/core/engine.ts"]
     core --> store["store — src/store/db.ts"]
   ```
4. **Key-files index** — a table of the ~20–40 files that matter most. This is the jump-table the next session navigates from:
   | File | Owns / responsibility |
   |------|-----------------------|
   | `src/core/engine.ts` → `Engine.run` | orchestrates the run loop |
5. **External contracts** — only if the code depends on systems it can't see (external services, sibling repos, vendor APIs). Per system: where its source or docs live, how this repo reaches it, and the behaviors that bite. Draw these from the Step 2 summaries.
6. **Conventions / invariants / gotchas** — where new code goes, naming/patterns, "don't do X", things that bite.

**Pointers are file + symbol** (`path` → `Symbol`), not `file:line` — line numbers rot on every edit above them. Keep `:line` only where nothing is nameable.

**Size budget:** orientation ≤ ~40 lines; whole file ≤ ~1500 lines. Over budget → compress (more pointers, fewer prose words). Never expand toward mirroring the code.

## Step 3.5 — Validate the map

Before writing meta state:

- Verify every pointer: the file is tracked at the base ref and its symbol is found in it (`grep -n`); a rare `:line` pointer must hold what it claims.
- Verify every Mermaid node's file path exists.
- Verify every key-files row still points at the responsibility it claims.
- For non-obvious invariants/intentional behaviors, confirm the claim against
  source rather than inherited documentation.
- If a map claim conflicts with source, source wins; update or remove the claim.

## Step 4 — Write `.z/map/meta.json`

```json
{
  "version": 1,
  "built_against_sha": "<output of: git rev-parse <base ref>>",
  "generated_at": "<UTC ISO 8601, e.g. output of: date -u +%Y-%m-%dT%H:%M:%SZ>",
  "thresholds": { "incremental_max_files": 25, "stale_commits": 20 },
  "section_index": {
    "Orientation": [
      "**/package.json",
      "**/pyproject.toml",
      "**/go.mod",
      "Makefile",
      "**/*.toml",
      "README*"
    ],
    "Territory": ["**/*"],
    "Diagrams": ["**/*"],
    "Key-files index": ["**/*"],
    "External contracts": ["**/*"],
    "Conventions / invariants / gotchas": ["**/*"]
  }
}
```

- `base_ref` _(optional)_ — set it (e.g. `"origin/develop"`) only when the default branch can't be detected from `origin/HEAD`, `main` or `master`.
- `stale_commits` — how many commits behind the base ref the map may fall before the hook flags it **STALE**. Tune it to the repo's merge rate: roughly a week of merges. Below it the hook stays quiet, so the banner means something when it appears.
- Drop the `External contracts` key if the map has no such section.

**The `section_index` contract:** each key is a `##` section heading in `.z/map/map.md`, spelled **exactly** as the heading; each value is the globs of files that feed it. Every `##` heading must appear as a key and every key must match a heading — `refresh` resolves a changed file → matching key(s) → the heading(s) to regenerate, so a key/heading desync silently breaks updates. Coarse sections any change can affect (Territory, Diagrams, Key-files index, Conventions) map to `**/*`; Orientation maps to the manifests/README that define it. If your map gives a large module its own `## Module: <name>` section, add a key for that exact heading mapped to its subtree (e.g. `"Module: auth": ["src/auth/**"]`) — "areas" are whatever the repo's top-level units are (packages, plugins, services), not necessarily `src/*`. Record the **exact** base-ref sha — staleness depends on it.

## Step 5 — Hand off

Report what was created, the file's size vs budget, and the build sha. **Do not commit.** Tell the user to review `.z/map/map.md` + `.z/map/meta.json`, and to commit them if the repo tracks `.z/`.

## Checklist

- [ ] Built from the base ref, not a feature branch
- [ ] Surveyed structure without reading file bodies wholesale
- [ ] Summaries gathered via fan-out (no file contents pulled into context)
- [ ] All sections present (External contracts only if the repo has any); Orientation wrapped in markers, ≤ ~40 lines, not restating always-loaded instructions
- [ ] Every Mermaid node carries a file path
- [ ] Pointers are file + symbol, and every one resolves at the base ref
- [ ] Whole map ≤ ~1500 lines
- [ ] `meta.json` written with exact base-ref `built_against_sha`, `generated_at`, `stale_commits`, `section_index`
- [ ] Handed off without committing
