import { FinanceModel, AssetsModel, LoanModel, HousingModel, PropertyModel, VehicleModel } from '../models/index.js';
import {
  LifeStage, LoanType, VEHICLE_REGISTRY, annualRentIncome,
} from '@lifeverse/shared';
import type {
  Finance, LifeStage as LifeStageType, ExpenseBreakdown, FinanceSummary, VehicleType,
} from '@lifeverse/shared';

/** Base lifestyle spend per stage. */
const LIFESTYLE_BASE: Record<LifeStageType, number> = {
  [LifeStage.Childhood]:   0,
  [LifeStage.Adolescence]: 1000,
  [LifeStage.YoungAdult]:  8000,
  [LifeStage.Adult]:       11000,
  [LifeStage.Senior]:      8000,
  [LifeStage.Elder]:       6000,
};

function vehicleValueOf(assetType: string): boolean {
  return VEHICLE_REGISTRY.has(assetType as VehicleType);
}

export const FinanceService = {
  /** Compute an itemised expense breakdown for the year. */
  computeExpenseBreakdown(
    characterId: string,
    stage: LifeStageType,
    flags: Record<string, boolean>,
  ): ExpenseBreakdown {
    // Housing cost = residence rent (if renting) + upkeep across the whole
    // owned portfolio. Living with parents / homeless = no rent.
    const housingRow = HousingModel.findByCharacterId(characterId);
    const rent = housingRow && housingRow.tenure === 'renting' ? housingRow.monthlyExpense * 12 : 0;
    const upkeep = PropertyModel.findByCharacterId(characterId)
      .reduce((sum, p) => sum + p.monthlyUpkeep * 12, 0);
    const housing = rent + upkeep;

    // Vehicle upkeep: garage maintenance + any legacy asset-based vehicles.
    let vehicle = VehicleModel.findByCharacterId(characterId)
      .reduce((s, v) => s + v.monthlyMaintenance * 12, 0);
    for (const a of AssetsModel.findByCharacterId(characterId)) {
      if (vehicleValueOf(a.assetType)) {
        vehicle += VEHICLE_REGISTRY.get(a.assetType as VehicleType)?.annualExpense ?? 0;
      }
    }

    const education = (flags['inUniversity'] || flags['inHigherEd']) ? 3000 : 0;
    let family = 0;
    if (flags['isMarried']) family += 4000;
    if (flags['hasChildren']) family += 8000;
    const lifestyle = LIFESTYLE_BASE[stage];

    const loanPayments = LoanModel.findActive(characterId).reduce((s, l) => s + l.annualPayment, 0);

    const total = housing + vehicle + education + family + lifestyle + loanPayments;
    return { housing, vehicle, education, family, lifestyle, loanPayments, total };
  },

  /** Persist annual living expenses (excludes loan payments, handled in cash flow). */
  updateExpenses(characterId: string, stage: LifeStageType, flags: Record<string, boolean>): void {
    const b = this.computeExpenseBreakdown(characterId, stage, flags);
    FinanceModel.update(characterId, { annualExpenses: b.total - b.loanPayments });
  },

  /** Net annual rental income across rented-out investment properties. */
  rentalIncome(characterId: string): number {
    return PropertyModel.findByCharacterId(characterId)
      .filter((p) => p.isRentedOut)
      .reduce((sum, p) => sum + annualRentIncome(p.monthlyRent), 0);
  },

  /** Combined current value of every owned property. */
  portfolioValue(characterId: string): number {
    return PropertyModel.findByCharacterId(characterId)
      .reduce((sum, p) => sum + p.currentValue, 0);
  },

  /** Apply one year of cash flow: income + rent − living expenses − loan payments. */
  processCashFlow(characterId: string): Finance {
    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance) throw new Error(`No finance record for ${characterId}`);

    // Pay down loans first
    let loanPaid = 0;
    for (const loan of LoanModel.findActive(characterId)) {
      loanPaid += LoanModel.applyAnnualPayment(loan);
    }

    const rentalIncome = this.rentalIncome(characterId);
    const net = finance.annualIncome + rentalIncome - finance.annualExpenses - loanPaid;
    let newCash = finance.cash + net;

    // A shortfall is only financed by a personal loan when the character has
    // income to service it (living beyond your means). With no income they
    // simply go without — capped borrowing prevents runaway idle debt.
    if (newCash < 0) {
      const shortfall = Math.round(-newCash);
      if (finance.annualIncome > 0) {
        // Cap personal debt at ~2x annual income to stay realistic.
        const personalCap = finance.annualIncome * 2;
        const currentPersonal = LoanModel.totalByType(characterId, LoanType.Personal);
        const room = Math.max(0, personalCap - currentPersonal);
        if (room > 0) LoanModel.addToPersonal(characterId, Math.min(shortfall, room));
      }
      newCash = 0;
    }

    const totalDebt = LoanModel.totalBalance(characterId);
    return FinanceModel.update(characterId, { cash: newCash, totalDebt });
  },

  /* ───────────── Loan helpers ───────────── */

  addStudentLoan(characterId: string, amount: number): void {
    if (amount <= 0) return;
    LoanModel.create({ characterId, type: LoanType.Student, label: 'Student Loan', principal: amount, interestRate: 0.045, termYears: 12 });
  },

  addMortgage(characterId: string, amount: number, propertyId?: string): void {
    if (amount <= 0) return;
    LoanModel.create({
      characterId, type: LoanType.Mortgage, label: 'Mortgage', principal: amount,
      interestRate: 0.05, termYears: 25, ...(propertyId ? { propertyId } : {}),
    });
  },

  /* ───────────── Balance sheet ───────────── */

  computeSummary(characterId: string): FinanceSummary {
    const finance = FinanceModel.findByCharacterId(characterId);
    const cash = finance?.cash ?? 0;
    const annualIncome = finance?.annualIncome ?? 0;

    // Property value is the whole owned portfolio (residence + investments).
    const propertyValue = this.portfolioValue(characterId);
    const rentalIncome = this.rentalIncome(characterId);
    let vehicleValue = VehicleModel.findByCharacterId(characterId)
      .reduce((s, v) => s + v.currentValue, 0);
    for (const a of AssetsModel.findByCharacterId(characterId)) {
      if (vehicleValueOf(a.assetType)) vehicleValue += a.value;
    }
    const totalAssets = cash + propertyValue + vehicleValue;

    const studentDebt = LoanModel.totalByType(characterId, LoanType.Student);
    const mortgageDebt = LoanModel.totalByType(characterId, LoanType.Mortgage);
    const personalDebt = LoanModel.totalByType(characterId, LoanType.Personal);
    const totalLiabilities = studentDebt + mortgageDebt + personalDebt;

    return {
      cash, propertyValue, vehicleValue, totalAssets,
      studentDebt, mortgageDebt, personalDebt, totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      annualIncome, rentalIncome, portfolioValue: propertyValue,
    };
  },

  computeNetWorth(characterId: string): number {
    return this.computeSummary(characterId).netWorth;
  },

  gainCash(characterId: string, amount: number): Finance {
    const f = FinanceModel.findByCharacterId(characterId);
    if (!f) throw new Error(`No finance record for ${characterId}`);
    return FinanceModel.update(characterId, { cash: f.cash + amount });
  },
};
