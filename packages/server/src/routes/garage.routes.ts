import { Router } from 'express';
import { z } from 'zod';
import { GarageService } from '../services/garage.service.js';
import { VehicleCondition } from '@lifeverse/shared';

export const garageRouter = Router();

const BuySchema = z.object({
  characterId: z.string().uuid(),
  modelKey: z.string().min(1),
  year: z.number().int().min(1980).max(2100),
  condition: z.nativeEnum(VehicleCondition),
  primary: z.boolean().optional(),
});
const VehicleSchema = z.object({ characterId: z.string().uuid(), vehicleId: z.string().min(1) });

function bad(res: import('express').Response): void {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
}

garageRouter.post('/buy', (req, res, next) => {
  try {
    const p = BuySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: GarageService.buy(p.data.characterId, p.data.modelKey, p.data.year, p.data.condition, p.data.primary ? { primary: true } : {}) });
  } catch (err) { next(err); }
});

garageRouter.post('/sell', (req, res, next) => {
  try {
    const p = VehicleSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: GarageService.sell(p.data.characterId, p.data.vehicleId) });
  } catch (err) { next(err); }
});

garageRouter.post('/set-primary', (req, res, next) => {
  try {
    const p = VehicleSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: GarageService.setPrimary(p.data.characterId, p.data.vehicleId) });
  } catch (err) { next(err); }
});

for (const action of ['service', 'repair', 'wash'] as const) {
  garageRouter.post(`/${action}`, (req, res, next) => {
    try {
      const p = VehicleSchema.safeParse(req.body); if (!p.success) return bad(res);
      res.json({ data: GarageService[action](p.data.characterId, p.data.vehicleId) });
    } catch (err) { next(err); }
  });
}
