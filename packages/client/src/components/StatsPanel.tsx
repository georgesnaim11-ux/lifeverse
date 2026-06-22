import { STAT_KEYS } from '@lifeverse/shared';
import type { StatBlock } from '@lifeverse/shared';
import { StatBar } from './StatBar';

interface Props {
  stats: StatBlock;
}

export function StatsPanel({ stats }: Props): JSX.Element {
  return (
    <div className="panel">
      <div className="section-title">Stats</div>
      {STAT_KEYS.map((key) => (
        <StatBar key={key} stat={key} value={stats[key]} />
      ))}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--muted)' }}>Stress</span>
          <span style={{ color: stats.stress > 70 ? 'var(--danger)' : 'var(--muted)' }}>{stats.stress}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
          <span style={{ color: 'var(--muted)' }}>Willpower</span>
          <span style={{ color: 'var(--muted)' }}>{stats.willpower}</span>
        </div>
      </div>
    </div>
  );
}
