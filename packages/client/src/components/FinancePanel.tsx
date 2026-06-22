import type { Finance } from '@lifeverse/shared';

interface Props {
  finance: Finance;
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

export function FinancePanel({ finance }: Props): JSX.Element {
  const netWorth = finance.cash - finance.totalDebt;
  return (
    <div className="panel">
      <div className="section-title">Finances</div>
      <div className="finance-grid">
        <div className="finance-item">
          <div className="finance-label">Cash</div>
          <div className="finance-value positive">{fmt(finance.cash)}</div>
        </div>
        <div className="finance-item">
          <div className="finance-label">Net Worth</div>
          <div className={`finance-value ${netWorth >= 0 ? 'positive' : 'negative'}`}>{fmt(netWorth)}</div>
        </div>
        <div className="finance-item">
          <div className="finance-label">Income / yr</div>
          <div className="finance-value">{fmt(finance.annualIncome)}</div>
        </div>
        <div className="finance-item">
          <div className="finance-label">Expenses / yr</div>
          <div className="finance-value">{fmt(finance.annualExpenses)}</div>
        </div>
      </div>
      {finance.totalDebt > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--danger)' }}>
          Debt: {fmt(finance.totalDebt)}
        </div>
      )}
    </div>
  );
}
