---
name: second-brain
description: Map the workspace and retrieve from it deterministically. Use ANY time the user asks "where is", "which file", "what did we decide", "find the doc about", or asks to rescan/refresh the brain, open the Agentic OS dashboard, or add a department/app/routine to it. Also use after creating notable new files so the index stays current.
---

# Second Brain

A deterministic retrieval layer over the workspace, plus a visual Agentic OS
dashboard. Three parts, all inside `second-brain/`:

- `scan.js` — walks the workspace, classifies files into departments
  (rules in `os.config.json`), extracts titles/headings, discovers skills
  (`.claude/skills`) and MCP apps, writes `brain/index.json` + `brain/map.js`.
- `brain.js` — answers retrieval questions WITHOUT the model reading files:
  keyword scoring over the index, opens only the winning file, returns only
  the best-matching section, follows pointer links.
- `dashboard.html` — the visual command center (open it in a browser).

## Rules for Claude

1. **Retrieval questions go to brain.js first.** Before any Grep/Glob/Read
   sweep for "where is X / what do we use for Y", run:
   `node second-brain/brain.js "<question>"` — read its output; only fall
   back to normal search if the candidates are clearly wrong.
2. **Keep the index fresh.** After creating or renaming notable files, or
   when brain.js misses something that exists, run
   `node second-brain/scan.js` (fast, safe, idempotent).
3. **Config is the source of truth for the OS view.** Departments, apps,
   routines, micro-apps, skills deck, timezones and agenda live in
   `os.config.json`. Edit that file when the user asks to add/remove any of
   them, then rescan.
4. **Routers over rummaging.** When organizing the workspace, maintain the
   router pattern in `templates/` — a lean root `CLAUDE.md` linking one
   router file per department — instead of deep folder reorganizing.

## Common commands

```bash
node second-brain/scan.js               # rescan workspace (root from config)
node second-brain/scan.js /path/to/ws   # scan a different root
node second-brain/brain.js "question"   # retrieve
node second-brain/brain.js --list "q"   # candidates only
```
