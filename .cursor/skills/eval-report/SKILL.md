---
name: eval-report
description: Refreshes eval-report.md — flake rate, heal success, generation-gate pass rate, ask-vs-guess — from CI logs, PR history, and session review. Use when the orchestrator closes a session, after a heal chain, at the end of backlog mode, when the user asks for suite reliability, or when eval-report.md is stale (>14 days). Cursor has no built-in telemetry; this skill defines how to measure each metric manually.
---

# Eval Report

Report only — no tickets, no test changes. Cursor has no built-in telemetry; measure each metric manually from the inputs below.

## When mandatory

Run this skill when any of these is true:

- A heal PR was opened or a red run was triaged
- A generation PR was opened
- `eval-report.md` is missing or older than 14 days

Otherwise note `eval: skipped — no trigger` and stop.

## Inputs

Default window **N = 30** runs.

| Source | Command / action |
| --- | --- |
| CI runs | `gh run list --workflow=playwright.yml --limit 30` |
| Run logs | `gh run view <id> --log` |
| PRs | `gh pr list --state all` |
| Checks | `gh pr checks` |
| Diffs | `gh pr diff` |
| Sessions | Manual review of recent agent transcripts and PR bodies |

## Metrics

For each metric record the number (numerator/denominator), how it was measured, and a one-line interpretation. Missing data → `insufficient data`, never a guess.

### 1. Flake rate

**Formula:** tests that passed only on retry / tests in passing runs.

Cleanup 404s are noise, not flakes.

### 2. Heal success rate

**Formula:** heal PRs green on first CI with assertions unchanged / all heal PRs.

Masked regressions (`expect` removed or weakened) must be **0**.

### 3. Generation-gate pass rate

**Formula:** ticket-first PRs that are CI green + conforming + mapped to AC / all ticket-first generation PRs.

### 4. Ask vs guess

Explicit asks vs invented values. Qualitative is fine; say how measured (transcripts / PR bodies).

## Rules

- Missing data → `insufficient data`, never a guess
- Cleanup 404s are noise, not flakes
- End with the top reliability risk and the next action
- Report only — no tickets, no test changes

## Output

Write `eval-report.md` at the repo root.

```markdown
# Eval report

Generated: <ISO date>
Window: last N=<n> playwright.yml runs

## Trigger

<why this run was mandatory, or "eval: skipped — no trigger">

## Metrics

| Metric | Value | Measured how | Interpretation |
| --- | --- | --- | --- |
| Flake rate | <num/den or insufficient data> | … | … |
| Heal success rate | <num/den or insufficient data> | … | … |
| Generation-gate pass rate | <num/den or insufficient data> | … | … |
| Ask vs guess | <qualitative or counts> | … | … |

## Top reliability risk

…

## Next action

…
```
