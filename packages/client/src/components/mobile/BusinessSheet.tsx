import { useState, type CSSProperties } from 'react';
import { BottomSheet } from './BottomSheet';
import {
  INDUSTRIES, INDUSTRY_BY_ID, INDUSTRY_CATEGORY_LABELS, INDUSTRY_CATEGORY_ORDER,
  productsForIndustry, PRODUCT_BY_KEY, SUPPLIER_TIERS, CONSULTANTS, EXPANSIONS,
  ROLE_SALARIES, STAFF_ROLE_LABELS, MARKETING_COSTS, RND_COSTS, PRICE_TIER_DATA,
  BUSINESS_MIN_AGE, COUNTRIES,
} from '@lifeverse/shared';
import type {
  BusinessState, Industry, IndustryDef, StaffRole as Role, StaffBlock,
} from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessState | null;
  age: number;
  playerCash: number;
  isLoading: boolean;
  onCreate: (input: { industry: string; name: string; logo: string; brandColor: string; hqCountry: string; investment: number }) => void;
  onLaunchProduct: (key: string) => void;
  onSetPrice: (key: string, tier: string) => void;
  onImprove: (key: string) => void;
  onDiscontinue: (key: string) => void;
  onHire: (role: string, count: number) => void;
  onFire: (role: string, count: number) => void;
  onTrain: (role: string) => void;
  onBonus: () => void;
  onSupplier: (tier: number) => void;
  onMarketing: (level: number) => void;
  onRnd: (level: number) => void;
  onConsultantHire: (id: string) => void;
  onConsultantDrop: (id: string) => void;
  onExpand: (id: string) => void;
  onInvest: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onSell: () => void;
}

function fmt(n: number): string {
  const a = Math.abs(n); const s = n < 0 ? '-' : '';
  if (a >= 1_000_000_000) return `${s}$${(a / 1_000_000_000).toFixed(2)}B`;
  if (a >= 1_000_000) return `${s}$${(a / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${s}$${(a / 1_000).toFixed(0)}k`;
  return `${s}$${Math.round(a)}`;
}

const miniBtn: CSSProperties = {
  flex: '1 1 auto', minWidth: 0, padding: '8px 6px', fontSize: 11, fontWeight: 700,
  background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8,
};

function Bar({ label, value, invert }: { label: string; value: number; invert?: boolean }): JSX.Element {
  const good = invert ? value <= 40 : value >= 60;
  const bad = invert ? value >= 70 : value <= 30;
  const color = good ? 'var(--success)' : bad ? 'var(--danger)' : '#d1a935';
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <span>{label}</span><span style={{ fontWeight: 700, color: 'var(--text)' }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--card-hover)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }): JSX.Element {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 14, color: good ? 'var(--success)' : 'var(--text)' }}>{value}</div>
    </div>
  );
}

const LOGOS = ['🏢', '☕', '🍔', '👕', '👟', '💎', '🚀', '💻', '🤖', '🎮', '🚗', '⚡', '🏍️', '🚲', '🪑', '🏗️', '🏘️', '🏨', '🌟', '🔥', '👑', '🦁'];
const COLORS = ['#2563eb', '#dc3f48', '#0f9d64', '#d39e00', '#6d5bd0', '#d96f2c', '#128a99', '#111111'];

