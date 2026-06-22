import type { ActivityDefinition, CharacterResources } from '@lifeverse/shared';

interface Props {
  activities: ActivityDefinition[];
  resources: CharacterResources;
  onPerform: (activityId: string) => void;
  isLoading: boolean;
}

const DOMAIN_COLORS: Record<string, string> = {
  academic: '#48bca8',
  physical: '#e05c5c',
  career:   '#e8a83a',
  social:   '#e8854a',
  creative: '#b48ef0',
  mental:   '#5db88a',
};

const DOMAIN_ICONS: Record<string, string> = {
  academic: '📚',
  physical: '💪',
  career:   '💼',
  social:   '🤝',
  creative: '🎨',
  mental:   '🧠',
};

const DOMAIN_LABELS: Record<string, string> = {
  academic: 'Academic',
  physical: 'Physical',
  career:   'Career',
  social:   'Social',
  creative: 'Creative',
  mental:   'Mental',
};

function CostPill({ label, value, color }: { label: string; value: number | string; color: string }): JSX.Element {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      padding: '2px 6px', borderRadius: 99,
      background: `${color}22`, color, fontSize: 10, fontWeight: 600,
    }}>
      {label} {value}
    </span>
  );
}

function ActivityCard({
  activity,
  resources,
  onPerform,
  isLoading,
}: {
  activity: ActivityDefinition;
  resources: CharacterResources;
  onPerform: () => void;
  isLoading: boolean;
}): JSX.Element {
  const remaining = resources.totalTimeSlots - resources.usedTimeSlots;
  const cantAffordTime = activity.timeCost > remaining;
  const cantAffordMental = (activity.mentalCost ?? 0) > resources.mentalEnergy;
  const cantAffordPhysical = (activity.physicalCost ?? 0) > resources.physicalEnergy;
  const isBlocked = resources.burnoutState && (activity.burnoutRisk ?? 0) > 0.2;
  const disabled = isLoading || cantAffordTime || isBlocked;

  const domainColor = DOMAIN_COLORS[activity.domain] ?? 'var(--accent)';

  return (
    <div style={{
      border: `1px solid ${disabled ? 'var(--border)' : domainColor + '55'}`,
      borderRadius: 8,
      padding: '12px 14px',
      background: disabled ? 'var(--panel)' : 'var(--card)',
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'border-color 0.15s, background 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>{DOMAIN_ICONS[activity.domain]}</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: disabled ? 'var(--muted)' : 'var(--text)' }}>
            {activity.label}
          </span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
          background: `${domainColor}22`, color: domainColor,
        }}>
          {DOMAIN_LABELS[activity.domain]}
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 8 }}>
        {activity.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        <CostPill label="⏱" value={`${activity.timeCost} slot${activity.timeCost > 1 ? 's' : ''}`} color={cantAffordTime ? 'var(--danger)' : 'var(--accent)'} />
        {(activity.mentalCost ?? 0) > 0 && (
          <CostPill label="🧠" value={activity.mentalCost!} color={cantAffordMental ? 'var(--danger)' : 'var(--intelligence)'} />
        )}
        {(activity.physicalCost ?? 0) > 0 && (
          <CostPill label="💪" value={activity.physicalCost!} color={cantAffordPhysical ? 'var(--danger)' : 'var(--health)'} />
        )}
        {(activity.moneyCost ?? 0) > 0 && (
          <CostPill label="$" value={activity.moneyCost!.toLocaleString()} color="var(--warning)" />
        )}
        {(activity.energyRestore?.mental ?? 0) > 0 && (
          <CostPill label="🧠+" value={activity.energyRestore!.mental!} color="var(--success)" />
        )}
        {(activity.energyRestore?.physical ?? 0) > 0 && (
          <CostPill label="💪+" value={activity.energyRestore!.physical!} color="var(--success)" />
        )}
      </div>

      {isBlocked && (
        <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>⚠ Blocked — burnout state active</div>
      )}

      <button
        style={{
          width: '100%', padding: '7px 0', borderRadius: 6,
          background: disabled ? 'var(--border)' : domainColor,
          color: disabled ? 'var(--muted)' : '#fff',
          border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 12, fontWeight: 700, transition: 'opacity 0.15s',
        }}
        onClick={disabled ? undefined : onPerform}
        disabled={disabled}
      >
        {cantAffordTime ? 'No Time Left' : isBlocked ? 'Blocked' : 'Do This →'}
      </button>
    </div>
  );
}

const DOMAIN_ORDER = ['academic', 'physical', 'career', 'social', 'creative', 'mental'];

export function ActivityPanel({ activities, resources, onPerform, isLoading }: Props): JSX.Element {
  const remaining = resources.totalTimeSlots - resources.usedTimeSlots;

  if (activities.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <div className="section-title">Activities</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
          {remaining === 0
            ? 'No time slots remaining. Age up to start a new year.'
            : 'No activities available. Age up to continue.'}
        </p>
      </div>
    );
  }

  // Group by domain
  const grouped = new Map<string, ActivityDefinition[]>();
  for (const domain of DOMAIN_ORDER) {
    const group = activities.filter((a) => a.domain === domain);
    if (group.length > 0) grouped.set(domain, group);
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="section-title">Choose an Activity</div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
        {remaining} time slot{remaining !== 1 ? 's' : ''} remaining · Mental {Math.round(resources.mentalEnergy)}/{resources.mentalEnergyMax} · Physical {Math.round(resources.physicalEnergy)}/{resources.physicalEnergyMax}
      </p>
      {Array.from(grouped.entries()).map(([domain, group]) => (
        <div key={domain} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: DOMAIN_COLORS[domain] ?? 'var(--muted)', marginBottom: 8 }}>
            {DOMAIN_ICONS[domain]} {DOMAIN_LABELS[domain]}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                resources={resources}
                onPerform={() => onPerform(activity.id)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
