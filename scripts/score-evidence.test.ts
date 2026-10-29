import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const SCORER = path.join(SCRIPT_DIR, 'score-evidence.ts');
const FIXTURES = path.join(SCRIPT_DIR, 'evidence-fixtures');

interface DecisionResult {
  decisionId: string;
  decision: 'act' | 'escalate' | 'inconclusive';
  side: 'drift' | 'bug' | null;
  score: number;
  oracle: boolean;
  verified: string[];
  missing: string[];
  contradictions: string[];
  rule: number;
  allowedActions: string[];
}

function runFixture(caseName: string): DecisionResult {
  const root = path.join(FIXTURES, caseName);
  const evidence = path.join(root, 'evidence.json');
  const result = spawnSync(
    'npx',
    ['tsx', SCORER, evidence, '--verify-only', '--root', root],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { ...process.env },
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `scorer failed for ${caseName} (exit ${result.status}):\n${result.stderr}\n${result.stdout}`,
    );
  }

  return JSON.parse(result.stdout) as DecisionResult;
}

describe('score-evidence fixtures', () => {
  it('min-act-drift: R1–R4, D1 + D2 → drift 60, act (rule 6)', () => {
    const r = runFixture('min-act-drift');
    assert.equal(r.decision, 'act');
    assert.equal(r.side, 'drift');
    assert.equal(r.score, 60);
    assert.equal(r.oracle, true);
    assert.equal(r.rule, 6);
    assert.deepEqual(r.allowedActions, ['self-heal']);
  });

  it('min-act-bug: R1, R2, R4, B1 + B3 → bug 60, act (rule 6)', () => {
    const r = runFixture('min-act-bug');
    assert.equal(r.decision, 'act');
    assert.equal(r.side, 'bug');
    assert.equal(r.score, 60);
    assert.equal(r.oracle, true);
    assert.equal(r.rule, 6);
    assert.deepEqual(r.allowedActions, ['bug-reporter']);
  });

  it('min-escalate: R1–R4, D1 → drift 40, escalate (rule 7)', () => {
    const r = runFixture('min-escalate');
    assert.equal(r.decision, 'escalate');
    assert.equal(r.side, 'drift');
    assert.equal(r.score, 40);
    assert.equal(r.oracle, true);
    assert.equal(r.rule, 7);
    assert.deepEqual(r.allowedActions, ['escalate']);
  });

  it('missing-required: no R4, D1 + D4 → inconclusive (rule 2)', () => {
    const r = runFixture('missing-required');
    assert.equal(r.decision, 'inconclusive');
    assert.equal(r.rule, 2);
    assert.ok(r.missing.includes('R4'));
  });

  it('contradiction: R1–R4, D1 + B2 → inconclusive (rule 4)', () => {
    const r = runFixture('contradiction');
    assert.equal(r.decision, 'inconclusive');
    assert.equal(r.rule, 4);
    assert.ok(r.contradictions.length > 0);
  });

  it('neutral-oracle: R1–R4, N + D2 + D3 → drift 35, no oracle, escalate (rule 7)', () => {
    const r = runFixture('neutral-oracle');
    assert.equal(r.decision, 'escalate');
    assert.equal(r.side, 'drift');
    assert.equal(r.score, 35);
    assert.equal(r.oracle, false);
    assert.equal(r.rule, 7);
  });

  it('flaky: saved re-run passed → inconclusive (rule 3)', () => {
    const r = runFixture('flaky');
    assert.equal(r.decision, 'inconclusive');
    assert.equal(r.rule, 3);
  });

  it('model-score: evidence has confidence → inconclusive (rule 1)', () => {
    const r = runFixture('model-score');
    assert.equal(r.decision, 'inconclusive');
    assert.equal(r.rule, 1);
  });
});
