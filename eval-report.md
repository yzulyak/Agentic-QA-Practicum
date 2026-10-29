# Eval report

Generated: 2026-10-29
Window: last N=30 playwright.yml runs (unavailable — see Metrics)

## Trigger

`eval-report.md` was missing (mandatory refresh).

## Metrics

| Metric | Value | Measured how | Interpretation |
| --- | --- | --- | --- |
| Flake rate | insufficient data | `gh run list --workflow=playwright.yml --limit 30` failed (invalid GitHub token); GitHub MCP listed 0 PRs for `yzulyak/Agentic-QA-Practicum` | Too few accessible runs to compute retries vs passing tests |
| Heal success rate | insufficient data | No heal PRs visible via GitHub MCP (`gh pr list` / auth also failed) | Window too small / unreachable — no heal PR denominator |
| Generation-gate pass rate | insufficient data | No ticket-first generation PRs listed via GitHub MCP | Window too small / unreachable — no generation PR denominator |
| Ask vs guess | insufficient data | Session review deferred until CI/PR history is readable; skill forbids estimating | Cannot score asks vs invented values without a measurable sample |

## Top reliability risk

Suite reliability cannot be scored yet: local `gh` auth is invalid and remote PR/run history for this repo is empty or inaccessible, so flake/heal/generation rates have no denominator.

## Next action

Refresh GitHub CLI auth (`gh auth refresh -h github.com`), confirm Actions runs exist for `playwright.yml`, then re-run the eval-report skill once ≥ a handful of completed runs (and any heal/generation PRs) are queryable.
