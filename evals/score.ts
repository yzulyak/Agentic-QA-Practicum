#!/usr/bin/env npx tsx
/**
 * Score agent predictions against an answer key.
 *
 * Usage: npx tsx evals/score.ts <agent>
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const CLASSES = ['drift', 'bug', 'ambiguous'] as const;
type ClassLabel = (typeof CLASSES)[number];

interface AnswerCase {
  id: string;
  input: unknown;
  expected: ClassLabel;
}

interface Prediction {
  id: string;
  predicted: ClassLabel;
  evidence: string;
}

interface RunFile {
  model: string;
  startedAt: string;
  finishedAt: string;
  predictions: Prediction[];
}

interface ClassCounts {
  tp: number;
  fp: number;
  fn: number;
}

// ---------------------------------------------------------------------------
// Paths / I/O
// ---------------------------------------------------------------------------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

function isClassLabel(value: unknown): value is ClassLabel {
  return typeof value === 'string' && (CLASSES as readonly string[]).includes(value);
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function loadAnswerKey(agentDir: string): AnswerCase[] {
  const keyPath = path.join(agentDir, 'answer-key.json');
  if (!existsSync(keyPath)) {
    throw new Error(`Answer key not found: ${keyPath}`);
  }
  const raw = readJsonFile(keyPath);
  if (!Array.isArray(raw)) {
    throw new Error(`Answer key must be an array: ${keyPath}`);
  }
  const cases: AnswerCase[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Invalid answer-key entry in ${keyPath}`);
    }
    const entry = item as Record<string, unknown>;
    if (typeof entry.id !== 'string' || !isClassLabel(entry.expected)) {
      throw new Error(`Invalid answer-key case in ${keyPath}: need id + expected in ${CLASSES.join('|')}`);
    }
    cases.push({
      id: entry.id,
      input: entry.input,
      expected: entry.expected,
    });
  }
  return cases;
}

function loadRuns(agentDir: string): { file: string; run: RunFile }[] {
  const runsDir = path.join(agentDir, 'runs');
  if (!existsSync(runsDir)) {
    return [];
  }
  const files = readdirSync(runsDir)
    .filter((name) => name.endsWith('.json'))
    .sort();
  const runs: { file: string; run: RunFile }[] = [];
  for (const name of files) {
    const filePath = path.join(runsDir, name);
    const raw = readJsonFile(filePath);
    if (typeof raw !== 'object' || raw === null) {
      throw new Error(`Invalid run file: ${filePath}`);
    }
    const obj = raw as Record<string, unknown>;
    if (
      typeof obj.model !== 'string' ||
      typeof obj.startedAt !== 'string' ||
      typeof obj.finishedAt !== 'string' ||
      !Array.isArray(obj.predictions)
    ) {
      throw new Error(`Run file missing required fields: ${filePath}`);
    }
    const predictions: Prediction[] = [];
    for (const p of obj.predictions) {
      if (typeof p !== 'object' || p === null) {
        throw new Error(`Invalid prediction in ${filePath}`);
      }
      const pred = p as Record<string, unknown>;
      if (
        typeof pred.id !== 'string' ||
        !isClassLabel(pred.predicted) ||
        typeof pred.evidence !== 'string'
      ) {
        throw new Error(
          `Invalid prediction in ${filePath}: need id, predicted (${CLASSES.join('|')}), evidence`,
        );
      }
      predictions.push({
        id: pred.id,
        predicted: pred.predicted,
        evidence: pred.evidence,
      });
    }
    runs.push({
      file: name,
      run: {
        model: obj.model,
        startedAt: obj.startedAt,
        finishedAt: obj.finishedAt,
        predictions,
      },
    });
  }
  return runs;
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

function emptyCounts(): Record<ClassLabel, ClassCounts> {
  return {
    drift: { tp: 0, fp: 0, fn: 0 },
    bug: { tp: 0, fp: 0, fn: 0 },
    ambiguous: { tp: 0, fp: 0, fn: 0 },
  };
}

function ratio(numerator: number, denominator: number): string {
  if (denominator === 0) {
    return 'n/a';
  }
  return (numerator / denominator).toFixed(3);
}

function score(
  keyById: Map<string, ClassLabel>,
  runs: { file: string; run: RunFile }[],
): {
  counts: Record<ClassLabel, ClassCounts>;
  correct: number;
  total: number;
  unknownIds: string[];
  agreement: number | null;
  agreementDenom: number;
} {
  const counts = emptyCounts();
  let correct = 0;
  let total = 0;
  const unknownIds: string[] = [];

  for (const { file, run } of runs) {
    for (const pred of run.predictions) {
      const expected = keyById.get(pred.id);
      if (expected === undefined) {
        unknownIds.push(`${file}:${pred.id}`);
        continue;
      }
      total += 1;
      if (pred.predicted === expected) {
        correct += 1;
        counts[pred.predicted].tp += 1;
      } else {
        counts[pred.predicted].fp += 1;
        counts[expected].fn += 1;
      }
    }
  }

  // Agreement: share of key cases present in every run where all runs agree.
  let agreement: number | null = null;
  let agreementDenom = 0;
  if (runs.length >= 1) {
    const caseIds = [...keyById.keys()];
    let agree = 0;
    for (const id of caseIds) {
      const preds: ClassLabel[] = [];
      let missing = false;
      for (const { run } of runs) {
        const hit = run.predictions.find((p) => p.id === id);
        if (!hit) {
          missing = true;
          break;
        }
        preds.push(hit.predicted);
      }
      if (missing || preds.length === 0) {
        continue;
      }
      agreementDenom += 1;
      if (preds.every((p) => p === preds[0])) {
        agree += 1;
      }
    }
    agreement = agreementDenom === 0 ? null : agree / agreementDenom;
  }

  return { counts, correct, total, unknownIds, agreement, agreementDenom };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const agent = process.argv[2];
  if (!agent || agent.startsWith('-')) {
    console.error('Usage: npx tsx evals/score.ts <agent>');
    process.exit(1);
  }

  const agentDir = path.join(ROOT, agent);
  if (!existsSync(agentDir)) {
    console.error(`Agent directory not found: ${agentDir}`);
    process.exit(1);
  }

  const cases = loadAnswerKey(agentDir);
  const keyById = new Map<string, ClassLabel>();
  for (const c of cases) {
    if (keyById.has(c.id)) {
      console.error(`Duplicate id in answer key: ${c.id}`);
      process.exit(1);
    }
    keyById.set(c.id, c.expected);
  }

  const runs = loadRuns(agentDir);
  if (runs.length === 0) {
    console.error(`No run files in ${path.join(agentDir, 'runs')}`);
    process.exit(1);
  }

  const { counts, correct, total, unknownIds, agreement, agreementDenom } = score(
    keyById,
    runs,
  );

  if (unknownIds.length > 0) {
    console.error('Run references id(s) not in answer key:');
    for (const u of unknownIds) {
      console.error(`  ${u}`);
    }
    process.exit(1);
  }

  console.log(`Agent: ${agent}`);
  console.log(`Answer-key cases: ${cases.length}`);
  console.log(`Runs: ${runs.length} (${runs.map((r) => r.file).join(', ')})`);
  console.log('');
  console.log('Per-class precision / recall / false positives:');
  for (const label of CLASSES) {
    const { tp, fp, fn } = counts[label];
    console.log(
      `  ${label}: precision=${ratio(tp, tp + fp)} recall=${ratio(tp, tp + fn)} fp=${fp}`,
    );
  }
  console.log('');
  console.log(`Overall accuracy: ${ratio(correct, total)} (${correct}/${total})`);
  console.log(
    `Agreement across runs: ${
      agreement === null ? 'n/a' : agreement.toFixed(3)
    } (${agreementDenom === 0 ? '0/0' : `${Math.round((agreement ?? 0) * agreementDenom)}/${agreementDenom}`})`,
  );
}

main();
