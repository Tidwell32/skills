---
name: z-review
description: Use when a change is implemented and tests pass and you want fresh-context eyes on the diff before handing it off — the mandatory review beat of z-build, also usable on its own. Triggers on "review this", "review the changes", "review the diff", "fresh eyes on this".
---

# z-review

## Overview

Get a genuine fresh-eyes pass on the finished diff, then triage what comes back.

**Core principle: fresh context is the whole point.** You wrote the code, so you can't unsee your own intent — you read the diff as you meant it, not as it is. A subagent starting cold reads what's actually there. This is the one place in the lean loop a subagent earns its tokens, which is why it's mandatory.

## Run the Review

Dispatch **one** fresh subagent (general-purpose, with file-reading and shell access) using the prompt in [reviewer-prompt.md](reviewer-prompt.md). It assembles the full change itself — committed, staged, unstaged, and untracked, since z-build leaves work uncommitted — reads the changed files for context, and returns findings classified by severity — correctness/security bugs first, then reuse/simplification/efficiency — each tagged **CONFIRMED** (traced) or **PLAUSIBLE** (suspected).

One subagent, one pass. Don't fan out multiple reviewers for an ordinary change.

**Heavier option:** for a large or high-stakes diff, the built-in `/code-review` (including its cloud `ultra` mode) does a deeper multi-angle review. Mention it to the user; don't launch it yourself.

## Triage With Rigor

Findings are input, not orders. For each one:

1. **Verify it against the code.** Confirm the issue is real and the reviewer understood the context. Fresh-context reviewers miss intent and invent problems that aren't there. Budget effort by the confidence tag: spot-check a **CONFIRMED** finding; treat a **PLAUSIBLE** one as a hypothesis to verify from scratch.
2. **Decide.** Real → fix it. Wrong or not worth it → say so, with the evidence for why. Don't implement a change you can't justify just because a reviewer suggested it.
3. **Fix the real ones one at a time**, then re-run the tests (the TEST iron law still holds: show real output).

Push back when the reviewer is wrong — performative agreement produces worse code than no review.

## Hand Off

When findings are resolved and tests are green, stop. **Do not stage, commit, or push** — hand the clean working tree back for the user to review and commit.

Quality cleanups beyond bug-hunting (reuse, dead weight, altitude) are `z-simplify`'s job — run it after this pass if the diff grew past its task.

## Common Mistakes

- **Reviewing it yourself instead of dispatching** — you can't get fresh context on your own work. That's why this exists.
- **Implementing findings blindly** — verify each against the code first; push back on the wrong ones.
- **Fanning out many reviewers** — one fresh subagent for an ordinary diff.
- **Skipping the re-test after fixes** — a fix is a change; re-run and show evidence.
- **Committing the result** — never; hand off the working tree.
