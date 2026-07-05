import { useState, type CSSProperties } from 'react';
import { BottomSheet } from './BottomSheet';
import {
  INDUSTRIES, INDUSTRY_BY_ID, INDUSTRY_CATEGORY_LABELS, INDUSTRY_CATEGORY_ORDER,
  productsForIndustry, PRODUCT_BY_KEY, SUPPLIER_TIERS, SUPPLIER_BY_TIER, CONSULTANTS, EXPANSIONS,
  ROLE_SALARIES, STAFF_ROLE_LABELS, TEAM_BUILDING, SUPPLIER_SEARCH_FEE, MAX_SUPPLIER_TIER,
  BUSINESS_MIN_AGE, COUNTRIES,
  priceAppeal, marketingMultiplier, optimalPrice, locationCost, locationEmployees,
  expansionQuote,
} from '@lifeverse/shared';
import type {
  BusinessState, Industry, IndustryDef, StaffRole as Role, StaffBlock, OwnedProduct,
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
  onSetPrice: (key: string, price: number) => void;
  onSetProductMarketing: (key: string, budget: number) => void;
  onImprove: (key: string) => void;
  onDiscontinue: (key: string) => void;
  onHire: (role: string, count: number) => void;
  onFire: (role: string, count: number) => void;
  onTrain: (role: string) => void;
  onBonus: () => void;
  onTeamBuilding: (id: string) => void;
  onSupplier: (tier: number) => void;
  onFindSupplier: () => void;
  onConsultantHire: (id: string) => void;
  onConsultantDrop: (id: string) => void;
  onExpand: (id: string) => void;
  onExpandLocations: (count: number) => void;
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

function money(n: number): string {
  const a = Math.abs(n); const s = n < 0 ? '-' : '';
  if (a >= 1_000_000_000) return `${s}$${(a / 1_000_000_000).toFixed(2)}B`;
  if (a >= 1_000_000) return `${s}$${(a / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${s}$${(a / 1_000).toFixed(1)}k`;
  return `${s}$${a < 10 ? a.toFixed(2) : Math.round(a)}`;
}

/** A single product with live price & marketing sliders and a demand hint. */
function ProductCard(props: {
  product: OwnedProduct; ind: IndustryDef; brandColor: string; supplierQualityBonus: number;
  reputation: number; isLoading: boolean;
  onSetPrice: (key: string, price: number) => void;
  onSetMarketing: (key: string, budget: number) => void;
  onImprove: (key: string) => void; onDiscontinue: (key: string) => void;
}): JSX.Element {
  const { product: p, ind, brandColor, supplierQualityBonus, reputation, isLoading,
    onSetPrice, onSetMarketing, onImprove, onDiscontinue } = props;
  const def = PRODUCT_BY_KEY.get(p.key)!;
  const [price, setPrice] = useState(p.price);
  const [budget, setBudget] = useState(p.marketingBudget);

  const qualityEff = Math.min(100, Math.max(1, p.quality + supplierQualityBonus));
  const appeal = priceAppeal(price, def, qualityEff, reputation, ind.competition);
  const best = optimalPrice(def, qualityEff, reputation, ind.competition);
  const mkt = marketingMultiplier(budget, ind);
  const margin = price > 0 ? Math.round(((price - p.productionCost) / price) * 100) : 0;
  const improveCost = Math.max(1000, Math.round(def.devCost * 0.25 * (1 + p.improveLevel * 0.5)));
  const priceMin = def.basePrice * 0.2, priceMax = def.basePrice * 4;
  const budgetMax = Math.max(20000, Math.round(def.basePrice * 4000));
  const demandWord = appeal >= 1.25 ? 'very high' : appeal >= 1.0 ? 'strong' : appeal >= 0.7 ? 'moderate' : appeal >= 0.4 ? 'weak' : 'almost none';
  const demandColor = appeal >= 1.0 ? 'var(--success)' : appeal >= 0.5 ? '#d1a935' : 'var(--danger)';

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14 }}>
        <span>{def.emoji} {def.name}</span>
        <span style={{ color: p.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{p.profit >= 0 ? '+' : ''}{money(p.profit)}/yr</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 8px' }}>
        {p.unitsSold.toLocaleString()} sold · rev {money(p.revenue)} · margin {margin}% · cost {money(p.productionCost)}/unit{p.inventory > 0 ? ` · ${p.inventory.toLocaleString()} in stock` : ''}
      </div>
      <Bar label="Quality" value={p.quality} />
      <Bar label="Satisfaction" value={p.satisfaction} />
      <Bar label="Popularity" value={p.popularity} />

      {/* Price slider with demand feedback */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 8 }}>
        <span style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Selling price</span>
        <span style={{ fontWeight: 800 }}>{money(price)}</span>
      </div>
      <input type="range" min={priceMin} max={priceMax} step={Math.max(0.5, def.basePrice / 100)} value={Math.min(price, priceMax)}
        style={{ width: '100%', accentColor: brandColor }} disabled={isLoading}
        onChange={(e) => setPrice(Number(e.target.value))}
        onMouseUp={() => onSetPrice(p.key, price)} onTouchEnd={() => onSetPrice(p.key, price)} />
      <div style={{ fontSize: 10, color: demandColor }}>
        Demand at this price: <b>{demandWord}</b> (×{appeal.toFixed(2)}) · sweet spot ≈ {money(best)}
      </div>

      {/* Marketing slider */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 8 }}>
        <span style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Marketing budget</span>
        <span style={{ fontWeight: 800 }}>{budget === 0 ? 'none' : `${money(budget)}/yr`}</span>
      </div>
      <input type="range" min={0} max={budgetMax} step={Math.max(500, Math.round(budgetMax / 100))} value={Math.min(budget, budgetMax)}
        style={{ width: '100%', accentColor: brandColor }} disabled={isLoading}
        onChange={(e) => setBudget(Number(e.target.value))}
        onMouseUp={() => onSetMarketing(p.key, budget)} onTouchEnd={() => onSetMarketing(p.key, budget)} />
      <div style={{ fontSize: 10, color: 'var(--muted)' }}>Awareness boost: ×{mkt.toFixed(2)} sales (diminishing returns)</div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="lv-btn" style={{ flex: 1, padding: '8px 6px', fontSize: 11, fontWeight: 700, background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8 }}
          disabled={isLoading} onClick={() => onImprove(p.key)}>⬆️ R&D +quality ({money(improveCost)})</button>
        <button className="lv-btn" style={{ flex: '0 0 auto', padding: '8px 12px', fontSize: 11, fontWeight: 700, background: 'var(--card-hover)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 8 }}
          disabled={isLoading} onClick={() => onDiscontinue(p.key)}>Drop</button>
      </div>
    </div>
  );
}

