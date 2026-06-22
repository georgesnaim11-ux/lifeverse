import type { CharacterState, Finance } from '@lifeverse/shared';
import { STAT_KEYS } from '@lifeverse/shared';

interface Props {
  charState: CharacterState;
  finance: Finance;
  onRestart: () => void;
}

const STAT_LABELS: Record<string, string> = {
  health: 'Health', intelligence: 'Intelligence', happiness: 'Happiness',
  charisma: 'Charisma', discipline: 'Discipline', creativity: 'Creativity',
};

export function GameOverScreen({ charState, finance, onRestart }: Props): JSX.Element {
  const { character, stats } = charState;
  const netWorth = finance.cash - finance.totalDebt;

  function fmt(n: number): string {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n}`;
  }

  return (
    <div className="game-over">
      <div style={{ fontSize: 40, marginBottom: 8 }}>✦</div>
      <div className="game-over-title">{character.name}</div>
      <div style={{ color: 'var(--muted)', fontSize: 15 }}>
        Lived to age {character.age} · {character.lifeStage}
      </div>
      <div className="game-over-stats">
        {STAT_KEYS.map((stat) => (
          <div className="go-stat" key={stat}>
            <div className="go-stat-label">{STAT_LABELS[stat]}</div>
            <div className="go-stat-value" style={{ color: `var(--${stat})` }}>{stats[stat]}</div>
          </div>
        ))}
        <div className="go-stat">
          <div className="go-stat-label">Net Worth</div>
          <div className="go-stat-value" style={{ color: netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {fmt(netWorth)}
          </div>
        </div>
        <div className="go-stat">
          <div className="go-stat-label">Years Lived</div>
          <div className="go-stat-value">{character.age}</div>
        </div>
      </div>
      <p style={{ color: 'var(--muted)', maxWidth: 360, lineHeight: 1.7, fontSize: 14 }}>
        Every life tells a story. This one was yours.
      </p>
      <button className="btn btn-primary btn-lg" onClick={onRestart} style={{ marginTop: 16 }}>
        Start a New Life →
      </button>
    </div>
  );
}
