# Capturing an entry

Goal: record the reasoning a future cold session couldn't reconstruct from the code or git — tersely, and only when it earns its place.

## When to capture

- **Decision** — you chose among real alternatives and the choice isn't self-evident from the result (a library, a data model, where state lives, an approach rejected).
- **Gotcha / landmine** — something that looks wrong or removable but is intentional; the kind of thing a future you would "fix" and regret.
- **Open thread** — you're pausing mid-task; record where it stands and the next step so the next session resumes cleanly.

If git, the PR description, or `z-map` already says it, **don't** duplicate it here.

## The wrap-up synthesis pass

When the user says "wrap up" (or you're handing off), do a short pass over what the session actually did:

1. Identify the 0–N things that meet the bar above. Most sessions produce 0–3. Many produce zero — that's fine. (If an item is an existing **open thread** whose work just finished, it's a *curate* action — close and archive it per `curating.md` — not a new capture.)
2. **Propose** them to the user as a short list before writing. Let the user cut or reword. Do **not** silently capture — the whole point of model-authored (not auto) capture is signal over noise. *Fallback:* when there's no user to confirm (autonomous or non-interactive run), apply the bar strictly yourself and record, alongside the entries, a one-line note of what you captured and what you excluded — so the choice stays reviewable. "Propose first" is the interactive default, not a hard block.
3. Write the confirmed entries; skip the rest.

## Entry quality

Each entry is 1–3 lines and carries the **why**:

- **Date it** with the UTC date (`date -u +%Y-%m-%d`).
- State the **decision/gotcha/thread** and the **reason** — ideally the alternative that was rejected and why.
- Reference a `file:line` (gotchas) or commit/PR (decisions) when it grounds the entry. Optional, not required.

Good vs weak:
- ❌ `Switched to Postgres.`
- ✅ `**2026-06-23** Chose Postgres over SQLite — need concurrent writers + JSON queries; SQLite's single-writer lock was the blocker.`
- ❌ `Don't touch the retry loop.`
- ✅ `**2026-06-23** Retry loop sleeps 5s on purpose (`net/client.go:88`) — the upstream rate-limits under 5s; shorter backoff gets us banned.`

## Where it goes

- Append to the matching section **inside the `<!--worklog-->` markers** in `.z/log/log.md`: Open threads / Decisions / Gotchas. Keep the newest at the top of its section.
- Update `.z/log/meta.json`: set `last_updated` (UTC ISO 8601, e.g. `date -u +%Y-%m-%dT%H:%M:%SZ`) and `last_updated_sha` (`git rev-parse HEAD`).
- If adding pushes the digest over `digest_budget_lines` (~60), run a curate pass (`curating.md`) before finishing.

If `.z/log/log.md` / `.z/log/` don't exist yet, create them per the artifact spec in SKILL.md (digest with the three sections inside markers, plus `meta.json`).

## Hand off

Report the entries written and the file. **Do not commit** — the user reviews the `.z/log/log.md` diff and commits.

## Checklist

- [ ] Entry meets the bar (decision / gotcha / open thread, not routine, not already in git/z-map)
- [ ] At wrap-up, entries were **proposed and confirmed** (or, in an autonomous run, the bar was applied strictly and the captured/excluded split noted)
- [ ] Each entry is dated and states the *why* (rejected alternative when relevant)
- [ ] Written inside the `<!--worklog-->` markers, in the right section
- [ ] `meta.json` `last_updated` + `last_updated_sha` updated
- [ ] Digest still within budget (else curated)
- [ ] Handed off without committing