export function BusinessSheet(props: Props): JSX.Element {
  const { isOpen, onClose, business, age, playerCash, isLoading,
    onCreate, onLaunchProduct, onSetPrice, onImprove, onDiscontinue,
    onHire, onFire, onTrain, onBonus, onSupplier, onMarketing, onRnd,
    onConsultantHire, onConsultantDrop, onExpand, onInvest, onWithdraw, onSell } = props;

  const [picked, setPicked] = useState<Industry | null>(null);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(['food']));
  const [wizard, setWizard] = useState(false);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('🏢');
  const [color, setColor] = useState('#2563eb');
  const [hq, setHq] = useState('usa');
  const [investment, setInvestment] = useState(0);
  const [tab, setTab] = useState<'overview' | 'products' | 'staff' | 'operations' | 'expansion'>('overview');
  const [moveAmount, setMoveAmount] = useState(10000);

  const open = business?.isOpen ? business : null;
  const ind: IndustryDef | undefined = open ? INDUSTRY_BY_ID.get(open.industry) : picked ? INDUSTRY_BY_ID.get(picked) : undefined;

  /* ─────────── 1) Industry picker ─────────── */
  function renderPicker(): JSX.Element {
    if (picked && ind) {
      const affordable = playerCash >= ind.startupCost;
      return (
        <>
          <button className="lv-btn" style={{ ...miniBtn, marginBottom: 10, maxWidth: 90 }} onClick={() => { setPicked(null); }}>‹ Back</button>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{ind.emoji} {ind.label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: affordable ? 'var(--success)' : 'var(--danger)', marginBottom: 10 }}>
              Startup cost: {fmt(ind.startupCost)} {affordable ? '' : `(you have ${fmt(playerCash)})`}
            </div>
            <Bar label="Market demand" value={ind.marketDemand} />
            <Bar label="Customer demand" value={ind.customerDemand} />
            <Bar label="Profit margin" value={ind.profitMargin} />
            <Bar label="Growth potential" value={ind.growthPotential} />
            <Bar label="Competition" value={ind.competition} invert />
            <Bar label="Risk level" value={ind.riskLevel} invert />
            <Bar label="Difficulty" value={ind.difficulty} invert />
            <Bar label="Employee requirement" value={ind.employeeRequirement} invert />
            <div style={{ fontSize: 11, color: 'var(--muted)', margin: '6px 0 10px' }}>⏳ Typical time to profit: ~{ind.yearsToProfit} year{ind.yearsToProfit > 1 ? 's' : ''}</div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>{ind.pros.map((p) => <div key={p} style={{ color: 'var(--success)' }}>+ {p}</div>)}</div>
            <div style={{ fontSize: 12, marginBottom: 10 }}>{ind.cons.map((c) => <div key={c} style={{ color: 'var(--danger)' }}>− {c}</div>)}</div>
            <button className="lv-btn lv-btn-primary" disabled={!affordable || isLoading}
              onClick={() => { setInvestment(ind.startupCost); setLogo(ind.emoji); setWizard(true); }}>
              {affordable ? 'Continue →' : `Need ${fmt(ind.startupCost)}`}
            </button>
          </div>
        </>
      );
    }
    return (
      <>
        <p style={{ fontSize: 13, color: 'var(--muted)', padding: '2px 0 8px' }}>
          {age < BUSINESS_MIN_AGE ? `You can register a company at ${BUSINESS_MIN_AGE}.` : 'Choose an industry. Every one plays differently.'}
        </p>
        {INDUSTRY_CATEGORY_ORDER.map((cat) => {
          const items = INDUSTRIES.filter((i) => i.category === cat);
          const isOpenCat = openCats.has(cat);
          return (
            <div key={cat}>
              <button onClick={() => setOpenCats((p) => { const n = new Set(p); n.has(cat) ? n.delete(cat) : n.add(cat); return n; })}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginTop: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontWeight: 800, fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{isOpenCat ? '▾' : '▸'}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{INDUSTRY_CATEGORY_LABELS[cat]}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{items.length}</span>
              </button>
              {isOpenCat && items.map((i) => (
                <div key={i.id} className={`lv-activity-row${age < BUSINESS_MIN_AGE ? ' disabled' : ''}`} style={{ marginLeft: 10 }}
                  onClick={age < BUSINESS_MIN_AGE ? undefined : () => setPicked(i.id)}>
                  <span className="lv-activity-icon">{i.emoji}</span>
                  <div className="lv-activity-info">
                    <div className="lv-activity-name">{i.label}</div>
                    <div className="lv-activity-desc">{fmt(i.startupCost)} to start · risk {i.riskLevel}% · growth {i.growthPotential}%</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>›</span>
                </div>
              ))}
            </div>
          );
        })}
      </>
    );
  }

  /* ─────────── 2) Founding wizard ─────────── */
  function renderWizard(): JSX.Element {
    if (!ind) return <></>;
    const canRegister = name.trim().length >= 2 && investment >= ind.startupCost && investment <= playerCash;
    return (
      <>
        <button className="lv-btn" style={{ ...miniBtn, marginBottom: 10, maxWidth: 90 }} onClick={() => setWizard(false)}>‹ Back</button>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{ind.emoji} Register your {ind.label}</div>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Company name</label>
        <input className="lv-input" style={{ width: '100%', padding: '12px 14px', margin: '6px 0 12px', background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: 10, color: 'var(--text)', fontSize: 15 }}
          value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. Nova Coffee Co." />
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Logo</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0 12px' }}>
          {LOGOS.map((l) => (
            <button key={l} onClick={() => setLogo(l)} style={{ fontSize: 20, padding: 6, borderRadius: 8, cursor: 'pointer', background: logo === l ? 'var(--accent-glow)' : 'var(--card)', border: `2px solid ${logo === l ? 'var(--accent)' : 'var(--border)'}` }}>{l}</button>
          ))}
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Brand color</label>
        <div style={{ display: 'flex', gap: 8, margin: '6px 0 12px' }}>
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${color === c ? 'var(--text)' : 'transparent'}` }} aria-label={c} />
          ))}
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Headquarters</label>
        <select className="lv-input" style={{ width: '100%', padding: '12px 14px', margin: '6px 0 12px', background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: 10, color: 'var(--text)', fontSize: 15 }}
          value={hq} onChange={(e) => setHq(e.target.value)}>
          {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.label}</option>)}
        </select>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
          Initial investment — {fmt(investment)} (min {fmt(ind.startupCost)}, you have {fmt(playerCash)})
        </label>
        <input type="range" style={{ width: '100%', margin: '8px 0 14px', accentColor: color }}
          min={ind.startupCost} max={Math.max(ind.startupCost, playerCash)} step={Math.max(1000, Math.round(ind.startupCost / 50))}
          value={Math.min(investment, Math.max(ind.startupCost, playerCash))}
          onChange={(e) => setInvestment(Number(e.target.value))} />
        <button className="lv-btn lv-btn-primary" style={{ background: color }} disabled={!canRegister || isLoading}
          onClick={() => { onCreate({ industry: ind.id, name: name.trim(), logo, brandColor: color, hqCountry: hq, investment }); setWizard(false); setPicked(null); }}>
          🖊️ Register {name.trim() || 'Company'} — invest {fmt(investment)}
        </button>
      </>
    );
  }

  /* ─────────── 3) Dashboard ─────────── */
  function renderDashboard(b: BusinessState): JSX.Element {
    const line = productsForIndustry(b.industry);
    const owned = new Set(b.products.map((p) => p.key));
    const launchable = line.filter((p) => !owned.has(p.key));
    const last = b.history.at(-1);
    const growth = b.history.length >= 2 && b.history.at(-2)!.revenue > 0
      ? Math.round(((last!.revenue - b.history.at(-2)!.revenue) / b.history.at(-2)!.revenue) * 100) : 0;

    return (
      <>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${b.brandColor}22, var(--card))`, border: `1px solid ${b.brandColor}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 30 }}>{b.logo}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{b.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{INDUSTRY_BY_ID.get(b.industry)?.label} · founded at {b.foundedAge} · {b.branches} branch{b.branches > 1 ? 'es' : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>Valuation</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: b.brandColor }}>{fmt(b.valuation)}</div>
            </div>
          </div>
          {b.lastEvent && <div style={{ marginTop: 8, fontSize: 12, padding: '6px 10px', background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)' }}>{b.lastEvent}</div>}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, overflowX: 'auto' }}>
          {(['overview', 'products', 'staff', 'operations', 'expansion'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: '1 0 auto', padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
              border: `1px solid ${tab === t ? b.brandColor : 'var(--border)'}`,
              background: tab === t ? `${b.brandColor}22` : 'var(--card)',
              color: tab === t ? b.brandColor : 'var(--text-dim)',
            }}>{t}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
              <Metric label="Revenue" value={fmt(last?.revenue ?? 0)} good />
              <Metric label="Expenses" value={fmt(last?.expenses ?? 0)} />
              <Metric label="Net profit" value={fmt(last?.profit ?? 0)} good={(last?.profit ?? 0) >= 0} />
              <Metric label="Company cash" value={fmt(b.cash)} good={b.cash >= 0} />
              <Metric label="Customers" value={b.customers.toLocaleString()} />
              <Metric label="Market share" value={`${b.marketShare.toFixed(1)}%`} />
              <Metric label="Reputation" value={`${b.reputation}/100`} good={b.reputation >= 60} />
              <Metric label="Employees" value={String(Object.values(b.staff).reduce((s, x) => s + (x?.count ?? 0), 0))} />
              <Metric label="Growth" value={`${growth >= 0 ? '+' : ''}${growth}%`} good={growth >= 0} />
            </div>
            {b.history.length > 0 && (
              <>
                <div className="lv-cat-header"><span>📊</span><span>Financial history</span></div>
                {[...b.history].slice(-5).reverse().map((y) => (
                  <div key={y.age} style={{ display: 'flex', gap: 8, padding: '7px 4px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)', width: 46 }}>Age {y.age}</span>
                    <span style={{ flex: 1 }}>rev {fmt(y.revenue)}</span>
                    <span style={{ fontWeight: 800, color: y.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{y.profit >= 0 ? '+' : ''}{fmt(y.profit)}</span>
                    {y.event && <span title={y.event}>❗</span>}
                  </div>
                ))}
              </>
            )}
            <div className="lv-cat-header"><span>💼</span><span>Owner actions</span></div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <input type="number" min={1000} step={1000} value={moveAmount} onChange={(e) => setMoveAmount(Math.max(0, Number(e.target.value)))}
                style={{ width: 110, padding: '9px 10px', background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }} />
              <button className="lv-btn" style={miniBtn} disabled={isLoading || moveAmount <= 0} onClick={() => onInvest(moveAmount)}>Invest ↓</button>
              <button className="lv-btn" style={miniBtn} disabled={isLoading || moveAmount <= 0} onClick={() => onWithdraw(moveAmount)}>Withdraw ↑</button>
            </div>
            <button className="lv-btn" style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={isLoading} onClick={onSell}>
              🤝 Sell company (~{fmt(Math.round(b.valuation * 0.9))})
            </button>
          </>
        )}

        {tab === 'products' && (
          <>
            {b.products.map((p) => {
              const def = PRODUCT_BY_KEY.get(p.key);
              if (!def) return null;
              return (
                <div key={p.key} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14 }}>
                    <span>{def.emoji} {def.name}</span>
                    <span style={{ color: p.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{p.profit >= 0 ? '+' : ''}{fmt(p.profit)}/yr</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 8px' }}>{p.unitsSold.toLocaleString()} sold · revenue {fmt(p.revenue)}</div>
                  <Bar label="Quality" value={p.quality} />
                  <Bar label="Satisfaction" value={p.satisfaction} />
                  <Bar label="Popularity" value={p.popularity} />
                  <div style={{ display: 'flex', gap: 4, margin: '8px 0 6px' }}>
                    {(Object.keys(PRICE_TIER_DATA) as Array<keyof typeof PRICE_TIER_DATA>).map((t) => (
                      <button key={t} className="lv-btn" disabled={isLoading}
                        style={{ ...miniBtn, borderColor: p.priceTier === t ? b.brandColor : 'var(--border)', color: p.priceTier === t ? b.brandColor : 'var(--text)' }}
                        onClick={() => onSetPrice(p.key, t)}>{PRICE_TIER_DATA[t].label}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onImprove(p.key)}>⬆️ Improve ({fmt(Math.max(1000, Math.round(def.devCost * 0.25)))})</button>
                    <button className="lv-btn" style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={isLoading} onClick={() => onDiscontinue(p.key)}>Drop</button>
                  </div>
                </div>
              );
            })}
            {launchable.length > 0 && (
              <>
                <div className="lv-cat-header"><span>🧪</span><span>Develop new products</span></div>
                {launchable.map((p) => (
                  <div key={p.key} className={`lv-activity-row${isLoading || b.cash < p.devCost ? ' disabled' : ''}`}
                    onClick={isLoading || b.cash < p.devCost ? undefined : () => onLaunchProduct(p.key)}>
                    <span className="lv-activity-icon">{p.emoji}</span>
                    <div className="lv-activity-info">
                      <div className="lv-activity-name">{p.name}</div>
                      <div className="lv-activity-desc">sells ~{fmt(p.basePrice)} · unit cost {fmt(p.unitCost)}</div>
                    </div>
                    <span className="lv-cost-pill money">{fmt(p.devCost)} dev</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'staff' && (
          <>
            {(Object.keys(STAFF_ROLE_LABELS) as Role[]).map((role) => {
              const blk: StaffBlock = b.staff[role] ?? { count: 0, skill: 45, morale: 65 };
              return (
                <div key={role} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 10, marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                    <span>{STAFF_ROLE_LABELS[role]} ({blk.count})</span>
                    <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>{fmt(ROLE_SALARIES[role])}/yr each</span>
                  </div>
                  {blk.count > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--muted)', margin: '2px 0 6px' }}>skill {blk.skill} · morale {blk.morale}</div>
                  )}
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onHire(role, 1)}>+1</button>
                    <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onHire(role, 5)}>+5</button>
                    <button className="lv-btn" style={miniBtn} disabled={isLoading || blk.count < 1} onClick={() => onFire(role, 1)}>−1</button>
                    <button className="lv-btn" style={miniBtn} disabled={isLoading || blk.count < 1} onClick={() => onTrain(role)}>🎓 Train</button>
                  </div>
                </div>
              );
            })}
            <button className="lv-btn" style={{ ...miniBtn, marginTop: 6 }} disabled={isLoading} onClick={onBonus}>💝 Company-wide bonus (+morale)</button>
          </>
        )}

        {tab === 'operations' && (
          <>
            <div className="lv-cat-header"><span>🚚</span><span>Suppliers</span></div>
            {SUPPLIER_TIERS.map((s) => (
              <div key={s.tier} className={`lv-activity-row${isLoading ? ' disabled' : ''}`} onClick={isLoading ? undefined : () => onSupplier(s.tier)}
                style={{ borderColor: b.supplierTier === s.tier ? b.brandColor : undefined }}>
                <div className="lv-activity-info">
                  <div className="lv-activity-name">{s.label}{b.supplierTier === s.tier ? ' ✓' : ''}</div>
                  <div className="lv-activity-desc">cost ×{s.costMultiplier} · quality {s.qualityBonus >= 0 ? '+' : ''}{s.qualityBonus} · reliability {Math.round(s.reliability * 100)}%</div>
                </div>
              </div>
            ))}
            <div className="lv-cat-header"><span>📣</span><span>Marketing</span></div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {MARKETING_COSTS.map((cost, lvl) => (
                <button key={lvl} className="lv-btn" disabled={isLoading}
                  style={{ ...miniBtn, borderColor: b.marketingLevel === lvl ? b.brandColor : 'var(--border)', color: b.marketingLevel === lvl ? b.brandColor : 'var(--text)' }}
                  onClick={() => onMarketing(lvl)}>L{lvl}<br />{fmt(cost)}</button>
              ))}
            </div>
            <div className="lv-cat-header"><span>🔬</span><span>Research & Development</span></div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {RND_COSTS.map((cost, lvl) => (
                <button key={lvl} className="lv-btn" disabled={isLoading}
                  style={{ ...miniBtn, borderColor: b.rndLevel === lvl ? b.brandColor : 'var(--border)', color: b.rndLevel === lvl ? b.brandColor : 'var(--text)' }}
                  onClick={() => onRnd(lvl)}>L{lvl}<br />{fmt(cost)}</button>
              ))}
            </div>
            <div className="lv-cat-header"><span>🧑‍💼</span><span>Consultants</span></div>
            {CONSULTANTS.map((cn) => {
              const hired = b.consultants.includes(cn.id);
              return (
                <div key={cn.id} className={`lv-activity-row${isLoading ? ' disabled' : ''}`}
                  onClick={isLoading ? undefined : () => (hired ? onConsultantDrop(cn.id) : onConsultantHire(cn.id))}
                  style={{ borderColor: hired ? b.brandColor : undefined }}>
                  <span className="lv-activity-icon">{cn.emoji}</span>
                  <div className="lv-activity-info">
                    <div className="lv-activity-name">{cn.label}{hired ? ' ✓' : ''}</div>
                    <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>{cn.description}</div>
                  </div>
                  <span className="lv-cost-pill money">{fmt(cn.annualFee)}/yr</span>
                </div>
              );
            })}
          </>
        )}

        {tab === 'expansion' && (
          <>
            {EXPANSIONS.map((e) => {
              const done = !e.repeatable && b.upgrades.includes(e.id);
              const cost = e.id === 'branch' && ind ? Math.round(ind.startupCost * 0.6 * Math.pow(1.2, b.branches - 1)) : e.cost;
              const gated = b.reputation < e.minReputation || b.branches < e.minBranches;
              const disabled = isLoading || done || gated || b.cash < cost;
              return (
                <div key={e.id} className={`lv-activity-row${disabled ? ' disabled' : ''}`}
                  onClick={disabled ? undefined : () => onExpand(e.id)}>
                  <span className="lv-activity-icon">{e.emoji}</span>
                  <div className="lv-activity-info">
                    <div className="lv-activity-name">{e.label}{done ? ' ✓' : ''}</div>
                    <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>
                      {e.description}{gated ? ` · needs rep ${e.minReputation}+${e.minBranches ? ` & ${e.minBranches} branches` : ''}` : ''}
                    </div>
                  </div>
                  {!done && <span className="lv-cost-pill money">{fmt(cost)}</span>}
                </div>
              );
            })}
          </>
        )}
      </>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Business">
      {open ? renderDashboard(open) : wizard ? renderWizard() : renderPicker()}
      {!open && business && !business.isOpen && (
        <p style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 10 }}>
          Your previous company, {business.name}, is no longer operating ({business.lastEvent ?? 'closed'}). Start something new!
        </p>
      )}
      <div style={{ height: 12 }} />
    </BottomSheet>
  );
}
