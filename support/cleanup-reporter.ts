import type { Reporter } from '@playwright/test/reporter';
import { cleanupCreatedRecords } from './cleanup-records';

/**
 * Runs API cleanup when the test run ends (in addition to globalTeardown).
 */
class CleanupReporter implements Reporter {
  async onEnd(): Promise<void> {
    await cleanupCreatedRecords();
  }
}

export default CleanupReporter;
