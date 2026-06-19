# Visual Companion

A browser tab for showing mockups, diagrams, and side-by-side comparisons during ideation. The user looks and **replies in chat** — there's no click-capture or auth, just a live preview that reloads as you push new screens.

## When to reach for it

Decide per question. The test: **would the user understand this better seeing it than reading it?**

- **Use it** for visual content — UI mockups, layout comparisons, architecture/flow diagrams, color/style directions, "which of these looks right."
- **Stay in the terminal** for text — requirements, scope, conceptual A/B/C choices, tradeoff tables, API/data-model decisions.

A question *about* a UI topic isn't automatically visual. "What kind of dashboard?" is conceptual (terminal). "Which of these two dashboard layouts?" is visual (browser).

## Start it

Launch the server in the background so it survives across turns. Pass an explicit `--dir` so you know where to find its info file and where to write screens:

```bash
SESSION="${TMPDIR:-/tmp}/z-build-visual"
node <skill-dir>/server.js --dir "$SESSION"
```

Run it with **background execution** (in Claude Code: `run_in_background: true`). It prints — and writes to `$SESSION/server-info.json` — a JSON blob:

```json
{ "url": "http://127.0.0.1:52341/", "contentDir": ".../content", "pid": 4242 }
```

Read `server-info.json` to get `url` and `contentDir`. **Do not auto-open a browser — just give the user the `url`.** That lets them open it where they want; in VS Code, the **Simple Browser** (Command Palette → "Simple Browser: Show") opens it in a pane right beside the chat. (An optional `--open` flag exists to auto-launch the system browser, but don't pass it by default.)

## The loop

1. **Write an HTML fragment** to a *new* file in `contentDir` (e.g. `layout.html`). Use your file-writing tool — never `cat`/heredoc. The server serves the newest file by mtime and the open tab live-reloads on its own.
2. **Tell the user** the URL, a one-line summary of what's on screen ("3 homepage layouts"), and ask them to look and reply in chat. Then **end your turn.**
3. **Iterate** by writing a new file (`layout-v2.html`) — never reuse a filename. Only advance when the current question is settled.
4. When you move back to a text discussion, push a `waiting.html` ("Continuing in terminal…") so the user isn't staring at a resolved choice.

## Writing fragments

Write just the inner content — the server wraps it in a themed frame (header, dark theme, CSS, live-reload client). No `<html>`, `<style>`, or `<script>` needed. (If a file *does* start with `<!doctype>`/`<html>`, it's served as-is with only the reload client injected.)

The companion is a **pure viewer** — screens are for reading, not clicking. Nothing is interactive; the user makes their choice in chat. Available classes (all optional):

```html
<h2>Title</h2><p class="subtitle">The question being asked</p>

<!-- A/B/C options -->
<div class="options">
  <div class="option">
    <div class="letter">A</div><div class="content"><h3>Name</h3><p>Detail</p></div>
  </div>
</div>

<!-- side-by-side mockups -->
<div class="split">
  <div class="mockup"><div class="mockup-header">Option A</div><div class="mockup-body">…</div></div>
  <div class="mockup"><div class="mockup-header">Option B</div><div class="mockup-body">…</div></div>
</div>

<!-- wireframe blocks: .mock-nav .mock-sidebar .mock-content .mock-button .mock-input .placeholder -->
<!-- also: .cards/.card/.card-image/.card-body, .pros-cons/.pros/.cons, .section, .label -->
```

## Tips

- 2–4 options per screen; explain the question on the page, not just "pick one."
- Scale fidelity to the question — wireframes for layout, real polish for look-and-feel.
- Use real content when it matters (e.g. actual images for a gallery); placeholders hide design problems.

## Stop it

```bash
kill "$(node -e "process.stdout.write(String(require('$SESSION/server-info.json').pid))")"
```

It also self-exits after the idle timeout (default 240 min) with no connected clients, so a forgotten server won't linger. The temp dir is disposable — nothing lands in the repo.
