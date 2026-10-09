---
name: ci-failure-triage
description: When a CI run is red, pull the run's logs and the playwright-report artifact via GitHub MCP or GH CLI, read the Playwright error and trace, cross-reference the spec, POM, and app source in the repo, classify real app bug vs test issue, and post a structured diagnosis to the PR. Use whenever a build fails — even if triage isn't asked for.
---

# CI Failure Triage

## Steps

1. Pull the failed run's logs and the playwright-report artifact (GitHub MCP, or `gh run view <id> --log` and `gh run download <id>`). For a local red run, use the local report and `test-results/`.
2. Read the error: failing test, expected vs received, trace path. Inspect the trace from the command line with `npx playwright trace`. Quote the aria snapshot from the error context when Playwright includes one.
3. Cross-reference the spec, the page object, the story's acceptance criteria, and the Confluence page. BuddyTime's source isn't in this repo; compare against the documented behavior instead.
4. Classify exactly one: test issue (drift) | real app bug | ambiguous.
5. Report: root cause, affected file and line, expected/actual, suggested fix, and evidence (trace or screenshot path, run id) — as a PR comment when a PR exists, otherwise to the parent agent.

## Rules

- Never merge or apply a fix yourself.
- A real defect goes to jira-bug-reporter.
- The diagnosis names the location and the cause, not just the symptom.
