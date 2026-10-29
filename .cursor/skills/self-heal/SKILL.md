---
name: self-heal
description: Repairs drifted Playwright locators after a UI change — patch the POM, re-run unchanged assertions, open a PR. Use when the evidence scorer returns act with side drift (or escalate plus a human approval file). NEVER for a real app bug — route those to bug-reporter instead.
---

# Self-Heal

Repairs drifted Playwright locators after a UI change — patch the POM, re-run unchanged assertions, open a PR.

## Prerequisite

The evidence scorer decision on `.test-artifacts/evidence/current.json`:

```bash
npx tsx scripts/score-evidence.ts --verify-only .test-artifacts/evidence/current.json
```

Allowed only when:

- `decision` is `act` and `side` is `drift`, or
- `decision` is `escalate` **and** a human has created
  `.test-artifacts/approvals/<decisionId>.json` by hand.

Do **not** heal from a triage chat label alone. If the decision is `act` + `bug`,
inconclusive, or escalate without an approval file → stop (route bugs to
bug-reporter; otherwise ask the human).

Hooks enforce the same rule on `pages/` writes and `gh pr create` while on a
`heal/` branch — they re-run the scorer and ignore saved decision files.

## Steps

1. From the error and trace, find the failing test, the assertion line (read-only), the POM property that supplied the locator, and the old locator exactly as written.
2. Re-discover the element with `browser_navigate` + `browser_snapshot` against `APP_URL`: same role, current accessible name. Never guess from screenshots.
3. Patch only that locator in the POM (minimal diff; keep role-based; never CSS or XPath; never broaden it to make it pass). One locator per run. Work on branch `heal/<short-description>`.
4. Re-run the failing spec and prove it green with zero changes under `tests/`.
5. Open a PR on branch `heal/<short-description>` with the run id, the scorer `decisionId` / decision / score / rule, the old → new locator diff, the re-run result, and the line `assertions unchanged`. Do not merge.

## Stop and escalate

Stop and escalate if:

- green needs an assertion change
- the same locator error persists after re-discovery
- a new failure looks like a product regression
- the scorer is no longer `act`+`drift` (or escalate without approval)

Route product defects to bug-reporter; do not heal a real app bug.

## Report template

Use this structure in the PR body (and in chat if no PR yet):

```markdown
## Self-heal report

- **Run id:** <CI run id or local>
- **Scorer:** decisionId=<id> decision=act side=drift score=<n> rule=<n>
- **Failing test:** <file>::<title>
- **POM:** <pages/... property>
- **Locator:**
  - old: `<old locator exactly as written>`
  - new: `<new locator exactly as written>`
- **Re-run:** green — `<command>` exit 0
- **assertions unchanged**
```

## Do / Don't

| Do | Don't |
| --- | --- |
| Require scorer `act`+`drift` (or escalate + approval file) before healing | Heal from a chat label, a saved decision file, or `act`+`bug` |
| Re-discover with `browser_navigate` + `browser_snapshot` on `APP_URL` | Guess locators from screenshots |
| Patch one role-based locator in the POM | Change CSS, XPath, or broaden a locator to force a pass |
| Re-run the failing spec with zero edits under `tests/` | Change assertions, soften expects, or edit the spec to go green |
| Open a PR on `heal/<short-description>` and leave it unmerged | Merge the heal PR |
| Escalate when green needs assertion changes, re-discovery fails, or a new failure looks like a product bug | Keep patching until something passes |
