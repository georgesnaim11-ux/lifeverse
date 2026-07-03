import { type CSSProperties } from 'react';
import { BottomSheet } from './BottomSheet';
import {
  SPORTS, SPORT_BY_ID, SCHOOL_TIER_LABELS, CLUB_BY_ID, TRAINING_DECISIONS,
  SPORTS_MIN_AGE, SportsPhase,
} from '@lifeverse/shared';
import type { SportsCareerState } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sports: SportsCareerState | null;
  age: number;
  isLoading: boolean;
  onTryout: (sport: string) => void;
  onDecide: (decisionId: string) => void;
  onQuit: () => void;
  onAcceptOffer: () => void;
  onRejectOffer: () => void;
  onNegotiate: () => void;
  onRequestTransfer: () => void;
  onRetire: () => void;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

const miniBtn: CSSProperties = {
  flex: '1 1 auto', minWidth: 0, padding: '8px 6px', fontSize: 11, fontWeight: 700,
  background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8,
};

function Bar({ label, value, color }: { label: string; value: number; color: string }): JSX.Element {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>{label}</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{value}</span>
      </div>
      <div style={{ height: 6, background: 'var(--card-hover)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }): JSX.Element {
  return (
    <div>
      <div style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontWeight: 700, color: good ? 'var(--success)' : 'var(--text)' }}>{value}</div>
    </div>
  );
}

