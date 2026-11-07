# BuddyTime API catalog

Observed via Playwright MCP against the main family (`bt_token` Bearer JWT from `playwright/.auth/user.json`). Static assets, images, fonts, analytics, and Next.js page data omitted.

| method | path | page that called it | how it's authenticated | status seen | request body fields (writes) | response top-level fields and types | safe for tests? | evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/me` | Dashboard, Friends, Communities, Availability, Playdates, Birthdays, Profile | `Authorization: Bearer <JWT>` from localStorage `bt_token` | 200; content-type `application/json; charset=utf-8`. Without token: **401** | — | `parent` object, `family` object, `isAdmin` boolean | yes | executed |
| GET | `/api/v1/connections` | Dashboard, Friends, Communities, Availability, Playdates, Birthdays, Profile | Bearer JWT | 200; content-type `application/json; charset=utf-8`. Without token: **401** | — | JSON array (empty in session) | yes | executed |
| GET | `/api/v1/availability` | Dashboard, Availability | Bearer JWT | 200; content-type `application/json; charset=utf-8`. Without token: **401** | — | `rules` array, `exceptions` array | yes | executed |
| GET | `/api/v1/playdates?filter=upcoming` | Dashboard | Bearer JWT | 200; content-type `application/json; charset=utf-8`. Without token: **401** | — | JSON array (empty in session) | yes | executed |
| GET | `/api/v1/playdates` | Playdates | Bearer JWT | 200; content-type `application/json; charset=utf-8`. Without token: **401** | — | JSON array (empty in session) | yes | executed |
| GET | `/api/v1/communities` | Dashboard, Communities, Birthdays | Bearer JWT | 200; content-type `application/json; charset=utf-8`. Without token: **401** | — | JSON array (empty in session) | yes | executed |
| GET | `/api/v1/matches?days=21` | Playdates | Bearer JWT | 200; content-type `application/json; charset=utf-8`. Without token: **401** | — | JSON array (empty in session) | yes | executed |
| GET | `/api/v1/events` | Birthdays | Bearer JWT | 200; content-type `application/json; charset=utf-8`. Without token: **401** | — | JSON array (empty in session) | yes | executed |
| POST | `/api/v1/children` | Dashboard | Bearer JWT | 201; content-type `application/json; charset=utf-8` | `firstName` string, `birthYear` number, `birthMonth` number, `avatarKey` string, `interests` array | `id` string, `firstName` string, `birthYear` number, `birthMonth` number, `age` number, `gender` null\|value, `interests` array, `avatarKey` string | yes (undo via DELETE) | executed |
| DELETE | `/api/v1/children/{id}` | Dashboard | Bearer JWT | 204; empty body. Other family (alt on main's id): **400**. Without token: **401** | (none) | empty (owner 204). Cross-family / unauth bodies not asserted | yes (undo of create; auth negatives observed) | executed |
| PATCH | `/api/v1/me` | Profile (POM waitForResponse) | not exercised this session | — | unknown | unknown | no | inspected only |

### Nested shapes glimpsed on executed responses (not asserted beyond top-level above)

- `GET /api/v1/me` → `parent`: `id`, `email`, `name`, `displayName`, `phone`, `emailVerified`; `family`: `id`, `name`, `addressText`, `addressVisibility`, `tz`, `parents` array, `children` array.

### Authorization (two families)

- **executed** — Family B (`altApi`) `DELETE /api/v1/children/{id}` on a child created by family A (`mainApi`) returns **400**; child remains in family A's `GET /api/v1/me` `family.children` and is absent from family B's `/me` (this alt session returned `family: null`).
- **executed** — Anonymous (no token) `DELETE /api/v1/children/{id}` returns **401**; child remains in family A's `GET /api/v1/me`.

## Not yet tested

- Pagination (query params, cursors, page size) on list endpoints
- Error formats for failed writes (validation, conflict); unauthenticated error body fields beyond status 401; cross-family DELETE **400** response body fields
- Rate limits
- Full behavior matrix without a token for writes (POST/PATCH; DELETE covered for children above)
- Non-empty item shapes for `connections`, `communities`, `playdates`, `matches`, `events`, and `family.children` / `family.parents` / `availability.rules` / `availability.exceptions`
- Write APIs for availability, playdates, invites, communities, co-parent
- `PATCH /api/v1/me` request body and response
- Child create with a non-null `gender` selected in the UI
- Content-Type / body for DELETE beyond empty 204 (owner) and beyond status-only for 400/401
- Cross-family access on other resources (connections, availability, playdates, communities, events, matches)
- Whether an alt account with a non-null `family` still omits family A's children (only `family: null` observed for this alt)
