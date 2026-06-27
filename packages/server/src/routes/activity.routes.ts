import { Router } from 'express';
import { z } from 'zod';
import { ActivitiesService } from '../services/activities.service.js';

export const activityRouter = Router();

function bad(res: import('express').Response): void {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
}

const PerformSchema = z.object({ characterId: z.string().uuid(), activityId: z.string().min(1) });
const VacationSchema = z.object({
  characterId: z.string().uuid(),
  countryId: z.string().min(1),
  type: z.string().min(1),
  activityKey: z.string().min(1),
});
const CasinoSchema = z.object({
  characterId: z.string().uuid(),
  game: z.string().min(1),
  bet: z.number().int().positive().max(1_000_000_000),
});

activityRouter.post('/perform', (req, res, next) => {
  try {
    const p = PerformSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: ActivitiesService.perform(p.data.characterId, p.data.activityId) });
  } catch (err) { next(err); }
});

activityRouter.post('/vacation', (req, res, next) => {
  try {
    const p = VacationSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: ActivitiesService.vacation(p.data.characterId, p.data.countryId, p.data.type, p.data.activityKey) });
  } catch (err) { next(err); }
});

activityRouter.post('/casino', (req, res, next) => {
  try {
    const p = CasinoSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: ActivitiesService.casino(p.data.characterId, p.data.game, p.data.bet) });
  } catch (err) { next(err); }
});
