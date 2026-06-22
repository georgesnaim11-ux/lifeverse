import { Router } from 'express';
import { z } from 'zod';
import { AgeUpService } from '../services/age-up.service.js';

export const gameRouter = Router();

const AgeUpSchema = z.object({ characterId: z.string().uuid() });
const ChooseSchema = z.object({
  characterId: z.string().uuid(),
  eventId: z.string().min(1),
  choiceId: z.string().min(1),
});

gameRouter.post('/age-up', (req, res, next) => {
  try {
    const parsed = AgeUpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
      return;
    }
    const result = AgeUpService.ageUp(parsed.data.characterId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

gameRouter.post('/choose', (req, res, next) => {
  try {
    const parsed = ChooseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
      return;
    }
    const { characterId, eventId, choiceId } = parsed.data;
    const result = AgeUpService.choose(characterId, eventId, choiceId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

