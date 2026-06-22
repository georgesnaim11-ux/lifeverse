import type { StatKey } from '@lifeverse/shared';

const STAT_COLORS: Record<string, string> = {
  health: 'var(--health)',
  intelligence: 'var(--intelligence)',
  happiness: 'var(--happiness)',
  charisma: 'var(--charisma)',
  discipline: 'var(--discipline)',
  creativity: 'var(--creativity)',
};

const STAT_LABELS: Record<string, string> = {
  health: 'Health',
  intelligence: 'Intelligence',
  happiness: 'Happiness',
  charisma: 'Charisma',
  discipline: 'Discipline',
  creativity: 'Creativity',
};

interface Props {
  stat: StatKey;
  value: number;
}

export function StatBar({ stat, value }: Props): JSX.Element {
  const color = STAT_COLORS[stat] ?? 'var(--accent)';
  const label = STAT_LABELS[stat] ?? stat;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="stat-row">
      <div className="stat-header">
        <span className="stat-name" style={{ color }}>{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-bar-track">
        <div
          className="stat-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
