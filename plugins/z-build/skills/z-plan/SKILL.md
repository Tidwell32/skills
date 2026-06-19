---
name: z-plan
description: Use when you need to align on an approach before writing code — at the start of a feature, bugfix, or refactor, or whenever tempted to start editing without a plan. The planning beat of z-build, also usable on its own. Triggers on "how should we approach this", "plan this", "what's the plan".
---

# z-plan

## Overview

Align on the approach before touching code, with the lightest possible footprint. **Reason the approach through directly** — work it out yourself, not through a researcher subagent or a written spec.

**Core principle: this is alignment, not a spec ceremony.** The output is shared understanding, not a document. Catch a wrong approach here, where it costs a sentence to fix, instead of after it's been built.

## What to Produce

Two things, both ephemeral:

1. **A short approach statement** (in chat) — what you'll do and why, the key decisions, and anything you're reusing. A few sentences for a small task; a tight paragraph or two for a larger one. Not a document.
2. **A todo list** — the steps, in order, via the native todo tool. This *is* the plan; it lives in the session, not on disk.

**Never** write a `PLAN.md`, `RESEARCH.md`, `CONTEXT.md`, or `.planning/` file. State is ephemeral.

## How

- **Explore only what you need.** Look at the code the change touches and the patterns nearby — enough to plan accurately, not a full survey. Actively reuse existing functions, utilities, and conventions; prefer them over new code.
- **Think before you write.** Weigh the approaches yourself before committing to one. If two are genuinely viable, name the tradeoff in the approach statement and recommend one.
- **Gate on the approach.** For non-trivial work, present the approach and get the user's buy-in before coding. For a small, unambiguous task, state the approach in a line and proceed.

## Common Mistakes

- **Turning a plan into a spec** — no documents. Approach statement + todo list, both in-session.
- **Over-exploring** — read what the change touches, not the whole codebase.
- **Proposing new code when something exists** — search first, reuse what's there.
- **Skipping the buy-in gate on non-trivial work** — the gate is the value; a wrong approach is cheapest to fix before it's built.
- **Gating a trivial task** — one line and proceed; don't stage a decision with an obvious answer.
