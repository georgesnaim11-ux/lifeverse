import { Router } from 'express';
import { z } from 'zod';
import { ActivityService } from '../services/activity.service.js';
import { DomainsModel } from '../models/domains.model.js';
import { ResourcesModel } from '../models/resources.model.js';

export const activityRouter = Router();

const PerformSchema = z.object({
  characterId: z.string().uuid(),
  activityId: z.string().min(1),
});

/** GET /api/activity/:characterId — list available activities */
activityRouter.get('/:characterId', (req, res, next) => {
  try {
    const { characterId } = req.params;
    if (!characterId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing characterId' } });
      return;
    }
    const activities = ActivityService.getAvailableActivities(characterId);
    const domains = DomainsModel.ensureExists(characterId);
    const resources = ResourcesModel.ensureExists(characterId, 3);
    res.json({ data: { activities, domains, resources } });
  } catch (err) { next(err); }
});

/** POST /api/activity/perform — perform an activity */
activityRouter.post('/perform', (req, res, next) => {
  try {
    const parsed = PerformSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', details: parsed.error.flatten().fieldErrors } });
      return;
    }
    const result = ActivityService.perform(parsed.data.characterId, parsed.data.activityId);
    res.json({ data: result });
  } catch (err) { next(err); }
});
