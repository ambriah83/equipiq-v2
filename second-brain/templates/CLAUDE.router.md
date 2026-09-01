# CLAUDE.md — workspace router

<!-- Copy this to the ROOT of your workspace (merge with your existing
     CLAUDE.md). It is the hub of the second brain: a small map that lets
     Claude jump straight to the right department instead of searching
     the whole tree. Keep it short — it is loaded on every session. -->

## Retrieval rule (read this first)

Before using Grep/Glob to answer "where is / what is / which do we use"
questions, run the deterministic index first — it is faster and cheaper:

```
node second-brain/brain.js "<the question>"
```

If it misses, fall back to normal search, then run
`node second-brain/scan.js` so the index learns the new files.

## Departments

| Department | Router file | What lives there |
| --- | --- | --- |
| Business | `business/business.md` | clients, finances, legal |
| Content | `content/content.md` | videos, posts, scripts, assets |
| Personal | `personal/personal.md` | life admin, health, travel |

<!-- One row per department. Each router file lists that department's key
     documents, skills, and reference files — see department.router.md. -->

## Standing facts

<!-- 3-10 bullet points of things Claude should always know without
     searching: your name/brand, main tools, where outputs go. -->
