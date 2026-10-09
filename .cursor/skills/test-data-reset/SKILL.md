---
name: test-data-reset
description: Deletes records that Playwright tests created in the app under test, using the delete calls in support/api-client.ts. Use only when the user explicitly asks to reset test data after an interrupted run left records behind.
disable-model-invocation: true
---

# Test Data Reset

Manual cleanup for records left behind after an interrupted Playwright run. Deletes only what `.test-artifacts/created-records.jsonl` tracked — never invents IDs or deletes untracked data.

## Steps

1. **Confirm intent.** Only proceed when the user explicitly asked to reset test data. If unclear, ask once and stop.
2. **Auth files.** Ensure `playwright/.auth/user.json` and `playwright/.auth/alt-user.json` exist. If either is missing, run the setup project first:
   ```bash
   npx playwright test --project=setup
   ```
3. **Dry-run first** (unless the user already confirmed a live delete):
   ```bash
   npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts --dry-run
   ```
   Optionally narrow with `--type <type>` (types from `support/record-tracker.ts`).
4. Show the dry-run targets and get confirmation before deleting.
5. **Delete:**
   ```bash
   npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts
   ```
   Add `--type <type>` when scoping to one kind.
6. Handle responses:
   - **401** → storage state expired; re-run `npx playwright test --project=setup`, then retry the reset.
   - **404** → already removed; report it as already removed (not a hard failure).
7. Report with the template below. The script prints found / deleted / failed counts and resets the tracker after a live run (not after `--dry-run`).

## Rules

- Reuse `support/api-client.ts` and `support/record-tracker.ts` — do not duplicate API logic.
- Never delete a record the tracker did not record.
- Credentials and tokens come only from storage state / `process.env` — never hardcode secrets.
- This is not a substitute for per-test cleanup (`api-cleanup` skill + fixtures). Use only for leftover data after an interrupted run.

## Result template

```markdown
## Test data reset

- **Scope:** <all | type=…>
- **Found:** <n>
- **Deleted:** <n>
- **Failed:** <n>
```
