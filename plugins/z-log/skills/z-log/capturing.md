# Capturing an entry

Goal: record the reasoning a future cold session couldn't reconstruct from the code or git — tersely, in the right home, and only when it earns its place.

## When to capture

- **Decision** — you chose among real alternatives and the choice isn't self-evident from the result (a library, a data model, where state lives, an approach rejected).
- **Gotcha / landmine** — something that looks wrong or removable but is intentional; the kind of thing a future you would "fix" and regret. This includes **corrections**: the user overruled an approach or explained why the obvious fix is wrong — capture the why so no future session re-attempts it.
- **Open thread** — you're pausing mid-task; record where it stands and the next step so the next session resumes cleanly.

If git, the PR description, or `z-map` already says it, **don't** duplicate it here.

## Route it first

Before writing, pick the home (SKILL.md, "What goes where"):

- **Durable fact** — still true in three months with nobody acting? Then it's not a worklog entry. Add it to `z-map`'s Conventions (about the code) or External contracts (about a system outside the repo) as a small direct edit. If the repo has no map, the digest's Gotchas section is the fallback.
- **Inventory item** (tech debt, a follow-up, an audit finding) → the repo's inventory file, if it keeps one.
- **Thread detail** (handoff notes, measurements, options weighed) → `.z/tmp/<topic>.md`, a design doc, or the PR. The digest gets the two-line thread with a link.
- Everything else → the digest.

## The wrap-up synthesis pass

When the user says "wrap up" (or you're handing off), do a short pass over what the session actually did:

1. Identify the 0–N things that meet the bar above, and route each. Most sessions produce 0–3. Many produce zero — that's fine. (If an item is an existing **open thread** whose work just finished, it's a _curate_ action — close and archive it per `curating.md` — not a new capture. If a thread's status changed, update its two lines in place.)
2. **Propose** them to the user as a short list, each tagged with its destination (digest / map / inventory), before writing. Let the user cut or reword. Do **not** silently capture — the whole point of model-authored (not auto) capture is signal over noise. _Fallback:_ when there's no user to confirm (autonomous or non-interactive run), apply the bar strictly yourself and record, alongside the entries, a one-line note of what you captured and what you excluded — so the choice stays reviewable. "Propose first" is the interactive default, not a hard block.
3. Write the confirmed entries; skip the rest.

## Entry quality

- **Open threads: ≤ 2 lines.** Where it stands, the next step, a link to detail. Not a status report.
- **Decisions and gotchas: ≤ 3 lines**, carrying the **why**:
  - **Date it** with the UTC date (`date -u +%Y-%m-%d`).
  - State the **decision/gotcha** and the **reason** — ideally the alternative that was rejected and why.
  - Reference a file and symbol (gotchas) or commit/PR (decisions) when it grounds the entry. Optional, not required.

Good vs weak:

- ❌ `Switched to Postgres.`
- ✅ `**2026-06-23** Chose Postgres over SQLite — need concurrent writers + JSON queries; SQLite's single-writer lock was the blocker.`
- ❌ `Don't touch the retry loop.`
- ✅ `**2026-06-23** Retry loop sleeps 5s on purpose (`net/client.go` → `retryWithBackoff`) — the upstream rate-limits under 5s; shorter backoff gets us banned.`
- ❌ A nine-line thread recounting test counts, review status, rejected designs and open product questions.
- ✅ `- Exclude in-progress items from the widget — built, uncommitted; blocked on product call re FAILED plans. Detail: .z/tmp/exclusion.md (started 2026-09-25)`

## Where it goes

- Add it to the matching section **inside the `<!--worklog-->` markers** in `.z/log/log.md`: Open threads / Decisions / Gotchas. Keep the newest at the top of its section.
- **Use a targeted Edit** (or `>>` for the archive). Never rewrite the file — other sessions may be writing it too.
- Update `.z/log/meta.json` `last_updated` (UTC ISO 8601, e.g. `date -u +%Y-%m-%dT%H:%M:%SZ`).
- If the digest is now over `digest_budget_lines` (~60), run a curate pass (`curating.md`) before finishing. Never raise the budget to fit.

If `.z/log/log.md` / `.z/log/` don't exist yet, create them per the artifact spec in SKILL.md (digest with the three sections inside markers, plus `meta.json`).

## Hand off

Report the entries written and where each went. **Do not commit** — the user reviews the diffs and commits.

## Checklist

- [ ] Entry meets the bar (decision / gotcha / open thread, not routine, not already in git/z-map)
- [ ] Routed: durable facts to the map, inventory items to their file, detail behind a link
- [ ] At wrap-up, entries were **proposed and confirmed** (or, in an autonomous run, the bar was applied strictly and the captured/excluded split noted)
- [ ] Threads ≤ 2 lines; decisions/gotchas ≤ 3, dated, stating the _why_
- [ ] Written with a targeted Edit inside the `<!--worklog-->` markers, in the right section
- [ ] `meta.json` `last_updated` updated
- [ ] Digest still within budget (else curated)
- [ ] Handed off without committing
