interface Props {
  outcome: string;
  hasMoreEvents: boolean;
  onContinue: () => void;
  onDone: () => void;
  isLoading: boolean;
}

export function OutcomeCard({ outcome, hasMoreEvents, onContinue, onDone, isLoading }: Props): JSX.Element {
  return (
    <div style={{ padding: 20 }}>
      <div className="outcome-card">
        <div className="outcome-label">What happened</div>
        <div className="outcome-text">"{outcome}"</div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          {hasMoreEvents ? (
            <button className="btn btn-primary" onClick={onContinue} disabled={isLoading}>
              Next Event →
            </button>
          ) : (
            <button className="btn btn-success" onClick={onDone} disabled={isLoading}>
              Continue Living →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
