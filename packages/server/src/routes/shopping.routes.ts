import { Router } from 'express';
import { z } from 'zod';
import { ShoppingService } from '../services/shopping.service.js';
import { CharacterService } from '../services/character.service.js';
import { FinanceModel } from '../models/index.js';
import { PropertyType, VehicleType } from '@lifeverse/shared';
import type { Finance } from '@lifeverse/shared';

export const shoppingRouter = Router();

const PropertySchema = z.object({ characterId: z.string().uuid(), propertyType: z.nativeEnum(PropertyType) });
const VehicleSchema = z.object({ characterId: z.string().uuid(), vehicleType: z.nativeEnum(VehicleType) });

function blankFinance(id: string): Finance {
  return { characterId: id, cash: 0, annualIncome: 0, annualExpenses: 0, totalDebt: 0, updatedAt: '' };
}

function respond(res: import('express').Response, characterId: string, message: string): void {
  res.json({
    data: {
      state: CharacterService.getFullState(characterId),
      finance: FinanceModel.findByCharacterId(characterId) ?? blankFinance(characterId),
      ownedAssets: ShoppingService.getOwnedAssets(characterId),
      message,
    },
  });
}

shoppingRouter.post('/buy-property', (req, res, next) => {
  try {
    const p = PropertySchema.safeParse(req.body);
    if (!p.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
    const { message } = ShoppingService.buyProperty(p.data.characterId, p.data.propertyType);
    respond(res, p.data.characterId, message);
  } catch (err) { next(err); }
});

shoppingRouter.post('/buy-vehicle', (req, res, next) => {
  try {
    const p = VehicleSchema.safeParse(req.body);
    if (!p.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
    const { message } = ShoppingService.buyVehicle(p.data.characterId, p.data.vehicleType);
    respond(res, p.data.characterId, message);
  } catch (err) { next(err); }
});
