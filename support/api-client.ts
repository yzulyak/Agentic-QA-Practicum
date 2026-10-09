import fs from 'fs';
import { request, type APIRequestContext } from '@playwright/test';
import { ALT_AUTH_FILE, AUTH_FILE } from './auth.constants';
import type { RecordOwner, RecordType, TrackedRecord } from './record-tracker';

export type DeleteResult = {
  type: RecordType;
  id: string;
  ok: boolean;
  status: number;
  message: string;
};

type StorageOrigin = {
  origin: string;
  localStorage: Array<{ name: string; value: string }>;
};

type StorageStateFile = {
  cookies?: unknown[];
  origins?: StorageOrigin[];
};

/**
 * Reads the BuddyTime JWT from a Playwright storageState file (localStorage bt_token).
 * APIRequestContext does not send localStorage; the Bearer header must be set explicitly.
 */
function readBearerToken(storageStatePath: string): string {
  const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf8')) as StorageStateFile;
  for (const origin of state.origins ?? []) {
    const entry = origin.localStorage.find((item) => item.name === 'bt_token');
    if (entry?.value) {
      return entry.value;
    }
  }
  throw new Error(`bt_token not found in storageState: ${storageStatePath}`);
}

function storageStateForOwner(owner: RecordOwner): string {
  return owner === 'main' ? AUTH_FILE : ALT_AUTH_FILE;
}

async function createFamilyRequestContext(owner: RecordOwner): Promise<APIRequestContext> {
  const baseURL = process.env.APP_URL;
  if (!baseURL) {
    throw new Error('APP_URL is not set');
  }

  const storageState = storageStateForOwner(owner);
  const token = readBearerToken(storageState);

  return request.newContext({
    baseURL,
    storageState,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Deletes a child via DELETE /api/v1/children/:id using the given family's auth.
 */
export async function deleteChild(owner: RecordOwner, id: string): Promise<DeleteResult> {
  const ctx = await createFamilyRequestContext(owner);
  try {
    const response = await ctx.delete(`/api/v1/children/${id}`);
    const status = response.status();
    const ok = response.ok();
    const message = ok ? '' : await response.text();
    return { type: 'child', id, ok, status, message };
  } finally {
    await ctx.dispose();
  }
}

/** Dispatches delete for a tracked record by type. */
export async function deleteTrackedRecord(record: TrackedRecord): Promise<DeleteResult> {
  switch (record.type) {
    case 'child':
      return deleteChild(record.owner, record.id);
    default: {
      const _exhaustive: never = record.type;
      throw new Error(`Unsupported record type: ${_exhaustive}`);
    }
  }
}
