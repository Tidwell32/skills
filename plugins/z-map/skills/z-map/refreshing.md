# Refreshing the map (incremental update)

Goal: bring the map back in sync with the code at **cost proportional to the diff**, not the repo. Touch only what changed; keep the `.z/map/map.md` diff small enough to review.

## Step 1 — Read state & compute the diff

- Read `.z/map/meta.json` → `built_against_sha`, `base_ref`, `section_index`, `thresholds.incremental_max_files`.
- Resolve the **base ref** (SKILL.md): `base_ref`, else `origin/HEAD`, else `main`/`master`. The map tracks merged code, so every step below reads the base, not your branch.
- Changed since the map was built:
  - `git diff --name-status <built_against_sha>..<base>` (added / modified / deleted / renamed) — this is the default and what freshness is measured against.
  - When the working tree isn't on the base, read changed files as they are there: `git show <base>:<path>`.
  - Unmerged or uncommitted work — **only** when the caller explicitly asks (e.g. "refresh including my branch"). It folds that work into the map content but does **not** advance the freshness contract: `built_against_sha` still records the base (Step 4).
- If `built_against_sha` is missing from history (`git cat-file -e <sha>^{commit}` fails — e.g. rebased) or isn't an ancestor of the base, treat it as a structural change and rebuild affected areas against the base.

**0 changed files → report "map is fresh" and stop. Rewrite nothing.**

## Step 2 — Classify the change

- **Resolve** each changed path to its owning section(s) via `section_index` (glob match). Keys are the map's `##` headings, so a match names the exact heading(s) to regenerate. Repo-wide sections (Territory, Diagrams, Key-files index, Conventions) match `**/*`, so they're always candidates — but within them you still touch only the affected rows/nodes (Step 3a), not the whole section.
- **Incremental** when: changed-file count ≤ `incremental_max_files` AND no structural shift — no top-level dir added/removed, no entry point moved/renamed, no manifest/dependency overhaul.
- **Structural** otherwise (large diff, new/removed module, moved entry points, build system change).
- **Pointer invalidation** independently of section_index, search the existing map for every changed/renamed/deleted path. Any section that contains a pointer to a changed file is affected and must have those pointers/claims revalidated. A changed file can invalidate a map claim even when the section’s configured glob would not otherwise select it.

## Step 3a — Incremental update

For each affected section:

- Re-derive just that section from the changed files. Read only the changed files (or a focused area), not the whole repo.
- **Modified** files → confirm the symbols the map anchors in them still exist and still do what the map says; update their key-files-index rows and any area summary they belong to.
- **Added** files → add a key-files-index row / territory line **only if significant** (new public surface, new module). Skip trivial additions.
- **Deleted** files → remove their rows; drop now-empty tree/diagram nodes.
- **Renamed/moved** files or symbols → update paths and symbol anchors in the index, in prose, and in any Mermaid node labels.
- **Legacy `file:line` pointers** in a touched section → convert them to file + symbol while you're there.
- If a changed area has a per-area summary or diagram, update those nodes; leave untouched areas byte-for-byte unchanged so the diff stays minimal.

## Step 3b — Structural rebuild (affected areas only)

Re-fan-out (per `generating.md` Step 2) for the areas that changed structurally, and regenerate those sections + the affected diagram. Only fall back to a full regenerate when the change is genuinely pervasive (e.g. a repo-wide reorg). Even then, reuse unchanged sections verbatim.

## Step 4 — Update `meta.json` & hand off

- Set `built_against_sha` to `git rev-parse <base>` and refresh `generated_at`. Add `thresholds.stale_commits` if it's missing (default 20; roughly a week of merges).
- Add/adjust `section_index` entries if modules were added/removed/renamed, keeping every key matching a `##` heading in the map.
- Re-check the size budget (≤ ~1500 lines); compress if the update pushed it over.
- Re-run pointer validation for all sections touched by the refresh.
- Report which sections changed and the new build sha. **Do not commit** — the user reviews the `.z/map/map.md` diff and commits.

## Checklist

- [ ] Diff computed as `built_against_sha..<base>`; files read at the base; 0-change case exits early
- [ ] Changed files resolved to sections via `section_index`, plus every section pointing at a changed file
- [ ] Incremental vs structural classified correctly
- [ ] Only affected sections rewritten; untouched sections left byte-for-byte
- [ ] Deletions pruned, renames repathed and symbols re-anchored (including in diagram nodes)
- [ ] `built_against_sha` = base sha, `generated_at` updated; `section_index` adjusted for module changes
- [ ] Size still within budget; handed off without committing
