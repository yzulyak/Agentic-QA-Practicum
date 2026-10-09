---
name: api-cleanup
description: Ensures Playwright tests clean up the data they create. Use whenever generating or reviewing tests that create persistent records in the app under test (BuddyTime availability, playdates, invites, or anything else), so test data does not accumulate in the shared test environment. Apply this to every test that creates data — even if cleanup isn't explicitly requested.
paths: "tests/**"
---

# API Cleanup

Ensures Playwright tests clean up the data they create so records do not accumulate in the shared test environment.

## Steps

1. Import test and expect from fixtures/cleanup.fixture.ts, not from @playwright/test.
2. Records created through the UI are tracked automatically from the create response.
   Records created through the API: call trackRecord({ type, id, owner }) right after
   creation, with owner "main" or "alt".
3. No manual afterAll cleanup blocks — the fixture and global teardown handle it.
4. Cleanup uses the delete calls in support/api-client.ts with the owner family's
   storage state. If a record type has no delete call, the spec uses the UI teardown
   agreed in P10 — never leaves it behind.
5. Never hardcode a credential. Never delete data the test did not create.

## Tracked record types

Filled from `support/record-tracker.ts` and `support/api-client.ts` as they exist today.

| type | create request | delete request | owner |
| --- | --- | --- | --- |
| child | POST /api/v1/children | DELETE /api/v1/children/:id | main or alt |
