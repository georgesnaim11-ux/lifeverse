import { Router } from 'express';
import { z } from 'zod';
import { ShopService } from '../services/shop.service.js';
import { CollectibleCategory, CollectibleCondition } from '@lifeverse/shared';

export const shopRouter = Router();

const BuySchema = z.object({
  characterId: z.string().uuid(),
  category: z.nativeEnum(CollectibleCategory),
  itemKey: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  condition: z.nativeEnum(CollectibleCondition),
});
const SellSchema = z.object({ characterId: z.string().uuid(), collectibleId: z.string().min(1) });

function bad(res: import('express').Response): void {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
}

shopRouter.post('/buy', (req, res, next) => {
  try {
    const p = BuySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: ShopService.buy(p.data.characterId, p.data.category, p.data.itemKey, p.data.year, p.data.condition) });
  } catch (err) { next(err); }
});

shopRouter.post('/sell', (req, res, next) => {
  try {
    const p = SellSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: ShopService.sell(p.data.characterId, p.data.collectibleId) });
  } catch (err) { next(err); }
});
