# Curating the worklog

Goal: keep `.z/log/log.md` (the injected digest) **bounded and high-signal**, and keep the rest of the repo's memory where it belongs. The digest is read every session, so the long tail belongs in the archive, durable facts in the map, and lists in their own files.

This is the repo's **maintenance pass**. It also checks the map, so keeping memory healthy is one habit rather than two.

Run this when: the hook flags the digest over budget, threads have resolved, the map is flagged STALE, or you're tidying up.

## The pass

Review each entry in the digest:

- **Resolved / stale / no-longer-relevant** → move it to `.z/log/archive.md`, preserving its date. Don't delete history — archive it.
- **Completed open threads** → close them: append `— closed <YYYY-MM-DD>: <one-line outcome>` to the thread line, then move it to the archive.
- **Durable facts** (a rule that's now just how the code, or an external system, works) → **graduate** them now: a small direct edit to `z-map`'s Conventions or External contracts section (see z-map's "Small edits between refreshes"), then archive the worklog copy with a note like `→ graduated to .z/map/map.md`. Don't wait for a refresh, and don't keep the same rule in both places. If the repo has no `z-map`, keep it in the digest — don't drop it.
- **Inventory items** that crept in (tech debt, follow-ups) → move them to the repo's inventory file.
- **Still active** → keep, but trim: open threads to ≤ 2 lines (move detail to `.z/tmp/<topic>.md` or the design doc, and link it); refresh "where it stands" if it changed.
- **Duplicates / near-duplicates** → merge.

## Check the map

If the repo has a `z-map`, run its **status** (freshness against the base ref). Past its `stale_commits` threshold → run `z-map refresh` as part of this pass. If the refresh is structural (large diff, many areas), propose it to the user instead of starting it unasked, since it fans out subagents.

## Archive format

`.z/log/archive.md` is chronological history — same entry format as the digest, never injected, searched on demand. Append archived entries (with `>>` or an Edit at the end; never rewrite the file) under a heading for the **date you archive them** (e.g. `## 2026-06-23`); keep each entry's **own original date** in its text.

- **Archive each entry once.** No verbatim snapshots of the digest "before curation" — the archived entries are the record, and a snapshot doubles the file for nothing.
- **Correct in place.** When an archived claim turns out wrong, amend that entry (`**Corrected <YYYY-MM-DD>:** …`) instead of appending a separate walk-back elsewhere. Readers find the claim; they must find the correction with it.
- **It's history, not a reference.** If sessions keep searching the archive for the same topic, that topic is a durable fact (→ map) or an inventory (→ its own file). Move it there.

## Finish

- Re-check the digest is within `digest_budget_lines`. If still over, archive more aggressively (oldest resolved items first) — the digest is a working set, not a record. Never raise the budget to fit.
- Update `.z/log/meta.json` `last_updated` (UTC ISO 8601).
- Report what was archived / graduated / moved, the digest's new size, and the map's status. **Do not commit** — the user reviews and commits.

## Checklist

- [ ] Resolved/stale entries archived (dates preserved), not deleted
- [ ] Finished threads closed with an outcome
- [ ] Durable facts graduated to the map with a small direct edit; worklog copy archived with a pointer
- [ ] Inventory items moved to their file; thread detail moved behind links; threads ≤ 2 lines
- [ ] Duplicates merged; active open threads refreshed
- [ ] Map status checked; refreshed (or refresh proposed) if STALE
- [ ] Archive appended, not rewritten; no snapshots; corrections made in place
- [ ] Digest within `digest_budget_lines`
- [ ] `meta.json` `last_updated` updated
- [ ] Handed off without committing
