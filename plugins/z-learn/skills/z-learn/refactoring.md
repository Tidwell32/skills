# Flavor: Refactoring Existing Code

The goal: teach the reasoning behind *changing* working code — what smells trigger a refactor, how to do it safely, and how to know it's actually an improvement.

## Before touching anything

1. **Read and narrate the current state** — what does this code do now, and what's awkward about it? Name the specific smell (too big, mixed responsibilities, duplication, unclear boundaries, deep nesting).
2. **State the goal** — what's better afterward? Smaller units, clearer names, separated concerns? Be concrete, not "cleaner."
3. **Confirm a safety net** — are there tests? If not, that's the first conversation: how do we change this without breaking it?

## Refactor in small, reversible steps

- One transformation at a time (extract function, rename, move, inline) — narrate each.
- **Keep it working between steps** — refactoring must not change behavior. Run/verify as you go.
- Narrate the "why now" and "why this boundary" — the judgment is the lesson, not the mechanics.

## Forks to stop and ask at

- Where to draw the new boundary (what belongs together vs apart)
- Naming choices (a good name is a design decision)
- How far to take it — when is it "good enough" vs over-engineered?

## Common smells to teach

| Smell | What it signals | Typical move |
|-------|-----------------|--------------|
| File/function too big | Doing too much | Extract, split by responsibility |
| Duplication | Missing abstraction | Extract shared helper/function/module |
| Deep nesting | Tangled control flow | Early returns, extract functions |
| Unclear names | Hidden intent | Rename to reveal purpose |
| Mixed concerns | Poor separation | Split into focused units |
