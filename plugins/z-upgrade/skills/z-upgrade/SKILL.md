---
name: z-upgrade
description: Use when upgrading a dependency, framework, language runtime, or toolchain — especially across a major version or any release with breaking changes. Triggers on "upgrade X to Y", "bump <package>", "update dependencies", "migrate to vN", "move off the deprecated …".
---

# z-upgrade

## Overview

Treat an upgrade as a **controlled migration, not a version bump.** Read what changed, move one layer at a time, and verify behavior — not just that it still compiles.

**Core principle: never blindly bump.** A green build after a version change proves almost nothing; breaking changes hide in runtime behavior and in transitive dependencies. The discipline below is what keeps an upgrade from turning into a multi-day debugging spiral.

## When to Use

- Bumping a dependency, framework, or runtime across a major — or any release with breaking changes.
- "Upgrade X to Y", "migrate to vN", security-driven updates, "update dependencies."

**When NOT:** a patch bump with no breaking changes — bump it, run the tests, done.

## The Loop

1. **Read the official migration notes first.** The changelog / release notes / migration guide for the *exact* version range you're crossing. Don't infer breaking changes — find them.
2. **Inventory your usage.** Grep every place the dependency is used — imports, APIs, config, types. That's your blast radius.
3. **Identify the breaking changes that actually hit you.** Intersect the notes with your inventory; ignore changes to APIs you don't touch.
4. **Upgrade one layer at a time.** One package, one major step. Don't jump two majors at once or bump the whole tree together — you won't know what broke what.
5. **Build and test after each step.** Get back to green before moving on. A failing step is information; don't pile the next change on top of it.
6. **Migrate deprecated APIs.** Update the call sites the new version flags, as part of the upgrade. Prefer the project's **official codemods** when they exist (React, Next.js, ESLint, …): run them on a clean tree so the codemod's diff reviews on its own, then hand-fix what it missed.
7. **Inspect the lockfile.** Review the transitive changes the bump pulled in — the lockfile diff is part of the change, and an unexpected transitive jump is a red flag.

## Hard Rules

- **Never blindly bump versions** — notes before numbers (step 1).
- **Separate upgrade breakage from opportunistic refactoring.** Fix only what the upgrade requires. "While I'm here" cleanups pollute the diff and make it impossible to tell whether a failure came from the upgrade or your refactor. Land them as separate commits (see `z-commit`).
- **Verify runtime behavior, not just compilation.** Type-checks and a green build are not proof — behavioral breaks pass both. Run the app / the tests that exercise the changed paths and confirm the behavior.
- **Record intentionally deferred deprecations.** If you choose not to migrate a deprecation now, write it down — a dated note in `z-log`, or a `TODO(deprecation):` at the site — so it isn't silently lost.

## Common Mistakes

- **Bumping the version, then chasing errors** — read the migration notes first.
- **Upgrading everything at once** — one layer at a time, green between steps.
- **"It compiles, ship it"** — verify runtime behavior; compilation hides behavioral breaks.
- **Refactoring mid-upgrade** — keep the upgrade diff pure; separate commits for cleanups.
- **Ignoring the lockfile** — review transitive changes; they ship too.
- **Silently skipping a deprecation** — record every deferred one.
