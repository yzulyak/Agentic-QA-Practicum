import { deleteTrackedRecord } from './api-client';
import { getTrackedRecords, initTracker } from './record-tracker';

/**
 * Deletes every tracked record with its owner's API context, then resets the tracker.
 */
export async function cleanupCreatedRecords(): Promise<void> {
  const records = getTrackedRecords();

  for (const record of records) {
    try {
      const result = await deleteTrackedRecord(record);
      if (result.ok) {
        console.log(`Deleted ${result.type} ${result.id}`);
      } else {
        console.warn(
          `Warning: failed to delete ${result.type} ${result.id} — status ${result.status}${
            result.message ? `: ${result.message}` : ''
          }`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: failed to delete ${record.type} ${record.id}: ${message}`);
    }
  }

  initTracker();
}
