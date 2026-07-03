import { Router } from 'express';
import { z } from 'zod';
import { SportsService } from '../services/sports.service.js';
import { Sport } from '@lifeverse/shared';

export const sportsRouter = Router();

const TryoutSchema = z.object({ characterId: z.string().uuid(), sport: z.nativeEnum(Sport) });
const DecideSchema = z.object({ characterId: z.string().uuid(), decisionId: z.string().min(1) });
const ActionSchema = z.object({ characterId: z.string().uuid() });

function bad(res: import('express').Response): void {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
}

sportsRouter.post('/tryout', (req, res, next) => {
  try {
    const p = TryoutSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: SportsService.tryout(p.data.characterId, p.data.sport) });
  } catch (err) { next(err); }
});

sportsRouter.post('/decide', (req, res, next) => {
  try {
    const p = DecideSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: SportsService.decide(p.data.characterId, p.data.decisionId) });
  } catch (err) { next(err); }
});

for (const action of ['quit', 'accept-offer', 'reject-offer', 'negotiate', 'request-transfer', 'retire'] as const) {
  const method = ({ 'quit': 'quit', 'accept-offer': 'acceptOffer', 'reject-offer': 'rejectOffer',
    'negotiate': 'negotiate', 'request-transfer': 'requestTransfer', 'retire': 'retire' } as const)[action];
  sportsRouter.post(`/${action}`, (req, res, next) => {
    try {
      const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
      res.json({ data: SportsService[method](p.data.characterId) });
    } catch (err) { next(err); }
  });
}
