import { BottomSheet } from './BottomSheet';
import type { StatBlock, DomainState } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: StatBlock;
  domains: DomainState;
}

const STATS = [
  { key: 'health',       label: 'Health',       icon: '❤️',  color: 'var(--health)' },
  { key: 'happiness',    label: 'Happiness',    icon: '😊', color: 'var(--happiness)' },
  { key: 'intelligence', label: 'Intelligence', icon: '🧠', color: 'var(--intelligence)' },
  { key: 'looks',        label: 'Looks',        icon: '✨', color: 'var(--looks)' },
] as const;

const DOMAINS = [
  { key: 'academic', label: 'Academic',  icon: '📚', color: 'var(--d-academic)' },
  { key: 'physical', label: 'Physical',  icon: '💪', color: 'var(--d-physical)' },
  { key: 'career',   label: 'Career',    icon: '💼', color: 'var(--d-career)' },
  { key: 'social',   label: 'Social',    icon: '🤝', color: 'var(--d-social)' },
  { key: 'creative', label: 'Creative',  icon: '🎨', color: 'var(--d-creative)' },
  { key: 'mental',   label: 'Mental',    icon: '🧘', color: 'var(--d-mental)' },
] as const;

function momentumIcon(m: number): string {
  if (m >= 2) return '▲▲';
  if (m === 1) return '▲';
  if (m <= -2) return '▼▼';
  if (m === -1) return '▼';
  return '—';
}

function momentumColor(m: number): string {
  if (m > 0) return 'var(--success)';
  if (m < 0) return 'var(--danger)';
  return 'var(--muted)';
}

export function StatsSheet({ isOpen, onClose, stats, domains }: Props): JSX.Element {
  const stress = stats.stress;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Stats & Domains">
      <div className="lv-sheet-section-title">Character Stats</div>

      {STATS.map(({ key, label, icon, color }) => {
        const val = stats[key as keyof StatBlock] as number;
        return (
          <div key={key} className="lv-stat-detail">
            <span className="lv-stat-detail-icon">{icon}</span>
            <div className="lv-stat-detail-info">
              <div className="lv-stat-detail-name">{label}</div>
              <div className="lv-stat-detail-bar">
                <div className="lv-stat-detail-fill" style={{ width: `${val}%`, background: color }} />
              </div>
            </div>
            <span className="lv-stat-detail-val" style={{ color }}>{val}</span>
          </div>
        );
      })}

      {/* Stress shown separately */}
      <div className="lv-stat-detail">
        <span className="lv-stat-detail-icon">😰</span>
        <div className="lv-stat-detail-info">
          <div className="lv-stat-detail-name">Stress</div>
          <div className="lv-stat-detail-bar">
            <div className="lv-stat-detail-fill" style={{ width: `${stress}%`, background: stress > 70 ? 'var(--danger)' : 'var(--stress)' }} />
          </div>
        </div>
        <span className="lv-stat-detail-val" style={{ color: stress > 70 ? 'var(--danger)' : 'var(--stress)' }}>{stress}</span>
      </div>

      <div className="lv-sheet-section-title" style={{ marginTop: 8 }}>Life Domains</div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
        Domains grow through activities and unlock passive bonuses at level 50+.
      </p>

      {DOMAINS.map(({ key, label, icon, color }) => {
        const val = domains[key as keyof DomainState] as number;
        const mKey = `${key}Momentum` as keyof DomainState;
        const m = domains[mKey] as number;
        const nKey = `${key}Neglect` as keyof DomainState;
        const neglect = domains[nKey] as number;

        return (
          <div key={key} className="lv-domain-row">
            <div className="lv-domain-left">
              <span className="lv-domain-icon">{icon}</span>
              <span className="lv-domain-name" style={{ color }}>{label}</span>
            </div>
            <div className="lv-domain-bar-wrap">
              <div className="lv-domain-fill" style={{ width: `${val}%`, background: color }} />
            </div>
            <span className="lv-domain-momentum" style={{ color: momentumColor(m) }}>{momentumIcon(m)}</span>
            <span className="lv-domain-val">{val}</span>
            {neglect >= 3 && <span style={{ fontSize: 11, color: 'var(--warning)' }} title={`Neglected ${neglect}y`}>⚠</span>}
          </div>
        );
      })}

      <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text)' }}>Passive Bonuses at 50+</strong><br />
          📚 Academic → +15% intelligence from events<br />
          💪 Physical → Health decay halved<br />
          💼 Career → +10% annual salary<br />
          🤝 Social → Bond decay halved<br />
          🎨 Creative → +3 happiness / year<br />
          🧘 Mental → +10 stress recovery / year
        </div>
      </div>
    </BottomSheet>
  );
}
