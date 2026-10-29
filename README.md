# Agentic QA Practicum

**BuddyTime** is a shared test site where parents manage kids, their circle, playdates, communities, and calendar. Stories live in **Jira project AQPBT**; feature pages live in **Confluence space AQPBT**.

## Prerequisites

- Node.js **20+**

## Install

```bash
npm ci
npx playwright install --with-deps chromium
```

## Environment

```bash
cp .env.example .env
```

| Section | Vars | Needed for |
| --- | --- | --- |
| Run tests | `APP_URL`, `APP_USER_EMAIL`, `APP_USER_PASSWORD` | Playwright `baseURL` and auth setup for the main family |
| Run tests (optional second family) | `APP_ALT_USER_EMAIL`, `APP_ALT_USER_PASSWORD` | Flows that need two parents; tests that need them skip if unset |
| Agent / CI only | `CURSOR_API_KEY`, `ATLASSIAN_*`, `JIRA_PROJECT_KEY`, `CONFLUENCE_SPACE_KEY` | Headless agent / backlog workflows — **not** required for `npx playwright test` alone |

Two family accounts exist so multi-parent flows (e.g. circle / playdate invites between families) can run against isolated Family A and Family B credentials.

## Run tests

```bash
# Full suite
npx playwright test

# App project only (skips setup project by name; still depends on setup via config)
npx playwright test --project=app

# Tagged slices
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive

# Single file
npx playwright test tests/path/to/spec.ts

# HTML report
npx playwright show-report
```

## CI triggers

| Event | Slice |
| --- | --- |
| `push` | sanity (`npm run test:sanity`) |
| `pull_request` | smoke (`npm run test:smoke`) |
| `workflow_dispatch` | full suite (`npx playwright test`) |

Workflow: `.github/workflows/playwright.yml`.

## Agent parts

| Path | Role |
| --- | --- |
| `.cursor/rules` | Always-on constitution, Playwright conventions, and QA orchestrator workflow |
| `.cursor/skills` | Repeatable playbooks (ticket → Gherkin, triage, heal, cleanup, eval-report, …) |
| `.cursor/agents` | Specialist subagents: `test-writer`, `triage`, `bug-reporter` |
| `.cursor/hooks` | After-edit guards that block weakened assertions and constitution violations |

## MCP setup

Configure **Atlassian** and **GitHub** MCP servers in **Cursor Settings** (IDE). Do **not** put MCP credentials in `.env` for local IDE use — `.env` Atlassian vars are for agent/CI scripts only.

## Typical flow

The orchestrator reads a Jira story (and its Confluence page), turns acceptance criteria into a plan under `features/`, and delegates `test-writer` to author a Playwright spec. On a red run, `triage` classifies drift vs real bug; drift goes to self-heal (POM only), bugs go to `bug-reporter` after human approval. Humans approve every merge and every filed bug.
