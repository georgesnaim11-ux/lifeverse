import { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import {
  ACTIVITIES_BY_CATEGORY, ACTIVITY_CATEGORY_ORDER, ACTIVITY_CATEGORY_LABELS, ACTIVITY_CATEGORY_EMOJI,
  ActivityCategory, VACATION_TYPES, VACATION_ACTIVITIES, VACATION_BASE_COST, VACATION_MIN_AGE,
  CASINO_GAMES, CASINO_MIN_AGE, COUNTRIES,
} from '@lifeverse/shared';
import type { LifeActivity } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  age: number;
  cash: number;
  isLoading: boolean;
  onPerform: (id: string) => void;
  onVacation: (countryId: string, type: string, activityKey: string) => void;
  onCasino: (game: string, bet: number) => void;
  /** When set (e.g. routed here by an event), auto-expand this category. */
  openCategory?: string | undefined;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

export function ActivitiesSheet({ isOpen, onClose, age, cash, isLoading, onPerform, onVacation, onCasino, openCategory }: Props): JSX.Element {
  const [open, setOpen] = useState<Set<string>>(new Set([ActivityCategory.Health]));
  const toggle = (k: string) => setOpen((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  // When an event routes the player here, expand the requested category.
  useEffect(() => {
    if (isOpen && openCategory) setOpen((p) => new Set(p).add(openCategory));
  }, [isOpen, openCategory]);

  // Vacation builder state
  const [vCountry, setVCountry] = useState(COUNTRIES[0]?.id ?? 'usa');
  const [vType, setVType] = useState('budget');
  const [vAct, setVAct] = useState(VACATION_ACTIVITIES[0]?.id ?? 'beach');
  // Casino bet inputs keyed by game id
  const [bets, setBets] = useState<Record<string, number>>({});

  function CatHeader({ cat }: { cat: string }): JSX.Element {
    const isOpen = open.has(cat);
    return (
      <button onClick={() => toggle(cat)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        padding: '12px', marginTop: 8, background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 10, color: 'var(--text)', fontSize: 15, fontWeight: 800,
      }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', width: 10 }}>{isOpen ? '▾' : '▸'}</span>
        <span style={{ fontSize: 18 }}>{ACTIVITY_CATEGORY_EMOJI[cat as ActivityCategory]}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{ACTIVITY_CATEGORY_LABELS[cat as ActivityCategory]}</span>
      </button>
    );
  }

  function activityRow(a: LifeActivity): JSX.Element {
    const tooYoung = a.minAge !== undefined && age < a.minAge;
    const cost = a.moneyCost ?? 0;
    const tooPoor = cash < cost;
    const disabled = isLoading || tooYoung || tooPoor;
    const note = a.moneyReward ? '💵 earns cash' : a.effects.map((e) => e.stat).filter((s, i, arr) => arr.indexOf(s) === i).join(' · ');
    return (
      <div key={a.id} className={`lv-activity-row${disabled ? ' disabled' : ''}`} style={{ marginLeft: 12 }}
        onClick={disabled ? undefined : () => { onPerform(a.id); }}>
        <span className="lv-activity-icon">{a.emoji}</span>
        <div className="lv-activity-info">
          <div className="lv-activity-name">{a.label}</div>
          <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>{a.description}{note ? ` · ${note}` : ''}</div>
        </div>
        <div className="lv-activity-cost">
          {cost > 0 && <span className="lv-cost-pill money">{fmt(cost)}</span>}
          <span style={{ fontSize: 10, color: tooYoung ? 'var(--muted)' : tooPoor ? 'var(--danger)' : 'var(--success)' }}>
            {tooYoung ? `Age ${a.minAge}+` : tooPoor ? 'Too pricey' : 'Do it ›'}
          </span>
        </div>
      </div>
    );
  }

  const vCountryData = COUNTRIES.find((c) => c.id === vCountry);
  const vTypeData = VACATION_TYPES.find((t) => t.id === vType);
  const vCost = vCountryData && vTypeData ? Math.round(VACATION_BASE_COST * vCountryData.costOfLiving * vTypeData.costMultiplier) : 0;

  const selectStyle = { flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' } as const;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Activities">
      {ACTIVITY_CATEGORY_ORDER.map((cat) => {
        const isTravel = cat === ActivityCategory.Travel;
        const isCasino = cat === ActivityCategory.Casino;
        return (
          <div key={cat}>
            <CatHeader cat={cat} />
            {open.has(cat) && !isTravel && !isCasino && ACTIVITIES_BY_CATEGORY[cat].map(activityRow)}

            {/* ✈️ Travel — 3-step builder */}
            {open.has(cat) && isTravel && (
              <div style={{ marginLeft: 12, marginTop: 6, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                {age < VACATION_MIN_AGE ? (
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>You must be {VACATION_MIN_AGE} to travel on your own.</p>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>1. Country</div>
                    <select style={selectStyle} value={vCountry} onChange={(e) => setVCountry(e.target.value)}>
                      {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.label}</option>)}
                    </select>
                    <div style={{ fontSize: 11, color: 'var(--muted)', margin: '8px 0 4px' }}>2. Vacation type</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {VACATION_TYPES.map((t) => (
                        <button key={t.id} onClick={() => setVType(t.id)} style={{
                          flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          border: `1px solid ${vType === t.id ? 'var(--accent)' : 'var(--border)'}`,
                          background: vType === t.id ? 'var(--accent-glow)' : 'var(--card-hover)',
                          color: vType === t.id ? 'var(--accent)' : 'var(--text-dim)',
                        }}>{t.emoji} {t.label}</button>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', margin: '8px 0 4px' }}>3. Activity</div>
                    <select style={selectStyle} value={vAct} onChange={(e) => setVAct(e.target.value)}>
                      {VACATION_ACTIVITIES.map((a) => <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>)}
                    </select>
                    <button className="lv-btn lv-btn-primary" style={{ marginTop: 12, width: '100%' }}
                      disabled={isLoading || cash < vCost}
                      onClick={() => onVacation(vCountry, vType, vAct)}>
                      {cash < vCost ? `Need ${fmt(vCost)}` : `Book Trip — ${fmt(vCost)}`}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* 🎰 Casino */}
            {open.has(cat) && isCasino && (
              <div style={{ marginLeft: 12, marginTop: 6 }}>
                {age < CASINO_MIN_AGE ? (
                  <p style={{ fontSize: 12, color: 'var(--muted)', padding: '4px 0' }}>You must be {CASINO_MIN_AGE} to gamble.</p>
                ) : CASINO_GAMES.map((g) => {
                  const bet = bets[g.id] ?? g.minBet;
                  const canBet = !isLoading && cash >= bet && bet >= g.minBet;
                  return (
                    <div key={g.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{g.emoji} {g.label} <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>min {fmt(g.minBet)}</span></div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="number" min={g.minBet} value={bet}
                          onChange={(e) => setBets((b) => ({ ...b, [g.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))}
                          style={{ ...selectStyle, flex: 1 }} />
                        <button className="lv-btn lv-btn-primary" style={{ minWidth: 90 }} disabled={!canBet}
                          onClick={() => onCasino(g.id, bet)}>Bet {fmt(bet)}</button>
                      </div>
                    </div>
                  );
                })}
                <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>The house always has an edge — bet responsibly.</p>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ height: 12 }} />
    </BottomSheet>
  );
}
