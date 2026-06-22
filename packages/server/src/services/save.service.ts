import { SavesModel } from '../models/index.js';
import type { Save } from '@lifeverse/shared';

export const SaveService = {
  autosave(characterId: string): Save {
    return SavesModel.create(characterId, 'Autosave', true);
  },

  manualSave(characterId: string, saveName?: string): Save {
    return SavesModel.create(characterId, saveName ?? null, false);
  },

  listSaves(characterId: string): Save[] {
    return SavesModel.findByCharacterId(characterId);
  },
};
