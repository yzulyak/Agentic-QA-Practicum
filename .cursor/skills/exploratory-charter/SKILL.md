---
name: exploratory-charter
description: Turns a feature name and a risk into a session charter and a blank findings template. Use when the user asks for an exploratory charter, session charter, exploratory testing plan, or wants to structure a time-boxed exploration before or after clicking through the app. The tester supplies the thinking; this skill only enforces the format.
---

# Exploratory Charter

Format only — never invent risks, oracles, or findings. The tester supplies the thinking; this skill only enforces the format.

## Inputs

**Required** (ask if missing):

- Feature
- Risk

**Optional:**

- Time box
- Scope in / out
- Ticket key
- Confluence page
- Page URL

## Steps

1. Confirm required inputs. Stop and ask for any that are missing. Do not invent them.
2. Fill only fields the human provided. Leave human-owned sections blank or as placeholders for the tester to complete.
3. Save as `charters/<feature-slug>.md` (kebab-case slug from the feature name).
4. Stop. Do not write specs, file bugs, or run tests.

## Charter + findings template

Write this file shape. Leave Oracles, Areas to probe, Notes before start, Findings rows, and Coverage for the human — do not invent content there.

```markdown
# Exploratory charter: <feature>

## Charter

| Field | Value |
| --- | --- |
| Feature | <feature> |
| Risk | <risk> |
| Time box | <optional or blank> |
| In scope | <optional or blank> |
| Out of scope | <optional or blank> |
| Ticket | <optional or blank> |

### Mission

Explore <feature> with attention to <risk>.

### Oracles (human)

-

### Areas to probe (human)

-

### Notes before start

-

## Findings

| # | Type (bug / question / note) | Area | Observation | Severity | Follow-up |
| --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |

## Coverage

- Tried:
- Not tried:
- Charter done?
```

## Do / Don't

| Do | Don't |
| --- | --- |
| Ask for feature and risk when missing | Invent risks, oracles, findings, or severity |
| Fill only human-supplied optional fields | Pretend optional context was provided |
| Save to `charters/<feature-slug>.md` | Write specs, file bugs, or run tests |
| Leave Oracles / Areas / Findings / Coverage blank for the tester | Fill human sections with guessed content |
