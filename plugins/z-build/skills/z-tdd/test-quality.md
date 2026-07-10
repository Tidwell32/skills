# Test Quality & Economy

Goal: tests that catch real regressions and earn their maintenance cost. Coverage is measured in **behaviors, not lines** — a suite is good when every test uniquely catches a way the code could be wrong, and no test does anything else.

## Quality — what makes a test good

1. **Test behavior, not implementation.** Assert observable outcomes at the public contract — return values, state changes, emitted effects — never internal call order or private state. Two litmus questions: *would this test fail if the behavior were wrong?* (it must) and *would it still pass if the internals were rewritten correctly?* (it should).
2. **The tautology check.** A test that mirrors the implementation — assert the mock was called with exactly what the code calls it with — proves only that the code is the code. If the assertion restates the implementation, rewrite it against an independently-known expectation or delete it.
3. **Mock the boundary you don't own.** Network, clock, filesystem, third-party APIs — mock those. Never mock the thing under test, or your own logic between it and the assertion; an over-mocked test passes while production breaks.
4. **One behavior per test, named as the spec.** The name states behavior + condition ("rejects expired token", "returns empty list when no matches") so a failure reads as a broken requirement, not a puzzle.
5. **Boundaries over bulk.** Empty / one / many, min / max, malformed input, the failure path. Pick edge cases where the **code branches**, not where the inputs merely differ.

## Economy — when to stop

More tests ≠ more safety. Every test is code: it must be read, maintained, and migrated through every refactor. A bloated suite slows the team *and* dilutes signal — the failure that matters scrolls past in a wall of red.

- **One test per distinct behavior** — a branch, a contract clause, a failure mode. If two tests can only fail together, one of them is redundant: cut it.
- **Same path, different data → one table.** Parameterize instead of copy-pasting near-identical test functions. Twelve cases in a table beat twelve test bodies.
- **Don't re-test the same path at every level.** Unit-test the logic; integration-test the wiring once; don't repeat the full case matrix at each layer.
- **Don't test the framework, the language, or the getter.** Downstream code has its own tests; trust them.
- **Snapshot restraint.** A snapshot asserts everything, and therefore nothing in particular — use targeted assertions unless the whole output *is* the contract.
- **Scale with branchiness and risk, not feature size.** Glue gets a smoke test; the parser gets the table. A big feature made of straight-line code needs few tests; a small function with eight branches needs many.

**The audit question:** for each test, name the distinct failure it uniquely catches. Can't name one → it goes. If the test file dwarfs the implementation, run this audit before taking the size as thoroughness.

## Red flags

- The assertion mirrors the mock setup (tautology)
- A correct internal refactor breaks half the suite (implementation-coupled)
- Many near-identical test bodies differing only in data (wants a table)
- A test whose name you can't write as a requirement ("test2", "works correctly")
- Test-to-code ratio far above the code's branchiness (bloat, not rigor)
