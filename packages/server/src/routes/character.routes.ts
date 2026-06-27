import { Router } from 'express';
import { z } from 'zod';
import { CharacterService } from '../services/character.service.js';
import { JobService } from '../services/job.service.js';
import { FinanceService } from '../services/finance.service.js';
import { HousingService } from '../services/housing.service.js';
import { GarageService } from '../services/garage.service.js';
import { ShopService } from '../services/shop.service.js';
import { LoanModel } from '../models/index.js';
import {
  RelationshipsModel,
  FinanceModel,
  CareerModel,
  EducationModel,
  AchievementsModel,
  EventLogModel,
  JobModel,
  AssetsModel,
  FlagsModel,
} from '../models/index.js';
import { DomainsModel } from '../models/domains.model.js';
import { Gender } from '@lifeverse/shared';
import type { Finance } from '@lifeverse/shared';

export const characterRouter = Router();

const CreateSchema = z.object({
  name: z.string().min(2).max(40),
  lastName: z.string().max(40).optional(),
  country: z.string().min(1).optional(),
  gender: z.nativeEnum(Gender).optional(),
  statAllocation: z.record(z.number().int().min(0).max(100)).optional(),
});

function blankFinance(characterId: string): Finance {
  return { characterId, cash: 0, annualIncome: 0, annualExpenses: 0, totalDebt: 0, updatedAt: '' };
}

characterRouter.post('/', (req, res, next) => {
  try {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', details: parsed.error.flatten().fieldErrors } });
      return;
    }
    const { name, lastName, country, gender, statAllocation } = parsed.data;
    const state = CharacterService.create({
      name,
      ...(lastName !== undefined ? { lastName } : {}),
      ...(country !== undefined ? { country } : {}),
      ...(gender !== undefined ? { gender } : {}),
      ...(statAllocation !== undefined ? { statAllocation } : {}),
    });
    res.status(201).json({ data: { state } });
  } catch (err) { next(err); }
});

characterRouter.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) { res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing id' } }); return; }

    const state = CharacterService.getFullState(id);
    const relationships = RelationshipsModel.findByCharacterId(id);
    const finance = FinanceModel.findByCharacterId(id) ?? blankFinance(id);
    const careers = CareerModel.findByCharacterId(id);
    const education = EducationModel.findByCharacterId(id);
    const achievements = AchievementsModel.findByCharacterId(id);
    const eventLog = EventLogModel.findByCharacterId(id, 200);
    const domains = DomainsModel.ensureExists(id);
    const job = JobModel.findActive(id);
    const eligibleJobs = JobService.listEligibility(id);
    const ownedAssets = AssetsModel.findByCharacterId(id);
    const flags = FlagsModel.getAll(id);
    const loans = LoanModel.findActive(id);
    const expenses = FinanceService.computeExpenseBreakdown(id, state.character.lifeStage, flags);
    const financeSummary = FinanceService.computeSummary(id);
    const timeline = CharacterService.buildTimeline(id);
    const housing = HousingService.get(id);
    const listings = HousingService.getMarket(id);
    const properties = HousingService.getProperties(id);
    const garage = GarageService.getGarage(id);
    const dealership = GarageService.getDealership(id);
    const collectibles = ShopService.getCollection(id);

    res.json({
      data: {
        state, relationships, finance, careers, education, achievements, eventLog,
        domains,
        job, eligibleJobs, ownedAssets, flags,
        loans, expenses, financeSummary, timeline,
        housing, listings, properties, garage, dealership, collectibles,
      },
    });
  } catch (err) { next(err); }
});
