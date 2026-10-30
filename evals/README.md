# Agent evals

Each agent under `evals/<agent>/` has an `answer-key.json` of `{ id, input, expected }` cases (`expected`: `drift` | `bug` | `ambiguous`).
A scoring pass writes `runs/<date>-<n>.json` with `{ model, startedAt, finishedAt, predictions: [{ id, predicted, evidence }] }`.
Run `npx tsx evals/score.ts <agent>` to score every run against the key (precision, recall, accuracy, false positives, cross-run agreement).
The agent under test must never read `answer-key.json` during a run; only `score.ts` and humans may.
Fill cases yourself — do not let an agent edit the answer key.
