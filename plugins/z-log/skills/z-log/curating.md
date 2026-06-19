# Curating the worklog

Goal: keep `.z/log/log.md` (the injected digest) **bounded and high-signal**. The digest is read every session, so the long tail belongs in the archive, not the digest.

Run this when: the digest exceeds `digest_budget_lines` (~60), threads have resolved, or you're tidying up.

## The pass

Review each entry in the digest:

- **Resolved / stale / no-longer-relevant** → move it to `.z/log/archive.md`, preserving its date. Don't delete history — archive it.
- **Completed open threads** → close them: append `— closed <YYYY-MM-DD>: <one-line outcome>` to the thread line, then move it to the archive.
- **Hardened into a permanent invariant** (a rule that's now just how the project works) → **graduate** it into `z-map`'s Conventions section **via the `z-map` skill** (its refresh path), not by hand-editing `.z/map/map.md` — that way the map keeps its format and its `.z/map/meta.json` (`generated_at`) stays consistent instead of silently drifting. Then archive the worklog copy with a note like `→ graduated to .z/map/map.md`. Don't keep the same durable rule in both. If the repo has no `z-map`, keep the invariant in the worklog (it's still the best home) — don't drop it.
- **Still active** (open threads in flight, decisions/gotchas still load-bearing) → keep, but refresh open threads' "where it stands" if it changed.
- **Duplicates / near-duplicates** → merge.

## Archive format

`.z/log/archive.md` is append-only and chronological — same entry format as the digest, never injected, searched on demand. Append archived entries under a heading for the **date you archive them** (e.g. `## 2026-06-23`); keep each entry's **own original date** in its text.

## Finish

- Re-check the digest is within `digest_budget_lines`. If still over, archive more aggressively (oldest resolved items first) — the digest is a working set, not a record.
- Update `.z/log/meta.json`: `last_updated` (UTC ISO 8601) and `last_updated_sha` (`git rev-parse HEAD`).
- Report what was archived/graduated and the digest's new size. **Do not commit** — the user reviews and commits.

## Checklist

- [ ] Resolved/stale entries archived (dates preserved), not deleted
- [ ] Finished threads closed with an outcome
- [ ] Hardened invariants graduated **via the `z-map` skill** (not hand-edited), worklog copy archived with a pointer
- [ ] Duplicates merged; active open threads refreshed
- [ ] Digest within `digest_budget_lines`
- [ ] `meta.json` `last_updated` + `last_updated_sha` updated
- [ ] Handed off without committing
