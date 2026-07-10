---
name: z-commit
description: Use when a chunk of work is done and the working tree has uncommitted changes that need to become clean, reviewable commits — to group them into atomic commits with proposed messages you approve and run yourself. Triggers on "prep my commits", "help me commit this", "how should I split these", "what should the commit message be", finishing a change.
---

# z-commit

## Overview

Turn a finished working tree into a set of clean, atomic, well-described commits — that **you** review and run.

**Core principle: the commit is yours; this skill only makes it clean and reviewable.** It surveys what changed, proposes how to split and describe it, and hands you ready-to-run commands. **It never stages, commits, or pushes** — you go through each file and commit yourself.

## When to Use

- Work is done and `git status` shows uncommitted changes you want to land well.
- The natural end of a `z-build` loop (its hand-off step), or after any ad-hoc change.
- You're unsure how to split a messy working tree into sensible commits.

**When NOT:** nothing uncommitted, or a single obvious one-file change — just commit it.

## The Process

1. **Survey** — `git status` + `git diff`, and read untracked (`??`) files in full. Understand everything that changed before grouping.
2. **Group into atomic commits** — one concern per commit (see heuristics). Separate unrelated changes.
3. **Propose** — for each group: the files, a commit message, and a one-line *why*. Flag anything that shouldn't be committed.
4. **Hand off** — present the plan plus copy-paste `git add … && git commit …` commands. **You** review each file, stage, and commit. The skill does not run them.

## Grouping Heuristics

- **One concern per commit** — a feature, a fix, a refactor; not a grab-bag.
- **A mixed-concern file splits by hunk** — when one file carries two concerns, the file isn't the atom, the hunk is: propose `git add -p` and say which hunks belong to which commit.
- **Separate refactor from behavior change** — a rename/move apart from the logic change, so each is reviewable and revertable on its own.
- **Don't mix formatting with logic** — pure reformatting/whitespace is its own commit.
- **Tests travel with the code they cover** — same commit or immediately after, not somewhere unrelated.
- **Order for review** — foundational/mechanical commits first, behavior last.

## Messages

Conventional and imperative: `type(scope): summary` (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`). The summary says *what*; add a body line for the *why* when it isn't obvious from the diff. No filler, no restating the diff.

## Flag, Don't Commit

Call out and propose excluding: secrets/keys/tokens, debug prints (`console.log`, `dbg!`, etc.), commented-out code, stray unrelated edits, large generated files or build output, and leftover scaffolding. Far better surfaced now than buried in history.

## Common Mistakes

- **Staging or committing for the user** — never. Output the commands; let them run each.
- **One mega-commit** — split by concern into atomic commits.
- **Mixing a refactor into a feature/fix** — separate commits, separately reviewable.
- **Vague messages** ("update code", "fixes stuff") — say what changed and why.
- **Committing debug/secret/unrelated noise** — flag it instead of sweeping it in.
- **Ignoring untracked files** — new files are part of the change; read them before proposing.
