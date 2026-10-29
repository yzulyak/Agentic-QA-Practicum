---
name: jira-bug-reporter
description: Analyzes Playwright test failures, identifies root cause, and creates detailed Jira bug tickets. Use when the evidence scorer returns act with side bug (or escalate plus a human approval file).
---

# Jira Bug Reporter

## Prerequisite

The evidence scorer decision on `.test-artifacts/evidence/current.json`:

```bash
npx tsx scripts/score-evidence.ts --verify-only .test-artifacts/evidence/current.json
```

File a Bug only when:

- `decision` is `act` and `side` is `bug`, or
- `decision` is `escalate` **and** a human has created
  `.test-artifacts/approvals/<decisionId>.json` by hand.

Do **not** file from a triage chat label alone. If the decision is `act`+`drift`,
inconclusive, or escalate without approval → stop.

The `beforeMCPExecution` hook re-runs the scorer before Atlassian
`createJiraIssue` with `issueType: "Bug"` and blocks otherwise. Never test that
gate with a live create.

## Workflow

1. Read the failure: assertion message, stack trace, screenshot and trace paths under `test-results/`.
2. Confirm evidence + scorer still say `act`+`bug` (or escalate + approval).
3. Identify the root cause from the spec, the page object, and the app's behavior (BuddyTime's source is not available to us — describe the behavior precisely).
4. Search Jira project `JIRA_PROJECT_KEY` (AQPBT) for a similar open bug before drafting a new one.
5. Draft:
   - **Title** (specific)
   - **Type** Bug (`issueType` field on `createJiraIssue` — exact name in AQPBT: `Bug`)
   - **Severity**
   - **Priority**
   - **Steps to reproduce** (numbered, from login, naming which family does what)
   - **Expected** (from the AC or the Confluence page)
   - **Actual**
   - **Environment** (the `APP_URL` host, browser, account role — never an email or password)
   - **Evidence** (screenshot and trace paths; evidence JSON path; scorer `decisionId`)
   - the exact Playwright error
   - **Linked story** (AQPBT-N)
6. Show the draft to the human. File it with the Atlassian MCP `createJiraIssue` only after approval, and link it to the originating story.

## Rules

- Never file for drift, inconclusive, escalate-without-approval, or a green run.
- Never include credentials.
- Never write under `.test-artifacts/approvals/` (humans only).
