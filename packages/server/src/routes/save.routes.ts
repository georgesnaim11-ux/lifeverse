import { Router } from 'express';
import { z } from 'zod';
import { SaveService } from '../services/save.service.js';

export const saveRouter = Router();

const CreateSaveSchema = z.object({
  characterId: z.string().uuid(),
  saveName: z.string().max(80).optional(),
});

saveRouter.post('/', (req, res, next) => {
  try {
    const parsed = CreateSaveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
      return;
    }
    const save = SaveService.manualSave(parsed.data.characterId, parsed.data.saveName);
    res.json({ data: { saveId: save.id, savedAt: save.savedAt } });
  } catch (err) { next(err); }
});

saveRouter.get('/:characterId', (req, res, next) => {
  try {
    const { characterId } = req.params;
    if (!characterId) { res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing characterId' } }); return; }
    const saves = SaveService.listSaves(characterId);
    res.json({ data: { saves } });
  } catch (err) { next(err); }
});
