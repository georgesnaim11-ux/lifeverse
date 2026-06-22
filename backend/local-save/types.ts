export const CURRENT_SAVE_SCHEMA_VERSION = 1;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type SaveSyncStatus = 'local-only' | 'pending-upload' | 'synced' | 'conflict';

export type SaveMetadata = {
  saveId: string;
  slotId: string;
  userId: string | null;
  cloudSaveId: string | null;
  characterName: string;
  characterAge: number;
  gameVersion: string;
  saveSchemaVersion: number;
  revision: number;
  syncStatus: SaveSyncStatus;
  deviceId: string;
  createdAt: string;
  updatedAt: string;
  lastPlayedAt: string;
  lastSyncedAt: string | null;
};

export type SaveRecord<TGameState extends JsonObject = JsonObject> = {
  metadata: SaveMetadata;
  gameState: TGameState;
};

export type SaveIndexEntry = Pick<
  SaveMetadata,
  | 'saveId'
  | 'slotId'
  | 'characterName'
  | 'characterAge'
  | 'updatedAt'
  | 'lastPlayedAt'
  | 'syncStatus'
  | 'revision'
>;

export type SaveIndex = {
  version: 1;
  activeSaveId: string | null;
  saves: SaveIndexEntry[];
};

export type SaveSummary = {
  characterName: string;
  characterAge: number;
};

export type LoadSaveResult<TGameState extends JsonObject = JsonObject> =
  | {
      status: 'found';
      saveRecord: SaveRecord<TGameState>;
    }
  | {
      status: 'missing';
      saveRecord: null;
    }
  | {
      status: 'corrupted';
      saveRecord: null;
      reason: string;
    }
  | {
      status: 'unsupported-version';
      saveRecord: null;
      reason: string;
    };

export type CreateSaveInput<TGameState extends JsonObject = JsonObject> = {
  gameState: TGameState;
  summary: SaveSummary;
  slotId?: string;
  gameVersion: string;
};

export type UpdateSaveInput<TGameState extends JsonObject = JsonObject> = {
  saveRecord: SaveRecord<TGameState>;
  nextGameState: TGameState;
  summary: SaveSummary;
  gameVersion: string;
};

