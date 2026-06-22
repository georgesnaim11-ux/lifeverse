import { TraitBadge } from './TraitBadge';
import type { CharacterState, Relationship } from '@lifeverse/shared';
import type { TraitKey } from '@lifeverse/shared';

interface Props {
  charState: CharacterState;
  relationships: Relationship[];
}

const STAGE_LABELS: Record<string, string> = {
  childhood: 'Childhood',
  adolescence: 'Adolescence',
  young_adult: 'Young Adult',
  adult: 'Adult',
  senior: 'Senior',
  elder: 'Elder',
};

const TYPE_LABELS: Record<string, string> = {
  parent: 'Parent', sibling: 'Sibling', friend: 'Friend',
  partner: 'Partner', child: 'Child', rival: 'Rival', mentor: 'Mentor',
};

export function CharacterPanel({ charState, relationships }: Props): JSX.Element {
  const { character, traits } = charState;
  const liveRels = relationships.filter((r) => r.isAlive);

  return (
    <div>
      <div className="panel">
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{character.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {STAGE_LABELS[character.lifeStage] ?? character.lifeStage}
          </div>
        </div>
        {traits.length > 0 && (
          <>
            <div className="section-title">Traits</div>
            <div style={{ flexWrap: 'wrap', display: 'flex' }}>
              {traits.map((k) => <TraitBadge key={k} traitKey={k as TraitKey} />)}
            </div>
          </>
        )}
      </div>
      {liveRels.length > 0 && (
        <div className="panel">
          <div className="section-title">Relationships</div>
          {liveRels.map((r) => (
            <div className="rel-item" key={r.id}>
              <div className="rel-header">
                <span className="rel-name">{r.name}</span>
                <span className="rel-type">{TYPE_LABELS[r.type] ?? r.type}</span>
              </div>
              <div className="rel-bars">
                <MiniBar label="Bond" value={r.bond} color="var(--accent)" />
                <MiniBar label="Trust" value={r.trust} color="var(--success)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ color: 'var(--muted)', width: 30 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>
      <span style={{ color: 'var(--muted)', width: 22, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
