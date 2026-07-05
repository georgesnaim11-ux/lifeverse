import { Router } from 'express';
import { z } from 'zod';
import { BusinessService } from '../services/business.service.js';
import { Industry, StaffRole, PriceTier } from '@lifeverse/shared';

export const businessRouter = Router();

function bad(res: import('express').Response): void {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } });
}

const CreateSchema = z.object({
  characterId: z.string().uuid(),
  industry: z.nativeEnum(Industry),
  name: z.string().min(2).max(40),
  logo: z.string().max(8),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hqCountry: z.string().min(1).max(30),
  investment: z.number().int().positive().max(1_000_000_000),
});
const KeySchema = z.object({ characterId: z.string().uuid(), key: z.string().min(1) });
const PriceSchema = z.object({ characterId: z.string().uuid(), key: z.string().min(1), tier: z.nativeEnum(PriceTier) });
const StaffSchema = z.object({ characterId: z.string().uuid(), role: z.nativeEnum(StaffRole), count: z.number().int().min(1).max(1000) });
const RoleSchema = z.object({ characterId: z.string().uuid(), role: z.nativeEnum(StaffRole) });
const LevelSchema = z.object({ characterId: z.string().uuid(), level: z.number().int().min(0).max(3) });
const TierSchema = z.object({ characterId: z.string().uuid(), tier: z.number().int().min(1).max(3) });
const IdSchema = z.object({ characterId: z.string().uuid(), id: z.string().min(1) });
const AmountSchema = z.object({ characterId: z.string().uuid(), amount: z.number().int().positive().max(10_000_000_000) });
const ActionSchema = z.object({ characterId: z.string().uuid() });

businessRouter.post('/create', (req, res, next) => {
  try {
    const p = CreateSchema.safeParse(req.body); if (!p.success) return bad(res);
    const { characterId, ...input } = p.data;
    res.json({ data: BusinessService.create(characterId, input) });
  } catch (err) { next(err); }
});

businessRouter.post('/product/launch', (req, res, next) => {
  try { const p = KeySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.launchProduct(p.data.characterId, p.data.key) }); } catch (err) { next(err); }
});
businessRouter.post('/product/price', (req, res, next) => {
  try { const p = PriceSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.setProductPrice(p.data.characterId, p.data.key, p.data.tier) }); } catch (err) { next(err); }
});
businessRouter.post('/product/improve', (req, res, next) => {
  try { const p = KeySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.improveProduct(p.data.characterId, p.data.key) }); } catch (err) { next(err); }
});
businessRouter.post('/product/discontinue', (req, res, next) => {
  try { const p = KeySchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.discontinueProduct(p.data.characterId, p.data.key) }); } catch (err) { next(err); }
});

businessRouter.post('/staff/hire', (req, res, next) => {
  try { const p = StaffSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.hire(p.data.characterId, p.data.role, p.data.count) }); } catch (err) { next(err); }
});
businessRouter.post('/staff/fire', (req, res, next) => {
  try { const p = StaffSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.fire(p.data.characterId, p.data.role, p.data.count) }); } catch (err) { next(err); }
});
businessRouter.post('/staff/train', (req, res, next) => {
  try { const p = RoleSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.train(p.data.characterId, p.data.role) }); } catch (err) { next(err); }
});
businessRouter.post('/staff/bonus', (req, res, next) => {
  try { const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.raiseSalaries(p.data.characterId) }); } catch (err) { next(err); }
});

businessRouter.post('/supplier', (req, res, next) => {
  try { const p = TierSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.setSupplier(p.data.characterId, p.data.tier) }); } catch (err) { next(err); }
});
businessRouter.post('/marketing', (req, res, next) => {
  try { const p = LevelSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.setMarketing(p.data.characterId, p.data.level) }); } catch (err) { next(err); }
});
businessRouter.post('/rnd', (req, res, next) => {
  try { const p = LevelSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.setRnd(p.data.characterId, p.data.level) }); } catch (err) { next(err); }
});
businessRouter.post('/consultant/hire', (req, res, next) => {
  try { const p = IdSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.hireConsultant(p.data.characterId, p.data.id) }); } catch (err) { next(err); }
});
businessRouter.post('/consultant/drop', (req, res, next) => {
  try { const p = IdSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.dropConsultant(p.data.characterId, p.data.id) }); } catch (err) { next(err); }
});
businessRouter.post('/expand', (req, res, next) => {
  try { const p = IdSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.expand(p.data.characterId, p.data.id) }); } catch (err) { next(err); }
});
businessRouter.post('/invest', (req, res, next) => {
  try { const p = AmountSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.invest(p.data.characterId, p.data.amount) }); } catch (err) { next(err); }
});
businessRouter.post('/withdraw', (req, res, next) => {
  try { const p = AmountSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.withdraw(p.data.characterId, p.data.amount) }); } catch (err) { next(err); }
});
businessRouter.post('/sell', (req, res, next) => {
  try { const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.sellBusiness(p.data.characterId) }); } catch (err) { next(err); }
});
businessRouter.post('/close', (req, res, next) => {
  try { const p = ActionSchema.safeParse(req.body); if (!p.success) return bad(res);
    res.json({ data: BusinessService.closeBusiness(p.data.characterId) }); } catch (err) { next(err); }
});
