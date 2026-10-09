/**
 * Deletes records listed in .test-artifacts/created-records.jsonl using
 * support/api-client.ts. Run from the repo root:
 *
 *   npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts
 *   npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts --dry-run
 *   npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts --type child
 */
import dotenv from 'dotenv';
import { deleteTrackedRecord } from '../../../../support/api-client';
import {
  getTrackedRecords,
  initTracker,
  type RecordType,
  type TrackedRecord,
} from '../../../../support/record-tracker';

dotenv.config();

const KNOWN_TYPES: readonly RecordType[] = ['child'];

type CliOptions = {
  dryRun: boolean;
  typeFilter: RecordType | undefined;
};

function parseArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let typeFilter: RecordType | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--type') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('--type requires a value (e.g. --type child)');
      }
      if (!(KNOWN_TYPES as readonly string[]).includes(value)) {
        throw new Error(
          `Unknown record type "${value}". Known types: ${KNOWN_TYPES.join(', ')}`,
        );
      }
      typeFilter = value as RecordType;
      i++;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { dryRun, typeFilter };
}

function filterRecords(
  records: TrackedRecord[],
  typeFilter: RecordType | undefined,
): TrackedRecord[] {
  if (!typeFilter) {
    return records;
  }
  return records.filter((record) => record.type === typeFilter);
}

async function main(): Promise<void> {
  const { dryRun, typeFilter } = parseArgs(process.argv.slice(2));
  const targets = filterRecords(getTrackedRecords(), typeFilter);

  let deleted = 0;
  let failed = 0;

  console.log(
    `Scope: ${typeFilter ?? 'all'} | dry-run: ${dryRun} | found: ${targets.length}`,
  );

  for (const record of targets) {
    const label = `${record.type} ${record.id} (owner=${record.owner})`;

    if (dryRun) {
      console.log(`[dry-run] would delete ${label}`);
      continue;
    }

    try {
      const result = await deleteTrackedRecord(record);
      if (result.ok) {
        deleted++;
        console.log(`Deleted ${label}`);
        continue;
      }

      if (result.status === 404) {
        deleted++;
        console.log(`Already removed ${label} (404)`);
        continue;
      }

      if (result.status === 401) {
        failed++;
        console.error(
          `Failed ${label}: 401 — storage state expired; re-run the setup project`,
        );
        continue;
      }

      failed++;
      console.error(
        `Failed ${label}: status ${result.status}${
          result.message ? `: ${result.message}` : ''
        }`,
      );
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed ${label}: ${message}`);
    }
  }

  console.log(`Found: ${targets.length}`);
  console.log(`Deleted: ${dryRun ? 0 : deleted}`);
  console.log(`Failed: ${dryRun ? 0 : failed}`);

  if (!dryRun) {
    initTracker();
    console.log('Tracker reset.');
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