export function BusinessSheet(props: Props): JSX.Element {
  const { isOpen, onClose, business, age, playerCash, isLoading,
    onCreate, onLaunchProduct, onSetPrice, onSetProductMarketing, onImprove, onDiscontinue,
    onHire, onFire, onTrain, onBonus, onTeamBuilding, onSupplier, onFindSupplier,
    onConsultantHire, onConsultantDrop, onExpand, onExpandLocations, onInvest, onWithdraw, onSell } = props;

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
  const [expandCount, setExpandCount] = useState(1);

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
    const prev = b.history.at(-2);
    const growth = prev && prev.revenue > 0 ? Math.round(((last!.revenue - prev.revenue) / prev.revenue) * 100) : 0;
    const trend = (cur: number, was: number | undefined): string => (was === undefined ? '' : cur > was ? ' ▲' : cur < was ? ' ▼' : '');
    // Warnings when things slide.
    const warnings: string[] = [];
    if (prev && last && last.revenue < prev.revenue * 0.9) warnings.push('Revenue is falling — check pricing or marketing.');
    if (last && last.profit < 0) warnings.push('You are running at a loss — cut costs or raise prices.');
    if (b.satisfaction > 0 && b.satisfaction < 45) warnings.push('Customer satisfaction is low — improve quality or lower prices.');
    if (b.cash < 0) warnings.push('Company cash is negative — two losing years means bankruptcy.');
    const staffCount = Object.values(b.staff).reduce((s, x) => s + (x?.count ?? 0), 0);

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
            {warnings.length > 0 && (
              <div style={{ background: 'rgba(220,63,72,0.1)', border: '1px solid var(--danger)', borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>
                {warnings.map((w) => <div key={w} style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>⚠ {w}</div>)}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
              <Metric label="Revenue" value={fmt(last?.revenue ?? 0) + trend(last?.revenue ?? 0, prev?.revenue)} good />
              <Metric label="Expenses" value={fmt(last?.expenses ?? 0)} />
              <Metric label="Net profit" value={fmt(last?.profit ?? 0) + trend(last?.profit ?? 0, prev?.profit)} good={(last?.profit ?? 0) >= 0} />
              <Metric label="Company cash" value={fmt(b.cash)} good={b.cash >= 0} />
              <Metric label="Valuation" value={fmt(b.valuation)} good />
              <Metric label="Customers" value={b.customers.toLocaleString()} />
              <Metric label="Satisfaction" value={`${b.satisfaction}/100`} good={b.satisfaction >= 60} />
              <Metric label="Market share" value={`${b.marketShare.toFixed(1)}%`} />
              <Metric label="Reputation" value={`${b.reputation}/100`} good={b.reputation >= 60} />
              <Metric label="Employees" value={String(staffCount)} />
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
            {b.products.map((p) => (
              <ProductCard key={p.key} product={p} ind={ind!} brandColor={b.brandColor}
                supplierQualityBonus={SUPPLIER_BY_TIER.get(b.supplierTier)?.qualityBonus ?? 0}
                reputation={b.reputation} isLoading={isLoading}
                onSetPrice={onSetPrice} onSetMarketing={onSetProductMarketing}
                onImprove={onImprove} onDiscontinue={onDiscontinue} />
            ))}
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
            {(() => {
              const blocks = Object.values(b.staff).filter(Boolean) as StaffBlock[];
              const avgMorale = blocks.length ? Math.round(blocks.reduce((s, x) => s + x.morale, 0) / blocks.length) : 0;
              return (
                <div style={{ fontSize: 12, color: avgMorale < 45 ? 'var(--danger)' : 'var(--muted)', marginBottom: 8 }}>
                  Average morale: <b>{avgMorale}</b>/100. {avgMorale < 45
                    ? '⚠ Low morale cuts productivity, product quality, and satisfaction — and staff quit.'
                    : 'Happy teams are more productive and keep customers satisfied.'}
                </div>
              );
            })()}
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
            <button className="lv-btn" style={{ ...miniBtn, marginTop: 6 }} disabled={isLoading} onClick={onBonus}>💝 Company-wide 5% bonus (+morale)</button>
            <div className="lv-cat-header"><span>🎉</span><span>Team Building</span></div>
            {TEAM_BUILDING.map((t) => {
              const cost = t.costPerHead * staffCount;
              return (
                <div key={t.id} className={`lv-activity-row${isLoading || staffCount === 0 ? ' disabled' : ''}`}
                  onClick={isLoading || staffCount === 0 ? undefined : () => onTeamBuilding(t.id)}>
                  <span className="lv-activity-icon">{t.emoji}</span>
                  <div className="lv-activity-info">
                    <div className="lv-activity-name">{t.label} <span style={{ color: 'var(--success)', fontSize: 11 }}>+{t.moraleGain} morale</span></div>
                    <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>{t.note}</div>
                  </div>
                  <span className="lv-cost-pill money">{fmt(cost)}</span>
                </div>
              );
            })}
          </>
        )}

        {tab === 'operations' && (
          <>
            <div className="lv-cat-header"><span>🚚</span><span>Suppliers</span></div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 6px' }}>
              Cheaper suppliers cap how much you can produce; better ones raise quality and capacity so you can grow. Marketing & R&D now live per-product on the Products tab.
            </p>
            {SUPPLIER_TIERS.map((s) => {
              const locked = s.tier > b.supplierUnlocked;
              const current = b.supplierTier === s.tier;
              return (
                <div key={s.tier} className={`lv-activity-row${isLoading || locked ? ' disabled' : ''}`}
                  onClick={isLoading || locked || current ? undefined : () => onSupplier(s.tier)}
                  style={{ borderColor: current ? b.brandColor : undefined, opacity: locked ? 0.5 : 1 }}>
                  <div className="lv-activity-info">
                    <div className="lv-activity-name">{locked ? '🔒 ' : ''}{s.label}{current ? ' ✓' : ''}</div>
                    <div className="lv-activity-desc">
                      cost ×{s.costMultiplier} · quality {s.qualityBonus >= 0 ? '+' : ''}{s.qualityBonus} · capacity {s.capacity.toLocaleString()}/yr
                    </div>
                  </div>
                </div>
              );
            })}
            {b.supplierUnlocked < MAX_SUPPLIER_TIER && (
              <button className="lv-btn" style={{ ...miniBtn, marginTop: 6 }} disabled={isLoading || b.cash < SUPPLIER_SEARCH_FEE}
                onClick={onFindSupplier}>🔎 Find Better Supplier ({fmt(SUPPLIER_SEARCH_FEE)})</button>
            )}
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

        {tab === 'expansion' && ind && (() => {
          const staffCnt = staffCount;
          const perBranchRev = b.branches > 0 && last ? last.revenue / b.branches : 0;
          const perBranchOpex = b.branches > 0 && last ? last.expenses / b.branches : 0;
          const quote = expansionQuote(ind, b.branches, expandCount, staffCnt, perBranchRev, perBranchOpex);
          const perLoc = locationEmployees(ind);
          const nextCost = locationCost(ind, b.branches, 0);
          const cashShort = b.cash < quote.totalCost;
          const canExpand = !isLoading && b.reputation >= 35 && !cashShort && quote.employeesShort === 0;
          return (
            <>
              <div className="lv-cat-header"><span>🏗️</span><span>Open New Locations</span></div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                Each {ind.label.toLowerCase()} location needs ~{perLoc} staff and costs more as you grow (next: {fmt(nextCost)}).
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                <span>Locations to open</span><span style={{ color: b.brandColor }}>{expandCount}</span>
              </div>
              <input type="range" min={1} max={20} step={1} value={expandCount}
                style={{ width: '100%', accentColor: b.brandColor }} disabled={isLoading}
                onChange={(e) => setExpandCount(Number(e.target.value))} />
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, margin: '4px 0 8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Total cost</span><span style={{ textAlign: 'right', fontWeight: 700, color: cashShort ? 'var(--danger)' : 'var(--text)' }}>{fmt(quote.totalCost)}</span>
                  <span style={{ color: 'var(--muted)' }}>Staff required</span><span style={{ textAlign: 'right', fontWeight: 700, color: quote.employeesShort ? 'var(--danger)' : 'var(--text)' }}>{quote.employeesRequired} (have {staffCnt})</span>
                  <span style={{ color: 'var(--muted)' }}>Est. +revenue/yr</span><span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{fmt(quote.expectedRevenueDelta)}</span>
                  <span style={{ color: 'var(--muted)' }}>Est. +expenses/yr</span><span style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(quote.expectedOpexDelta)}</span>
                  <span style={{ color: 'var(--muted)' }}>Estimated ROI</span><span style={{ textAlign: 'right', fontWeight: 800, color: quote.roiPct >= 0 ? 'var(--success)' : 'var(--danger)' }}>{quote.roiPct}%/yr</span>
                </div>
              </div>
              {b.reputation < 35 && <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>⚠ Reputation must reach 35 to expand (currently {b.reputation}).</div>}
              {quote.employeesShort > 0 && <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>⚠ Hire {quote.employeesShort} more staff first.</div>}
              {cashShort && <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>⚠ Company needs {fmt(quote.totalCost)} (has {fmt(b.cash)}).</div>}
              <button className="lv-btn lv-btn-primary" style={{ background: b.brandColor }} disabled={!canExpand}
                onClick={() => onExpandLocations(expandCount)}>
                🏗️ Open {expandCount} location{expandCount > 1 ? 's' : ''} — {fmt(quote.totalCost)}
              </button>

              <div className="lv-cat-header"><span>🚀</span><span>Strategic Upgrades</span></div>
              {EXPANSIONS.map((e) => {
                const done = !e.repeatable && b.upgrades.includes(e.id);
                const gated = b.reputation < e.minReputation || b.branches < e.minBranches;
                const disabled = isLoading || done || gated || b.cash < e.cost;
                return (
                  <div key={e.id} className={`lv-activity-row${disabled ? ' disabled' : ''}`}
                    onClick={disabled ? undefined : () => onExpand(e.id)}>
                    <span className="lv-activity-icon">{e.emoji}</span>
                    <div className="lv-activity-info">
                      <div className="lv-activity-name">{e.label}{done ? ' ✓' : ''}</div>
                      <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>
                        {e.description}{gated ? ` · needs rep ${e.minReputation}+ & ${e.minBranches} locations` : ''}
                      </div>
                    </div>
                    {!done && <span className="lv-cost-pill money">{fmt(e.cost)}</span>}
                  </div>
                );
              })}
            </>
          );
        })()}
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
