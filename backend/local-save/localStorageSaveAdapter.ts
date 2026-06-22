import type { SaveIndex, SaveRecord } from './types';

const SAVE_INDEX_KEY = 'lifeverse:saves:index';
const DEVICE_ID_KEY = 'lifeverse:device-id';
const SAVE_RECORD_PREFIX = 'lifeverse:saves:record:';

const EMPTY_SAVE_INDEX: SaveIndex = {
  version: 1,
  activeSaveId: null,
  saves: [],
};

export class LocalStorageSaveAdapter {
  constructor(private readonly storage: Storage = window.localStorage) {}

  getDeviceId(): string {
    const existingDeviceId = this.storage.getItem(DEVICE_ID_KEY);

    if (existingDeviceId) {
      return existingDeviceId;
    }

    const deviceId = createId('device');
    this.storage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  }

  loadIndex(): SaveIndex {
    const rawIndex = this.storage.getItem(SAVE_INDEX_KEY);

    if (!rawIndex) {
      return EMPTY_SAVE_INDEX;
    }

    const parsedIndex = parseJson<SaveIndex>(rawIndex);

    if (!parsedIndex || parsedIndex.version !== 1 || !Array.isArray(parsedIndex.saves)) {
      return EMPTY_SAVE_INDEX;
    }

    return parsedIndex;
  }

  saveIndex(saveIndex: SaveIndex): void {
    this.storage.setItem(SAVE_INDEX_KEY, JSON.stringify(saveIndex));
  }

  loadRawSave(saveId: string): unknown {
    const rawSave = this.storage.getItem(getSaveRecordKey(saveId));

    if (!rawSave) {
      return null;
    }

    return parseJson<unknown>(rawSave);
  }

  saveRecord(saveRecord: SaveRecord): void {
    this.storage.setItem(getSaveRecordKey(saveRecord.metadata.saveId), JSON.stringify(saveRecord));
  }

  deleteSave(saveId: string): void {
    this.storage.removeItem(getSaveRecordKey(saveId));
  }
}

export function createId(prefix: string): string {
  if (window.crypto?.randomUUID) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getSaveRecordKey(saveId: string): string {
  return `${SAVE_RECORD_PREFIX}${saveId}`;
}

function parseJson<TValue>(rawValue: string): TValue | null {
  try {
    return JSON.parse(rawValue) as TValue;
  } catch {
    return null;
  }
}
