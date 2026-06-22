import type { CharacterState, FocusBudget } from '@lifeverse/shared';

interface Props {
  charState: CharacterState;
  focus: FocusBudget;
  onAgeUp: () => void;
  onSave: () => void;
  isLoading: boolean;
  phase: string;
}

const STAGE_LABELS: Record<string, string> = {
  childhood: 'Child', adolescence: 'Teen', young_adult: 'Young Adult',
  adult: 'Adult', senior: 'Senior', elder: 'Elder',
};

export function TopBar({ charState, focus, onAgeUp, onSave, isLoading, phase }: Props): JSX.Element {
  const { character } = charState;
  const canAgeUp = phase === 'playing' && !isLoading && character.isAlive;

  return (
    <header className="topbar">
      <div className="topbar-brand">LifeVerse</div>
      <div className="topbar-info">
        <div className="topbar-stat">
          <span className="topbar-stat-label">Name</span>
          <span className="topbar-stat-value">{character.name}</span>
        </div>
        <div className="topbar-stat">
          <span className="topbar-stat-label">Age</span>
          <span className="topbar-stat-value">{character.age}</span>
        </div>
        <div className="topbar-stat">
          <span className="topbar-stat-label">Stage</span>
          <span className="topbar-stat-value">{STAGE_LABELS[character.lifeStage] ?? character.lifeStage}</span>
        </div>
        <div className="topbar-stat">
          <span className="topbar-stat-label">Focus</span>
          <span className="topbar-stat-value">{focus.remaining}/{focus.total}</span>
        </div>
      </div>
      <div className="topbar-actions">
        <button className="btn btn-secondary btn-sm" onClick={onSave} disabled={isLoading}>
          Save
        </button>
        <button
          className="btn btn-primary"
          onClick={onAgeUp}
          disabled={!canAgeUp}
          style={{ minWidth: 100 }}
        >
          {isLoading ? '…' : 'Age Up →'}
        </button>
      </div>
    </header>
  );
}
