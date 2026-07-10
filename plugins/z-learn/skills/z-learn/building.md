# Flavor: Building From Scratch

The goal: let the user witness how a file comes into existence, in the real order a developer works — not top-to-bottom as if transcribing a finished result.

## Typical order (narrate each move, don't just do it)

These steps generalize across languages and platforms — a backend handler, a CLI script, an Arduino sketch, a Unity behaviour, a UI component all take shape roughly this way:

1. **Skeleton** — the imports/includes you already know you need, the declaration (function / class / module / sketch / script entry), and a minimal body that compiles or runs. Get something that *exists* before perfecting anything.
2. **Shape the contract** — inputs and outputs: signature, parameters, return type, the data it touches. "What does this take in and give back?" Nailing this often clarifies everything downstream.
3. **State & data** — the variables/fields it needs, what's derived vs stored, where the data comes from. Narrate *why* each piece of state lives where it does.
4. **Behavior** — the core logic: the main loop, handlers, callbacks, lifecycle hooks, the algorithm. Narrate ordering — what depends on what.
5. **Wire it together** — connect the pieces and the I/O (the print, the response, the pin write, the render) last, once the parts exist.

This order is illustrative, not a script — real building jumps around. The teaching value is narrating *why you jump*.

**Teach by breaking, when a concept only makes sense as a fix.** Some ideas (debounce, caching, error handling, concurrency safety) land far better when the learner first watches the naive version misbehave. Deliberately build the simple-but-broken version, observe the problem together, *then* fix it — the fix teaches the concept better than pre-empting it ever could.

## Pivots to narrate (these are the gold)

- "This block/function is getting big — let's pull it into its own function/module/file." Explain the threshold: when does size / reuse / clarity justify the split?
- "I keep repeating this — time for a helper." Explain why now and not earlier.
- "I need a type / struct / data shape I don't have yet — let me define it before I keep going."
- "This is getting hard to reason about — let me simplify before adding more."

## Forks to stop and ask at

- Data structure / type choice ("array vs map / list vs struct here — what do you think?")
- Where data and state should live (local variable, field, global, passed in, persisted)
- Whether to extract now or later
- Which of two valid patterns to use, and the tradeoff

## Platform & lifecycle notes

- Many platforms have a flow worth narrating out loud — Arduino's `setup()` then `loop()`; Unity's `Awake → Start → Update → FixedUpdate`; a backend's request → handler → response; a UI framework's mount → update → teardown. Make the order and the *why* explicit.
- **Plenty of code has no framework lifecycle at all** — a library, an algorithm, a pure function, a script. There the "flow" to narrate is the data's journey (inputs → transformation → outputs) and the order you build the pieces in. Don't force a lifecycle frame where none exists.
- **Fixed-entry-point platforms** (Arduino `setup()`/`loop()`, Unity MonoBehaviours, etc.) often have no function signature to design, and their I/O may be wired *outside* the file (e.g. Unity's Inspector, physical pins). On these, the "shape the contract" step becomes **designing the pins / serialized fields / persistent state**, and "wire it together" may happen in the editor or hardware rather than the code. Adapt the order — don't force a signature/return-value frame that doesn't apply.
- **When the work leaves the code** (a game engine's editor, hardware wiring, a cloud console): direct, don't skip. Give exact steps with the *why* for each, let the user drive — that's hands-on learning, not an interruption — and have them report what they observe. Their report is your only ground truth for editor-side state; treat it like test output before building on it.
- **When a new technology appears inside an otherwise familiar stack** (a new library, a new platform API, a new paradigm), concentrate the tight teaching *there* even while skimming the surrounding familiar code. This is the calibration payoff from `SKILL.md`.
