import { isValidSaveRecord, migrateSaveRecord } from './migrations';
import { createId, LocalStorageSaveAdapter } from './localStorageSaveAdapter';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  type CreateSaveInput,
  type JsonObject,
  type LoadSaveResult,
  type SaveIndex,
  type SaveRecord,
  type UpdateSaveInput,
} from './types';

const DEFAULT_SLOT_ID = 'slot_1';

export class SaveManager {
  constructor(private readonly adapter = new LocalStorageSaveAdapter()) {}

  loadIndex(): SaveIndex {
    return this.adapter.loadIndex();
  }

  loadActiveSave<TGameState extends JsonObject = JsonObject>(): LoadSaveResult<TGameState> {
    const saveIndex = this.adapter.loadIndex();

    if (!saveIndex.activeSaveId) {
      return {
        status: 'missing',
        saveRecord: null,
      };
    }

    return this.loadSave<TGameState>(saveIndex.activeSaveId);
  }

  loadSave<TGameState extends JsonObject = JsonObject>(saveId: string): LoadSaveResult<TGameState> {
    const rawSave = this.adapter.loadRawSave(saveId);

    if (!rawSave) {
      return {
        status: 'missing',
        saveRecord: null,
      };
    }

    if (!isValidSaveRecord<TGameState>(rawSave)) {
      return {
        status: 'corrupted',
        saveRecord: null,
        reason: 'The save exists, but it does not match the expected Lifeverse save format.',
      };
    }

    try {
      return {
        status: 'found',
        saveRecord: migrateSaveRecord(rawSave),
      };
    } catch (error) {
      return {
        status: 'unsupported-version',
        saveRecord: null,
        reason: error instanceof Error ? error.message : 'Unsupported save version.',
      };
    }
  }

  createSave<TGameState extends JsonObject>(input: CreateSaveInput<TGameState>): SaveRecord<TGameState> {
    const now = new Date().toISOString();

    const saveRecord: SaveRecord<TGameState> = {
      metadata: {
        saveId: createId('save'),
        slotId: input.slotId ?? DEFAULT_SLOT_ID,
        userId: null,
        cloudSaveId: null,
        characterName: input.summary.characterName,
        characterAge: input.summary.characterAge,
        gameVersion: input.gameVersion,
        saveSchemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
        revision: 1,
        syncStatus: 'local-only',
        deviceId: this.adapter.getDeviceId(),
        createdAt: now,
        updatedAt: now,
        lastPlayedAt: now,
        lastSyncedAt: null,
      },
      gameState: input.gameState,
    };

    this.persistSave(saveRecord);
    return saveRecord;
  }

  updateSave<TGameState extends JsonObject>(input: UpdateSaveInput<TGameState>): SaveRecord<TGameState> {
    const now = new Date().toISOString();
    const nextSaveRecord: SaveRecord<TGameState> = {
      metadata: {
        ...input.saveRecord.metadata,
        characterName: input.summary.characterName,
        characterAge: input.summary.characterAge,
        gameVersion: input.gameVersion,
        saveSchemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
        revision: input.saveRecord.metadata.revision + 1,
        syncStatus: input.saveRecord.metadata.userId ? 'pending-upload' : 'local-only',
        updatedAt: now,
        lastPlayedAt: now,
      },
      gameState: input.nextGameState,
    };

    this.persistSave(nextSaveRecord);
    return nextSaveRecord;
  }

  deleteSave(saveId: string): void {
    const saveIndex = this.adapter.loadIndex();
    const nextIndex: SaveIndex = {
      version: 1,
      activeSaveId: saveIndex.activeSaveId === saveId ? null : saveIndex.activeSaveId,
      saves: saveIndex.saves.filter((entry) => entry.saveId !== saveId),
    };

    this.adapter.deleteSave(saveId);
    this.adapter.saveIndex(nextIndex);
  }

  private persistSave<TGameState extends JsonObject>(saveRecord: SaveRecord<TGameState>): void {
    this.adapter.saveRecord(saveRecord);
    this.adapter.saveIndex(upsertIndexEntry(this.adapter.loadIndex(), saveRecord));
  }
}

function upsertIndexEntry(saveIndex: SaveIndex, saveRecord: SaveRecord): SaveIndex {
  const nextEntry = {
    saveId: saveRecord.metadata.saveId,
    slotId: saveRecord.metadata.slotId,
    characterName: saveRecord.metadata.characterName,
    characterAge: saveRecord.metadata.characterAge,
    updatedAt: saveRecord.metadata.updatedAt,
    lastPlayedAt: saveRecord.metadata.lastPlayedAt,
    syncStatus: saveRecord.metadata.syncStatus,
    revision: saveRecord.metadata.revision,
  };

  const otherSaves = saveIndex.saves.filter((entry) => entry.saveId !== saveRecord.metadata.saveId);

  return {
    version: 1,
    activeSaveId: saveRecord.metadata.saveId,
    saves: [nextEntry, ...otherSaves],
  };
}

