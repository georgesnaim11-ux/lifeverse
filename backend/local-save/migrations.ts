import { CURRENT_SAVE_SCHEMA_VERSION, type JsonObject, type SaveRecord } from './types';

export function migrateSaveRecord<TGameState extends JsonObject>(
  saveRecord: SaveRecord<TGameState>,
): SaveRecord<TGameState> {
  if (saveRecord.metadata.saveSchemaVersion > CURRENT_SAVE_SCHEMA_VERSION) {
    throw new Error('This save was created by a newer version of Lifeverse.');
  }

  let migratedSave = saveRecord;

  while (migratedSave.metadata.saveSchemaVersion < CURRENT_SAVE_SCHEMA_VERSION) {
    switch (migratedSave.metadata.saveSchemaVersion) {
      default:
        throw new Error(`Unsupported save schema version: ${migratedSave.metadata.saveSchemaVersion}`);
    }
  }

  return migratedSave;
}

export function isValidSaveRecord<TGameState extends JsonObject = JsonObject>(
  value: unknown,
): value is SaveRecord<TGameState> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const possibleSave = value as Partial<SaveRecord<TGameState>>;
  const metadata = possibleSave.metadata;
  const gameState = possibleSave.gameState;

  return Boolean(
    metadata &&
      gameState &&
      typeof metadata.saveId === 'string' &&
      typeof metadata.slotId === 'string' &&
      typeof metadata.characterName === 'string' &&
      typeof metadata.characterAge === 'number' &&
      typeof metadata.gameVersion === 'string' &&
      typeof metadata.saveSchemaVersion === 'number' &&
      typeof metadata.revision === 'number' &&
      typeof metadata.deviceId === 'string' &&
      typeof metadata.createdAt === 'string' &&
      typeof metadata.updatedAt === 'string' &&
      typeof metadata.lastPlayedAt === 'string' &&
      typeof gameState === 'object',
  );
}

