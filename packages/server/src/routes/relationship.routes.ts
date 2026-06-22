import { Router } from 'express';
import { z } from 'zod';
import { RelationshipService } from '../services/relationship.service.js';
import { WeddingTier } from '@lifeverse/shared';

export const relationshipRouter = Router();

const ActionSchema = z.object({ characterId: z.string().uuid() });
const WeddingSchema = z.object({ characterId: z.string().uuid(), tier: z.nativeEnum(WeddingTier) });

function bad(res: import('express').Response): void {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
}

relationshipRouter.post('/find-partner', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.findPartner(p.data.characterId) });
  } catch (err) { next(err); }
});

relationshipRouter.post('/date', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.goOnDate(p.data.characterId) });
  } catch (err) { next(err); }
});

relationshipRouter.post('/propose', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.propose(p.data.characterId) });
  } catch (err) { next(err); }
});

relationshipRouter.post('/plan-wedding', (req, res, next) => {
  try {
    const p = WeddingSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.planWedding(p.data.characterId, p.data.tier) });
  } catch (err) { next(err); }
});

relationshipRouter.post('/delay-wedding', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.delayWedding(p.data.characterId) });
  } catch (err) { next(err); }
});

relationshipRouter.post('/cancel-engagement', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.cancelEngagement(p.data.characterId) });
  } catch (err) { next(err); }
});

relationshipRouter.post('/break-up', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.breakUp(p.data.characterId) });
  } catch (err) { next(err); }
});

relationshipRouter.post('/try-for-baby', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.tryForBaby(p.data.characterId) });
  } catch (err) { next(err); }
});

relationshipRouter.post('/birth-control', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.toggleBirthControl(p.data.characterId) });
  } catch (err) { next(err); }
});

relationshipRouter.post('/divorce', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: RelationshipService.divorce(p.data.characterId) });
  } catch (err) { next(err); }
});
