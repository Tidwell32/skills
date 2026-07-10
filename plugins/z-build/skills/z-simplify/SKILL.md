---
name: z-simplify
description: Use when a change works and tests pass but the diff deserves tightening before hand-off — a reuse / dead-weight / altitude pass that hunts over-engineering, not bugs. The optional quality companion to z-build's review beat, also usable on its own. Triggers on "simplify this", "clean up the diff", "is this over-engineered", "tighten this up", a diff that feels bigger than its task.
---

# z-simplify

## Overview

A post-green quality pass over the finished diff: cut what doesn't earn its place, reuse what already exists, and bring the code to the right altitude.

**Core principle: the best diff is the smallest one that does the job.** Working code is the entry bar, not the finish line — every line added is a line someone must read, review, and maintain. This pass hunts **excess**, not bugs: `z-review` owns correctness; this owns economy.

## When to Use

- Tests pass and the change works, but the diff grew past its task
- "Simplify this", "clean up the diff", "is this over-engineered?"
- As the optional quality companion after `z-review`, before hand-off

**When NOT to use:** mid-implementation (premature simplification churns code that's still moving), or on code you didn't just change — simplifying untouched code is a refactor project; plan it as its own task.

## The Pass

Work **the diff, not the codebase** — same scope fence as review. Sweep four categories:

1. **Reuse** — did the change reinvent something that exists? A helper, a stdlib call, an established pattern in this repo. Search before keeping any new utility (the searches are independent — batch them in parallel). Found an existing one → use it, delete yours.
2. **Dead weight** — unused params, unread fields, unreachable branches, speculative generality ("might need it later"), options with exactly one caller, abstractions with exactly one implementation.
3. **Altitude** — the right level of abstraction, in both directions: inline the once-called helper whose body is clearer than its name, collapse pass-through layers — and extract the block that's now repeated three times. Right altitude, not maximum abstraction.
4. **Consistency** — match the surrounding idiom. Don't leave the file with two ways of doing what it previously did one way.

**One simplification at a time, tests green between each.** A simplification must not change behavior — if the tests move, it wasn't a simplification; revert it. The TEST iron law holds: re-run and show output after each cut.

**Every cut needs a stated reason** — "already exists at `file:line`", "single caller", "never read". If you can't articulate why something is excess, leave it. Suspicious-but-not-understood code is a question for the user (or the worklog's gotchas), not a deletion.

## Rationalizations — STOP

| Excuse | Reality |
|--------|---------|
| "Might need it later" | YAGNI. Git remembers; add it the day it's needed. |
| "It works, why touch it" | Working is the entry bar. The diff is what gets maintained. |
| "The abstraction keeps it flexible" | One implementation is speculation, not flexibility. |
| "Deleting it feels wasteful" | Sunk cost. The writing is spent either way; the maintenance isn't. |
| "Fewer lines is always simpler" | Golfing isn't simplifying. Optimize for the reader, not the line count. |

## Hand Off

Report what was cut and why, with the final test output. **Do not stage, commit, or push** — hand the working tree back for the user to review and commit.

## Common Mistakes

- **Hunting bugs** — that's `z-review`. If you find one mid-pass, flag it and fix it under the review/test discipline, don't blur the passes.
- **Simplifying beyond the diff** — untouched code is out of scope; note it as a candidate refactor instead.
- **Removing what you merely don't understand** — verify it's truly unused before cutting; intentional-looking oddities may be load-bearing (check the worklog's gotchas).
- **Batching cuts without re-testing** — one change at a time, green between.
- **Keeping a new helper without searching first** — reuse is the highest-value cut; look before you keep.
- **Golfing** — clever compression that costs the reader is a regression, not a simplification.
