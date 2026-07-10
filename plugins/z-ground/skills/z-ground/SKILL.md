---
name: z-ground
description: Use before writing code against any API you haven't verified in this project — an unfamiliar or fast-moving library, a version-sensitive framework, a CLI's flags, a config schema — to check installed reality instead of coding from memory. Triggers on first use of a dependency, "which version do we have", framework majors, and hallucinated-API errors ("no such method", "unexpected keyword", "cannot import").
---

# z-ground

## Overview

Verify APIs against **installed reality** before writing code that depends on them. A model's memory of an API is trained across many versions at once, so it's often subtly wrong for *yours*: renamed methods, moved imports, changed defaults, options that don't exist yet — or anymore.

**Core principle: your memory of an API is a hypothesis, not a fact.** This is the TEST iron law applied to knowledge — no building on an unverified claim. The ground truth is the installed package, not a blog post, not the latest docs, and not recall.

## When to Use

- First use of a library or framework in this project, or any fast-moving dependency (JS frameworks, cloud SDKs, LLM APIs)
- Version-sensitive code — majors differ meaningfully, or you're not sure which major is installed
- Writing against a CLI's flags or a tool's config schema
- A "no such method / unexpected keyword / cannot import" error — that's a grounding failure; come here instead of guessing another name

**When NOT to use:** APIs you've already verified this session, stdlib you use constantly, or a surface the repo already exercises — existing call sites are verified-by-execution and count as ground truth.

## The Procedure

1. **Pin the version.** Lockfile or manifest first (`package-lock.json`, `poetry.lock`, `go.sum`, `Cargo.lock`), or ask the tool (`npm ls <pkg>`, `pip show <pkg>`, `cargo tree`). The version decides which docs — and which part of your memory — even apply.
2. **Read the installed surface, not your memory of it.** The truth ships with the package: `node_modules/<pkg>/**/*.d.ts`, the source in `site-packages`, `go doc`, `--help` for CLIs. Grep for the exact export you intend to call before you call it.
3. **Follow the repo's existing usage.** If the codebase already calls this dependency, those call sites are working examples — match them rather than introducing a second style from memory.
4. **Probe when still unsure.** Write a 5-line throwaway script in a scratch directory, run it, observe the real behavior. One probe is cheaper than debugging a wrong assumption after three files depend on it. Delete the probe when done.
5. **Docs last, and version-matched.** If you do fetch documentation, fetch it for the *pinned* version — latest docs against an older installed version is the classic trap.

Once verified, it's ground — build on it without re-checking every turn.

## Red Flags

- About to write an import path you haven't seen in this repo or its type definitions → verify first.
- Reasoning "in version X they changed…" without having checked which version is installed.
- Fixing a "no attribute/method" error by trying a *different remembered name* → stop; one read of the installed surface beats three failed guesses.
- Copying a snippet from docs or a blog without matching it to the pinned version.

## Common Mistakes

- **Coding from memory on a fast-moving dependency** — the exact failure this skill exists to stop.
- **API roulette** — rerunning with successive remembered names instead of reading the actual exports.
- **Latest docs, old install** — always match the docs to the lockfile version.
- **Probing inside the repo** — scratch scripts go in a temp directory, never the working tree, never committed.
- **Re-verifying endlessly** — verification is per-session, not per-call. Once grounded, move on.
