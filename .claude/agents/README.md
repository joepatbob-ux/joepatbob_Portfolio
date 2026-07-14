# Subagents

Purpose-built agents so a capable orchestrator (Fable/Opus) can fan mechanical
work out to cheaper models automatically, instead of the human shuttling
prompts between chats. Claude Code auto-loads every `*.md` here as a dispatchable
agent; the `model:` frontmatter pins each one to a tier.

## Roster

| Agent         | Model  | Owns                                                                 |
|---------------|--------|---------------------------------------------------------------------|
| `verify`      | haiku  | Runs the green-check gate (lint/types/tests/bundle, optional build). |
| `implementer` | sonnet | Applies a fully-specified, bounded change and self-verifies.         |

## The orchestration pattern

The orchestrator keeps the judgment work (design, root-cause debugging,
deciding the approach) and delegates the rest:

1. Orchestrator writes a **tight spec**: files to touch, the exact change, and
   the acceptance check.
2. Dispatch to `implementer` — it makes the edit, runs `lint && test &&
   check:bundle`, and returns the diff + green/red.
3. Dispatch to `verify` any time you just need the gate re-run (after a merge,
   rebase, or hand edit) without spending orchestrator context on it.
4. If an agent hits ambiguity or a change larger than its spec, it stops and
   returns the blocker — the orchestrator decides, then re-dispatches.

A cheap model succeeds when the task is **bounded and the acceptance check is
explicit**. Keep the spec that tight and delegation stays reliable.

## Green-check gate

Fast: `npm run lint && npm test && npm run check:bundle`
Full: add `npm run build` (build + bundle guard + prerender + strip-deploy).
