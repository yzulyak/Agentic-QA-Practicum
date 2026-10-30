---
name: score-agent
description: Scores an agent against an answer key and appends the result to eval-report.md. Use when the user asks how accurate an agent is, wants to score triage, self-heal, or test generation, or after cases are added to an evals/*/answer-key.json.
---

# Score agent

Put a number on an agent by running it against `evals/<agent>/answer-key.json` without showing it the key, then scoring the predictions.

## Rule

The agent under test **never** reads `answer-key.json` during a run. Only humans and `evals/score.ts` may open the key.

## Steps

1. Confirm `evals/<agent>/answer-key.json` has cases (`{ id, input, expected }` with `expected` in `drift` | `bug` | `ambiguous`). Stop if empty.
2. For each case, run the agent once on `input` only. Collect `{ id, predicted, evidence }` — do not pass or hint `expected`.
3. Write one run file: `evals/<agent>/runs/<YYYY-MM-DD>-<n>.json` with
   `{ model, startedAt, finishedAt, predictions: [{ id, predicted, evidence }] }`.
   Choose `<n>` as the next unused integer for that date.
4. Repeat steps 2–3 **N** times (default **N = 3**) so agreement can be measured.
5. Run `npx tsx evals/score.ts <agent>`.
6. Append a dated **Agent accuracy** section to `eval-report.md` with:
   - agent name and model
   - N, case count, run file names
   - per-class precision and recall, overall accuracy, false positives per class, cross-run agreement
   - one line on how they were measured (answer key + run files; agent never saw the key)

## Layout

```
evals/<agent>/answer-key.json
evals/<agent>/runs/<date>-<n>.json
evals/score.ts
evals/README.md
```
