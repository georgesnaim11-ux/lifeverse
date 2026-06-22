import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import type { Relationship } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  relationships: Relationship[];
  flags: Record<string, boolean>;
  age: number;
  cash: number;
  isLoading: boolean;
  onFindPartner: () => void;
  onDate: () => void;
  onPropose: () => void;
  onPlanWedding: (tier: string) => void;
  onDelayWedding: () => void;
  onCancelEngagement: () => void;
  onBreakUp: () => void;
  onTryForBaby: () => void;
  onToggleBirthControl: () => void;
  onDivorce: () => void;
}

function band(v: number): { label: string; color: string } {
  if (v >= 90) return { label: 'Excellent', color: 'var(--success)' };
  if (v >= 70) return { label: 'Strong', color: '#3ba776' };
  if (v >= 50) return { label: 'Stable', color: 'var(--warning)' };
  if (v >= 30) return { label: 'Weak', color: '#d9803a' };
  return { label: 'Critical', color: 'var(--danger)' };
}

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

const RELATION_ICONS: Record<string, string> = {
  parent: '👤', sibling: '🧑', child: '🧒', grandparent: '👴', aunt: '👩',
  uncle: '👨', cousin: '🧑', friend: '🙂', niece: '👧', nephew: '👦', partner: '❤️',
};

function PersonRow({ rel }: { rel: Relationship }): JSX.Element {
  const b = band(rel.bond);
  const m = rel.partner;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 2px', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 20 }}>{RELATION_ICONS[rel.type] ?? '🙂'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{rel.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
          {m?.age != null ? `Age ${m.age}` : ''}{m?.occupation ? ` · ${m.occupation}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{b.label}</div>
        <div style={{ width: 56, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
          <div style={{ width: `${rel.bond}%`, height: '100%', background: b.color }} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, people }: { title: string; icon: string; people: Relationship[] }): JSX.Element | null {
  if (people.length === 0) return null;
  return (
    <>
      <div className="lv-cat-header"><span>{icon}</span><span>{title}</span></div>
      {people.map((r) => <PersonRow key={r.id} rel={r} />)}
    </>
  );
}

export function RelationshipsSheet(props: Props): JSX.Element {
  const { isOpen, onClose, relationships, flags, age, cash, isLoading,
    onFindPartner, onDate, onPropose, onPlanWedding, onDelayWedding,
    onCancelEngagement, onBreakUp, onTryForBaby, onToggleBirthControl, onDivorce } = props;
  const [showWeddings, setShowWeddings] = useState(false);

  const live = relationships.filter((r) => r.isAlive);
  const partner = live.find((r) => r.type === 'partner') ?? null;
  const children = live.filter((r) => r.type === 'child');
  const parents = live.filter((r) => r.type === 'parent');
  const siblings = live.filter((r) => r.type === 'sibling');
  const grandparents = live.filter((r) => r.type === 'grandparent');
  const extended = live.filter((r) => ['aunt', 'uncle', 'cousin', 'niece', 'nephew'].includes(r.type));
  const friends = live.filter((r) => r.type === 'friend');
  const stage = partner?.stage;
  const onBirthControl = flags['birthControl'];

  const WEDDINGS = [
    { tier: 'small', label: 'Small Wedding', cost: 5000 },
    { tier: 'standard', label: 'Standard Wedding', cost: 20000 },
    { tier: 'luxury', label: 'Luxury Wedding', cost: 60000 },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Relationships">
      {/* ── Partner / love ── */}
      <div className="lv-cat-header"><span>❤️</span><span>Love Life</span></div>
      {!partner ? (
        <div style={{ padding: '8px 0 14px' }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
            {age < 16 ? "You're too young to date." : "You're single."}
          </p>
          {age >= 16 && (
            <button className="lv-btn lv-btn-primary" disabled={isLoading} onClick={onFindPartner}>Meet Someone New</button>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--accent-dim)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{partner.name}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                {stage === 'married' ? 'Spouse' : stage === 'engaged' ? 'Fiancé(e)' : 'Dating'}
              </div>
            </div>
            <span style={{ fontSize: 28 }}>{stage === 'married' ? '💍' : stage === 'engaged' ? '💎' : '❤️'}</span>
          </div>
          {partner.partner && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
              Age {partner.partner.age} · {partner.partner.occupation} · {partner.partner.education}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Relationship Strength — {band(partner.bond).label}</div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${partner.bond}%`, height: '100%', background: band(partner.bond).color }} />
          </div>

          <button className="lv-btn lv-btn-primary" style={{ marginBottom: 8 }} disabled={isLoading} onClick={onDate}>💐 Go on a Date</button>

          {stage === 'dating' && (
            <button className="lv-btn lv-btn-success" style={{ marginBottom: 8 }} disabled={isLoading} onClick={onPropose}>💎 Propose</button>
          )}

          {stage === 'engaged' && !showWeddings && (
            <>
              <button className="lv-btn lv-btn-success" style={{ marginBottom: 8 }} disabled={isLoading} onClick={() => setShowWeddings(true)}>💍 Plan Wedding</button>
              <button className="lv-btn" style={{ marginBottom: 8, background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)' }} disabled={isLoading} onClick={onDelayWedding}>Delay Wedding</button>
              <button className="lv-btn" style={{ marginBottom: 8, background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} disabled={isLoading} onClick={onCancelEngagement}>End Engagement</button>
            </>
          )}

          {stage === 'engaged' && showWeddings && WEDDINGS.map((w) => {
            const tooPoor = cash < w.cost;
            return (
              <button key={w.tier} className="lv-btn lv-btn-success" style={{ marginBottom: 8, opacity: tooPoor ? 0.5 : 1 }}
                disabled={isLoading || tooPoor} onClick={() => { onPlanWedding(w.tier); setShowWeddings(false); }}>
                {w.label} — {fmt(w.cost)}{tooPoor ? ' (too pricey)' : ''}
              </button>
            );
          })}

          {stage === 'married' && (
            <>
              <button className="lv-btn lv-btn-primary" style={{ marginBottom: 8, opacity: onBirthControl || age > 55 ? 0.6 : 1 }}
                disabled={isLoading} onClick={onTryForBaby}>👶 Try for a Baby</button>
              <button className="lv-btn" style={{ marginBottom: 8, background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                disabled={isLoading} onClick={onToggleBirthControl}>
                {onBirthControl ? '🟢 Birth Control: ON' : '⚪ Birth Control: OFF'}
              </button>
              <button className="lv-btn" style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                disabled={isLoading} onClick={onDivorce}>💔 Divorce</button>
            </>
          )}

          {(stage === 'dating') && (
            <button className="lv-btn" style={{ marginTop: 4, background: 'transparent', border: '1px solid var(--border)', color: 'var(--danger)' }}
              disabled={isLoading} onClick={onBreakUp}>Break Up</button>
          )}
        </div>
      )}

      <Section title="Children" icon="🧒" people={children} />
      <Section title="Parents" icon="👪" people={parents} />
      <Section title="Siblings" icon="🧑‍🤝‍🧑" people={siblings} />
      <Section title="Grandparents" icon="👵" people={grandparents} />
      <Section title="Extended Family" icon="👨‍👩‍👧‍👦" people={extended} />
      <Section title="Friends" icon="🙌" people={friends} />

      <div style={{ height: 12 }} />
    </BottomSheet>
  );
}
