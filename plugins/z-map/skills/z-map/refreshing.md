# Refreshing the map (incremental update)

Goal: bring the map back in sync with the code at **cost proportional to the diff**, not the repo. Touch only what changed; keep the `.z/map/map.md` diff small enough to review.

## Step 1 — Read state & compute the diff

- Read `.z/map/meta.json` → `built_against_sha`, `section_index`, `thresholds.incremental_max_files`.
- Changed since the map was built:
  - `git diff --name-status <built_against_sha>..HEAD` (committed changes: added / modified / deleted / renamed) — this is the default and what freshness is measured against.
  - `git status --porcelain` — **only** when the caller explicitly wants the map to reflect in-flight, uncommitted work (e.g. "refresh including my local changes"). This folds working-tree edits into the map content but does **not** advance the freshness contract: `built_against_sha` still tracks committed state (Step 4), so the next commit is what makes the map authoritatively fresh.
- If `built_against_sha` is missing from history (`git cat-file -e <sha>^{commit}` fails — e.g. rebased), treat as a structural change and rebuild affected areas against current `HEAD`.

**0 changed files → report "map is fresh" and stop. Rewrite nothing.**

## Step 2 — Classify the change

- **Resolve** each changed path to its owning section(s) via `section_index` (glob match). Keys are the map's `##` headings, so a match names the exact heading(s) to regenerate. Repo-wide sections (Territory, Diagrams, Key-files index, Conventions) match `**/*`, so they're always candidates — but within them you still touch only the affected rows/nodes (Step 3a), not the whole section.
- **Incremental** when: changed-file count ≤ `incremental_max_files` AND no structural shift — no top-level dir added/removed, no entry point moved/renamed, no manifest/dependency overhaul.
- **Structural** otherwise (large diff, new/removed module, moved entry points, build system change).

## Step 3a — Incremental update

For each affected section:
- Re-derive just that section from the changed files. Read only the changed files (or a focused area), not the whole repo.
- **Modified** files → update their key-files-index rows and any area summary they belong to.
- **Added** files → add a key-files-index row / territory line **only if significant** (new public surface, new module). Skip trivial additions.
- **Deleted** files → remove their rows; drop now-empty tree/diagram nodes.
- **Renamed/moved** files → update paths in the index and in any Mermaid node labels.
- If a changed area has a per-area summary or diagram, update those nodes; leave untouched areas byte-for-byte unchanged so the diff stays minimal.

## Step 3b — Structural rebuild (affected areas only)

Re-fan-out (per `generating.md` Step 2) for the areas that changed structurally, and regenerate those sections + the affected diagram. Only fall back to a full regenerate when the change is genuinely pervasive (e.g. a repo-wide reorg). Even then, reuse unchanged sections verbatim.

## Step 4 — Update `meta.json` & hand off

- Set `built_against_sha` to the current `git rev-parse HEAD` and refresh `generated_at`.
- Add/adjust `section_index` entries if modules were added/removed/renamed, keeping every key matching a `##` heading in the map.
- Re-check the size budget (≤ ~1500 lines); compress if the update pushed it over.
- Report which sections changed and the new build sha. **Do not commit** — the user reviews the `.z/map/map.md` diff and commits.

## Checklist

- [ ] Diff computed against `built_against_sha`; 0-change case exits early
- [ ] Changed files resolved to sections via `section_index`
- [ ] Incremental vs structural classified correctly
- [ ] Only affected sections rewritten; untouched sections left byte-for-byte
- [ ] Deletions pruned, renames repathed (including in diagram nodes)
- [ ] `built_against_sha` + `generated_at` updated; `section_index` adjusted for module changes
- [ ] Size still within budget; handed off without committing
