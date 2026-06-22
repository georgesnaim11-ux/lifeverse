import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import type { Relationship } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partner: Relationship | null;
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
}

const STAGE_LABELS: Record<string, string> = {
  dating: 'Dating', engaged: 'Engaged', married: 'Married',
  friend: 'Friend', close_friend: 'Close Friend',
};

const WEDDINGS = [
  { tier: 'small', label: 'Small Wedding', cost: 5000, desc: 'Intimate & affordable · +12 happiness' },
  { tier: 'standard', label: 'Standard Wedding', cost: 20000, desc: 'A proper celebration · +20 happiness' },
  { tier: 'luxury', label: 'Luxury Wedding', cost: 60000, desc: 'The wedding of the year · +34 happiness' },
];

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

function Bar({ label, value, color }: { label: string; value: number; color: string }): JSX.Element {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>
        <span>{label}</span><span>{value}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export function LoveSheet(props: Props): JSX.Element {
  const { isOpen, onClose, partner, age, cash, isLoading,
    onFindPartner, onDate, onPropose, onPlanWedding, onDelayWedding, onCancelEngagement, onBreakUp } = props;
  const [showWeddings, setShowWeddings] = useState(false);

  const meta = partner?.partner;
  const stage = partner?.stage;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Relationships">
      {!partner ? (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>💘</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>You're single</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            {age < 16 ? 'You\'re too young to date yet.' : 'Put yourself out there and meet someone special.'}
          </p>
          {age >= 16 && (
            <button className="lv-btn lv-btn-primary" style={{ maxWidth: 240, margin: '0 auto' }} disabled={isLoading} onClick={onFindPartner}>
              Find a Partner
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Partner card */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--accent-dim)', borderRadius: 14, padding: 16, marginTop: 4, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{partner.name}</div>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {stage ? STAGE_LABELS[stage] : 'Partner'}
                </div>
              </div>
              <div style={{ fontSize: 32 }}>
                {stage === 'married' ? '💍' : stage === 'engaged' ? '💎' : '❤️'}
              </div>
            </div>

            {meta && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                <span>Age: <strong style={{ color: 'var(--text)' }}>{meta.age}</strong></span>
                <span>Job: <strong style={{ color: 'var(--text)' }}>{meta.occupation}</strong></span>
                <span style={{ gridColumn: '1 / -1' }}>Education: <strong style={{ color: 'var(--text)' }}>{meta.education}</strong></span>
              </div>
            )}

            <Bar label="Relationship Strength" value={partner.bond} color="var(--happiness)" />
            <Bar label="Trust" value={partner.trust} color="var(--intelligence)" />
            {meta && <Bar label={`${partner.name}'s Happiness`} value={meta.happiness} color="var(--health)" />}

            {meta && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span>💕 Dating since age {meta.datingStartAge}</span>
                {meta.engagementAge && <span>💎 Engaged at {meta.engagementAge}</span>}
                {meta.marriageAge && <span>💍 Married at {meta.marriageAge}</span>}
              </div>
            )}
          </div>

          {/* Actions */}
          <button className="lv-btn lv-btn-primary" style={{ marginBottom: 8 }} disabled={isLoading} onClick={onDate}>
            💐 Go on a Date
          </button>

          {stage === 'dating' && (
            <button className="lv-btn lv-btn-success" style={{ marginBottom: 8 }} disabled={isLoading} onClick={onPropose}>
              💎 Propose
            </button>
          )}

          {stage === 'engaged' && !showWeddings && (
            <>
              <button className="lv-btn lv-btn-success" style={{ marginBottom: 8 }} disabled={isLoading} onClick={() => setShowWeddings(true)}>
                💍 Plan Wedding
              </button>
              <button className="lv-btn" style={{ marginBottom: 8, background: 'var(--card-hover)', color: 'var(--text)', border: '1px solid var(--border)' }} disabled={isLoading} onClick={onDelayWedding}>
                Delay Wedding
              </button>
              <button className="lv-btn" style={{ marginBottom: 8, background: 'var(--card-hover)', color: 'var(--danger)', border: '1px solid var(--danger)' }} disabled={isLoading} onClick={onCancelEngagement}>
                Cancel Engagement
              </button>
            </>
          )}

          {stage === 'engaged' && showWeddings && (
            <>
              <div className="lv-cat-header"><span>💍</span><span>Choose Your Wedding</span></div>
              {WEDDINGS.map((w) => {
                const tooPoor = cash < w.cost;
                return (
                  <div key={w.tier} className={`lv-activity-row${tooPoor || isLoading ? ' disabled' : ''}`}
                    onClick={tooPoor || isLoading ? undefined : () => { onPlanWedding(w.tier); setShowWeddings(false); onClose(); }}>
                    <div className="lv-activity-info">
                      <div className="lv-activity-name">{w.label}</div>
                      <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>{w.desc}</div>
                    </div>
                    <div className="lv-activity-cost">
                      <span className="lv-cost-pill money">{fmt(w.cost)}</span>
                      {tooPoor && <span style={{ fontSize: 10, color: 'var(--danger)' }}>Can't afford</span>}
                    </div>
                  </div>
                );
              })}
              <button className="lv-btn" style={{ marginTop: 8, background: 'var(--card-hover)', color: 'var(--muted)', border: '1px solid var(--border)' }} onClick={() => setShowWeddings(false)}>
                ← Back
              </button>
            </>
          )}

          {stage !== 'married' && (
            <button className="lv-btn" style={{ marginTop: 8, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--border)' }} disabled={isLoading} onClick={onBreakUp}>
              Break Up
            </button>
          )}
        </>
      )}
    </BottomSheet>
  );
}
