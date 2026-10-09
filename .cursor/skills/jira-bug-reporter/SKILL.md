---
name: jira-bug-reporter
description: Analyzes Playwright test failures, identifies root cause, and creates detailed Jira bug tickets. Use when a test fails and needs investigation and bug reporting.
---

# Jira Bug Reporter

## Workflow

1. Read the failure: assertion message, stack trace, screenshot and trace paths under `test-results/`.
2. Confirm it reproduces: re-run the failing test once.
3. Identify the root cause from the spec, the page object, and the app's behavior (BuddyTime's source is not available to us — describe the behavior precisely).
4. Search Jira project `JIRA_PROJECT_KEY` (AQPBT) for a similar open bug before drafting a new one.
5. Draft:
   - **Title** (specific)
   - **Type** Bug
   - **Severity**
   - **Priority**
   - **Steps to reproduce** (numbered, from login, naming which family does what)
   - **Expected** (from the AC or the Confluence page)
   - **Actual**
   - **Environment** (the `APP_URL` host, browser, account role — never an email or password)
   - **Evidence** (screenshot and trace paths)
   - the exact Playwright error
   - **Linked story** (AQPBT-N)
6. Show the draft to the human. File it with the Atlassian MCP only after approval, and link it to the originating story.

## Rules

- Never file for a test issue or a green run.
- Never include credentials.
