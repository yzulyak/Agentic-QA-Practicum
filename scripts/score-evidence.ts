#!/usr/bin/env npx tsx
/**
 * Evidence scorer — decision is computed in code from verified artifacts.
 * The model never reports a score.
 *
 * Usage: npx tsx scripts/score-evidence.ts <evidence.json> [--verify-only] [--root <dir>]
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Side = 'drift' | 'bug';

interface EvidenceItem {
  id: string;
  kind: string;
  artifact: string;
  line?: number;
  excerpt?: string;
}

interface EvidenceFile {
  test: { file: string; title: string };
  items: EvidenceItem[];
  [key: string]: unknown;
}

interface RequiredRule {
  id: string;
  kind: string;
  whenSide?: Side;
}

interface WeightedRule {
  id: string;
  kind: string;
  side: Side | null;
  weight: number;
  oracle: boolean;
}

interface Rubric {
  required: RequiredRule[];
  weighted: WeightedRule[];
  thresholds: {
    act: number;
    escalate: number;
    actRequiresOracle: boolean;
  };
}

type Decision = 'act' | 'escalate' | 'inconclusive';

interface DecisionResult {
  decisionId: string;
  decision: Decision;
  side: Side | null;
  score: number;
  oracle: boolean;
  verified: string[];
  missing: string[];
  contradictions: string[];
  rule: number;
  allowedActions: string[];
}

interface VerifyResult {
  verified: boolean;
  reason?: string;
}

interface RerunInfo {
  passed: boolean;
  firstErrorLine: string | null;
  reportPath: string;
}

// ---------------------------------------------------------------------------
// Paths / CLI
// ---------------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const RUBRIC_PATH = path.join(REPO_ROOT, 'config', 'evidence-rubric.json');

const GIT_CHECKED_PREFIXES = ['tests/', 'pages/', 'features/'];
const FORBIDDEN_SCORE_KEYS = new Set(['score', 'confidence', 'weight']);

interface CliArgs {
  evidencePath: string;
  verifyOnly: boolean;
  root: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let evidencePath: string | null = null;
  let verifyOnly = false;
  let root: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--verify-only') {
      verifyOnly = true;
    } else if (a === '--root') {
      const next = args[++i];
      if (!next) throw new Error('--root requires a directory');
      root = path.resolve(next);
    } else if (a.startsWith('-')) {
      throw new Error(`Unknown flag: ${a}`);
    } else if (!evidencePath) {
      evidencePath = path.resolve(a);
    } else {
      throw new Error(`Unexpected argument: ${a}`);
    }
  }

  if (!evidencePath) {
    throw new Error(
      'Usage: npx tsx scripts/score-evidence.ts <evidence.json> [--verify-only] [--root <dir>]',
    );
  }

  return { evidencePath, verifyOnly, root };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decisionIdFromBytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 12);
}

function loadRubric(): Rubric {
  return JSON.parse(readFileSync(RUBRIC_PATH, 'utf8')) as Rubric;
}

function deepHasForbiddenScoreField(value: unknown, pathKeys: string[] = []): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = deepHasForbiddenScoreField(value[i], [...pathKeys, String(i)]);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_SCORE_KEYS.has(k)) {
        return [...pathKeys, k].join('.');
      }
      const hit = deepHasForbiddenScoreField(v, [...pathKeys, k]);
      if (hit) return hit;
    }
  }
  return null;
}

function resolveArtifact(artifact: string, root: string | null): string {
  if (path.isAbsolute(artifact)) return artifact;
  return path.resolve(root ?? process.cwd(), artifact);
}

function repoRelativePosix(absPath: string, root: string | null): string {
  const base = root ?? REPO_ROOT;
  const rel = path.relative(base, absPath);
  return rel.split(path.sep).join('/');
}

function isGitCheckedPath(relPosix: string): boolean {
  return GIT_CHECKED_PREFIXES.some(
    (p) => relPosix === p.slice(0, -1) || relPosix.startsWith(p),
  );
}

function readGitHeadFile(relPosix: string): string | null {
  try {
    return execFileSync('git', ['show', `HEAD:${relPosix}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function readArtifactContent(
  absPath: string,
  root: string | null,
): { ok: true; content: string } | { ok: false; reason: string } {
  if (!existsSync(absPath)) {
    return { ok: false, reason: `artifact missing: ${absPath}` };
  }

  const disk = readFileSync(absPath, 'utf8');

  if (root) {
    return { ok: true, content: disk };
  }

  const rel = repoRelativePosix(absPath, null);
  if (isGitCheckedPath(rel)) {
    const head = readGitHeadFile(rel);
    if (head === null) {
      return { ok: false, reason: `not in HEAD: ${rel}` };
    }
    if (head !== disk) {
      return { ok: false, reason: `differs from HEAD: ${rel}` };
    }
  }

  return { ok: true, content: disk };
}

function lineContainsExcerpt(
  content: string,
  line: number,
  excerpt: string,
): VerifyResult {
  if (excerpt.length < 8) {
    return { verified: false, reason: 'excerpt shorter than 8 characters' };
  }
  const lines = content.split(/\r?\n/);
  if (line < 1 || line > lines.length) {
    return { verified: false, reason: `line ${line} out of range` };
  }
  if (!lines[line - 1].includes(excerpt)) {
    return {
      verified: false,
      reason: `line ${line} does not contain excerpt`,
    };
  }
  return { verified: true };
}

function verifyStaticItem(
  item: EvidenceItem,
  root: string | null,
): VerifyResult {
  const abs = resolveArtifact(item.artifact, root);
  const read = readArtifactContent(abs, root);
  if (!read.ok) return { verified: false, reason: read.reason };

  if (item.line !== undefined) {
    if (item.excerpt === undefined) {
      return { verified: false, reason: 'cited line without excerpt' };
    }
    return lineContainsExcerpt(read.content, item.line, item.excerpt);
  }

  return { verified: true };
}

// ---------------------------------------------------------------------------
// Playwright JSON report helpers
// ---------------------------------------------------------------------------

interface PlaywrightError {
  message?: string;
  stack?: string;
}

function collectResults(node: unknown, out: { status?: string; errors: PlaywrightError[] }[]): void {
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;

  if (Array.isArray(obj.results)) {
    for (const r of obj.results) {
      if (r && typeof r === 'object') {
        const result = r as Record<string, unknown>;
        const errors = Array.isArray(result.errors)
          ? (result.errors as PlaywrightError[])
          : [];
        out.push({
          status: typeof result.status === 'string' ? result.status : undefined,
          errors,
        });
      }
    }
  }

  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) {
      for (const child of v) collectResults(child, out);
    } else if (v && typeof v === 'object') {
      collectResults(v, out);
    }
  }
}

function firstErrorLineFromReport(report: unknown): string | null {
  const results: { status?: string; errors: PlaywrightError[] }[] = [];
  collectResults(report, results);
  for (const r of results) {
    for (const err of r.errors) {
      const msg = err.message ?? err.stack ?? '';
      const line = msg.split(/\r?\n/).find((l) => l.trim().length > 0);
      if (line) return line.trim();
    }
  }
  // Top-level errors array (playwright JSON reporter)
  if (report && typeof report === 'object') {
    const top = report as { errors?: PlaywrightError[] };
    if (Array.isArray(top.errors)) {
      for (const err of top.errors) {
        const msg = err.message ?? err.stack ?? '';
        const line = msg.split(/\r?\n/).find((l) => l.trim().length > 0);
        if (line) return line.trim();
      }
    }
  }
  return null;
}

function reportPassed(report: unknown): boolean {
  const results: { status?: string; errors: PlaywrightError[] }[] = [];
  collectResults(report, results);
  if (results.length === 0) {
    // Empty / stats-only: treat unexpected as not passed
    return false;
  }
  return results.every((r) => r.status === 'passed' || r.status === 'skipped');
}

function artifactsBase(root: string | null): string {
  return root ?? REPO_ROOT;
}

function rerunReportPath(decisionId: string, root: string | null): string {
  return path.join(artifactsBase(root), '.test-artifacts', 'reruns', `${decisionId}.json`);
}

function decisionOutPath(decisionId: string, root: string | null): string {
  return path.join(artifactsBase(root), '.test-artifacts', 'decisions', `${decisionId}.json`);
}

function executePlaywrightRerun(
  evidence: EvidenceFile,
  decisionId: string,
  root: string | null,
): RerunInfo {
  const reportPath = rerunReportPath(decisionId, root);
  mkdirSync(path.dirname(reportPath), { recursive: true });

  let stdout = '';
  let exitCode = 0;
  try {
    stdout = execFileSync(
      'npx',
      [
        'playwright',
        'test',
        evidence.test.file,
        '-g',
        evidence.test.title,
        '--reporter=json',
      ],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env },
      },
    );
  } catch (err) {
    const e = err as { stdout?: string; status?: number | null };
    stdout = e.stdout ?? '';
    exitCode = typeof e.status === 'number' ? e.status : 1;
  }

  if (!stdout.trim()) {
    throw new Error(`playwright re-run produced no JSON (exit ${exitCode})`);
  }

  writeFileSync(reportPath, stdout, 'utf8');
  const report: unknown = JSON.parse(stdout);
  return {
    passed: reportPassed(report),
    firstErrorLine: firstErrorLineFromReport(report),
    reportPath,
  };
}

function loadSavedRerun(decisionId: string, root: string | null): RerunInfo | null {
  const reportPath = rerunReportPath(decisionId, root);
  if (!existsSync(reportPath)) return null;
  const report: unknown = JSON.parse(readFileSync(reportPath, 'utf8'));
  return {
    passed: reportPassed(report),
    firstErrorLine: firstErrorLineFromReport(report),
    reportPath,
  };
}

function verifyRerunItem(
  r1: EvidenceItem | undefined,
  rerun: RerunInfo | null,
): VerifyResult {
  // R4's semantic check is against the playwright JSON report.
  if (!rerun) {
    return { verified: false, reason: 'rerun report missing' };
  }

  if (rerun.passed) {
    // Report present and green — item counts as verified so rule 3 can fire
    return { verified: true };
  }

  if (!r1?.excerpt || r1.excerpt.length < 8) {
    return { verified: false, reason: 'R1 excerpt missing or too short for R4 compare' };
  }

  if (!rerun.firstErrorLine) {
    return { verified: false, reason: 'rerun has no error line' };
  }

  if (!rerun.firstErrorLine.includes(r1.excerpt)) {
    return {
      verified: false,
      reason: 'rerun first error line does not match R1 excerpt',
    };
  }

  return { verified: true };
}

// ---------------------------------------------------------------------------
// Decision
// ---------------------------------------------------------------------------

function allowedActionsFor(
  decision: Decision,
  side: Side | null,
): string[] {
  if (decision === 'act' && side === 'drift') return ['self-heal'];
  if (decision === 'act' && side === 'bug') return ['bug-reporter'];
  if (decision === 'escalate') return ['escalate'];
  return [];
}

function buildResult(
  partial: Omit<DecisionResult, 'allowedActions'>,
): DecisionResult {
  return {
    ...partial,
    allowedActions: allowedActionsFor(partial.decision, partial.side),
  };
}

function scoreEvidence(
  evidence: EvidenceFile,
  evidenceBytes: Buffer,
  rubric: Rubric,
  opts: { verifyOnly: boolean; root: string | null },
): DecisionResult {
  const decisionId = decisionIdFromBytes(evidenceBytes);
  const items = evidence.items ?? [];
  const byKind = new Map<string, EvidenceItem>();
  for (const item of items) {
    if (!byKind.has(item.kind)) byKind.set(item.kind, item);
  }

  const verified: string[] = [];
  const missing: string[] = [];
  const contradictions: string[] = [];

  // Rule 1 — model must not supply score/confidence/weight
  const forbidden = deepHasForbiddenScoreField(evidence);
  if (forbidden) {
    return buildResult({
      decisionId,
      decision: 'inconclusive',
      side: null,
      score: 0,
      oracle: false,
      verified,
      missing,
      contradictions: [`forbidden field: ${forbidden}`],
      rule: 1,
    });
  }

  // Load / run rerun early (needed for R4 and rule 3)
  const r1 = byKind.get('failure');
  let rerun: RerunInfo | null = null;
  if (opts.verifyOnly) {
    rerun = loadSavedRerun(decisionId, opts.root);
  } else if (byKind.has('rerun')) {
    rerun = executePlaywrightRerun(evidence, decisionId, opts.root);
  } else {
    rerun = loadSavedRerun(decisionId, opts.root);
  }

  // Verify each evidence item
  const verifiedKinds = new Set<string>();
  for (const item of items) {
    let result: VerifyResult;
    if (item.kind === 'rerun') {
      result = verifyRerunItem(r1, rerun);
      // Still require artifact file exists when path is under root
      const abs = resolveArtifact(item.artifact, opts.root);
      if (!existsSync(abs)) {
        result = { verified: false, reason: `artifact missing: ${abs}` };
      } else if (result.verified && item.line !== undefined && item.excerpt) {
        const disk = readFileSync(abs, 'utf8');
        const lineCheck = lineContainsExcerpt(disk, item.line, item.excerpt);
        if (!lineCheck.verified) result = lineCheck;
      }
    } else {
      result = verifyStaticItem(item, opts.root);
    }

    if (result.verified) {
      verified.push(item.id);
      verifiedKinds.add(item.kind);
    }
  }

  // Weighted sides from verified items (neutrals ignored for side)
  const weightedByKind = new Map(rubric.weighted.map((w) => [w.kind, w]));
  let driftScore = 0;
  let bugScore = 0;
  let driftOracle = false;
  let bugOracle = false;
  let hasDrift = false;
  let hasBug = false;

  for (const item of items) {
    if (!verifiedKinds.has(item.kind)) continue;
    const rule = weightedByKind.get(item.kind);
    if (!rule) continue;
    if (rule.side === null) {
      // Neutral: add 0, never oracle, never contradict
      continue;
    }
    if (rule.side === 'drift') {
      hasDrift = true;
      driftScore += rule.weight;
      if (rule.oracle) driftOracle = true;
    } else if (rule.side === 'bug') {
      hasBug = true;
      bugScore += rule.weight;
      if (rule.oracle) bugOracle = true;
    }
  }

  // Required items (R3 only when drift side is in play)
  for (const req of rubric.required) {
    if (req.whenSide === 'drift' && !hasDrift) continue;
    if (!verifiedKinds.has(req.kind)) {
      missing.push(req.id);
    }
  }

  // Rule 2 — required missing or unverified
  if (missing.length > 0) {
    return buildResult({
      decisionId,
      decision: 'inconclusive',
      side: null,
      score: 0,
      oracle: false,
      verified,
      missing,
      contradictions,
      rule: 2,
    });
  }

  // Rule 3 — re-run passed (flaky)
  if (rerun?.passed) {
    return buildResult({
      decisionId,
      decision: 'inconclusive',
      side: null,
      score: 0,
      oracle: false,
      verified,
      missing,
      contradictions: ['rerun passed'],
      rule: 3,
    });
  }

  // Rule 4 — both sides present
  if (hasDrift && hasBug) {
    contradictions.push('drift and bug evidence both present');
    return buildResult({
      decisionId,
      decision: 'inconclusive',
      side: null,
      score: 0,
      oracle: false,
      verified,
      missing,
      contradictions,
      rule: 4,
    });
  }

  const side: Side | null = hasDrift ? 'drift' : hasBug ? 'bug' : null;
  const score = hasDrift ? driftScore : hasBug ? bugScore : 0;
  const oracle = hasDrift ? driftOracle : hasBug ? bugOracle : false;

  // Rule 5 — no weighted score
  if (score === 0) {
    return buildResult({
      decisionId,
      decision: 'inconclusive',
      side,
      score: 0,
      oracle: false,
      verified,
      missing,
      contradictions,
      rule: 5,
    });
  }

  // Rule 6 — act
  if (
    score >= rubric.thresholds.act &&
    (!rubric.thresholds.actRequiresOracle || oracle)
  ) {
    return buildResult({
      decisionId,
      decision: 'act',
      side,
      score,
      oracle,
      verified,
      missing,
      contradictions,
      rule: 6,
    });
  }

  // Rule 7 — escalate
  if (score >= rubric.thresholds.escalate) {
    return buildResult({
      decisionId,
      decision: 'escalate',
      side,
      score,
      oracle,
      verified,
      missing,
      contradictions,
      rule: 7,
    });
  }

  // Rule 8
  return buildResult({
    decisionId,
    decision: 'inconclusive',
    side,
    score,
    oracle,
    verified,
    missing,
    contradictions,
    rule: 8,
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function runScoreEvidence(argv: string[] = process.argv): DecisionResult {
  const cli = parseArgs(argv);
  const bytes = readFileSync(cli.evidencePath);
  const evidence = JSON.parse(bytes.toString('utf8')) as EvidenceFile;
  const rubric = loadRubric();
  const result = scoreEvidence(evidence, bytes, rubric, {
    verifyOnly: cli.verifyOnly,
    root: cli.root,
  });

  const outPath = decisionOutPath(result.decisionId, cli.root);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  return result;
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  try {
    runScoreEvidence();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(message + '\n');
    process.exit(1);
  }
}
