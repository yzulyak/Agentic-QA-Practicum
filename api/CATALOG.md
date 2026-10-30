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
| DELETE | `/api/v1/children/{id}` | Dashboard | Bearer JWT | 204; empty body | (none) | empty | yes (undo of create) | executed |
| PATCH | `/api/v1/me` | Profile (POM waitForResponse) | not exercised this session | — | unknown | unknown | no | inspected only |

### Nested shapes glimpsed on executed responses (not asserted beyond top-level above)

- `GET /api/v1/me` → `parent`: `id`, `email`, `name`, `displayName`, `phone`, `emailVerified`; `family`: `id`, `name`, `addressText`, `addressVisibility`, `tz`, `parents` array, `children` array.

## Not yet tested

- Pagination (query params, cursors, page size) on list endpoints
- Error formats for failed writes (validation, conflict); unauthenticated error body fields beyond status 401
- Rate limits
- Full behavior matrix without a token for writes (POST/PATCH/DELETE)
- Non-empty item shapes for `connections`, `communities`, `playdates`, `matches`, `events`, and `family.children` / `family.parents` / `availability.rules` / `availability.exceptions`
- Write APIs for availability, playdates, invites, communities, co-parent
- `PATCH /api/v1/me` request body and response
- Child create with a non-null `gender` selected in the UI
- Content-Type / body for DELETE beyond empty 204
