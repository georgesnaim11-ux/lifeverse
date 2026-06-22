import type { FocusBudget, FocusAction } from '@lifeverse/shared';

interface Props {
  budget: FocusBudget;
  actions: FocusAction[];
  onSpend: (key: string) => void;
  isLoading: boolean;
}

export function FocusPanel({ budget, actions, onSpend, isLoading }: Props): JSX.Element {
  const dots = Array.from({ length: budget.total }, (_, i) => i < budget.remaining);

  return (
    <div className="focus-panel">
      <div className="section-title">Focus Points</div>
      <div className="focus-budget">
        {dots.map((available, i) => (
          <div key={i} className={`fp-dot ${available ? '' : 'spent'}`} />
        ))}
        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
          {budget.remaining}/{budget.total} remaining
        </span>
      </div>
      {actions.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>No focus points remaining this year.</p>
      ) : (
        <div className="focus-actions">
          {actions.map((a) => (
            <button
              key={a.key}
              className="focus-action-btn"
              onClick={() => onSpend(a.key)}
              disabled={isLoading || a.cost > budget.remaining}
              title={a.description}
            >
              <span>{a.label}</span>
              <span className="focus-action-cost">{a.cost} FP</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
