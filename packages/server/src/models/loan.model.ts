import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { Loan, LoanType } from '@lifeverse/shared';

interface LoanRow {
  id: string;
  character_id: string;
  type: string;
  label: string;
  original_principal: number;
  balance: number;
  interest_rate: number;
  annual_payment: number;
  is_active: number;
  property_id: string | null;
}

function rowToLoan(row: LoanRow): Loan {
  return {
    id: row.id,
    characterId: row.character_id,
    type: row.type as LoanType,
    label: row.label,
    originalPrincipal: row.original_principal,
    balance: row.balance,
    interestRate: row.interest_rate,
    annualPayment: row.annual_payment,
    isActive: row.is_active === 1,
  };
}

export interface CreateLoanInput {
  characterId: string;
  type: LoanType;
  label: string;
  principal: number;
  interestRate: number;
  /** Term in years used to compute the annual payment. */
  termYears: number;
  /** Property this loan financed (for mortgages), so it can be settled on sale. */
  propertyId?: string;
}

export const LoanModel = {
  create(input: CreateLoanInput): Loan {
    const id = newId();
    // Simple amortised-ish annual payment: principal/term + first-year interest.
    const annualPayment = Math.round(input.principal / input.termYears + input.principal * input.interestRate);
    getDb()
      .prepare(
        `INSERT INTO loans (id, character_id, type, label, original_principal, balance, interest_rate, annual_payment, property_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.characterId, input.type, input.label, input.principal, input.principal, input.interestRate, annualPayment, input.propertyId ?? null);
    return this.findById(id) as Loan;
  },

  /** Active mortgage attached to a property, if any. */
  findByProperty(propertyId: string): Loan | null {
    const row = getDb()
      .prepare('SELECT * FROM loans WHERE property_id = ? AND is_active = 1 LIMIT 1')
      .get(propertyId) as LoanRow | undefined;
    return row ? rowToLoan(row) : null;
  },

  /** Close out a property's mortgage (e.g. on sale). Returns the balance cleared. */
  settleByProperty(propertyId: string): number {
    const loan = this.findByProperty(propertyId);
    if (!loan) return 0;
    getDb().prepare('UPDATE loans SET balance = 0, is_active = 0 WHERE id = ?').run(loan.id);
    return loan.balance;
  },

  findById(id: string): Loan | null {
    const row = getDb().prepare('SELECT * FROM loans WHERE id = ?').get(id) as LoanRow | undefined;
    return row ? rowToLoan(row) : null;
  },

  findActive(characterId: string): Loan[] {
    const rows = getDb()
      .prepare('SELECT * FROM loans WHERE character_id = ? AND is_active = 1 ORDER BY rowid ASC')
      .all(characterId) as LoanRow[];
    return rows.map(rowToLoan);
  },

  findByType(characterId: string, type: LoanType): Loan | null {
    const row = getDb()
      .prepare('SELECT * FROM loans WHERE character_id = ? AND type = ? AND is_active = 1 LIMIT 1')
      .get(characterId, type) as LoanRow | undefined;
    return row ? rowToLoan(row) : null;
  },

  /** Apply one year: accrue interest, subtract payment. Returns cash paid. */
  applyAnnualPayment(loan: Loan): number {
    const withInterest = loan.balance + Math.round(loan.balance * loan.interestRate);
    const payment = Math.min(loan.annualPayment, withInterest);
    const newBalance = Math.max(0, withInterest - payment);
    getDb()
      .prepare('UPDATE loans SET balance = ?, is_active = ? WHERE id = ?')
      .run(newBalance, newBalance > 0 ? 1 : 0, loan.id);
    return payment;
  },

  /** Increase (or create) a personal loan to cover a shortfall. */
  addToPersonal(characterId: string, amount: number): void {
    const existing = this.findByType(characterId, 'personal' as LoanType);
    if (existing) {
      const newBalance = existing.balance + amount;
      const newPayment = Math.round(newBalance / 5 + newBalance * existing.interestRate);
      getDb().prepare('UPDATE loans SET balance = ?, annual_payment = ?, is_active = 1 WHERE id = ?')
        .run(newBalance, newPayment, existing.id);
    } else {
      this.create({ characterId, type: 'personal' as LoanType, label: 'Personal Loan', principal: amount, interestRate: 0.09, termYears: 5 });
    }
  },

  totalBalance(characterId: string): number {
    const row = getDb()
      .prepare('SELECT COALESCE(SUM(balance), 0) as total FROM loans WHERE character_id = ? AND is_active = 1')
      .get(characterId) as { total: number };
    return row.total;
  },

  totalByType(characterId: string, type: LoanType): number {
    const row = getDb()
      .prepare('SELECT COALESCE(SUM(balance), 0) as total FROM loans WHERE character_id = ? AND type = ? AND is_active = 1')
      .get(characterId, type) as { total: number };
    return row.total;
  },
};
