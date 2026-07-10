---
name: z-tdd
description: Use when implementing behavior that's easy to get subtly wrong, or fixing a bug — write the test first and watch it fail before writing the code. The disciplined-testing path of z-build's implement beat. Triggers on non-trivial logic, edge-case-heavy code, bug reproduction, "make sure this is right".
---

# z-tdd

## Overview

Test-first, where it earns its place: write the test, **watch it fail for the right reason**, then write the minimal code to pass.

**Core principle: if you didn't watch the test fail, you don't know that it tests the right thing.** A test written after the code, or never seen red, can pass for the wrong reason and prove nothing. Watching red→green is the proof.

## When to Use

**Test-first when** the behavior is risky or easy to get subtly wrong: business logic, edge cases, parsing/validation, state machines, anything with branches — and **every bug fix** (reproduce it with a failing test before you fix it).

**Skip the ceremony when** the code is trivial or obvious (a getter, a config value, glue with no logic) — but the **evidence rule still holds**: you must still run it and show it works. Pragmatic, not dogmatic.

## The Cycle

```dot
digraph tdd { rankdir=LR;
  "RED: write test" -> "RUN: see it FAIL" -> "GREEN: minimal code" -> "RUN: see it PASS" -> "REFACTOR" -> "RED: write test";
}
```

1. **RED** — write one test for the next behavior. Run it. **See it fail**, and confirm it fails for the *expected* reason (not a typo or import error).
2. **GREEN** — write the least code that makes it pass. Run it. **See it pass.**
3. **REFACTOR** — clean up names/duplication with the test green. Re-run.

For a bug: the failing test must **reproduce the bug** first. A fix isn't verified until that red test goes green.

## Writing the Tests Themselves

**REQUIRED: read [test-quality.md](test-quality.md)** whenever you write or extend tests. It covers both sides: quality (behavior over implementation, mock the boundary not the subject, the tautology check) and **economy** (one test per distinct behavior, tables over copy-paste, suite size scales with branchiness — not feature size). More tests is not the goal; tests that each uniquely catch a real failure is.

## Rationalizations — STOP

| Excuse | Reality |
|--------|---------|
| "I'll write the test after" | Tests-after pass immediately and prove nothing. You never saw red. |
| "It's too simple to test" | Then the test is 30 seconds — but simple-and-risky still gets a test. |
| "I already ran it manually once" | Manual once ≠ a test that guards it forever. Capture it. |
| "The fix is obvious" | Obvious fixes break obvious things. Reproduce, then fix. |
| "Watching it fail is a ritual" | It's the proof the test is wired to the behavior. Skip it and the test is theater. |

## Red Flags

- Wrote implementation before the test → for risky code, delete **the implementation you just wrote** (only the code you introduced in this change — never pre-existing or user-authored work) and start with the test.
- Test passed the first time you ran it → you didn't see red; make sure it actually exercises the new behavior.
- Fixing a bug with no failing test reproducing it → write that test first.

All of these mean: get back to red→green, with the run output as evidence.
