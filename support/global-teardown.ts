import { cleanupCreatedRecords } from './cleanup-records';

async function globalTeardown(): Promise<void> {
  await cleanupCreatedRecords();
}

export default globalTeardown;
