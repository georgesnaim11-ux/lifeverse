import type { DomainState } from '@lifeverse/shared';

interface Props {
  domains: DomainState;
}

const DOMAIN_META: Record<string, { label: string; color: string; icon: string }> = {
  academic:  { label: 'Academic',  color: '#48bca8', icon: '📚' },
  physical:  { label: 'Physical',  color: '#e05c5c', icon: '💪' },
  career:    { label: 'Career',    color: '#e8a83a', icon: '💼' },
  social:    { label: 'Social',    color: '#e8854a', icon: '🤝' },
  creative:  { label: 'Creative',  color: '#b48ef0', icon: '🎨' },
  mental:    { label: 'Mental',    color: '#5db88a', icon: '🧠' },
};

const DOMAIN_KEYS = ['academic', 'physical', 'career', 'social', 'creative', 'mental'] as const;

function MomentumArrow({ momentum }: { momentum: number }): JSX.Element {
  if (momentum >= 2) return <span style={{ color: 'var(--success)', fontSize: 11 }}>▲▲</span>;
  if (momentum === 1) return <span style={{ color: 'var(--success)', fontSize: 11 }}>▲</span>;
  if (momentum <= -2) return <span style={{ color: 'var(--danger)', fontSize: 11 }}>▼▼</span>;
  if (momentum === -1) return <span style={{ color: 'var(--danger)', fontSize: 11 }}>▼</span>;
  return <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>;
}

export function DomainPanel({ domains }: Props): JSX.Element {
  return (
    <div className="panel">
      <div className="section-title">Life Domains</div>
      {DOMAIN_KEYS.map((key) => {
        const meta = DOMAIN_META[key]!;
        const level = domains[key];
        const momentum = domains[`${key}Momentum` as keyof DomainState] as number;
        const neglect = domains[`${key}Neglect` as keyof DomainState] as number;
        const isNeglected = neglect >= 3;
        const pct = Math.min(100, Math.max(0, level));

        return (
          <div key={key} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>
                {meta.icon} {meta.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isNeglected && (
                  <span title={`Neglected ${neglect} years — decaying`} style={{ fontSize: 10, color: 'var(--warning)' }}>⚠</span>
                )}
                <MomentumArrow momentum={momentum} />
                <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 22, textAlign: 'right' }}>{level}</span>
              </div>
            </div>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
            </div>
            {level >= 50 && (
              <div style={{ fontSize: 10, color: meta.color, marginTop: 2, opacity: 0.8 }}>
                {getDomainBonus(key)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getDomainBonus(domain: string): string {
  switch (domain) {
    case 'academic': return '✦ +15% intelligence from events';
    case 'physical': return '✦ Health decay halved';
    case 'career':   return '✦ +10% annual salary';
    case 'social':   return '✦ Bond decay halved';
    case 'creative': return '✦ +3 happiness/year';
    case 'mental':   return '✦ +10 stress recovery/year';
    default: return '';
  }
}
