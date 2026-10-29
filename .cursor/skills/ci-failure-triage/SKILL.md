---
name: ci-failure-triage
description: When a CI run is red, pull the run's logs and the playwright-report artifact via GitHub MCP or GH CLI, read the Playwright error and trace, cross-reference the spec, POM, and app source in the repo, write evidence for the scorer, and report the scorer's decision. Use whenever a build fails — even if triage isn't asked for.
---

# CI Failure Triage

## Steps

1. Pull the failed run's logs and the playwright-report artifact (GitHub MCP, or `gh run view <id> --log` and `gh run download <id>`). For a local red run, use the local report and `test-results/`.
2. Read the error: failing test, expected vs received, trace path. Inspect the trace from the command line with `npx playwright trace`. Quote the aria snapshot from the error context when Playwright includes one.
3. Cross-reference the spec, the page object, the story's acceptance criteria, and the Confluence page. BuddyTime's source isn't in this repo; compare against the documented behavior instead.
4. **Write evidence** (never a `score`, `confidence`, or `weight` field):
   - Build `.test-artifacts/evidence/<run>-<test>.json` with shape `{ test: { file, title }, items: [{ id, kind, artifact, line?, excerpt }] }`.
   - Every item must point at a real artifact with `artifact`, and when citing a line include `line` + `excerpt` (≥ 8 characters) that appears on that line.
   - Include required kinds for the path you believe: `failure` (R1), `test_location` (R2), `rerun` (R4); add `pom_location` (R3) when collecting drift-side items; add weighted kinds (D*/B*/N) only when the artifact supports them.
   - Copy that file to `.test-artifacts/evidence/current.json`.
5. **Score** — run (and trust only this invocation, not a saved decision file):

   ```bash
   npx tsx scripts/score-evidence.ts --verify-only .test-artifacts/evidence/current.json
   ```

   Without `--verify-only` when you still need a fresh Playwright re-run for R4 (the scorer re-runs and writes `.test-artifacts/reruns/<decisionId>.json`). A re-run that **passes** is **inconclusive** (flaky / rule 3) — not drift.
6. Report to the parent (and as a PR comment when a PR exists): root cause notes, affected file and line, expected/actual, evidence paths, the scorer JSON (`decision`, `side`, `score`, `rule`, `oracle`, `missing`, `contradictions`, `allowedActions`).

## Decision meanings (from the scorer — do not invent a label)

| Scorer decision | Meaning |
| --- | --- |
| `act` + `side: drift` | Locator/POM drift path — eligible for self-heal |
| `act` + `side: bug` | Real app bug path — eligible for bug-reporter |
| `escalate` | Human must drop `.test-artifacts/approvals/<decisionId>.json` before act-side tools |
| `inconclusive` | Stop — list `missing` / `contradictions` (includes re-run passed → flaky, not drift) |

## Rules

- Never merge or apply a fix yourself.
- Never put `score`, `confidence`, or `weight` in the evidence file — the scorer computes the decision.
- A re-run that passes is **inconclusive**, not drift.
- Downstream skills read `allowedActions` / the decision; they do not trust a chat label.
