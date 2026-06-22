import { Router } from 'express';
import { z } from 'zod';
import { JobService } from '../services/job.service.js';
import { CharacterService } from '../services/character.service.js';
import { FinanceModel } from '../models/index.js';
import type { Finance } from '@lifeverse/shared';

export const careerRouter = Router();

const ApplySchema = z.object({ characterId: z.string().uuid(), jobId: z.string().min(1) });
const ActionSchema = z.object({ characterId: z.string().uuid() });

function blankFinance(id: string): Finance {
  return { characterId: id, cash: 0, annualIncome: 0, annualExpenses: 0, totalDebt: 0, updatedAt: '' };
}

function respond(res: import('express').Response, characterId: string, message: string): void {
  res.json({
    data: {
      state: CharacterService.getFullState(characterId),
      job: JobService.getActiveJob(characterId),
      finance: FinanceModel.findByCharacterId(characterId) ?? blankFinance(characterId),
      eligibleJobs: JobService.listEligibility(characterId),
      message,
    },
  });
}

careerRouter.post('/apply', (req, res, next) => {
  try {
    const p = ApplySchema.safeParse(req.body);
    if (!p.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
    const { message } = JobService.apply(p.data.characterId, p.data.jobId);
    respond(res, p.data.characterId, message);
  } catch (err) { next(err); }
});

careerRouter.post('/promote', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body);
    if (!p.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
    const { message } = JobService.askForPromotion(p.data.characterId);
    respond(res, p.data.characterId, message);
  } catch (err) { next(err); }
});

careerRouter.post('/work-hard', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body);
    if (!p.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
    const { message } = JobService.workHard(p.data.characterId);
    respond(res, p.data.characterId, message);
  } catch (err) { next(err); }
});

careerRouter.post('/quit', (req, res, next) => {
  try {
    const p = ActionSchema.safeParse(req.body);
    if (!p.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
    const { message } = JobService.quit(p.data.characterId);
    respond(res, p.data.characterId, message);
  } catch (err) { next(err); }
});
