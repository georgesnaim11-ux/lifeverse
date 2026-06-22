import { Router } from 'express';
import { z } from 'zod';
import { EducationService } from '../services/education.service.js';
import { CharacterService } from '../services/character.service.js';
import { EducationModel, FinanceModel } from '../models/index.js';
import { Major } from '@lifeverse/shared';
import type { Finance } from '@lifeverse/shared';

export const educationRouter = Router();

const EnrollSchema = z.object({
  characterId: z.string().uuid(),
  level: z.enum(['trade', 'university', 'graduate']),
  major: z.nativeEnum(Major).optional(),
});
const ActionSchema = z.object({ characterId: z.string().uuid() });

function blankFinance(id: string): Finance {
  return { characterId: id, cash: 0, annualIncome: 0, annualExpenses: 0, totalDebt: 0, updatedAt: '' };
}

function respond(res: import('express').Response, characterId: string, message: string): void {
  res.json({
    data: {
      state: CharacterService.getFullState(characterId),
      education: EducationModel.findByCharacterId(characterId),
      finance: FinanceModel.findByCharacterId(characterId) ?? blankFinance(characterId),
      message,
    },
  });
}

educationRouter.post('/enroll', (req, res, next) => {
  try {
    const p = EnrollSchema.safeParse(req.body);
    if (!p.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
    const { message } = EducationService.enrollHigher(p.data.characterId, p.data.level, p.data.major);
    respond(res, p.data.characterId, message);
  } catch (err) { next(err); }
});

for (const action of ['study', 'attend-class', 'take-exam'] as const) {
  educationRouter.post(`/${action}`, (req, res, next) => {
    try {
      const p = ActionSchema.safeParse(req.body);
      if (!p.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } }); return; }
      const fn = action === 'study' ? EducationService.study
        : action === 'attend-class' ? EducationService.attendClass
        : EducationService.takeExam;
      const { message } = fn.call(EducationService, p.data.characterId);
      respond(res, p.data.characterId, message);
    } catch (err) { next(err); }
  });
}
