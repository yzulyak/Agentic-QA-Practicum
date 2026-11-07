---
name: api-test-design
description: Designs API test cases as a table a human approves, from api/CATALOG.md, before any test code exists. Use when the user asks what to test for an endpoint or an area of the API, asks for test cases, test ideas, a test plan or coverage. Writes api/test-design/<area>.md and stops for approval. Do NOT use to write test code — that is api-contract-tests.
paths: "api/**"
---

# API test design

Design API test cases as an approval table from `api/CATALOG.md`. Write no test code.

## Steps

1. Read the endpoints of the area in `api/CATALOG.md` only.
2. Write `api/test-design/<area>.md`, one table per endpoint:
   ID | type (positive / negative / error) | what we send | expected status |
   expected body (rule, key values) | source (CATALOG.md row) | technique
3. Positive: characterization from rows labeled `executed` (observed) — the main
   success case, plus one row per observed option or default. Expected status and
   body come only from those executed rows.
4. Negative, with the technique named in its column:
   - boundary values: 0, the smallest valid value, exactly at a limit, one over it
     (one unit more than ordered, one cent more than received);
   - equivalence classes: one row per kind of bad input (missing field, empty string,
     wrong type, negative number);
   - state: the step done in the wrong order or done twice;
   - two families: the same request as the other family on this family's data
     (`apiAlt` on an id `apiMain` created), and with no token (`apiAnonymous`).
5. Errors: only when an executed catalog row recorded the status (and any body).
   An unknown id, a business rule, or any other case with no executed evidence gets
   no expected result — mark the row `assumed — ask` or `not yet tested`.
6. Not observed: a row marked `assumed — ask` or `not yet tested`, with no expected
   result.
7. Stop. Show the table and wait for the human to answer "approved" or ask for changes.
   Write no test code.
