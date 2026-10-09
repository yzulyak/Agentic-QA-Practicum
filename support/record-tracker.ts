import fs from 'fs';
import path from 'path';

export type RecordOwner = 'main' | 'alt';

/** Resource kinds the cleanup layer can track and delete. */
export type RecordType = 'child';

export type TrackedRecord = {
  type: RecordType;
  id: string;
  owner: RecordOwner;
};

export const TRACKER_PATH = path.join('.test-artifacts', 'created-records.jsonl');

/** Creates/empties the JSONL tracker file. */
export function initTracker(): void {
  fs.mkdirSync(path.dirname(TRACKER_PATH), { recursive: true });
  fs.writeFileSync(TRACKER_PATH, '', 'utf8');
}

/** Appends one created record for later cleanup. */
export function trackRecord(record: TrackedRecord): void {
  fs.mkdirSync(path.dirname(TRACKER_PATH), { recursive: true });
  fs.appendFileSync(TRACKER_PATH, `${JSON.stringify(record)}\n`, 'utf8');
}

/** Returns tracked records, unique by type+id (first occurrence wins). */
export function getTrackedRecords(): TrackedRecord[] {
  if (!fs.existsSync(TRACKER_PATH)) {
    return [];
  }

  const lines = fs
    .readFileSync(TRACKER_PATH, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const seen = new Set<string>();
  const unique: TrackedRecord[] = [];

  for (const line of lines) {
    const record = JSON.parse(line) as TrackedRecord;
    const key = `${record.type}:${record.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(record);
  }

  return unique;
}
