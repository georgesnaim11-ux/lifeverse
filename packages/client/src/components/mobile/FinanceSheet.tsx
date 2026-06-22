import { BottomSheet } from './BottomSheet';
import type { Finance, FinanceSummary, ExpenseBreakdown, Loan } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  finance: Finance;
  summary: FinanceSummary;
  expenses: ExpenseBreakdown;
  loans: Loan[];
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${Math.round(abs)}`;
}

function Row({ label, value, positive, bold, indent }: { label: string; value: number; positive?: boolean; bold?: boolean; indent?: boolean }): JSX.Element {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '7px 0', paddingLeft: indent ? 14 : 0,
      borderBottom: bold ? '1px solid var(--border)' : 'none',
      fontWeight: bold ? 800 : 500, fontSize: bold ? 14 : 13,
    }}>
      <span style={{ color: bold ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
      <span style={{ color: positive === undefined ? 'var(--text)' : positive ? 'var(--success)' : 'var(--danger)' }}>
        {value < 0 ? '-' : ''}{fmt(Math.abs(value))}
      </span>
    </div>
  );
}

const LOAN_LABELS: Record<string, string> = {
  student: '🎓 Student Loan', mortgage: '🏠 Mortgage', personal: '💳 Personal Loan',
};

export function FinanceSheet({ isOpen, onClose, summary, expenses, loans }: Props): JSX.Element {
  const netYear = summary.annualIncome + summary.rentalIncome - expenses.total;
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Finances">
      <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Net Worth</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: summary.netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {summary.netWorth < 0 ? '-' : ''}{fmt(Math.abs(summary.netWorth))}
        </div>
      </div>

      <div className="lv-cat-header"><span>📈</span><span>Assets</span></div>
      <Row label="Cash" value={summary.cash} positive />
      <Row label="Real Estate" value={summary.portfolioValue} positive />
      <Row label="Vehicle Value" value={summary.vehicleValue} positive />
      <Row label="Total Assets" value={summary.totalAssets} bold positive />

      <div className="lv-cat-header" style={{ marginTop: 14 }}><span>📉</span><span>Liabilities</span></div>
      <Row label="Student Debt" value={summary.studentDebt} positive={false} />
      <Row label="Mortgage" value={summary.mortgageDebt} positive={false} />
      <Row label="Personal Loans" value={summary.personalDebt} positive={false} />
      <Row label="Total Liabilities" value={summary.totalLiabilities} bold positive={false} />

      {loans.length > 0 && (
        <>
          <div className="lv-cat-header" style={{ marginTop: 14 }}><span>🏦</span><span>Active Loans</span></div>
          {loans.map((l) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{LOAN_LABELS[l.type] ?? l.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmt(l.annualPayment)}/yr · {Math.round(l.interestRate * 100)}% APR</div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>{fmt(l.balance)}</span>
            </div>
          ))}
        </>
      )}

      <div className="lv-cat-header" style={{ marginTop: 14 }}><span>💵</span><span>Annual Cash Flow</span></div>
      <Row label="Income" value={summary.annualIncome} positive />
      {summary.rentalIncome > 0 && <Row label="Rental Income" value={summary.rentalIncome} positive indent />}
      <Row label="Housing" value={-expenses.housing} positive={false} indent />
      <Row label="Vehicle" value={-expenses.vehicle} positive={false} indent />
      <Row label="Education" value={-expenses.education} positive={false} indent />
      <Row label="Family" value={-expenses.family} positive={false} indent />
      <Row label="Lifestyle" value={-expenses.lifestyle} positive={false} indent />
      <Row label="Loan Payments" value={-expenses.loanPayments} positive={false} indent />
      <Row label="Net / Year" value={netYear} bold positive={netYear >= 0} />

      <div style={{ height: 12 }} />
    </BottomSheet>
  );
}
