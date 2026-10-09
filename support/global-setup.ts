import { initTracker } from './record-tracker';

async function globalSetup(): Promise<void> {
  initTracker();
}

export default globalSetup;
