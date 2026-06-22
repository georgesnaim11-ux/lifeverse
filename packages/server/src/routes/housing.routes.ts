import { Router } from 'express';
import { z } from 'zod';
import { HousingService } from '../services/housing.service.js';

export const housingRouter = Router();

const KeySchema = z.object({ characterId: z.string().uuid(), propertyKey: z.string().min(1) });
const BuySchema = z.object({ characterId: z.string().uuid(), propertyKey: z.string().min(1), moveIn: z.boolean().optional() });
const PropertySchema = z.object({ characterId: z.string().uuid(), propertyId: z.string().min(1) });
const ActionSchema = z.object({ characterId: z.string().uuid() });

function bad(res: import('express').Response): void {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
}

housingRouter.post('/rent', (req, res, next) => {
  try {
    const p = KeySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: HousingService.rent(p.data.characterId, p.data.propertyKey) });
  } catch (err) { next(err); }
});

housingRouter.post('/buy', (req, res, next) => {
  try {
    const p = BuySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: HousingService.buy(p.data.characterId, p.data.propertyKey, { moveIn: p.data.moveIn ?? true }) });
  } catch (err) { next(err); }
});

housingRouter.post('/sell', (req, res, next) => {
  try {
    const p = PropertySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: HousingService.sell(p.data.characterId, p.data.propertyId) });
  } catch (err) { next(err); }
});

housingRouter.post('/set-residence', (req, res, next) => {
  try {
    const p = PropertySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: HousingService.setResidence(p.data.characterId, p.data.propertyId) });
  } catch (err) { next(err); }
});

housingRouter.post('/rent-out', (req, res, next) => {
  try {
    const p = PropertySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: HousingService.toggleRentOut(p.data.characterId, p.data.propertyId) });
  } catch (err) { next(err); }
});

housingRouter.post('/move-in-parents', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: HousingService.moveInWithParents(p.data.characterId) });
  } catch (err) { next(err); }
});
