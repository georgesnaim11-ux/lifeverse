import { getDb } from '../db/index.js';
import type { Finance } from '@lifeverse/shared';

interface FinanceRow {
  character_id: string;
  cash: number;
  annual_income: number;
  annual_expenses: number;
  total_debt: number;
  updated_at: string;
}

function rowToFinance(row: FinanceRow): Finance {
  return {
    characterId: row.character_id,
    cash: row.cash,
    annualIncome: row.annual_income,
    annualExpenses: row.annual_expenses,
    totalDebt: row.total_debt,
    updatedAt: row.updated_at,
  };
}

export const FinanceModel = {
  create(characterId: string, startingCash = 1000): Finance {
    getDb()
      .prepare(
        `INSERT INTO finances (character_id, cash) VALUES (?, ?)`,
      )
      .run(characterId, startingCash);
    return this.findByCharacterId(characterId) as Finance;
  },

  findByCharacterId(characterId: string): Finance | null {
    const row = getDb()
      .prepare('SELECT * FROM finances WHERE character_id = ?')
      .get(characterId) as FinanceRow | undefined;
    return row ? rowToFinance(row) : null;
  },

  update(
    characterId: string,
    fields: Partial<Pick<Finance, 'cash' | 'annualIncome' | 'annualExpenses' | 'totalDebt'>>,
  ): Finance {
    const updates: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];
    if (fields.cash !== undefined) { updates.push('cash = ?'); values.push(fields.cash); }
    if (fields.annualIncome !== undefined) { updates.push('annual_income = ?'); values.push(fields.annualIncome); }
    if (fields.annualExpenses !== undefined) { updates.push('annual_expenses = ?'); values.push(fields.annualExpenses); }
    if (fields.totalDebt !== undefined) { updates.push('total_debt = ?'); values.push(fields.totalDebt); }
    values.push(characterId);
    getDb()
      .prepare(`UPDATE finances SET ${updates.join(', ')} WHERE character_id = ?`)
      .run(...values);
    return this.findByCharacterId(characterId) as Finance;
  },

  applyAnnualCashFlow(characterId: string): Finance {
    const current = this.findByCharacterId(characterId);
    if (!current) throw new Error(`Finance record not found for ${characterId}`);
    const netFlow = current.annualIncome - current.annualExpenses;
    return this.update(characterId, { cash: Math.max(0, current.cash + netFlow) });
  },
};
