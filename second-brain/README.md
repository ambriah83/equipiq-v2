# Second Brain / Agentic OS

A portable second-brain toolkit in the spirit of the ARMS framework
(**A**pplications, **R**outines, **M**emory, **S**kills): it maps your whole
workspace, retrieves from it deterministically (fast + cheap on tokens), and
renders it as a visual command center.

![Agentic OS dashboard](#) <!-- open dashboard.html after scanning -->

## What's in here

| File | Role |
| --- | --- |
| `scan.js` | Indexer. Walks the workspace, classifies every file into a department, extracts markdown titles/headings, discovers Claude Code skills and MCP connectors. Writes `brain/index.json` (retrieval index) and `brain/map.js` (display data). |
| `brain.js` | Deterministic retrieval. Strips a question to keywords, scores every indexed file *without opening any*, opens only the winner, returns only the best section, follows pointer links. No LLM calls. |
| `dashboard.html` | The Agentic OS: central second-brain graph (center router → skills ring → memory sectors → routines ring → applications ring), micro-apps, live calendar/world clocks, skills deck, routines board. Pan, zoom, search, click-to-inspect. |
| `os.config.json` | Your OS: owner/org, departments + colors + match rules, apps, routines, micro-apps, skills deck, timezones, agenda. |
| `SKILL.md` | Drop-in Claude Code skill so Claude uses brain.js before Grep/Glob and keeps the index fresh. |
| `templates/` | Router-file templates (root `CLAUDE.md` + per-department routers). |

## Quick start

```bash
node second-brain/scan.js        # index the workspace
open second-brain/dashboard.html # macOS (Windows: start, Linux: xdg-open)
node second-brain/brain.js "how do I deploy the supabase functions"
```

## Install into your real workspace

The folder is self-contained — no dependencies, plain Node.

1. Copy the whole `second-brain/` folder to the ROOT of the workspace you
   point Claude Code at (e.g. the folder with all your business files).
2. Edit `os.config.json`:
   - `workspaceRoot`: usually `".."` (the parent of this folder).
   - `departments`: your real areas of work; `match` is a list of path
     substrings — first match wins, the empty-match department is the
     catch-all.
   - `apps`, `routines`, `microApps`, `skillsDeck`, `timezones`, `agenda`:
     fill in your world (this copy is pre-filled for Earth Nail Spa).
3. `node second-brain/scan.js` and open `dashboard.html`.
4. Make the skill available: copy `SKILL.md` to
   `.claude/skills/second-brain/SKILL.md` in that workspace (or
   `~/.claude/skills/second-brain/SKILL.md` to make it global).
5. Add the retrieval rule to your root `CLAUDE.md` (see
   `templates/CLAUDE.router.md`) so every session reaches for
   `brain.js` before grepping.

## Why it saves tokens

Default retrieval makes the model glob, grep, open and *read* candidate
files — every byte of which is billed context. `brain.js` does the
candidate-ranking in plain deterministic code against a prebuilt index, and
hands the model only one section of one file. Same answer, a fraction of the
context.

## Keeping it honest

- Rescan whenever the workspace changes meaningfully (`scan.js` runs in
  milliseconds; wire it into a routine if you like).
- The inbox panel ships as a labeled sample — wire it by having a routine
  (e.g. via the Gmail MCP) write real counts into `brain/inbox.json` and
  extending the dashboard, or just leave it off.
- `brain/` is generated output; feel free to gitignore it in your own
  workspace.
