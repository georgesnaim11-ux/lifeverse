import type { CharacterResources } from '@lifeverse/shared';

interface Props {
  resources: CharacterResources;
}

function EnergyBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }): JSX.Element {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);
  const isLow = pct < 25;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: isLow ? 'var(--danger)' : 'var(--muted)' }}>{label}</span>
        <span style={{ color: isLow ? 'var(--danger)' : 'var(--muted)' }}>{Math.round(value)}/{max}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: isLow ? 'var(--danger)' : color,
          borderRadius: 3, transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

export function ResourceBar({ resources }: Props): JSX.Element {
  const remaining = resources.totalTimeSlots - resources.usedTimeSlots;
  const dots = Array.from({ length: resources.totalTimeSlots }, (_, i) => i < remaining);

  return (
    <div className="panel">
      <div className="section-title">Resources</div>

      {resources.burnoutState && (
        <div style={{ padding: '8px 10px', background: 'rgba(224,92,92,0.15)', border: '1px solid var(--danger)', borderRadius: 6, marginBottom: 10, fontSize: 12, color: 'var(--danger)' }}>
          ⚠ Burnout — high-effort activities blocked. Rest to recover.
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>
          TIME SLOTS — {remaining}/{resources.totalTimeSlots} remaining
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {dots.map((available, i) => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: 4,
              background: available ? 'var(--accent)' : 'var(--border)',
              border: `1px solid ${available ? 'var(--accent)' : 'transparent'}`,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      <EnergyBar label="Mental Energy" value={resources.mentalEnergy} max={resources.mentalEnergyMax} color="var(--intelligence)" />
      <EnergyBar label="Physical Energy" value={resources.physicalEnergy} max={resources.physicalEnergyMax} color="var(--health)" />

      {resources.consecutiveLowMentalYears > 0 && !resources.burnoutState && (
        <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 6 }}>
          ⚡ Low mental energy for {resources.consecutiveLowMentalYears} year{resources.consecutiveLowMentalYears > 1 ? 's' : ''} — burnout risk rising
        </div>
      )}
    </div>
  );
}
