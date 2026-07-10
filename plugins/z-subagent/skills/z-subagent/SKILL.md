---
name: z-subagent
description: Use when delegating work to subagents — ad-hoc research, codebase sweeps, parallel fan-out, verification passes, or any agent dispatch — to decide whether to delegate at all and to write contracts that return compact, verifiable results instead of dumps. Triggers on "fan out", "delegate this", "spawn an agent", "research X across the codebase", "have an agent look at…", and before writing any subagent prompt.
---

# z-subagent

## Overview

How to delegate to subagents so the results are worth their tokens. A subagent's value is asymmetric: it reads whatever it needs in *its own* context and sends back only what you asked for — **if** you asked precisely. A vague dispatch returns a dump; the dump lands in your context; the delegation saved nothing.

**Core principle: a subagent call is a contract, not a wish.** Specify what comes back — shape, size, and grounding — before you specify what to do. The prompt is the entire interface: the agent can't ask follow-ups, you can't see its work, and its final message is all you get.

## Delegate or Read It Yourself

- **Delegate** when answering requires reading far more than the answer: broad sweeps ("find every place that…"), multi-file research questions, independent verification passes. You want the conclusion, not the bytes.
- **Read it yourself** when you already know the file or symbol, when you need exact bytes (e.g. to edit), or when the answer is one targeted lookup away. A subagent round-trip costs more than a single read.
- **Don't double-do it.** Once dispatched, wait for the result — re-running the search yourself pays twice.

## The Contract — five clauses, every dispatch

1. **One goal.** A specific question per agent, not a theme. "Find every call site of `retry()` and classify each as bounded/unbounded" — not "look into the retry logic."
2. **Scope fence.** What's in bounds and what's out ("stay within `src/auth/`; ignore test fixtures and generated code"). Without it the agent wanders the repo and returns opinions about it.
3. **Return shape.** The exact structure of the final message — the fields per item, the ordering, what a well-formed answer looks like. Say explicitly that the final message is the deliverable, not a status update.
4. **Size cap.** A hard budget ("≤ 25 lines; no file contents — `file:line` pointers instead"). The cap is what makes delegation cheaper than reading; an uncapped report is the dump you were avoiding.
5. **Grounding.** Every claim carries `file:line` evidence, and judgment calls carry a confidence tag — **CONFIRMED** (traced) vs **PLAUSIBLE** (suspected) — so your triage effort goes where the uncertainty is.

For findings-shaped work (reviews, audits, bug hunts), add the **refute-pass**: instruct the agent to try to kill each of its own findings before reporting and return only the survivors. Every false positive costs you a verification pass.

## Fan-Out

- **One agent per independent axis** — per module, per question, per review dimension. Not N agents on the same question hoping volume becomes coverage. (The exception is adversarial verification, where independent votes on the same claim are the point.)
- **Same contract, one variable slot.** Write the prompt once; vary only the target.
- **Dispatch in parallel.** Independent questions go out simultaneously, not serially.
- **Cap the fleet to what you'll triage.** Three reports you actually read beat ten you skim.
- **Aggregation is your job.** Dedupe, merge, and resolve conflicts in the main loop, where the task context lives — don't dispatch an agent to summarize the agents unless the volume genuinely demands it.

Treat what comes back as **input, not truth**: verify before acting, the same way `z-review` triages its reviewer's findings.

## Worked Examples in This Suite

- `z-review`'s `reviewer-prompt.md` — a findings contract: severity classes, confidence tags, refute-pass, bounded report.
- `z-map`'s `generating.md` Step 2 — a research contract: ≤ ~25 lines, no file contents, `file:line` pointers only.

Copy their skeletons; change the task.

## Common Mistakes

- **Delegating a one-lookup question** — the round-trip costs more than the read.
- **"Look into X and report back"** — no shape, no cap → a dump. Specify the return before the task.
- **No scope fence** — unbounded wandering, opinions about code that wasn't in question.
- **Accepting ungrounded claims** — no `file:line` means unverifiable, which means re-doing the work yourself.
- **Serial dispatch of independent work** — batch the launches in one go.
- **Fan-out as volume** — more agents on the same question adds noise, not coverage (adversarial votes excepted).
- **Acting on findings unverified** — subagent output is input; triage it.
