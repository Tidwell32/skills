# Flavor: Debugging As A Teaching Exercise

The goal: teach a real debugging *methodology*, not ad-hoc poking. Knowing how to debug within a codebase is a core skill — narrate the reasoning at each step.

**Core principle: find the root cause before proposing a fix.** A fix without an understood cause is a guess, and guesses create new bugs.

## The loop (narrate each step out loud)

### 1. Understand the symptom
- Read the error / stack trace completely — out loud. It often names the cause and the exact line.
- Reproduce it reliably: "Can we trigger it on demand? What are the exact steps?" If it's not reproducible, gather more data — don't guess.
- Check what changed recently (git diff, recent commits, new deps/config).

### 2. Form ONE hypothesis — this is the fork, so ask first
- Before stating yours, ask the user: "Given this, where would *you* look first, and why?"
- Then state a single, specific hypothesis: "I think X is the cause because Y." Not vague, not three at once.

### 3. Locate the evidence
- Decide *where to look* and explain the choice. In multi-layer systems (API → service → DB, etc.), check each boundary — what data goes in, what comes out — to find which layer breaks before diving into one.
- Trace bad values *backward*: where did this value originate? What called this with it? Fix at the source, not the symptom.

### 4. Test the hypothesis minimally
- Make the smallest possible change to confirm or reject it. One variable at a time.
- Confirmed → fix it. Rejected → form a NEW hypothesis. **Don't stack guesses on top of each other.**

### 5. Fix and verify
- Reproduce the original failure with a test if possible, then fix the root cause — one change, no "while I'm here" extras.
- Verify the symptom is gone and nothing else broke.

## If 3+ fixes fail: question the architecture

If each fix reveals a new problem somewhere else, the issue may be the design, not the bug. Stop guessing and discuss the structure with the user — this is a wrong-architecture signal, not a failed hypothesis.

## Red flags (stop and return to step 1)

- "Quick fix now, investigate later"
- "Just try changing X and see if it works"
- Proposing a fix before tracing the data flow
- Stacking a second fix on top of an unverified first
