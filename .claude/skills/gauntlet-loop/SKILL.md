---
name: gauntlet-loop
description: Generate and run a "gauntlet loop" - a fan-out-and-verify prompt pattern where builder subagents each get a blind critic partner and iteration continues until a concrete quality bar is met. Use when the user says "gauntlet", "gauntlet loop", "fan out subagents on this", "loop until it's perfect", "polish this until a critic is wowed", or wants a showcase-quality build (game, 3D scene, landing page, dashboard, report) beyond a normal one-pass result.
---

# Gauntlet Loop

A quality-maximizing orchestration pattern with three parts:

1. **Task** — what to build, in one sentence.
2. **Build method** — break the goal into the smallest independent pieces,
   fan out one builder subagent per piece, and pair EVERY builder with a
   separate blind critic subagent that judges only the output (screenshots,
   rendered result, running behavior — never the builder's reasoning).
3. **Bar** — a concrete external reference the critics compare against.
   Iteration continues until every critic passes the bar or the round cap
   is hit.

## Before starting — the MVP rule

A gauntlet loop POLISHES; it does not choose direction. If it starts from
nothing, it optimizes toward the wrong thing beautifully. So:

- If a design system, brand guide, or MVP exists (for Earth work: the
  `earth-design-system` and `earth-brand-guide` skills), load it and pin
  the loop to it in the Task line.
- If none exists, build a quick single-pass MVP first, confirm direction
  with the user, THEN run the gauntlet as the version-2 polish pass.
- Warn the user once: gauntlet runs are long and token-heavy. Default to a
  round cap of 3 unless they ask for a showcase run.

## The prompt template

When asked to *generate* a gauntlet loop prompt (for the user to paste
elsewhere), fill this in — keep it to three lines like the original:

```
Build <TASK>, matching <MVP / design system / reference> exactly.
Break the goal into the smallest independent pieces and fan out one
subagent per piece; give every builder a separate blind critic subagent
that reviews the actual output (screenshots/renders, not descriptions).
Do not stop until every critic is utterly wowed when comparing the result
against <CONCRETE BAR, e.g. "the reference photos" / "Call of Duty">,
or after <N> rounds — then report each critic's verdict.
```

## Running it here (Claude Code)

Invoking this skill is the user's opt-in to multi-agent orchestration.

- Fan out builders with the Agent tool (parallel, one per piece). For each
  completed piece, spawn a fresh critic agent whose prompt contains ONLY
  the bar and the artifacts to judge (paths/screenshots) — no builder
  context — and demands a PASS/FAIL verdict with specific defects.
- Where the Workflow tool is available, prefer a pipeline: build phase →
  critic phase → fix phase, so each piece re-enters the loop as soon as
  its verdict lands.
- Verify visually when the deliverable is visual: render with headless
  Chromium and hand critics real screenshots, not source code.
- Stop conditions: all critics PASS, or the round cap. Always end with a
  per-piece verdict table and what remains unfixed.