export function SportsSheet(props: Props): JSX.Element {
  const { isOpen, onClose, sports, age, isLoading,
    onTryout, onDecide, onQuit, onAcceptOffer, onRejectOffer, onNegotiate, onRequestTransfer, onRetire } = props;

  const decidedThisYear = sports ? sports.lastDecisionAge >= age : false;
  const offerClub = sports?.pendingOfferClub ? CLUB_BY_ID.get(sports.pendingOfferClub) : undefined;
  const sportDef = sports ? SPORT_BY_ID.get(sports.sport) : undefined;

  function offerBanner(): JSX.Element | null {
    if (!sports || !offerClub) return null;
    return (
      <div style={{ padding: 12, background: 'rgba(63,185,80,0.12)', border: '1px solid var(--success)', borderRadius: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>📨 Offer from {offerClub.name}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 10px' }}>
          {'⭐'.repeat(offerClub.prestige)} · {fmt(sports.pendingOfferSalary)}/yr contract
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="lv-btn" style={{ ...miniBtn, borderColor: 'var(--success)', color: 'var(--success)' }} disabled={isLoading} onClick={onAcceptOffer}>Sign ✍️</button>
          <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={onRejectOffer}>Decline</button>
        </div>
      </div>
    );
  }

  function decisionCard(): JSX.Element | null {
    if (!sports || sports.phase === SportsPhase.Retired) return null;
    const options = TRAINING_DECISIONS.filter((d) => d.phases.includes(sports.phase));
    return (
      <>
        <div className="lv-cat-header"><span>📅</span><span>This Year's Decision</span></div>
        {decidedThisYear ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', padding: '4px 0 8px' }}>
            ✅ Decision made for age {age}. Age up to start a new season.
          </p>
        ) : (
          options.map((d) => (
            <div key={d.id} className={`lv-activity-row${isLoading ? ' disabled' : ''}`}
              onClick={isLoading ? undefined : () => onDecide(d.id)}>
              <span className="lv-activity-icon">{d.emoji}</span>
              <div className="lv-activity-info">
                <div className="lv-activity-name">{d.label}</div>
                <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>{d.description}</div>
              </div>
            </div>
          ))
        )}
      </>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Sports">
      {!sports && (
        <>
          <p style={{ fontSize: 13, color: 'var(--muted)', padding: '4px 0 8px' }}>
            {age < SPORTS_MIN_AGE
              ? `Try out for a school team once you turn ${SPORTS_MIN_AGE}.`
              : age >= 19
                ? 'School tryouts are behind you now — but a new life could chase athletic glory from a young age.'
                : 'Pick a sport and try out for the school team. Health, confidence, and grit decide your fate.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SPORTS.map((s) => {
              const disabled = isLoading || age < SPORTS_MIN_AGE || age >= 19;
              return (
                <button key={s.id} className="lv-btn" disabled={disabled}
                  style={{ padding: '14px 8px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontWeight: 700, fontSize: 13, opacity: disabled ? 0.5 : 1 }}
                  onClick={() => onTryout(s.id)}>
                  <div style={{ fontSize: 26 }}>{s.emoji}</div>
                  {s.label}
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>Try out</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {sports && sports.phase === SportsPhase.School && sportDef && (
        <>
          <div style={{ background: 'var(--card)', border: '1px solid var(--accent-dim)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>School Athletics</div>
            <div style={{ fontSize: 17, fontWeight: 800, margin: '2px 0' }}>{sportDef.emoji} {sports.teamName}</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 10 }}>{SCHOOL_TIER_LABELS[sports.tier]}</div>
            <Bar label="Skill" value={sports.skill} color="var(--accent)" />
            <Bar label="Fitness" value={sports.fitness} color="var(--success)" />
            <Bar label="Reputation" value={sports.reputation} color="#d1a935" />
            <Bar label="Coach Approval" value={sports.coachApproval} color="#8a63d2" />
            {sports.injuryYears > 0 && <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 700, marginTop: 4 }}>🤕 Injured — recovering ({sports.injuryYears} yr)</div>}
            {sports.hasScholarship && <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, marginTop: 4 }}>🎓 Athletic scholarship secured — tuition halved</div>}
            {sports.awards.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                {sports.awards.map((a, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, background: 'rgba(209,169,53,0.15)', color: '#d1a935', padding: '2px 8px', borderRadius: 6 }}>🏆 {a}</span>
                ))}
              </div>
            )}
          </div>
          {offerBanner()}
          {decisionCard()}
          <button className="lv-btn" style={{ ...miniBtn, marginTop: 12, color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={isLoading} onClick={onQuit}>Quit the team</button>
        </>
      )}

      {sports && sports.phase === SportsPhase.Pro && sportDef && (
        <>
          <div style={{ background: 'var(--card)', border: '1px solid var(--accent-dim)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Professional {sportDef.label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, margin: '2px 0' }}>{sportDef.emoji} {sports.teamName}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
              {'⭐'.repeat(CLUB_BY_ID.get(sports.clubId ?? '')?.prestige ?? 1)} · {fmt(sports.salary)}/yr · Market value {fmt(sports.marketValue)}
            </div>
            <Bar label="Skill" value={sports.skill} color="var(--accent)" />
            <Bar label="Fitness" value={sports.fitness} color="var(--success)" />
            <Bar label="Reputation" value={sports.reputation} color="#d1a935" />
            {sports.injuryYears > 0 && <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 700, marginTop: 4 }}>🤕 Injured — recovering ({sports.injuryYears} yr)</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11, marginTop: 10 }}>
              <Stat label="Games" value={String(sports.appearances)} />
              <Stat label={sportDef.scoreNoun} value={String(sports.points)} good />
              {sportDef.hasAssists && <Stat label="Assists" value={String(sports.assists)} />}
              <Stat label="Titles" value={String(sports.championships)} good />
              <Stat label="Earnings" value={fmt(sports.careerEarnings)} good />
              <Stat label="Seasons" value={String(sports.yearsActive)} />
            </div>
            {sports.awards.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                {sports.awards.map((a, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, background: 'rgba(209,169,53,0.15)', color: '#d1a935', padding: '2px 8px', borderRadius: 6 }}>🏆 {a}</span>
                ))}
              </div>
            )}
          </div>
          {offerBanner()}
          {decisionCard()}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={onNegotiate}>💰 Negotiate</button>
            <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={onRequestTransfer}>📨 Request transfer</button>
            <button className="lv-btn" style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={isLoading} onClick={onRetire}>👋 Retire</button>
          </div>
        </>
      )}

      {sports && sports.phase === SportsPhase.Retired && sportDef && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Career Legacy</div>
          <div style={{ fontSize: 17, fontWeight: 800, margin: '2px 0' }}>{sportDef.emoji} Retired {sportDef.label} Player</div>
          {sports.hallOfFame && <div style={{ fontSize: 13, color: '#d1a935', fontWeight: 800, margin: '4px 0' }}>🏛️ Hall of Fame</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11, marginTop: 10 }}>
            <Stat label="Games" value={String(sports.appearances)} />
            <Stat label={sportDef.scoreNoun} value={String(sports.points)} good />
            <Stat label="Titles" value={String(sports.championships)} good />
            <Stat label="Earnings" value={fmt(sports.careerEarnings)} good />
            <Stat label="Seasons" value={String(sports.yearsActive)} />
            <Stat label="Awards" value={String(sports.awards.length)} good />
          </div>
          {sports.awards.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
              {sports.awards.map((a, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, background: 'rgba(209,169,53,0.15)', color: '#d1a935', padding: '2px 8px', borderRadius: 6 }}>🏆 {a}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ height: 12 }} />
    </BottomSheet>
  );
}
