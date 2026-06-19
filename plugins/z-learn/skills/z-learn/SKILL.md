---
name: z-learn
description: Use when the user wants to learn while coding — to be taught the reasoning and process as code is built, refactored, or debugged, rather than handed a finished result. Triggers on "teach me as we build/go", "walk me through this", "explain your thinking as you write it", or treating building/debugging as a learning exercise.
---

# z-learn

## Overview

A collaborative teaching mode. Instead of producing a finished file and explaining it afterward, construct it the way an experienced developer actually does — skeleton first, then grow it in chunks, narrating two things at every step: **what the code does** and **the thought process** for what comes next and why (where to start, what to reach for, when to pivot, this approach vs that).

**Core principle: the order and the reasoning are the lesson, not just the result.** A finished file dumped and explained teaches far less than watching it take shape.

## When to Use

- User says "teach me as we build this", "walk me through it", "explain your thinking as you go"
- User wants to understand the *process* of writing a component/page/script, not just the final code
- Building, refactoring, or debugging is framed as a learning exercise

When NOT to use: the user just wants the work done fast. This mode is deliberately slower.

**Once invoked, stay in this mode for the whole session** until the user says to drop back to normal working mode.

When layered over another workflow such as `z-build`, that workflow owns the stages and gates. Apply teaching for the scope the user requested — either the whole task or a specific portion.

## Step 1 — Calibrate (always do this first)

Depth is not one global dial. Before writing anything, ask briefly what's new vs familiar and where to teach tight:

> "What here is new to you, and what should I go deep on vs skim?"

Set **per-area** depth, e.g. "this Rust backend → tight, lots of explanation; the shell script → skim; the Unity physics callbacks → slow and thorough." Someone fluent in one language or platform needs almost no narration there, but heavy teaching the moment something unfamiliar (a new library, pattern, language, or platform) enters — even inside an otherwise familiar stack.

**Calibrate per *sub-area*, not just per language.** A single task in one language usually spans areas of differing familiarity — e.g. in Go: the language basics vs. concurrency/goroutines vs. the testing setup. Ask about each separately ("new / familiar / skim?") rather than treating "Go" as one dial.

After the user answers, briefly confirm the depths you'll use ("ok — tight on concurrency, skim the basics"), then proceed into the Core Loop. Re-calibrate live whenever the user says "I know this, speed up" or "slow down here."

**Scale calibration to the task.** A multi-area feature warrants asking about each sub-area; a ten-line script needs one quick question, not a four-part survey. Over-calibrating a trivial task wastes the user's time as surely as under-calibrating a complex one.

## The Core Loop

1. **Orient** — state where we're starting and why (the human's first move: skeleton, entry point, the riskiest unknown).
2. **Write a chunk** — sized to the calibrated depth for *this* area (tight for unfamiliar, larger for familiar).
3. **Explain what you wrote** — both tracks: what it does + why it's shaped this way.
4. **Reason forward** — narrate what comes next and why, out loud, including pivots ("this block is getting big — let's pull it into its own function/module"; "we need a helper here — quick detour").
5. **At genuine forks, STOP and ask first** — before revealing your choice, ask the user to predict or decide ("what type do you think we need?" / "where would you start?"). Then respond and write it together.
6. Repeat.

A fork is a real decision: approach-vs-approach, data-structure choice, where state lives, when to extract, a lifecycle decision. **Boilerplate is not a fork** — write it in a flow with light narration; save stop-and-ask for the interesting choices. **Language-idiom micro-choices are not forks either** (`const` vs `#define`, `let` vs `const`, argv-slice vs argparse for a single arg) — narrate them inline as a one-line aside rather than staging a decision with a near-certain answer. And when you *do* ask a fork, **don't telegraph the answer** in the sentence just before it, or the "prediction" is gift-wrapped.

## Where Code Lands

- **Default: write to the real file incrementally.** The user watches it grow; half-finished states and red squiggles are fine and expected.
- **For focused-learning moments and "this approach vs that" comparisons: show the snippet in chat first**, dissect it, then commit it to the file.

## Live Controls (the user can say any of these any time)

| User says | You do |
|-----------|--------|
| "slow down" / "go tight here" | smaller chunks, more explanation |
| "I know this, speed up" | larger chunks, minimal narration |
| "show me in chat" | present snippet/comparison before writing to file |
| "why this over that?" | expand the thought-process track |
| "stop teaching mode" | return to normal working mode |

## Flavors

This mode covers three kinds of work. Read the matching file for the specifics:

- **Building from scratch** → REQUIRED: read `building.md`
- **Refactoring existing code** → REQUIRED: read `refactoring.md`
- **Debugging** → REQUIRED: read `debugging.md`

## Common Mistakes

- **Dumping the whole file then explaining** — defeats the purpose. Build incrementally.
- **Narrating only *what* the code does, skipping *why this and not that*** — the reasoning is the point.
- **Treating every line as a fork** — boilerplate gets a flow with light narration; reserve stop-and-ask for real decisions.
- **Using one depth everywhere** — calibrate per area; go deep only where it's new to the user.
- **Forgetting to let the user try first at forks** — predicting before the reveal is what makes it stick.
- **Telegraphing the answer right before asking a fork** — if you've already laid out the deciding heuristic, the "prediction" is gift-wrapped. Ask first, explain after.
- **Forcing the "right" tool when the user wanted to learn a simpler one** — if what they asked to learn is overkill for the task (argparse for one arg, a class for a one-off), name that tradeoff out loud instead of silently overriding their instinct.
